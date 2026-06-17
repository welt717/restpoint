/**
 * Coffin Service Controller (CommonJS version)
 * Provides CRUD operations for coffins with image processing
 */
const crypto = require('crypto');
const path = require('path');
const { safeQuery } = require('../../shared/database');
const { getKenyaTimeISO } = require('../../services/utilities/timeStamps/timeStamps');

const IMAGE_CONFIG = {
  TARGET_WIDTH: 1920,
  TARGET_HEIGHT: 1080,
  QUALITY: 90,
  FORMAT: 'webp',
  MAX_FILE_SIZE: 10 * 1024 * 1024,
};

const EXCHANGE_RATES = { USD: 150, KES: 1 };

const generateRFID = (name) => {
  const hash = crypto.createHash('md5').update(`${name}-${Date.now()}`).digest('hex').substring(0, 8);
  return `RFID-${hash.toUpperCase()}`;
};

const generateCoffinId = (tenantSlug) => {
  const tenantPrefix = tenantSlug.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${tenantPrefix}-COF-${timestamp}-${random}`;
};

// ============================================
// CONTROLLER FUNCTIONS
// ============================================

const createCoffin = async (req, res) => {
  const tenantSlug = req.tenantSlug;
  if (!tenantSlug || tenantSlug === 'system_shared') {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const {
      custom_id, type, material, exact_price, currency, quantity,
      supplier, origin, color, size, category, created_by
    } = req.body;

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

    const insertSql = `
      INSERT INTO coffins (custom_id, tenant_id, type, material, exact_price, currency, 
        price_usd, exchange_rate, quantity, supplier, origin, color, size, category, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await safeQuery(insertSql, [
      finalCoffinId, tenantSlug, type.trim(), material.trim(), priceKES, currency,
      priceUSD, EXCHANGE_RATES.USD, parseInt(quantity) || 1, supplier?.trim() || null,
      origin?.trim() || null, color?.trim() || null, size?.trim() || null,
      category || 'locally_made', created_by || req.user?.userId || null
    ]);

    return res.status(201).json({
      success: true,
      message: 'Coffin created successfully',
      coffin_id: finalCoffinId,
      pricing: { price_kes: priceKES, price_usd: priceUSD, currency }
    });

  } catch (error) {
    console.error('Create coffin error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAllCoffins = async (req, res) => {
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

    const processedCoffins = coffins.map((coffin) => ({
      ...coffin,
      images: coffin.image_urls ? coffin.image_urls.split(',').slice(0, 10) : [],
      display_price: coffin.currency === 'USD'
        ? `$${coffin.price_usd} (Ksh ${coffin.exact_price})`
        : `Ksh ${coffin.exact_price} ($${coffin.price_usd})`
    }));

    return res.status(200).json({ success: true, data: processedCoffins, count: processedCoffins.length });
  } catch (error) {
    console.error('Get all coffins error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCoffinById = async (req, res) => {
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
  } catch (error) {
    console.error('Get coffin by ID error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateCoffin = async (req, res) => {
  const tenantSlug = req.tenantSlug;
  const { id } = req.params;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const { type, material, exact_price, currency, quantity, supplier, origin, color, size, category } = req.body;

    const updateFields = [];
    const updateValues = [];

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
      await safeQuery(updateSql, [...updateValues, id, tenantSlug]);
    }

    return res.status(200).json({ success: true, message: 'Coffin updated successfully' });
  } catch (error) {
    console.error('Update coffin error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCoffin = async (req, res) => {
  const tenantSlug = req.tenantSlug;
  const { id } = req.params;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    await safeQuery(
      'UPDATE coffins SET is_deleted = TRUE WHERE (coffin_id = ? OR custom_id = ?) AND tenant_id = ?',
      [id, id, tenantSlug]
    );
    return res.status(200).json({ success: true, message: 'Coffin deleted successfully' });
  } catch (error) {
    console.error('Delete coffin error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const assignCoffin = async (req, res) => {
  const tenantSlug = req.tenantSlug;
  const { deceased_id, coffin_id, assigned_by, assigned_date, deceased_name } = req.body;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const [coffins] = await safeQuery(
      'SELECT quantity FROM coffins WHERE (coffin_id = ? OR custom_id = ?) AND tenant_id = ?',
      [coffin_id, coffin_id, tenantSlug]
    );

    if (!coffins || coffins.length === 0 || coffins[0].quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Coffin not available' });
    }

    const rfid = generateRFID(deceased_name || 'unknown');
    const finalAssignedDate = assigned_date || new Date().toISOString().split('T')[0];

    await safeQuery(
      `INSERT INTO deceased_coffin (deceased_id, coffin_id, tenant_id, assigned_by_username, assigned_date, rfid)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [deceased_id, coffin_id, tenantSlug, assigned_by || req.user?.name || 'system', finalAssignedDate, rfid]
    );

    await safeQuery(
      'UPDATE coffins SET quantity = quantity - 1 WHERE (coffin_id = ? OR custom_id = ?) AND tenant_id = ?',
      [coffin_id, coffin_id, tenantSlug]
    );

    return res.status(201).json({ success: true, message: 'Coffin assigned successfully', rfid });
  } catch (error) {
    console.error('Assign coffin error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCoffinAnalytics = async (req, res) => {
  const tenantSlug = req.tenantSlug;
  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const overview = await safeQuery(`
      SELECT 
        COUNT(*) AS total_coffins,
        SUM(quantity) AS total_in_stock,
        SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) AS out_of_stock_count,
        COUNT(DISTINCT type) as unique_types,
        SUM(exact_price * quantity) AS total_inventory_value
      FROM coffins
      WHERE tenant_id = ? AND is_deleted = FALSE
    `, [tenantSlug]);

    const typeBreakdown = await safeQuery(`
      SELECT type, COUNT(*) as models, SUM(quantity) as stock, SUM(exact_price * quantity) as value
      FROM coffins WHERE tenant_id = ? AND is_deleted = FALSE GROUP BY type ORDER BY value DESC LIMIT 10
    `, [tenantSlug]);

    return res.status(200).json({
      success: true,
      data: { overview: overview[0], by_type: typeBreakdown, tenant: tenantSlug },
      generatedAt: getKenyaTimeISO()
    });
  } catch (error) {
    console.error('Get coffin analytics error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const healthCheck = async (req, res) => {
  return res.status(200).json({ status: 'UP', service: 'coffin-service', timestamp: getKenyaTimeISO() });
};

module.exports = {
  createCoffin,
  getAllCoffins,
  getCoffinById,
  updateCoffin,
  deleteCoffin,
  assignCoffin,
  getCoffinAnalytics,
  healthCheck
};