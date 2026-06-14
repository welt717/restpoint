const { safeQuery, safeExecute } = require('../../../shared/dbConfig');

exports.getAll = async (req, res) => {
  try {
    const { category, active, search } = req.query;
    const tenantDb = req.tenant?.db_name;

    if (!tenantDb) {
      return res.status(400).json({ success: false, message: 'Tenant database not resolved' });
    }

    let sql = `SELECT c.*, 
               (SELECT COALESCE(SUM(quantity_used), 0) FROM deceased_chemical_usage WHERE chemical_id = c.id) as total_used,
               CASE WHEN c.current_stock <= c.min_stock_level THEN 1 ELSE 0 END as is_low_stock
               FROM chemicals c WHERE 1=1`;
    const params = [];

    if (category) { sql += ' AND c.category = ?'; params.push(category); }
    if (active !== 'false') { sql += ' AND c.is_active = 1'; }
    if (search) { sql += ' AND c.name LIKE ?'; params.push(`%${search}%`); }

    sql += ' ORDER BY c.name ASC';

    const rows = await safeQuery(tenantDb, sql, params);
    res.json({ success: true, data: rows, count: rows.length });
  } catch (error) {
    console.error('[chemicalController.getAll]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const tenantDb = req.tenant?.db_name;
    if (!tenantDb) return res.status(400).json({ success: false, message: 'Tenant database not resolved' });

    const rows = await safeQuery(tenantDb,
      `SELECT c.*, 
        (SELECT COALESCE(SUM(quantity_used), 0) FROM deceased_chemical_usage WHERE chemical_id = c.id) as total_used
       FROM chemicals c WHERE c.id = ? AND c.is_active = 1`,
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ success: false, message: 'Chemical not found' });

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const tenantDb = req.tenant?.db_name;
    if (!tenantDb) return res.status(400).json({ success: false, message: 'Tenant database not resolved' });

    const { name, category, unit, current_stock, min_stock_level, unit_cost, supplier, batch_number, expiry_date, notes } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Chemical name is required' });

    const result = await safeExecute(tenantDb,
      `INSERT INTO chemicals (name, category, unit, current_stock, min_stock_level, unit_cost, supplier, batch_number, expiry_date, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category || 'embalming', unit || 'liters', current_stock || 0, min_stock_level || 0, unit_cost || 0, supplier || null, batch_number || null, expiry_date || null, notes || null]
    );

    // Log initial stock as received transaction if quantity > 0
    if (current_stock > 0) {
      await safeExecute(tenantDb,
        `INSERT INTO chemical_transactions (chemical_id, transaction_type, quantity, unit, previous_stock, new_stock, notes) 
         VALUES (?, 'received', ?, ?, 0, ?, 'Initial stock on creation')`,
        [result.insertId, current_stock, unit || 'liters', current_stock]
      );
    }

    res.status(201).json({ success: true, message: 'Chemical created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const tenantDb = req.tenant?.db_name;
    if (!tenantDb) return res.status(400).json({ success: false, message: 'Tenant database not resolved' });

    const { name, category, unit, min_stock_level, unit_cost, supplier, batch_number, expiry_date, notes } = req.body;

    await safeExecute(tenantDb,
      `UPDATE chemicals SET name=COALESCE(?,name), category=COALESCE(?,category), unit=COALESCE(?,unit),
       min_stock_level=COALESCE(?,min_stock_level), unit_cost=COALESCE(?,unit_cost),
       supplier=COALESCE(?,supplier), batch_number=COALESCE(?,batch_number),
       expiry_date=COALESCE(?,expiry_date), notes=COALESCE(?,notes)
       WHERE id=? AND is_active=1`,
      [name, category, unit, min_stock_level, unit_cost, supplier, batch_number, expiry_date, notes, req.params.id]
    );

    res.json({ success: true, message: 'Chemical updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const tenantDb = req.tenant?.db_name;
    if (!tenantDb) return res.status(400).json({ success: false, message: 'Tenant database not resolved' });

    await safeExecute(tenantDb, 'UPDATE chemicals SET is_active=0 WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Chemical removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.receiveStock = async (req, res) => {
  try {
    const tenantDb = req.tenant?.db_name;
    if (!tenantDb) return res.status(400).json({ success: false, message: 'Tenant database not resolved' });

    const { quantity, notes } = req.body;
    if (!quantity || quantity <= 0) return res.status(400).json({ success: false, message: 'Valid quantity required' });

    const chem = await safeQuery(tenantDb, 'SELECT id, current_stock, unit FROM chemicals WHERE id=? AND is_active=1', [req.params.id]);
    if (!chem.length) return res.status(404).json({ success: false, message: 'Chemical not found' });

    const previousStock = parseFloat(chem[0].current_stock);
    const newStock = previousStock + parseFloat(quantity);

    await safeExecute(tenantDb, 'UPDATE chemicals SET current_stock=? WHERE id=?', [newStock, req.params.id]);
    await safeExecute(tenantDb,
      `INSERT INTO chemical_transactions (chemical_id, transaction_type, quantity, unit, previous_stock, new_stock, notes)
       VALUES (?, 'received', ?, ?, ?, ?, ?)`,
      [req.params.id, quantity, chem[0].unit, previousStock, newStock, notes || 'Stock received']
    );

    res.json({ success: true, message: 'Stock received', previous_stock: previousStock, new_stock: newStock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.adjustStock = async (req, res) => {
  try {
    const tenantDb = req.tenant?.db_name;
    if (!tenantDb) return res.status(400).json({ success: false, message: 'Tenant database not resolved' });

    const { new_quantity, reason } = req.body;
    if (new_quantity === undefined || new_quantity < 0) return res.status(400).json({ success: false, message: 'Valid new_quantity required' });

    const chem = await safeQuery(tenantDb, 'SELECT id, current_stock, unit FROM chemicals WHERE id=? AND is_active=1', [req.params.id]);
    if (!chem.length) return res.status(404).json({ success: false, message: 'Chemical not found' });

    const previousStock = parseFloat(chem[0].current_stock);

    await safeExecute(tenantDb, 'UPDATE chemicals SET current_stock=? WHERE id=?', [new_quantity, req.params.id]);
    await safeExecute(tenantDb,
      `INSERT INTO chemical_transactions (chemical_id, transaction_type, quantity, unit, previous_stock, new_stock, notes)
       VALUES (?, 'adjusted', ?, ?, ?, ?, ?)`,
      [req.params.id, Math.abs(new_quantity - previousStock), chem[0].unit, previousStock, new_quantity, reason || 'Manual stock adjustment']
    );

    res.json({ success: true, message: 'Stock adjusted', previous_stock: previousStock, new_stock: new_quantity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const tenantDb = req.tenant?.db_name;
    if (!tenantDb) return res.status(400).json({ success: false, message: 'Tenant database not resolved' });

    const rows = await safeQuery(tenantDb,
      `SELECT ct.*, c.name as chemical_name FROM chemical_transactions ct 
       JOIN chemicals c ON c.id = ct.chemical_id
       WHERE ct.chemical_id = ? ORDER BY ct.created_at DESC LIMIT 100`,
      [req.params.id]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDashboardSummary = async (req, res) => {
  try {
    const tenantDb = req.tenant?.db_name;
    if (!tenantDb) return res.status(400).json({ success: false, message: 'Tenant database not resolved' });

    const [totalChemicals] = await safeQuery(tenantDb, 'SELECT COUNT(*) as total FROM chemicals WHERE is_active=1');
    const [lowStock] = await safeQuery(tenantDb, 'SELECT COUNT(*) as total FROM chemicals WHERE is_active=1 AND current_stock <= min_stock_level');
    const [recentUsage] = await safeQuery(tenantDb,
      `SELECT COALESCE(SUM(quantity_used), 0) as total FROM deceased_chemical_usage 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    const recentTransactions = await safeQuery(tenantDb,
      `SELECT ct.*, c.name as chemical_name FROM chemical_transactions ct 
       JOIN chemicals c ON c.id = ct.chemical_id
       ORDER BY ct.created_at DESC LIMIT 10`
    );

    // Most used chemicals this month
    const topUsed = await safeQuery(tenantDb,
      `SELECT c.id, c.name, c.unit, COALESCE(SUM(dcu.quantity_used),0) as total_used
       FROM chemicals c LEFT JOIN deceased_chemical_usage dcu ON dcu.chemical_id = c.id
       AND dcu.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       WHERE c.is_active=1 GROUP BY c.id ORDER BY total_used DESC LIMIT 5`
    );

    res.json({
      success: true,
      data: {
        total_chemicals: totalChemicals?.total || 0,
        low_stock_count: lowStock?.total || 0,
        total_usage_30d: recentUsage?.total || 0,
        recent_transactions: recentTransactions,
        top_used_chemicals: topUsed
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLowStockAlerts = async (req, res) => {
  try {
    const tenantDb = req.tenant?.db_name;
    if (!tenantDb) return res.status(400).json({ success: false, message: 'Tenant database not resolved' });

    const rows = await safeQuery(tenantDb,
      `SELECT id, name, category, unit, current_stock, min_stock_level,
        (current_stock - min_stock_level) as deficit
       FROM chemicals 
       WHERE is_active=1 AND current_stock <= min_stock_level
       ORDER BY (current_stock / min_stock_level) ASC`
    );

    res.json({ success: true, data: rows, count: rows.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};