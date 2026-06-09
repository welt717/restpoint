const { executeQuery } = require('../config/database');

// ==================== DECEASED MODEL ====================
class Deceased {
  static async findByIdentifier(identifier) {
    const isPhone = /^[0-9]{10,15}$/.test(identifier);
    let query;
    let params;

    if (isPhone) {
      query = `
        SELECT d.* FROM deceased d
        JOIN next_of_kin n ON n.deceased_id = d.deceased_id
        WHERE n.contact = ?
        LIMIT 1
      `;
      params = [identifier];
    } else {
      query = `
        SELECT * FROM deceased
        WHERE deceased_id = ? OR admission_number = ?
        LIMIT 1
      `;
      params = [identifier.toUpperCase(), identifier];
    }

    const result = await executeQuery(query, params);
    return result[0] || null;
  }

  static async findById(deceasedId) {
    const result = await executeQuery(
      'SELECT * FROM deceased WHERE deceased_id = ?',
      [deceasedId]
    );
    return result[0] || null;
  }

  static async create(data) {
    const {
      deceased_id,
      full_name,
      admission_number,
      email,
      phone_number,
      date_of_death,
      cause_of_death
    } = data;

    await executeQuery(
      `INSERT INTO deceased 
       (deceased_id, full_name, admission_number, email, phone_number, date_of_death, cause_of_death)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [deceased_id, full_name, admission_number, email, phone_number, date_of_death, cause_of_death]
    );

    return this.findById(deceased_id);
  }

  static async update(deceasedId, data) {
    const { email, phone_number, status } = data;
    let query = 'UPDATE deceased SET ';
    const params = [];

    if (email) {
      query += 'email = ?, ';
      params.push(email);
    }
    if (phone_number) {
      query += 'phone_number = ?, ';
      params.push(phone_number);
    }
    if (status) {
      query += 'status = ?, ';
      params.push(status);
    }

    query += 'updated_at = NOW() WHERE deceased_id = ?';
    params.push(deceasedId);

    await executeQuery(query, params);
    return this.findById(deceasedId);
  }
}

// ==================== NEXT OF KIN MODEL ====================
class NextOfKin {
  static async findByDeceasedId(deceasedId) {
    return executeQuery(
      'SELECT * FROM next_of_kin WHERE deceased_id = ? ORDER BY created_at DESC',
      [deceasedId]
    );
  }

  static async create(deceasedId, data) {
    const { full_name, relationship, contact, email } = data;
    await executeQuery(
      `INSERT INTO next_of_kin (deceased_id, full_name, relationship, contact, email)
       VALUES (?, ?, ?, ?, ?)`,
      [deceasedId, full_name, relationship, contact, email]
    );
  }
}

// ==================== MARKETPLACE PRODUCTS MODEL ====================
class MarketplaceProduct {
  static async findByDeceasedId(deceasedId, filters = {}) {
    let query = 'SELECT * FROM marketplace_products WHERE deceased_id = ?';
    const params = [deceasedId];

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY created_at DESC';

    return executeQuery(query, params);
  }

  static async findById(productId) {
    const result = await executeQuery(
      'SELECT * FROM marketplace_products WHERE product_id = ?',
      [productId]
    );
    return result[0] || null;
  }

  static async create(deceasedId, data) {
    const { name, description, category, price, quantity_available, image_url } = data;
    const result = await executeQuery(
      `INSERT INTO marketplace_products 
       (deceased_id, name, description, category, price, quantity_available, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [deceasedId, name, description, category, price, quantity_available, image_url]
    );
    return this.findById(result.insertId);
  }

  static async update(productId, data) {
    const { name, description, category, price, quantity_available, status } = data;
    let query = 'UPDATE marketplace_products SET ';
    const params = [];

    if (name) {
      query += 'name = ?, ';
      params.push(name);
    }
    if (description) {
      query += 'description = ?, ';
      params.push(description);
    }
    if (category) {
      query += 'category = ?, ';
      params.push(category);
    }
    if (price) {
      query += 'price = ?, ';
      params.push(price);
    }
    if (quantity_available !== undefined) {
      query += 'quantity_available = ?, ';
      params.push(quantity_available);
    }
    if (status) {
      query += 'status = ?, ';
      params.push(status);
    }

    query += 'updated_at = NOW() WHERE product_id = ?';
    params.push(productId);

    await executeQuery(query, params);
    return this.findById(productId);
  }

  static async delete(productId) {
    await executeQuery('DELETE FROM marketplace_products WHERE product_id = ?', [productId]);
  }
}

// ==================== SHOPPING CART MODEL ====================
class ShoppingCart {
  static async findByDeceasedId(deceasedId) {
    return executeQuery(
      `SELECT sc.*, mp.name, mp.price, mp.category, mp.image_url
       FROM shopping_cart sc
       JOIN marketplace_products mp ON sc.product_id = mp.product_id
       WHERE sc.deceased_id = ?
       ORDER BY sc.added_at DESC`,
      [deceasedId]
    );
  }

