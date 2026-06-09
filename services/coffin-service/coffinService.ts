import { Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import ExcelJS from 'exceljs';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { safeQuery, getConnection, releaseConnection } from '@montezuma/shared-config';
import logger from '@montezuma/shared-logger';
import { getKenyaTimeISO } from '@montezuma/shared-utils';
import { ICoffin, ICoffinImage, IDeceasedCoffin, ICreateCoffinDTO, IAssignCoffinDTO, ICoffinAnalytics } from '../models/Coffin';

// Extend Request with tenant and user
interface TenantRequest extends Request {
  tenantSlug?: string;
  tenant?: { id: string; slug: string; name: string };
  user?: { userId: string; email: string; role: string; name: string };
  files?: Express.Multer.File[];
}

// Image configuration
const IMAGE_CONFIG = {
  TARGET_WIDTH: 1920,
  TARGET_HEIGHT: 1080,
  QUALITY: 90,
  FORMAT: 'webp' as const,
  MAX_FILE_SIZE: 10 * 1024 * 1024,
};

// Exchange rates
const EXCHANGE_RATES = { USD: 150, KES: 1 };

// Helper functions
const generateRFID = (name: string): string => {
  const hash = crypto.createHash('md5').update(`${name}-${Date.now()}`).digest('hex').substring(0, 8);
  return `RFID-${hash.toUpperCase()}`;
};

const generateCoffinId = (tenantSlug: string): string => {
  const tenantPrefix = tenantSlug.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${tenantPrefix}-COF-${timestamp}-${random}`;
};

const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    logger.info(`Created directory: ${dirPath}`);
  }
};

const getTenantUploadPath = (tenantSlug: string): string => {
  return path.join('public', 'uploads', 'tenants', tenantSlug, 'coffins');
};

const processImage = async (
  inputBuffer: Buffer,
  outputPath: string,
  index: number,
  originalName: string
): Promise<string> => {
  const metadata = await sharp(inputBuffer).metadata();
  logger.debug(`Processing image ${index + 1}: ${originalName} (${metadata.width}x${metadata.height})`);

  await sharp(inputBuffer)
    .resize(IMAGE_CONFIG.TARGET_WIDTH, IMAGE_CONFIG.TARGET_HEIGHT, { fit: 'cover', position: 'center' })
    .webp({ quality: IMAGE_CONFIG.QUALITY, effort: 6 })
    .toFile(outputPath);

  return outputPath.replace('public/', '');
};

const processImages = async (files: Express.Multer.File[], coffinId: number, tenantSlug: string): Promise<string[]> => {
  const uploadDir = getTenantUploadPath(tenantSlug);
  await ensureDirectoryExists(uploadDir);

  const processedImages: string[] = [];
  for (let i = 0; i < Math.min(files.length, 10); i++) {
    const file = files[i];
    if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE) {
      logger.warn(`Skipping ${file.originalname}: file too large`);
      continue;
    }

    const timestamp = Date.now();
    const imageName = `coffin-${coffinId}-${timestamp}-${i}.${IMAGE_CONFIG.FORMAT}`;
    const outputPath = path.join(uploadDir, imageName);
    
    const webPath = await processImage(file.buffer, outputPath, i, file.originalname);
    processedImages.push(webPath);
  }
  return processedImages;
};

// ============================================
// CONTROLLER FUNCTIONS
// ============================================

export const createCoffin = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;
  if (!tenantSlug || tenantSlug === 'system_shared') {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  let connection: any = null;
  try {
    const {
      custom_id, type, material, exact_price, currency, quantity,
      supplier, origin, color, size, category, created_by
    } = req.body;

    // Validation
    if (!type || !material || !exact_price || !currency) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const price = parseFloat(exact_price);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ success: false, message: 'Invalid price' });
    }

    const finalCoffinId = custom_id || generateCoffinId(tenantSlug);
    const priceUSD = currency === 'USD' ? price : price / EXCHANGE_RATES.USD;
    const priceKES = currency === 'KES' ? price : price * EXCHANGE_RATES.USD;

    connection = await getConnection();
    await connection.beginTransaction();

    const insertSql = `
      INSERT INTO coffins (custom_id, tenant_id, type, material, exact_price, currency, 
        price_usd, exchange_rate, quantity, supplier, origin, color, size, category, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await connection.query(insertSql, [
      finalCoffinId, tenantSlug, type.trim(), material.trim(), priceKES, currency,
      priceUSD, EXCHANGE_RATES.USD, parseInt(quantity) || 1, supplier?.trim() || null,
      origin?.trim() || null, color?.trim() || null, size?.trim() || null,
      category || 'locally_made', created_by || req.user?.userId || null
    ]);

    const coffinDbId = (result as any).insertId;

    // Process images
    let imageUrls: string[] = [];
    if (req.files && req.files.length > 0) {
      imageUrls = await processImages(req.files, coffinDbId, tenantSlug);
      
      if (imageUrls.length > 0) {
        const imageSql = `INSERT INTO coffin_images (coffin_id, tenant_id, image_url, created_at) VALUES ?`;
        const imageValues = imageUrls.map(url => [coffinDbId, tenantSlug, url, getKenyaTimeISO()]);
        await connection.query(imageSql, [imageValues]);
      }
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Coffin created successfully',
      coffin_id: finalCoffinId,
      database_id: coffinDbId,
      images: { count: imageUrls.length, urls: imageUrls },
      pricing: { price_kes: priceKES, price_usd: priceUSD, currency }
    });

  } catch (error: any) {
    if (connection) await connection.rollback();
    logger.error('Create coffin error:', error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
};

export const getAllCoffins = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;
  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const sql = `
      SELECT c.*, u.name as created_by_name,
        GROUP_CONCAT(ci.image_url) as image_urls
      FROM coffins c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id AND c.tenant_id = ci.tenant_id
      WHERE c.tenant_id = ? AND c.is_deleted = FALSE
      GROUP BY c.coffin_id
      ORDER BY c.created_at DESC
    `;
    
    const coffins = await safeQuery(sql, [tenantSlug]);
    
    const processedCoffins = coffins.map((coffin: any) => ({
      ...coffin,
      images: coffin.image_urls ? coffin.image_urls.split(',').slice(0, 10) : [],
      display_price: coffin.currency === 'USD' 
        ? `$${coffin.price_usd} (Ksh ${coffin.exact_price})`
        : `Ksh ${coffin.exact_price} ($${coffin.price_usd})`
    }));

    return res.status(200).json({ success: true, data: processedCoffins, count: processedCoffins.length });
  } catch (error: any) {
    logger.error('Get all coffins error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCoffinById = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;
  const { id } = req.params;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const sql = `
      SELECT c.*, u.name as created_by_name,
        GROUP_CONCAT(ci.image_url) as image_urls
      FROM coffins c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id AND c.tenant_id = ci.tenant_id
      WHERE (c.coffin_id = ? OR c.custom_id = ?) AND c.tenant_id = ? AND c.is_deleted = FALSE
      GROUP BY c.coffin_id
    `;
    
    const coffins = await safeQuery(sql, [id, id, tenantSlug]);
    
    if (coffins.length === 0) {
      return res.status(404).json({ success: false, message: 'Coffin not found' });
    }

    const coffin = coffins[0];
    coffin.images = coffin.image_urls ? coffin.image_urls.split(',').slice(0, 10) : [];

    return res.status(200).json({ success: true, data: coffin });
  } catch (error: any) {
    logger.error('Get coffin by ID error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCoffin = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;
  const { id } = req.params;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  let connection: any = null;
  try {
    const { type, material, exact_price, currency, quantity, supplier, origin, color, size, category } = req.body;

    connection = await getConnection();
    await connection.beginTransaction();

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (type) { updateFields.push('type = ?'); updateValues.push(type.trim()); }
    if (material) { updateFields.push('material = ?'); updateValues.push(material.trim()); }
    if (exact_price !== undefined) {
      const price = parseFloat(exact_price);
      if (currency === 'USD') {
        updateFields.push('exact_price = ?, price_usd = ?');
        updateValues.push(price * EXCHANGE_RATES.USD, price);
      } else {
        updateFields.push('exact_price = ?, price_usd = ?');
        updateValues.push(price, price / EXCHANGE_RATES.USD);
      }
    }
    if (currency) { updateFields.push('currency = ?'); updateValues.push(currency); }
    if (quantity !== undefined) { updateFields.push('quantity = ?'); updateValues.push(parseInt(quantity)); }
    if (supplier !== undefined) { updateFields.push('supplier = ?'); updateValues.push(supplier?.trim() || null); }
    if (origin !== undefined) { updateFields.push('origin = ?'); updateValues.push(origin?.trim() || null); }
    if (color !== undefined) { updateFields.push('color = ?'); updateValues.push(color?.trim() || null); }
    if (size !== undefined) { updateFields.push('size = ?'); updateValues.push(size?.trim() || null); }
    if (category !== undefined) { updateFields.push('category = ?'); updateValues.push(category); }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id, tenantSlug);

    if (updateFields.length > 1) {
      const updateSql = `UPDATE coffins SET ${updateFields.join(', ')} WHERE (coffin_id = ? OR custom_id = ?) AND tenant_id = ? AND is_deleted = FALSE`;
      await connection.query(updateSql, [...updateValues, id, tenantSlug]);
    }

    // Handle new images
    if (req.files && req.files.length > 0) {
      const imageUrls = await processImages(req.files, parseInt(id), tenantSlug);
      if (imageUrls.length > 0) {
        const imageSql = `INSERT INTO coffin_images (coffin_id, tenant_id, image_url, created_at) VALUES ?`;
        const imageValues = imageUrls.map(url => [id, tenantSlug, url, getKenyaTimeISO()]);
        await connection.query(imageSql, [imageValues]);
      }
    }

    await connection.commit();

    return res.status(200).json({ success: true, message: 'Coffin updated successfully' });
  } catch (error: any) {
    if (connection) await connection.rollback();
    logger.error('Update coffin error:', error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
};

export const deleteCoffin = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;
  const { id } = req.params;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  let connection: any = null;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    // Check if coffin has assignments
    const assignments = await connection.query(
      'SELECT id FROM deceased_coffin WHERE coffin_id = ? AND tenant_id = ?',
      [id, tenantSlug]
    );
    
    if (assignments[0].length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete coffin with existing assignments' });
    }

    await connection.query(
      'UPDATE coffins SET is_deleted = TRUE WHERE (coffin_id = ? OR custom_id = ?) AND tenant_id = ?',
      [id, id, tenantSlug]
    );

    await connection.commit();
    return res.status(200).json({ success: true, message: 'Coffin deleted successfully' });
  } catch (error: any) {
    if (connection) await connection.rollback();
    logger.error('Delete coffin error:', error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
};

export const assignCoffin = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;
  const { deceased_id, coffin_id, assigned_by, assigned_date, deceased_name } = req.body;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  let connection: any = null;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    // Check coffin availability with tenant isolation
    const [coffins] = await connection.query(
      'SELECT quantity FROM coffins WHERE (coffin_id = ? OR custom_id = ?) AND tenant_id = ? FOR UPDATE',
      [coffin_id, coffin_id, tenantSlug]
    );

    if (coffins.length === 0 || coffins[0].quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Coffin not available' });
    }

    const rfid = generateRFID(deceased_name);
    const finalAssignedDate = assigned_date || new Date().toISOString().split('T')[0];

    await connection.query(
      `INSERT INTO deceased_coffin (deceased_id, coffin_id, tenant_id, assigned_by_username, assigned_date, rfid)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [deceased_id, coffin_id, tenantSlug, assigned_by || req.user?.name || 'system', finalAssignedDate, rfid]
    );

    await connection.query(
      'UPDATE coffins SET quantity = quantity - 1 WHERE (coffin_id = ? OR custom_id = ?) AND tenant_id = ?',
      [coffin_id, coffin_id, tenantSlug]
    );

    await connection.commit();

    return res.status(201).json({ success: true, message: 'Coffin assigned successfully', rfid });
  } catch (error: any) {
    if (connection) await connection.rollback();
    logger.error('Assign coffin error:', error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
};

export const getCoffinAnalytics = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;
  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const [overview] = await safeQuery(`
      SELECT 
        COUNT(*) AS total_coffins,
        SUM(quantity) AS total_in_stock,
        SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) AS out_of_stock_count,
        COUNT(DISTINCT type) as unique_types,
        SUM(exact_price * quantity) AS total_inventory_value
      FROM coffins
      WHERE tenant_id = ? AND is_deleted = FALSE
    `, [tenantSlug]);

    const [typeBreakdown] = await safeQuery(`
      SELECT type, COUNT(*) as models, SUM(quantity) as stock, SUM(exact_price * quantity) as value
      FROM coffins WHERE tenant_id = ? AND is_deleted = FALSE GROUP BY type ORDER BY value DESC LIMIT 10
    `, [tenantSlug]);

    return res.status(200).json({
      success: true,
      data: { overview: overview[0], by_type: typeBreakdown, tenant: tenantSlug },
      generatedAt: getKenyaTimeISO()
    });
  } catch (error: any) {
    logger.error('Get coffin analytics error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const healthCheck = async (req: Request, res: Response): Promise<Response> => {
  return res.status(200).json({ status: 'UP', service: 'coffin-service', timestamp: getKenyaTimeISO() });
};