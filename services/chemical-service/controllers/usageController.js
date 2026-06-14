const { safeQuery, safeExecute } = require('../../../shared/dbConfig');

exports.recordUsage = async (req, res) => {
  try {
    const tenantDb = req.tenant?.db_name;
    if (!tenantDb) return res.status(400).json({ success: false, message: 'Tenant database not resolved' });

    const { deceased_id, chemical_id, quantity_used, usage_notes } = req.body;

    if (!deceased_id || !chemical_id || !quantity_used || quantity_used <= 0) {
      return res.status(400).json({ success: false, message: 'deceased_id, chemical_id and quantity_used (>0) are required' });
    }

    // Check chemical exists and has stock
    const chem = await safeQuery(tenantDb,
      'SELECT id, current_stock, unit, name FROM chemicals WHERE id=? AND is_active=1',
      [chemical_id]
    );
    if (!chem.length) return res.status(404).json({ success: false, message: 'Chemical not found' });

    if (parseFloat(chem[0].current_stock) < parseFloat(quantity_used)) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${chem[0].current_stock} ${chem[0].unit}, Required: ${quantity_used} ${chem[0].unit}`,
        available_stock: chem[0].current_stock,
        required: quantity_used
      });
    }

    const previousStock = parseFloat(chem[0].current_stock);
    const newStock = previousStock - parseFloat(quantity_used);

    // Deduct from stock
    await safeExecute(tenantDb, 'UPDATE chemicals SET current_stock=? WHERE id=?', [newStock, chemical_id]);

    // Record stock transaction
    const txnResult = await safeExecute(tenantDb,
      `INSERT INTO chemical_transactions (chemical_id, transaction_type, quantity, unit, previous_stock, new_stock, reference_type, reference_id, notes)
       VALUES (?, 'consumed', ?, ?, ?, ?, 'deceased', ?, ?)`,
      [chemical_id, quantity_used, chem[0].unit, previousStock, newStock, deceased_id, usage_notes || `Used on deceased #${deceased_id}`]
    );

    // Record the usage against the deceased
    await safeExecute(tenantDb,
      `INSERT INTO deceased_chemical_usage (deceased_id, chemical_id, quantity_used, unit, transaction_id, usage_notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [deceased_id, chemical_id, quantity_used, chem[0].unit, txnResult.insertId, usage_notes || null]
    );

    res.status(201).json({
      success: true,
      message: `Used ${quantity_used} ${chem[0].unit} of ${chem[0].name} on deceased #${deceased_id}`,
      data: {
        chemical: chem[0].name,
        quantity_used,
        unit: chem[0].unit,
        previous_stock: previousStock,
        remaining_stock: newStock
      }
    });
  } catch (error) {
    console.error('[usageController.recordUsage]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getByDeceased = async (req, res) => {
  try {
    const tenantDb = req.tenant?.db_name;
    if (!tenantDb) return res.status(400).json({ success: false, message: 'Tenant database not resolved' });

    const rows = await safeQuery(tenantDb,
      `SELECT dcu.*, c.name as chemical_name, c.unit, c.category,
        (SELECT CONCAT(first_name, ' ', last_name) FROM deceased WHERE id = dcu.deceased_id) as deceased_name
       FROM deceased_chemical_usage dcu
       JOIN chemicals c ON c.id = dcu.chemical_id
       WHERE dcu.deceased_id = ?
       ORDER BY dcu.created_at DESC`,
      [req.params.deceasedId]
    );

    // Get total per chemical for this deceased
    const totals = await safeQuery(tenantDb,
      `SELECT c.id, c.name, c.unit, SUM(dcu.quantity_used) as total_used
       FROM deceased_chemical_usage dcu
       JOIN chemicals c ON c.id = dcu.chemical_id
       WHERE dcu.deceased_id = ?
       GROUP BY c.id, c.name, c.unit
       ORDER BY total_used DESC`,
      [req.params.deceasedId]
    );

    res.json({ success: true, data: { usage: rows, totals } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDeceasedByChemical = async (req, res) => {
  try {
    const tenantDb = req.tenant?.db_name;
    if (!tenantDb) return res.status(400).json({ success: false, message: 'Tenant database not resolved' });

    const rows = await safeQuery(tenantDb,
      `SELECT dcu.*, 
        (SELECT CONCAT(first_name, ' ', last_name) FROM deceased WHERE id = dcu.deceased_id) as deceased_name
       FROM deceased_chemical_usage dcu
       WHERE dcu.chemical_id = ?
       ORDER BY dcu.created_at DESC`,
      [req.params.chemicalId]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUsageReport = async (req, res) => {
  try {
    const tenantDb = req.tenant?.db_name;
    if (!tenantDb) return res.status(400).json({ success: false, message: 'Tenant database not resolved' });

    const { start_date, end_date, limit } = req.query;
    let sql = `
      SELECT dcu.id, dcu.quantity_used, dcu.unit, dcu.created_at, dcu.usage_notes,
        c.id as chemical_id, c.name as chemical_name, c.category,
        (SELECT CONCAT(first_name, ' ', last_name) FROM deceased WHERE id = dcu.deceased_id) as deceased_name,
        dcu.deceased_id
      FROM deceased_chemical_usage dcu
      JOIN chemicals c ON c.id = dcu.chemical_id
      WHERE 1=1`;
    const params = [];

    if (start_date) { sql += ' AND dcu.created_at >= ?'; params.push(start_date); }
    if (end_date) { sql += ' AND dcu.created_at <= ?'; params.push(end_date); }

    sql += ' ORDER BY dcu.created_at DESC';
    if (limit) sql += ' LIMIT ?';

    const rows = await safeQuery(tenantDb, sql, params);
    res.json({ success: true, data: rows, count: rows.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};