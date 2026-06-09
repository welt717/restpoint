const asyncHandler = require('express-async-handler');
const { safeQuery } = require('../../configurations/sqlConfig/db');
const { getKenyaTimeISO } = require('../../utilities/timeStamps/timeStamps');
const fs = require('fs');
const path = require('path');

// -----------------------------------
// 1. PORTAL LOGIN/ACCESS
// -----------------------------------
const getPortalDeceasedById = asyncHandler(async (req, res) => {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({
      message: 'Identifier is required (phone number or admission number).',
    });
  }

  const isPhone = /^[0-9]{10,15}$/.test(identifier);
  const isAdm = /^[A-Z0-9-]{3,20}$/i.test(identifier);

  if (!isPhone && !isAdm) {
    return res.status(400).json({
      message: 'Use a valid phone number (10–15 digits) or admission number.',
    });
  }

  let deceased_id = null;
  let deceasedRows = [];

  // Admission Number Login
  if (isAdm) {
    deceased_id = identifier.toUpperCase();
    deceasedRows = await safeQuery(
      `SELECT d.*, p.status AS portal_status
       FROM deceased d
       LEFT JOIN portal_tracking p ON d.deceased_id = p.deceased_id
       WHERE d.deceased_id = ?`,
      [deceased_id],
    );
  }

  // Phone Number Login
  if (isPhone) {
    deceasedRows = await safeQuery(
      `SELECT d.*, p.status AS portal_status
       FROM deceased d
       LEFT JOIN portal_tracking p ON d.deceased_id = p.deceased_id
       WHERE EXISTS (
         SELECT 1 FROM next_of_kin k
         WHERE k.deceased_id = d.deceased_id
         AND k.contact = ?
       )
       ORDER BY d.date_admitted DESC
       LIMIT 1`,
      [identifier],
    );

    if (deceasedRows.length > 0) {
      deceased_id = deceasedRows[0].deceased_id;
    }
  }

  if (!deceasedRows.length) {
    return res.status(404).json({
      message: 'No deceased found matching this identifier.',
    });
  }

  const deceased = deceasedRows[0];

  // Block completed records
  if (deceased.portal_status === 'completed' || deceased.has_certificate) {
    return res.status(403).json({
      message: 'Access denied. This record is already completed.',
    });
  }

  // Register session
  await safeQuery(
    `INSERT INTO portal_sessions (deceased_id, logged_in_at)
     VALUES (?, ?)`,
    [deceased_id, getKenyaTimeISO()],
  );

  // Get next-of-kin
  const [kin] = await safeQuery(
    `SELECT full_name, relationship, contact
     FROM next_of_kin
     WHERE deceased_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [deceased_id],
  );

  // Fetch full profile
  const rows = await safeQuery(
    `SELECT d.deceased_id, d.full_name AS deceased_name, d.date_of_death,
            d.cause_of_death, d.total_mortuary_charge, d.coffin_status,
            d.dispatch_date, d.date_admitted,
            TIMESTAMPDIFF(DAY, d.date_admitted, NOW()) AS days_in_morgue,
            p.status AS portal_status, p.remarks AS portal_remarks,
            a.findings AS autopsy_findings
     FROM deceased d
     LEFT JOIN portal_tracking p ON d.deceased_id = p.deceased_id
     LEFT JOIN postmortem a ON d.deceased_id = a.deceased_id
     WHERE d.deceased_id = ?
     LIMIT 1`,
    [deceased_id],
  );

  const rec = rows[0];
  const [mort] = await safeQuery(
    `SELECT name, phone, address FROM mortuaries LIMIT 1`,
  );

  res.status(200).json({
    message: 'Access granted.',
    deceased: {
      deceased_id: rec.deceased_id,
      deceased_name: rec.deceased_name,
      date_of_death: rec.date_of_death,
      cause_of_death: rec.cause_of_death,
      total_mortuary_charge: rec.total_mortuary_charge,
      coffin_status: rec.coffin_status,
      date_admitted: rec.date_admitted,
      dispatch_date: rec.dispatch_date,
      days_in_morgue: rec.days_in_morgue,
      status: rec.portal_status || 'pending',
      remarks: rec.portal_remarks || null,
      kin: {
        full_name: kin?.full_name || 'Next-of-kin not recorded',
        relationship: kin?.relationship || null,
        contact: kin?.contact || identifier,
      },
      autopsy_findings: rec.autopsy_findings || 'N/A',
      mortuary: {
        name: mort?.name || 'N/A',
        phone: mort?.phone || 'N/A',
        address: mort?.address || 'N/A',
      },
    },
  });
});

// -----------------------------------
// 2. GET DECEASED FINANCIAL DETAILS
// -----------------------------------
const getDeceasedFinancialDetails = asyncHandler(async (req, res) => {
  const { deceased_id } = req.params;

  // Fetch deceased + next of kin
  const deceasedSql = `
    SELECT 
      d.*,
      nk.full_name AS nok_name,
      nk.relationship,
      nk.contact,
      nk.email
    FROM deceased d
    LEFT JOIN next_of_kin nk 
      ON d.deceased_id = nk.deceased_id
    WHERE d.deceased_id = ?
    LIMIT 1
  `;
  const [deceased] = await safeQuery(deceasedSql, [deceased_id]);

  if (!deceased) {
    return res.status(404).json({ message: "Deceased not found" });
  }

  // Payments
  const paymentsSql = `
    SELECT * FROM payments
    WHERE deceased_id = ?
    ORDER BY payment_date DESC
  `;
  const payments = await safeQuery(paymentsSql, [deceased_id]);


if (!deceased) {
    return res.status(404).json({ message: "Deceased not found" });
}

const deceasedIntId = deceased.id; // <-- integer ID
  // Invoices
const invoicesSql = `
  SELECT * FROM invoices
  WHERE deceased_id = ?
  ORDER BY id DESC
`;
const invoices = await safeQuery(invoicesSql, [deceasedIntId]);



  // Extra charges (used for services too)
  const extraChargesSql = `
    SELECT * FROM extra_charges
    WHERE deceased_id = ?
    ORDER BY created_at DESC
  `;
  const extraCharges = await safeQuery(extraChargesSql, [deceased_id]);

  // All next of kin
  const nokSql = `
    SELECT * FROM next_of_kin
    WHERE deceased_id = ?
  `;
  const nextOfKin = await safeQuery(nokSql, [deceased_id]);

  // Coffin info
  const coffinSql = `
    SELECT 
      dc.*, 
      c.custom_id, 
      c.type, 
      c.category, 
      c.material,
      c.exact_price, 
      c.currency, 
      c.status AS coffin_status
    FROM deceased_coffin dc
    LEFT JOIN coffins c 
      ON dc.deceased_id = dc.deceased_id
    WHERE dc.deceased_id = ?
  `;
  const coffinInfo = await safeQuery(coffinSql, [deceased_id]);

  // -----------------------------------
  // CALCULATIONS
  // -----------------------------------
  const totalPayments = payments.reduce(
    (sum, p) => sum + parseFloat(p.amount || 0),
    0
  );

  // Use extra_charges as both extra charges and services
  const totalExtraCharges = extraCharges.reduce(
    (sum, c) => sum + parseFloat(c.amount || 0),
    0
  );

  const mortuaryCharges = parseFloat(deceased.total_mortuary_charge || 0);
  const coffinCharge = parseFloat(coffinInfo[0]?.exact_price || 0);

  const totalCharges = mortuaryCharges + totalExtraCharges + coffinCharge;
  const balance = totalCharges - totalPayments;

  res.status(200).json({
    status: "success",
    data: {
      deceased,
      nextOfKin,
      financial_summary: {
        mortuary_charges: mortuaryCharges.toFixed(2),
        extra_charges: totalExtraCharges.toFixed(2),
        coffin_charges: coffinCharge.toFixed(2),
        services_charges: totalExtraCharges.toFixed(2), // using extra_charges for services
        total_charges: totalCharges.toFixed(2),
        total_payments: totalPayments.toFixed(2),
        balance: balance.toFixed(2),
        balance_status:
          balance <= 0
            ? "paid"
            : balance > 0
            ? "pending"
            : "overpaid"
      },
      payments,
      invoices,
      extraCharges,
      coffin_info: coffinInfo[0] || null
    }
  });
});


// -----------------------------------
// 3. GET ALL DOCUMENTS FOR DECEASED
// -----------------------------------
const getDeceasedDocuments = asyncHandler(async (req, res) => {
  const { deceased_id } = req.params;

  // Check if deceased exists
  const [deceased] = await safeQuery(
    'SELECT deceased_id FROM deceased WHERE deceased_id = ?',
    [deceased_id]
  );

  if (!deceased) {
    return res.status(404).json({ message: 'Deceased not found' });
  }

  // Fetch all documents from the `documents` table for this deceased
  const documentsSql = `
    SELECT 
      document_type,
      file_name,
      file_path,
      uploaded_at,
      created_at,
      version,
      category
    FROM documents
    WHERE deceased_id = ?
    ORDER BY uploaded_at DESC
  `;
  const docs = await safeQuery(documentsSql, [deceased_id]);

  const allDocuments = [];

  for (const doc of docs) {
    if (doc.file_path && fs.existsSync(path.join(__dirname, '../..', doc.file_path))) {
      allDocuments.push({
        type: doc.document_type,
        path: doc.file_path,
        uploaded_at: doc.uploaded_at,
        created_at: doc.created_at,
        filename: doc.file_name,
        size: fs.statSync(path.join(__dirname, '../..', doc.file_path)).size,
        version: doc.version,
        category: doc.category
      });
    }
  }

  // Also check for any other files in deceased's folder
  const deceasedFolder = path.join(__dirname, `../../private/deceased_docs/${deceased_id}`);
  if (fs.existsSync(deceasedFolder)) {
    const files = fs.readdirSync(deceasedFolder);
    files.forEach(file => {
      const filePath = path.join(deceasedFolder, file);
      const stats = fs.statSync(filePath);

      if (!allDocuments.some(doc => doc.filename === file)) {
        allDocuments.push({
          type: 'Other Document',
          path: `private/deceased_docs/${deceased_id}/${file}`,
          date: stats.mtime,
          created_at: stats.ctime,
          filename: file,
          size: stats.size
        });
      }
    });
  }

  res.status(200).json({
    status: 'success',
    count: allDocuments.length,
    documents: allDocuments.sort((a, b) => new Date(b.uploaded_at || b.date) - new Date(a.uploaded_at || a.date))
  });
});

// -----------------------------------
// 4. DOWNLOAD DOCUMENT
// -----------------------------------
const downloadDocument = asyncHandler(async (req, res) => {
  const { deceased_id, document_path } = req.params;

  if (!deceased_id || !document_path) {
    return res.status(400).json({ message: 'Missing parameters' });
  }

  // Validate deceased exists
  const [deceased] = await safeQuery(
    'SELECT deceased_id FROM deceased WHERE deceased_id = ?',
    [deceased_id]
  );

  if (!deceased) {
    return res.status(404).json({ message: 'Deceased not found' });
  }

  // Construct full path
  const fullPath = path.join(__dirname, '../..', document_path);

  // Security check - ensure path is within allowed directories
  const allowedPaths = [
    'private/autopsy_reports',
    'private/death_certificates',
    'private/invoices',
    'private/receipts',
    'private/deceased_docs'
  ];

  const isAllowed = allowedPaths.some(allowedPath => 
    fullPath.includes(allowedPath) && fullPath.includes(deceased_id)
  );

  if (!isAllowed || !fs.existsSync(fullPath)) {
    return res.status(404).json({ message: 'Document not found or access denied' });
  }

  // Determine content type
  const ext = path.extname(fullPath).toLowerCase();
  const contentTypes = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };

  res.download(fullPath, path.basename(fullPath), {
    headers: {
      'Content-Type': contentTypes[ext] || 'application/octet-stream'
    }
  });
});



// -----------------------------------
// 5. GET ALL SERVICES AND COSTS
// -----------------------------------
const getDeceasedServicesAndCosts = asyncHandler(async (req, res) => {

  const { deceased_id } = req.params;

  // Fetch deceased info
  const [deceased] = await safeQuery(
    `SELECT 
      id, full_name, date_of_death, billing, total_mortuary_charge, coffin_status
     FROM deceased 
     WHERE deceased_id = ?`,
    [deceased_id]
  );

  if (!deceased) {
    
    return res.status(404).json({ status: 'error', message: 'Deceased not found' });
  }

  // Fetch extra charges
  const extraCharges = await safeQuery(
    `SELECT id, charge_type, amount, description, service_date, status, notes, created_at
     FROM extra_charges 
     WHERE deceased_id = ? 
     ORDER BY created_at DESC`,
    [deceased_id]
  );

  // Fetch coffin info
  const coffinInfo = await safeQuery(
    `SELECT c.coffin_id, c.type, c.category, c.material, c.exact_price, dc.assigned_date
     FROM coffins c
     JOIN deceased_coffin dc ON c.coffin_id = dc.coffin_id
     WHERE dc.deceased_id = ?`,
    [deceased_id]
  );

  // Fetch vehicle dispatch info
  const vehicleDispatch = await safeQuery(
    `SELECT dispatch_id, vehicle_plate, driver_name, driver_contact, status, notes, dispatch_date, dispatch_time, distance_km, round_trip_km, created_at
     FROM vehicle_dispatch
     WHERE deceased_id = ?
     ORDER BY dispatch_date DESC`,
    [deceased_id]
  );

  // Summary totals
  const totalExtra = extraCharges.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const totalCoffin = coffinInfo.reduce((sum, c) => sum + parseFloat(c.exact_price || 0), 0);
  const totalMortuary = parseFloat(deceased.total_mortuary_charge || 0);
  const grandTotal = totalExtra + totalCoffin + totalMortuary;

  res.status(200).json({
    status: 'success',
    data: {
      deceased: {
        id: deceased.id,
        full_name: deceased.full_name,
        date_of_death: deceased.date_of_death,
        billing: deceased.billing,
        total_mortuary_charge: totalMortuary
      },
      coffin_info: coffinInfo,
      vehicle_dispatch: vehicleDispatch,
      extra_charges: extraCharges,
      summary: {
        total_extra_charges: totalExtra.toFixed(2),
        total_coffin: totalCoffin.toFixed(2),
        total_mortuary: totalMortuary.toFixed(2),
        grand_total: grandTotal.toFixed(2)
      }
    }
  });
});


// -----------------------------------
// 6. GET DECEASED BILLING SUMMARY
// -----------------------------------
const getDeceasedBillingSummary = asyncHandler(async (req, res) => {
  const { deceased_id } = req.params;

  // Get deceased info
  const [deceased] = await safeQuery(
    `SELECT d.*, nk.full_name as nok_name, nk.contact, nk.email
     FROM deceased d
     LEFT JOIN next_of_kin nk ON d.deceased_id = nk.deceased_id
     WHERE d.deceased_id = ?
     LIMIT 1`,
    [deceased_id]
  );

  if (!deceased) {
    return res.status(404).json({ message: 'Deceased not found' });
  }

  // Get all payments
  const payments = await safeQuery(
    `SELECT * FROM payments 
     WHERE deceased_id = ? 
     ORDER BY payment_date DESC`,
    [deceased_id]
  );

  // Get all invoices
  const invoices = await safeQuery(
    `SELECT * FROM invoices 
     WHERE deceased_id = ? 
     ORDER BY created_at DESC`,
    [deceased_id]
  );

  // Calculate payment totals by method
  const paymentMethods = {};
  payments.forEach(payment => {
    const method = payment.payment_method || 'unknown';
    if (!paymentMethods[method]) {
      paymentMethods[method] = { count: 0, total: 0 };
    }
    paymentMethods[method].count++;
    paymentMethods[method].total += parseFloat(payment.amount || 0);
  });

  // Calculate invoice totals
  let totalInvoiced = 0;
  let totalPaid = 0;
  let outstandingInvoices = 0;

  invoices.forEach(invoice => {
    totalInvoiced += parseFloat(invoice.total_amount || 0);
    
    // Check if invoice is paid
    const invoicePayments = payments.filter(p => 
      p.invoice_id === invoice.id || p.reference === invoice.invoice_number
    );
    const paidAmount = invoicePayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    
    if (paidAmount >= parseFloat(invoice.total_amount || 0)) {
      totalPaid += parseFloat(invoice.total_amount || 0);
    } else {
      outstandingInvoices++;
    }
  });

  // Get payment timeline
  const paymentTimeline = payments.map(p => ({
    date: p.payment_date,
    amount: p.amount,
    method: p.payment_method,
    reference: p.reference
  })).sort((a, b) => new Date(a.date) - new Date(b.date));

  res.status(200).json({
    status: 'success',
    data: {
      deceased_info: {
        name: deceased.full_name,
        nok_name: deceased.nok_name,
        contact: deceased.contact,
        admission_date: deceased.date_admitted
      },
      billing_summary: {
        total_invoiced: totalInvoiced.toFixed(2),
        total_paid: totalPaid.toFixed(2),
        balance_due: (totalInvoiced - totalPaid).toFixed(2),
        outstanding_invoices: outstandingInvoices,
        payment_methods: paymentMethods
      },
      recent_payments: payments.slice(0, 5),
      recent_invoices: invoices.slice(0, 5),
      payment_timeline: paymentTimeline,
      full_payments: payments,
      full_invoices: invoices
    }
  });
});

// -----------------------------------
// 7. GET DECEASED COMPLETE PROFILE
// -----------------------------------
const getDeceasedCompleteProfile = asyncHandler(async (req, res) => {
  const { deceased_id } = req.params;

  // Get deceased basic info
  const [deceased] = await safeQuery(
    `SELECT * FROM deceased WHERE deceased_id = ?`,
    [deceased_id]
  );

  if (!deceased) {
    return res.status(404).json({ message: 'Deceased not found' });
  }

  // Get next of kin
  const nextOfKin = await safeQuery(
    `SELECT * FROM next_of_kin WHERE deceased_id = ?`,
    [deceased_id]
  );

  // Get medical info
  const medicalInfo = await safeQuery(
    `SELECT * FROM medical_records WHERE deceased_id = ?`,
    [deceased_id]
  );

  // Get autopsy info
  const autopsyInfo = await safeQuery(
    `SELECT * FROM postmortem WHERE deceased_id = ?`,
    [deceased_id]
  );

  // Get coffin info
  const coffinInfo = await safeQuery(
    `SELECT c.* FROM coffins c
     JOIN deceased_coffin dc ON c.coffin_id = dc.coffin_id
     WHERE dc.deceased_id = ?`,
    [deceased_id]
  );

  // Get dispatch info
  const dispatchInfo = await safeQuery(
    `SELECT * FROM vehicle_dispatch WHERE deceased_id = ?`,
    [deceased_id]
  );

  // Get portal tracking
  const portalTracking = await safeQuery(
    `SELECT * FROM portal_tracking WHERE deceased_id = ?`,
    [deceased_id]
  );

  // Count documents
  const documentCount = await safeQuery(
    `SELECT COUNT(*) as count FROM (
       SELECT certificate_url FROM death_certificates WHERE deceased_id = ?
       UNION ALL
       SELECT report_url FROM autopsy_reports WHERE deceased_id = ?
       UNION ALL
       SELECT pdf_url FROM invoices WHERE deceased_id = ?
     ) as docs`,
    [deceased_id, deceased_id, deceased_id]
  );

  res.status(200).json({
    status: 'success',
    data: {
      deceased,
      next_of_kin: nextOfKin,
      medical_info: medicalInfo[0] || {},
      autopsy_info: autopsyInfo[0] || {},
      coffin_info: coffinInfo[0] || {},
      dispatch_info: dispatchInfo[0] || {},
      portal_tracking: portalTracking[0] || {},
      statistics: {
        documents_count: documentCount[0]?.count || 0,
        kin_count: nextOfKin.length,
        days_in_morgue: Math.floor(
          (new Date() - new Date(deceased.date_admitted)) / (1000 * 60 * 60 * 24)
        )
      }
    }
  });
});

// -----------------------------------
// 8. VIEW INVOICE BY ID
// -----------------------------------
const getInvoiceById = asyncHandler(async (req, res) => {
  const { invoice_id } = req.params;

  const invoiceSql = `
    SELECT i.*, d.full_name as deceased_name, d.deceased_id,
           nk.full_name as nok_name, nk.contact as nok_contact
    FROM invoices i
    LEFT JOIN deceased d ON i.deceased_id = d.deceased_id
    LEFT JOIN next_of_kin nk ON d.deceased_id = nk.deceased_id
    WHERE i.id = ?
    LIMIT 1
  `;

  const [invoice] = await safeQuery(invoiceSql, [invoice_id]);

  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  // Parse items if it's a JSON string
  if (typeof invoice.items === 'string') {
    try {
      invoice.items = JSON.parse(invoice.items);
    } catch (e) {
      invoice.items = [];
    }
  }

  // Get payments for this invoice
  const payments = await safeQuery(
    `SELECT * FROM payments 
     WHERE invoice_id = ? OR reference = ?
     ORDER BY payment_date DESC`,
    [invoice_id, invoice.invoice_number]
  );

  // Calculate paid amount
  const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const balance = parseFloat(invoice.total_amount || 0) - totalPaid;

  res.status(200).json({
    status: 'success',
    data: {
      invoice,
      payments,
      payment_summary: {
        total_amount: parseFloat(invoice.total_amount || 0).toFixed(2),
        total_paid: totalPaid.toFixed(2),
        balance: balance.toFixed(2),
        payment_status: balance <= 0 ? 'paid' : balance > 0 ? 'pending' : 'overpaid'
      }
    }
  });
});

// -----------------------------------
// 9. SEARCH DECEASED RECORDS
// -----------------------------------
const searchDeceasedRecords = asyncHandler(async (req, res) => {
  const { query, type = 'all' } = req.query;

  if (!query || query.length < 2) {
    return res.status(400).json({ 
      message: 'Search query must be at least 2 characters long' 
    });
  }

  let searchSql = '';
  let searchParams = [`%${query}%`, `%${query}%`];

  switch (type) {
    case 'name':
      searchSql = `
        SELECT d.deceased_id, d.full_name, d.date_admitted, d.date_of_death,
               d.total_mortuary_charge, d.coffin_status,
               nk.full_name as nok_name, nk.contact
        FROM deceased d
        LEFT JOIN next_of_kin nk ON d.deceased_id = nk.deceased_id
        WHERE d.full_name LIKE ?
        ORDER BY d.date_admitted DESC
        LIMIT 50
      `;
      searchParams = [`%${query}%`];
      break;

    case 'id':
      searchSql = `
        SELECT d.deceased_id, d.full_name, d.date_admitted, d.date_of_death,
               d.total_mortuary_charge, d.coffin_status,
               nk.full_name as nok_name, nk.contact
        FROM deceased d
        LEFT JOIN next_of_kin nk ON d.deceased_id = nk.deceased_id
        WHERE d.deceased_id LIKE ? OR d.national_id LIKE ?
        ORDER BY d.date_admitted DESC
        LIMIT 50
      `;
      break;

    case 'kin':
      searchSql = `
        SELECT d.deceased_id, d.full_name, d.date_admitted, d.date_of_death,
               d.total_mortuary_charge, d.coffin_status,
               nk.full_name as nok_name, nk.contact
        FROM deceased d
        JOIN next_of_kin nk ON d.deceased_id = nk.deceased_id
        WHERE nk.full_name LIKE ? OR nk.contact LIKE ?
        ORDER BY d.date_admitted DESC
        LIMIT 50
      `;
      break;

    default: // 'all'
      searchSql = `
        SELECT d.deceased_id, d.full_name, d.date_admitted, d.date_of_death,
               d.total_mortuary_charge, d.coffin_status,
               nk.full_name as nok_name, nk.contact
        FROM deceased d
        LEFT JOIN next_of_kin nk ON d.deceased_id = nk.deceased_id
        WHERE d.full_name LIKE ? 
           OR d.deceased_id LIKE ? 
           OR d.national_id LIKE ?
           OR EXISTS (
             SELECT 1 FROM next_of_kin nk2 
             WHERE nk2.deceased_id = d.deceased_id 
               AND (nk2.full_name LIKE ? OR nk2.contact LIKE ?)
           )
        ORDER BY d.date_admitted DESC
        LIMIT 50
      `;
      searchParams = [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`];
  }

  const results = await safeQuery(searchSql, searchParams);

  res.status(200).json({
    status: 'success',
    count: results.length,
    results
  });
});

