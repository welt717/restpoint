import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import ExcelJS from 'exceljs';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { safeQuery, getConnection, releaseConnection } from '@montezuma/shared-config';
import logger from '@montezuma/shared-logger';
import { getKenyaTimeISO } from '@montezuma/shared-utils';

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
  OUTPUT_DIR: 'public/uploads/coffins',
};

// Exchange rates
const EXCHANGE_RATES = { USD: 150, KES: 1 };

// In-memory cache (replace with Redis in production)
const coffinCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 300000; // 5 minutes

// Helper: Get from cache
const getCached = (key: string): any => {
  const cached = coffinCache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  coffinCache.delete(key);
  return null;
};

// Helper: Set cache
const setCached = (key: string, data: any): void => {
  coffinCache.set(key, { data, expiry: Date.now() + CACHE_TTL });
};

// Helper: Clear cache
const clearCache = (pattern?: string): void => {
  if (pattern) {
    for (const key of coffinCache.keys()) {
      if (key.includes(pattern)) coffinCache.delete(key);
    }
  } else {
    coffinCache.clear();
  }
};

// Helper: Generate RFID
const generateRFID = (name: string): string => {
  const hash = crypto.createHash('md5').update(`${name}-${Date.now()}`).digest('hex').substring(0, 8);
  return `RFID-${hash.toUpperCase()}`;
};

// Helper: Generate Coffin ID
const generateCoffinId = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `COF-${timestamp}-${random}`;
};

// Helper: Ensure directory exists
const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    logger.info(`Created directory: ${dirPath}`);
  }
};

// Helper: Get tenant-specific upload path
const getTenantUploadPath = (tenantSlug: string): string => {
  return path.join(IMAGE_CONFIG.OUTPUT_DIR, tenantSlug);
};

// Helper: Process single image with Sharp
const processImage = async (
  inputBuffer: Buffer,
  outputPath: string,
  index: number,
  originalName: string
): Promise<string> => {
  try {
    const metadata = await sharp(inputBuffer).metadata();
    logger.debug(`Processing image ${index + 1}: ${originalName} (${metadata.width}x${metadata.height})`);

    await sharp(inputBuffer)
      .resize(IMAGE_CONFIG.TARGET_WIDTH, IMAGE_CONFIG.TARGET_HEIGHT, { 
        fit: 'cover', 
        position: 'center',
        withoutEnlargement: false 
      })
      .webp({ quality: IMAGE_CONFIG.QUALITY, effort: 6 })
      .toFile(outputPath);

    const stats = await fs.stat(outputPath);
    logger.debug(`   Processed: ${(stats.size / 1024).toFixed(2)} KB`);

    return outputPath.replace('public/', '');
  } catch (error) {
    logger.error(`Image processing failed for ${originalName}:`, error);
    throw new Error(`Image processing failed: ${error}`);
  }
};