  static async addItem(deceasedId, productId, quantity = 1) {
    return executeQuery(
      `INSERT INTO shopping_cart (deceased_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [deceasedId, productId, quantity]
    );
  }

  static async updateQuantity(deceasedId, productId, quantity) {
    if (quantity <= 0) {
      return this.removeItem(deceasedId, productId);
    }
    return executeQuery(
      'UPDATE shopping_cart SET quantity = ? WHERE deceased_id = ? AND product_id = ?',
      [quantity, deceasedId, productId]
    );
  }

  static async removeItem(deceasedId, productId) {
    return executeQuery(
      'DELETE FROM shopping_cart WHERE deceased_id = ? AND product_id = ?',
      [deceasedId, productId]
    );
  }

  static async clear(deceasedId) {
    return executeQuery('DELETE FROM shopping_cart WHERE deceased_id = ?', [deceasedId]);
  }
}

// ==================== ORDERS MODEL ====================
class Order {
  static async findByDeceasedId(deceasedId) {
    return executeQuery(
      'SELECT * FROM orders WHERE deceased_id = ? ORDER BY order_date DESC',
      [deceasedId]
    );
  }

  static async findById(orderId) {
    const result = await executeQuery(
      'SELECT * FROM orders WHERE order_id = ?',
      [orderId]
    );
    return result[0] || null;
  }

  static async create(deceasedId, data) {
    const { total_amount, notes } = data;
    const orderNumber = `ORD-${Date.now()}`;

    const result = await executeQuery(
      `INSERT INTO orders (deceased_id, order_number, total_amount, notes)
       VALUES (?, ?, ?, ?)`,
      [deceasedId, orderNumber, total_amount, notes]
    );

    return this.findById(result.insertId);
  }

  static async updateStatus(orderId, status, paymentStatus = null) {
    let query = 'UPDATE orders SET status = ?';
    const params = [status];

    if (paymentStatus) {
      query += ', payment_status = ?';
      params.push(paymentStatus);
    }

    query += ' WHERE order_id = ?';
    params.push(orderId);

    await executeQuery(query, params);
    return this.findById(orderId);
  }
}

// ==================== INVOICES MODEL ====================
class Invoice {
  static async findByDeceasedId(deceasedId) {
    return executeQuery(
      'SELECT * FROM invoices WHERE deceased_id = ? ORDER BY issue_date DESC',
      [deceasedId]
    );
  }

  static async create(deceasedId, data) {
    const { order_id, amount, notes } = data;
    const invoiceNumber = `INV-${Date.now()}`;

    const result = await executeQuery(
      `INSERT INTO invoices (deceased_id, order_id, invoice_number, amount, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [deceasedId, order_id, invoiceNumber, amount, notes]
    );

    return executeQuery('SELECT * FROM invoices WHERE invoice_id = ?', [result.insertId]);
  }

  static async findUnpaid(deceasedId) {
    return executeQuery(
      'SELECT * FROM invoices WHERE deceased_id = ? AND status IN ("pending", "overdue")',
      [deceasedId]
    );
  }
}

// ==================== PAYMENTS MODEL ====================
class Payment {
  static async findByDeceasedId(deceasedId) {
    return executeQuery(
      'SELECT * FROM payments WHERE deceased_id = ? ORDER BY payment_date DESC',
      [deceasedId]
    );
  }

  static async create(deceasedId, data) {
    const { invoice_id, amount, payment_method, reference_number, notes } = data;
    const result = await executeQuery(
      `INSERT INTO payments (deceased_id, invoice_id, amount, payment_method, reference_number, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [deceasedId, invoice_id, amount, payment_method, reference_number, notes]
    );

    return executeQuery('SELECT * FROM payments WHERE payment_id = ?', [result.insertId]);
  }
}

// ==================== DOCUMENTS MODEL ====================
class Document {
  static async findByDeceasedId(deceasedId) {
    return executeQuery(
      'SELECT * FROM documents WHERE deceased_id = ? ORDER BY uploaded_at DESC',
      [deceasedId]
    );
  }

  static async create(deceasedId, data) {
    const { document_type, file_name, file_path, file_size, uploaded_by } = data;
    const result = await executeQuery(
      `INSERT INTO documents (deceased_id, document_type, file_name, file_path, file_size, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [deceasedId, document_type, file_name, file_path, file_size, uploaded_by]
    );

    return executeQuery('SELECT * FROM documents WHERE document_id = ?', [result.insertId]);
  }

  static async updateStatus(documentId, status) {
    await executeQuery(
      'UPDATE documents SET status = ? WHERE document_id = ?',
      [status, documentId]
    );
  }

  static async delete(documentId) {
    await executeQuery('DELETE FROM documents WHERE document_id = ?', [documentId]);
  }
}

module.exports = {
  Deceased,
  NextOfKin,
  MarketplaceProduct,
  ShoppingCart,
  Order,
  Invoice,
  Payment,
  Document
};