// -----------------------------------
// 10. GET ALL DATA FOR DECEASED (Portal View)
// -----------------------------------
const getAllDeceasedData = asyncHandler(async (req, res) => {
  const { deceased_id } = req.params;

  // Verify deceased exists
  const [deceased] = await safeQuery(
    `SELECT d.*, nk.full_name AS nok_name, nk.relationship, nk.contact AS nok_contact, nk.email AS nok_email
     FROM deceased d
     LEFT JOIN next_of_kin nk ON d.deceased_id = nk.deceased_id
     WHERE d.deceased_id = ?
     LIMIT 1`,
    [deceased_id]
  );

  if (!deceased) {
    return res.status(404).json({ status: 'error', message: 'Deceased not found' });
  }

  // Get all next of kin
  const nextOfKin = await safeQuery(
    `SELECT * FROM next_of_kin WHERE deceased_id = ? ORDER BY created_at DESC`,
    [deceased_id]
  );

  // Get financial data
  const payments = await safeQuery(
    `SELECT * FROM payments WHERE deceased_id = ? ORDER BY payment_date DESC`,
    [deceased_id]
  );

  const invoices = await safeQuery(
    `SELECT * FROM invoices WHERE deceased_id = ? ORDER BY created_at DESC`,
    [deceased_id]
  );

  const extraCharges = await safeQuery(
    `SELECT * FROM extra_charges WHERE deceased_id = ? ORDER BY created_at DESC`,
    [deceased_id]
  );

  // Get documents
  const documents = await safeQuery(
    `SELECT 
       document_id, original_name, stored_name, file_path, mime_type, file_size,
       category, uploaded_by, uploaded_at
     FROM documents 
     WHERE deceased_id = ? 
     ORDER BY uploaded_at DESC`,
    [deceased_id]
  );

  // Get services
  const services = await safeQuery(
    `SELECT * FROM extra_charges WHERE deceased_id = ? ORDER BY created_at DESC`,
    [deceased_id]
  );

  // Get coffin info
  const coffinInfo = await safeQuery(
    `SELECT c.* FROM coffins c
     JOIN deceased_coffin dc ON c.coffin_id = dc.coffin_id
     WHERE dc.deceased_id = ?`,
    [deceased_id]
  );

  // Get vehicle dispatch
  const vehicleDispatch = await safeQuery(
    `SELECT * FROM vehicle_dispatch WHERE deceased_id = ? ORDER BY dispatch_date DESC`,
    [deceased_id]
  );

  // Get autopsy info
  const autopsyInfo = await safeQuery(
    `SELECT * FROM postmortem WHERE deceased_id = ? LIMIT 1`,
    [deceased_id]
  );

  // Get portal tracking
  const portalTracking = await safeQuery(
    `SELECT * FROM portal_tracking WHERE deceased_id = ? LIMIT 1`,
    [deceased_id]
  );

  // Calculate financial summary
  const totalPayments = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const totalExtraCharges = extraCharges.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
  const mortuaryCharges = parseFloat(deceased.total_mortuary_charge || 0);
  const coffinCharge = coffinInfo[0] ? parseFloat(coffinInfo[0].exact_price || 0) : 0;
  const totalCharges = mortuaryCharges + totalExtraCharges + coffinCharge;
  const balance = totalCharges - totalPayments;

  // Calculate days in morgue
  const daysInMorgue = deceased.date_admitted
    ? Math.floor((new Date() - new Date(deceased.date_admitted)) / (1000 * 60 * 60 * 24))
    : 0;

  res.status(200).json({
    status: 'success',
    data: {
      deceased: {
        deceased_id: deceased.deceased_id,
        full_name: deceased.full_name,
        date_admitted: deceased.date_admitted,
        date_of_death: deceased.date_of_death,
        cause_of_death: deceased.cause_of_death,
        national_id: deceased.national_id,
        age: deceased.age,
        gender: deceased.gender,
        total_mortuary_charge: mortuaryCharges,
        coffin_status: deceased.coffin_status,
        dispatch_date: deceased.dispatch_date,
        days_in_morgue: daysInMorgue,
        primary_nok: {
          name: deceased.nok_name,
          relationship: deceased.relationship,
          contact: deceased.nok_contact,
          email: deceased.nok_email
        }
      },
      next_of_kin: nextOfKin,
      financial_summary: {
        mortuary_charges: mortuaryCharges.toFixed(2),
        extra_charges: totalExtraCharges.toFixed(2),
        coffin_charges: coffinCharge.toFixed(2),
        total_charges: totalCharges.toFixed(2),
        total_payments: totalPayments.toFixed(2),
        balance: balance.toFixed(2),
        balance_status: balance <= 0 ? 'paid' : balance > 0 ? 'pending' : 'overpaid'
      },
      payments,
      invoices,
      documents: documents.map(doc => ({
        documentId: doc.document_id,
        originalName: doc.original_name,
        storedName: doc.stored_name,
        url: doc.file_path,
        mimeType: doc.mime_type,
        sizeKB: Math.round(doc.file_size / 1024),
        category: doc.category,
        uploadedBy: doc.uploaded_by,
        uploadedAt: doc.uploaded_at
      })),
      services,
      coffin_info: coffinInfo[0] || null,
      vehicle_dispatch: vehicleDispatch,
      autopsy_info: autopsyInfo[0] || null,
      portal_tracking: portalTracking[0] || null
    }
  });
});

module.exports = {
  getPortalDeceasedById,
  getDeceasedFinancialDetails,
  getDeceasedDocuments,
  downloadDocument,
  getDeceasedServicesAndCosts,
  getDeceasedBillingSummary,
  getDeceasedCompleteProfile,
  getAllDeceasedData,
};