// Helper: Process multiple images
const processImages = async (
  files: Express.Multer.File[], 
  coffinId: number, 
  tenantSlug: string
): Promise<string[]> => {
  const uploadDir = getTenantUploadPath(tenantSlug);
  await ensureDirectoryExists(uploadDir);

  const processedImages: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < Math.min(files.length, 10); i++) {
    const file = files[i];
    
    if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE) {
      errors.push(`${file.originalname}: file too large`);
      continue;
    }

    try {
      const timestamp = Date.now();
      const imageName = `coffin-${coffinId}-${timestamp}-${i}.${IMAGE_CONFIG.FORMAT}`;
      const outputPath = path.join(uploadDir, imageName);
      
      const webPath = await processImage(file.buffer, outputPath, i, file.originalname);
      processedImages.push(webPath);
    } catch (error) {
      errors.push(`${file.originalname}: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    logger.warn(`Some images failed to process:`, errors);
  }

  return processedImages;
};

// Helper: Validate coffin data
const validateCoffinData = (data: any): string[] => {
  const errors: string[] = [];
  
  if (!data.type?.trim()) errors.push('Coffin type is required');
  if (!data.material?.trim()) errors.push('Material is required');
  if (!data.exact_price || isNaN(parseFloat(data.exact_price))) errors.push('Valid price is required');
  if (parseFloat(data.exact_price) < 0) errors.push('Price cannot be negative');
  if (data.currency && !['KES', 'USD'].includes(data.currency)) errors.push('Valid currency (KES or USD) is required');
  if (data.quantity && (isNaN(parseInt(data.quantity)) || parseInt(data.quantity) < 0)) errors.push('Quantity must be non-negative');
  
  return errors;
};

/* ===============================
   ✅ CREATE COFFIN
   =============================== */
export const createCoffin = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;
  
  if (!tenantSlug || tenantSlug === 'system_shared') {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  if (req.files && req.files.length > 10) {
    return res.status(400).json({ success: false, message: 'Maximum 10 images allowed' });
  }

  let connection: any = null;

  try {
    const {
      custom_id, type, material, exact_price, currency, quantity,
      supplier, origin, color, size, category, created_by
    } = req.body;

    // Validate input
    const validationErrors = validateCoffinData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, errors: validationErrors });
    }

    const price = parseFloat(exact_price);
    const finalCoffinId = custom_id || generateCoffinId();
    
    // Calculate prices based on currency
    let priceKES: number, priceUSD: number;
    if (currency === 'USD') {
      priceUSD = price;
      priceKES = price * EXCHANGE_RATES.USD;
    } else {
      priceKES = price;
      priceUSD = price / EXCHANGE_RATES.USD;
    }

    // Find user ID
    let userId = null;
    if (created_by) {
      const users = await safeQuery(
        'SELECT id FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(name) = LOWER(?) LIMIT 1',
        [created_by.trim(), created_by.trim()]
      );
      userId = users[0]?.id || null;
    } else if (req.user?.userId) {
      userId = parseInt(req.user.userId);
    }

    connection = await getConnection();
    await connection.beginTransaction();

    // Check for duplicate custom ID
    if (custom_id) {
      const [existing] = await connection.query(
        'SELECT coffin_id FROM coffins WHERE custom_id = ? AND tenant_id = ?',
        [custom_id, tenantSlug]
      );
      if (existing.length > 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Custom ID already exists' });
      }
    }

    // Insert coffin
    const insertSql = `
      INSERT INTO coffins (
        custom_id, tenant_id, type, material, exact_price, currency, 
        price_usd, exchange_rate, quantity, supplier, origin, color, 
        size, category, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await connection.query(insertSql, [
      finalCoffinId, tenantSlug, type.trim(), material.trim(), priceKES, currency,
      priceUSD, EXCHANGE_RATES.USD, parseInt(quantity) || 1,
      supplier?.trim() || null, origin?.trim() || null, color?.trim() || null,
      size?.trim() || null, category || 'locally_made', userId
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

    // Clear cache
    clearCache('allCoffins');

    return res.status(201).json({
      success: true,
      message: '✅ Coffin created successfully',
      coffin_id: finalCoffinId,
      database_id: coffinDbId,
      images: { count: imageUrls.length, urls: imageUrls },
      pricing: { price_kes: priceKES, price_usd: priceUSD, currency },
      data: { coffin_id: finalCoffinId, type, material, quantity: quantity || 1 }
    });

  } catch (error: any) {
    if (connection) await connection.rollback();
    logger.error('Create coffin error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Custom ID already exists' });
    }
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
};

/* ===============================
   ✅ GET ALL COFFINS
   =============================== */
export const getAllCoffins = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;
  
  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const cacheKey = `allCoffins_${tenantSlug}`;
    let coffins = getCached(cacheKey);

    if (!coffins) {
      const sql = `
        SELECT 
          c.*, 
          u.name as created_by_name,
          GROUP_CONCAT(DISTINCT ci.image_url) as image_urls
        FROM coffins c
        LEFT JOIN users u ON c.created_by = u.id
        LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id AND c.tenant_id = ci.tenant_id
        WHERE c.tenant_id = ? AND c.is_deleted = FALSE
        GROUP BY c.coffin_id
        ORDER BY c.created_at DESC
      `;
      
      coffins = await safeQuery(sql, [tenantSlug]);
      
      // Process coffins
      coffins = coffins.map((coffin: any) => {
        const images = coffin.image_urls ? coffin.image_urls.split(',').slice(0, 10) : [];
        return {
          ...coffin,
          exact_price: parseFloat(coffin.exact_price),
          price_usd: parseFloat(coffin.price_usd),
          images,
          primary_image: images[0] || null,
          display_price: coffin.currency === 'USD' 
            ? `$${parseFloat(coffin.price_usd).toFixed(2)} (Ksh ${parseFloat(coffin.exact_price).toFixed(2)})`
            : `Ksh ${parseFloat(coffin.exact_price).toFixed(2)} ($${parseFloat(coffin.price_usd).toFixed(2)})`
        };
      });
      
      setCached(cacheKey, coffins);
    }

    return res.status(200).json({
      success: true,
      data: coffins,
      count: coffins.length,
      tenant: tenantSlug
    });

  } catch (error: any) {
    logger.error('Get all coffins error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
   ✅ GET COFFIN BY ID
   =============================== */
export const getCoffinById = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;
  const { id } = req.params;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const cacheKey = `coffin_${tenantSlug}_${id}`;
    let coffin = getCached(cacheKey);

    if (!coffin) {
      const sql = `
        SELECT 
          c.*, 
          u.name as created_by_name,
          u.username as created_by_username,
          GROUP_CONCAT(DISTINCT ci.image_url) as image_urls
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

      coffin = coffins[0];
      coffin.image_urls = coffin.image_urls ? coffin.image_urls.split(',').slice(0, 10) : [];
      coffin.exact_price = parseFloat(coffin.exact_price);
      coffin.price_usd = parseFloat(coffin.price_usd);
      
      setCached(cacheKey, coffin);
    }

    return res.status(200).json({ success: true, data: coffin });

  } catch (error: any) {
    logger.error('Get coffin by ID error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
   ✅ UPDATE COFFIN
   =============================== */
export const updateCoffin = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;
  const { id } = req.params;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  if (req.files && req.files.length > 10) {
    return res.status(400).json({ success: false, message: 'Maximum 10 images allowed' });
  }

  let connection: any = null;

  try {
    const { type, material, exact_price, currency, quantity, supplier, origin, color, size, category } = req.body;

    // Check if coffin exists
    const existingCoffin = await safeQuery(
      'SELECT * FROM coffins WHERE (coffin_id = ? OR custom_id = ?) AND tenant_id = ?',
      [id, id, tenantSlug]
    );
    
    if (existingCoffin.length === 0) {
      return res.status(404).json({ success: false, message: 'Coffin not found' });
    }

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
    updateValues.push(id, id, tenantSlug);

    if (updateFields.length > 1) {
      const updateSql = `
        UPDATE coffins 
        SET ${updateFields.join(', ')} 
        WHERE (coffin_id = ? OR custom_id = ?) AND tenant_id = ? AND is_deleted = FALSE
      `;
      await connection.query(updateSql, updateValues);
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const coffinId = existingCoffin[0].coffin_id;
      const imageUrls = await processImages(req.files, coffinId, tenantSlug);
      
      if (imageUrls.length > 0) {
        const imageSql = `INSERT INTO coffin_images (coffin_id, tenant_id, image_url, created_at) VALUES ?`;
        const imageValues = imageUrls.map(url => [coffinId, tenantSlug, url, getKenyaTimeISO()]);
        await connection.query(imageSql, [imageValues]);
      }
    }

    await connection.commit();

    // Clear caches
    clearCache('allCoffins');
    clearCache(`coffin_${tenantSlug}`);

    return res.status(200).json({ success: true, message: '✅ Coffin updated successfully' });

  } catch (error: any) {
    if (connection) await connection.rollback();
    logger.error('Update coffin error:', error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
};

/* ===============================
   ✅ DELETE COFFIN (Soft Delete)
   =============================== */
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
    const [assignments] = await connection.query(
      'SELECT id FROM deceased_coffin WHERE coffin_id = (SELECT coffin_id FROM coffins WHERE (coffin_id = ? OR custom_id = ?) AND tenant_id = ?)',
      [id, id, tenantSlug]
    );
    
    if (assignments.length > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete coffin with existing assignments to deceased persons' 
      });
    }

    // Soft delete
    await connection.query(
      'UPDATE coffins SET is_deleted = TRUE WHERE (coffin_id = ? OR custom_id = ?) AND tenant_id = ?',
      [id, id, tenantSlug]
    );

    await connection.commit();

    // Clear caches
    clearCache('allCoffins');
    clearCache(`coffin_${tenantSlug}`);

    return res.status(200).json({ success: true, message: '✅ Coffin deleted successfully' });

  } catch (error: any) {
    if (connection) await connection.rollback();
    logger.error('Delete coffin error:', error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
};

/* ===============================
   ✅ ASSIGN COFFIN TO DECEASED
   =============================== */
export const assignCoffin = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;
  const { deceased_id, coffin_id, assigned_by, assigned_date, deceased_name } = req.body;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  if (!deceased_id || !coffin_id || !deceased_name) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required fields: deceased_id, coffin_id, deceased_name' 
    });
  }

  let connection: any = null;

  try {
    connection = await getConnection();
    await connection.beginTransaction();

    // Check coffin availability with tenant isolation
    const [coffins] = await connection.query(
      `SELECT coffin_id, quantity, type, material FROM coffins 
       WHERE (coffin_id = ? OR custom_id = ?) AND tenant_id = ? AND is_deleted = FALSE FOR UPDATE`,
      [coffin_id, coffin_id, tenantSlug]
    );

    if (coffins.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Coffin not found' });
    }

    if (coffins[0].quantity <= 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Coffin out of stock' });
    }

    const rfid = generateRFID(deceased_name);
    const finalAssignedDate = assigned_date || new Date().toISOString().split('T')[0];
    const assignedBy = assigned_by || req.user?.name || 'system';

    // Insert assignment
    await connection.query(
      `INSERT INTO deceased_coffin (deceased_id, coffin_id, tenant_id, assigned_by_username, assigned_date, rfid, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [deceased_id, coffins[0].coffin_id, tenantSlug, assignedBy, finalAssignedDate, rfid]
    );

    // Update coffin stock
    await connection.query(
      'UPDATE coffins SET quantity = quantity - 1, updated_at = NOW() WHERE coffin_id = ? AND tenant_id = ?',
      [coffins[0].coffin_id, tenantSlug]
    );

    await connection.commit();

    // Clear cache
    clearCache('allCoffins');
    clearCache('recentAssignments');

    return res.status(201).json({
      success: true,
      message: '✅ Coffin assigned successfully',
      assignment_id: (result as any).insertId,
      rfid,
      coffin_details: { type: coffins[0].type, material: coffins[0].material }
    });

  } catch (error: any) {
    if (connection) await connection.rollback();
    logger.error('Assign coffin error:', error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
};

/* ===============================
   ✅ GET RECENTLY ASSIGNED COFFINS
   =============================== */
export const getRecentlyAssignedCoffins = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const cacheKey = `recentAssignments_${tenantSlug}_${limit}`;
    let assignments = getCached(cacheKey);

    if (!assignments) {
      const sql = `
        SELECT 
          dc.id AS assignment_id,
          dc.deceased_id,
          d.full_name AS deceased_name,
          dc.assigned_date,
          dc.rfid,
          c.coffin_id,
          c.custom_id,
          c.type AS coffin_type,
          c.material,
          c.color,
          c.size
        FROM deceased_coffin dc
        LEFT JOIN deceased d ON dc.deceased_id = d.deceased_id AND d.tenant_id = dc.tenant_id
        LEFT JOIN coffins c ON dc.coffin_id = c.coffin_id AND c.tenant_id = dc.tenant_id
        WHERE dc.tenant_id = ?
        ORDER BY dc.assigned_date DESC, dc.created_at DESC
        LIMIT ?
      `;

      assignments = await safeQuery(sql, [tenantSlug, limit]);
      setCached(cacheKey, assignments);
    }

    return res.status(200).json({
      success: true,
      data: assignments,
      count: assignments.length,
      tenant: tenantSlug
    });

  } catch (error: any) {
    logger.error('Get recent assignments error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
   ✅ COFFIN ANALYTICS DASHBOARD
   =============================== */
export const getCoffinAnalytics = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const cacheKey = `coffinAnalytics_${tenantSlug}`;
    let analytics = getCached(cacheKey);

    if (!analytics) {
      const [overview] = await safeQuery(`
        SELECT 
          COUNT(*) AS total_coffins,
          SUM(quantity) AS total_in_stock,
          SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) AS out_of_stock_count,
          SUM(CASE WHEN quantity > 0 THEN 1 ELSE 0 END) AS available_types,
          COUNT(DISTINCT type) as unique_types,
          COUNT(DISTINCT material) as unique_materials,
          SUM(exact_price * quantity) AS total_inventory_value
        FROM coffins
        WHERE tenant_id = ? AND is_deleted = FALSE
      `, [tenantSlug]);

      const [typeBreakdown] = await safeQuery(`
        SELECT 
          type,
          COUNT(*) AS total_models,
          SUM(quantity) AS total_stock,
          SUM(exact_price * quantity) AS total_value
        FROM coffins
        WHERE tenant_id = ? AND is_deleted = FALSE
        GROUP BY type
        ORDER BY total_stock DESC
        LIMIT 20
      `, [tenantSlug]);

      const [materialBreakdown] = await safeQuery(`
        SELECT 
          material,
          COUNT(*) AS total_models,
          SUM(quantity) AS total_stock,
          SUM(exact_price * quantity) AS total_value
        FROM coffins
        WHERE tenant_id = ? AND is_deleted = FALSE
        GROUP BY material
        ORDER BY total_value DESC
        LIMIT 20
      `, [tenantSlug]);

      const [categoryBreakdown] = await safeQuery(`
        SELECT 
          category,
          COUNT(*) as count,
          SUM(quantity) as total_stock,
          SUM(exact_price * quantity) as total_value
        FROM coffins
        WHERE tenant_id = ? AND is_deleted = FALSE
        GROUP BY category
      `, [tenantSlug]);

      const recentAssignments = await safeQuery(`
        SELECT 
          dc.id AS assignment_id,
          dc.deceased_id,
          d.full_name AS deceased_name,
          dc.assigned_date,
          c.type AS coffin_type,
          c.material
        FROM deceased_coffin dc
        LEFT JOIN deceased d ON dc.deceased_id = d.deceased_id
        LEFT JOIN coffins c ON dc.coffin_id = c.coffin_id
        WHERE dc.tenant_id = ?
        ORDER BY dc.assigned_date DESC
        LIMIT 5
      `, [tenantSlug]);

      analytics = {
        overview: {
          total_coffins: overview[0]?.total_coffins || 0,
          total_in_stock: overview[0]?.total_in_stock || 0,
          out_of_stock_count: overview[0]?.out_of_stock_count || 0,
          available_types: overview[0]?.available_types || 0,
          unique_types: overview[0]?.unique_types || 0,
          unique_materials: overview[0]?.unique_materials || 0,
          total_inventory_value: parseFloat(overview[0]?.total_inventory_value || 0).toFixed(2),
        },
        by_type: typeBreakdown,
        by_material: materialBreakdown,
        by_category: categoryBreakdown,
        recent_assignments: recentAssignments,
        last_updated: getKenyaTimeISO()
      };

      setCached(cacheKey, analytics);
    }

    return res.status(200).json({
      success: true,
      message: '✅ Coffin analytics fetched successfully',
      data: analytics,
      tenant: tenantSlug
    });

  } catch (error: any) {
    logger.error('Get coffin analytics error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
   ✅ EXPORT COFFINS TO EXCEL
   =============================== */
export const exportCoffinsToExcel = async (req: TenantRequest, res: Response): Promise<void> => {
  const tenantSlug = req.tenantSlug;

  if (!tenantSlug) {
    res.status(403).json({ success: false, message: 'Valid tenant required' });
    return;
  }

  try {
    const coffins = await safeQuery(`
      SELECT 
        c.coffin_id, c.custom_id, c.type, c.material, c.exact_price, c.currency,
        c.price_usd, c.quantity, c.supplier, c.origin, c.color, c.size, 
        c.category, c.created_at,
        u.name as created_by_name
      FROM coffins c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.tenant_id = ? AND c.is_deleted = FALSE
      ORDER BY c.created_at DESC
    `, [tenantSlug]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Coffin Inventory');

    // Headers
    const headers = ['ID', 'Custom ID', 'Type', 'Material', 'Price (KES)', 'Currency', 'Quantity', 'Supplier', 'Origin', 'Color', 'Size', 'Category', 'Created At'];
    worksheet.addRow(headers);

    // Data rows
    coffins.forEach((coffin: any) => {
      worksheet.addRow([
        coffin.coffin_id,
        coffin.custom_id || 'N/A',
        coffin.type,
        coffin.material,
        coffin.exact_price,
        coffin.currency,
        coffin.quantity,
        coffin.supplier || 'N/A',
        coffin.origin || 'N/A',
        coffin.color || 'N/A',
        coffin.size || 'STANDARD',
        coffin.category,
        coffin.created_at
      ]);
    });

    // Style headers
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a202c' } };
      cell.font.color = { argb: 'FFFFFFFF' };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `coffin-inventory-${tenantSlug}-${Date.now()}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);

  } catch (error: any) {
    logger.error('Export error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
   ✅ HEALTH CHECK
   =============================== */
export const healthCheck = async (req: Request, res: Response): Promise<Response> => {
  return res.status(200).json({
    status: 'UP',
    service: 'coffin-service',
    timestamp: getKenyaTimeISO()
  });
};


