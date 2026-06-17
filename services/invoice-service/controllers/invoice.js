// controllers/invoiceController.js
const asyncHandler = require('express-async-handler');
const NodeCache = require('node-cache');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const crypto = require('crypto');

const { AppError } = require('../../middlewares/errorHandler/errorHandler');
const { safeQuery } = require('../../configurations/sqlConfig/db');
const { getKenyaTimeISO } = require('../../utilities/timeStamps/timeStamps');


const invoiceCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

const generateStampHash = () => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `LFH-INV-${dd}-${mm}-${yyyy}`;
};

const generateInvoicePDFBuffer = async (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Invoice ${invoice.invoice_number}`,
          Author: 'Montezuma Monalisa Funeral Home',
        },
      });
      
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // HEADER SECTION 
      const headerTop = 40;
      const logoPath = path.join(__dirname, '../../public/logo/montezuma.png');

      if (fs.existsSync(logoPath)) {
        //  white background behind logo 
        doc.rect(45, headerTop - 5, 90, 45)
          .fill('#ffffff')
          .stroke('#e0e0e0');
        
        doc.image(logoPath, 50, headerTop, { width: 80 });
      } else {
        // Fallback if no logo
        doc.rect(45, headerTop - 5, 90, 45)
          .fill('#1a5276')
          .stroke('#0f172a');
        
        doc.fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#ffffff')
          .text('LEE', 60, headerTop + 10);
      }

      // Company Name below logo
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text('MONTEZUMA MONALISA  ', 50, headerTop + 50);

      // Contact Info on RIGHT side
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#0f172a')
        .text(
          ' Mbagathi Way, Opp. Forces Memorial Hospital',
          300,
          headerTop + 10,
        )
        .text(
          ' monte2lisa[@]yahoo.com | Fax: (020) 8068115',
          300,
          headerTop + 25,
        )
        .text(
          '+254 722 268 566  |  +254 722 827 652',
          300,
          headerTop + 40,
        );

      // Invoice   details  Sectio
      const detailsTop = headerTop + 100;

      // 2   column  layout
      const leftColumn = 50;
      const rightColumn = 300;

      // Invoice  deatils
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1a5276')
        .text('INVOICE DETAILS', leftColumn, detailsTop);

      doc
        .font('Helvetica')
        .fillColor('#2c3e50')
        .text(
          `Invoice #: ${invoice.invoice_number}`,
          leftColumn,
          detailsTop + 20,
        )
        .text(
          `Date: ${new Date(invoice.created_at || Date.now()).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}`,
          leftColumn,
          detailsTop + 35,
        );

      // Client  info
      doc
        .font('Helvetica-Bold')
        .fillColor('#1a5276')
        .text('CLIENT INFORMATION', rightColumn, detailsTop);

      doc
        .font('Helvetica')
        .fillColor('#2c3e50')
        .text(
          `Deceased: ${invoice.deceased_name || 'N/A'}`,
          rightColumn,
          detailsTop + 20,
        )
        .text(
          `Admission #: ${invoice.admission_number || invoice.adm_number || invoice.id_number || 'N/A'}`,
          rightColumn,
          detailsTop + 35,
        )
        .text(
          `Next of Kin: ${invoice.nok || 'N/A'}`,
          rightColumn,
          detailsTop + 50,
        )
        .text(
          `Date of Admission: ${invoice.date_of_admission || invoice.dod || 'N/A'}`,
          rightColumn,
          detailsTop + 65,
        );

      //Services   Table 
       const tableX = 50;
       const tableWidth = 495;

      // column  width  
       const colServiceWidth = 230; 
       const colQtyWidth = 50;       
       const colUnitWidth = 90;     
       const colAmountWidth = 90;    

      // Col  X  positions  
      const colServiceX = tableX + 5;
      const colQtyX = colServiceX + colServiceWidth + 5;
      const colUnitX = colQtyX + colQtyWidth + 5;
      const colAmountX = colUnitX + colUnitWidth + 5;

      const tableTop = detailsTop + 90;

      // Table Header 
      doc.rect(tableX, tableTop, tableWidth, 20).fill('#1a5276');

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#ffffff')
        .text('SERVICE / DESCRIPTION', colServiceX, tableTop + 6)
        .text('QTY', colQtyX, tableTop + 6, { width: colQtyWidth, align: 'right' })
        .text('UNIT PRICE', colUnitX, tableTop + 6, { width: colUnitWidth, align: 'right' })
        .text('AMOUNT', colAmountX, tableTop + 6, { width: colAmountWidth, align: 'right' });
      //  Table Rows 
      let currentY = tableTop + 20;
      const items = Array.isArray(invoice.items) ? invoice.items : [];
      const rowHeight = 22;
      const maxRowsPerPage = 15;
      let rowCount = 0;
      // Function to draw a row
      const drawTableRow = (item, index, yPos) => {
        const rowColor = index % 2 === 0 ? '#f8f9f9' : '#ffffff';
        doc.rect(tableX, yPos, tableWidth, rowHeight).fill(rowColor);

        const unitPrice = parseFloat(item.unit_price || item.amount || 0);
        const quantity = parseFloat(item.qty || item.quantity || 1);
        const amount = quantity * unitPrice;

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#000000')
          .text(item.service || item.description || 'Service', colServiceX, yPos + 6, { 
            width: colServiceWidth,
            ellipsis: true 
          })
          .text(quantity.toString(), colQtyX, yPos + 6, { width: colQtyWidth, align: 'right' })
          .text(
            `KES ${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            colUnitX,
            yPos + 6,
            { width: colUnitWidth, align: 'right' }
          )
          .text(
            `KES ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            colAmountX,
            yPos + 6,
            { width: colAmountWidth, align: 'right' }
          );

        return yPos + rowHeight;
      };

      //  Draw Items with Pagination 
      items.forEach((item, index) => {
        if (rowCount >= maxRowsPerPage) {
          doc.addPage();
          currentY = 50;
          rowCount = 0;

          // Redraw header on new page
          doc.rect(tableX, currentY, tableWidth, 20).fill('#1a5276');
          doc
            .fontSize(9)
            .font('Helvetica-Bold')
            .fillColor('#ffffff')
            .text('SERVICE / DESCRIPTION', colServiceX, currentY + 6)
            .text('QTY', colQtyX, currentY + 6, { width: colQtyWidth, align: 'right' })
            .text('UNIT PRICE', colUnitX, currentY + 6, { width: colUnitWidth, align: 'right' })
            .text('AMOUNT', colAmountX, currentY + 6, { width: colAmountWidth, align: 'right' });

          currentY += 20;
        }

        currentY = drawTableRow(item, index, currentY);
        rowCount++;
      });

      // empty rows if needed
      if (items.length < 3) {
        for (let i = items.length; i < 3; i++) {
          const rowColor = i % 2 === 0 ? '#f8f9f9' : '#ffffff';
          doc.rect(tableX, currentY, tableWidth, rowHeight).fill(rowColor);
          currentY += rowHeight;
          rowCount++;
        }
      }

      // ===== TOTALS SECTION =====
      const totalsTop = currentY + 20;
      const pageWidth = 595;  //set  page   width  
      const margin = 50;
      const usableWidth = pageWidth - margin * 2;
      const columnWidth = usableWidth / 2;
      // left   col  (   payment status )
      const leftBoxX = margin;
      const leftBoxWidth = columnWidth;
      const leftBoxHeight = 100;
      // Right  col  invoice toatls
      const rightBoxX = margin + columnWidth;
      const rightBoxWidth = columnWidth;
      const rightBoxHeight = 100;
      // - left  box
      doc
        .rect(leftBoxX, totalsTop, leftBoxWidth, leftBoxHeight)
        .fill('#f8f9f9')
        .stroke('#bdc3c7');
      // Payment Status Header
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#1a5276')
        .text('PAYMENT STATUS', leftBoxX + 10, totalsTop + 10);

      // Payment details
      const totalAmount = parseFloat(invoice.total_amount || 0);
      const amountPaid = parseFloat(invoice.amount_paid || 0);
      const balance = totalAmount - amountPaid;

      let paymentStatus = 'PENDING';
      let statusColor = '#e23b28';
      let statusBg = '#fadbd8';

      if (balance <= 0) {
        paymentStatus = 'FULLY PAID';
        statusColor = '#27ae60';
        statusBg = '#d5f4e6';
      } else if (amountPaid > 0) {
        paymentStatus = 'PARTIAL';
        statusColor = '#f39c12';
        statusBg = '#fef9e7';
      }

      // Status badge
      doc
        .rect(leftBoxX + 10, totalsTop + 22, 50, 15)
        .fill(statusBg);

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(statusColor)
        .text(paymentStatus, leftBoxX + 15, totalsTop + 26);

      // Paid/Balance
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#2c3e50')
        .text(
          `Paid: KES ${amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          leftBoxX + 10,
          totalsTop + 45
        )
        .text(
          `Balance: KES ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          leftBoxX + 10,
          totalsTop + 60
        );

      //  RIGHT BOX 
      doc
        .rect(rightBoxX, totalsTop, rightBoxWidth, rightBoxHeight)
        .fill('#f8f9f9')
        .stroke('#bdc3c7');

      // Header
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#1a5276')
        .text('INVOICE TOTALS', rightBoxX + 10, totalsTop + 10);

      // Subtotal - FIXED -----   Position inside the box
      const subtotal = parseFloat(invoice.subtotal || invoice.total_amount || 0);
      
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#2c3e50')
        .text('SUBTOTAL:', rightBoxX + 10, totalsTop + 30);

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#2c3e50')
        .text(
          `KES ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          rightBoxX + 80,
          totalsTop + 30,
          { width: 80, align: 'right' }
        );

      // Separator line
      doc
        .strokeColor('#1a5276')
        .lineWidth(0.5)
        .moveTo(rightBoxX + 10, totalsTop + 45)
        .lineTo(rightBoxX + 170, totalsTop + 45)
        .stroke();

      // Total Amount - Highlighted
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#1a5276')
        .text('TOTAL:', rightBoxX + 10, totalsTop + 55);

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#1a5276')
        .text(
          `KES ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          rightBoxX + 80,
          totalsTop + 55,
          { width: 80, align: 'right' }
        );

      //  FOOTER SECTION
      const footerTop = Math.max(totalsTop + leftBoxHeight, totalsTop + rightBoxHeight) + 30;

      // Check if  need a new page for footer
      const pageHeight = 842;
      if (footerTop > pageHeight - 120) {
        doc.addPage();
        currentY = 50;
      }

      // Footer separator line
      doc
        .strokeColor('#001EFF')
        .lineWidth(1)
        .moveTo(50, footerTop)
        .lineTo(545, footerTop)
        .stroke();

      // Verification and generation info
      const stamp = invoice.stamp_hash || invoice.verification_hash || generateStampHash().toUpperCase();
      
      doc
        .fontSize(6)
        .font('Helvetica')
        .fillColor('#001EFF')
        .text(`Verification: ${stamp.substring(0, 24)}`, 50, footerTop + 8)
        .text(`Generated: ${new Date().toLocaleString('en-GB')}`, 50, footerTop + 18);

      // Contact & Support Note
      doc
        .fontSize(7)
        .font('Helvetica')
        .fillColor('#2c3e50')
        .text(
          'Thank you for choosing Lee Funeral Home. For inquiries:',
          50,
          footerTop + 35,
          { width: 300 }
        );

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#1a5276')
        .text(
          '+254 740 045 355 | info@lf.services',
          50,
          footerTop + 50,
          { width: 300 }
        );

      // Signature Area - Right side
      const signaturePath = path.join(
        __dirname,
        '../../uploads/signature/signature.png',
      );
      
      if (fs.existsSync(signaturePath)) {
        doc.image(signaturePath, 400, footerTop + 25, {
          width: 50,
          height: 25,
        });
      } else {
        doc
          .strokeColor('#1a5276')
          .lineWidth(0.5)
          .moveTo(400, footerTop + 37)
          .lineTo(450, footerTop + 37)
          .stroke();
      }

      doc
        .fontSize(7)
        .fillColor('#1a5276')
        .text('Authorized Signature', 400, footerTop + 55)
        .fontSize(6)
        .text('Lee Funeral Home', 400, footerTop + 65);

      // Terms note at bottom
      const termsY = footerTop + 80;
      if (termsY < pageHeight - 20) {
        doc
          .fontSize(6)
          .fillColor('#2c3e50')
          .text(
            'This invoice is computer generated and does not require a physical signature.',
            50,
            termsY,
            { align: 'center', width: 495 },
          )
          .text(
            'All payments should be made to Lee Funeral Home bank account as indicated above.',
            50,
            termsY + 8,
            { align: 'center', width: 495 },
          )
          .text(
            'Please retain this invoice for your records.',
            50,
            termsY + 16,
            { align: 'center', width: 495 },
          );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// Get all deceased with financial summary
const getAllDeceasedWithFinancials = asyncHandler(async (req, res, next) => {
  const sql = `
    SELECT 
      d.id,
      d.deceased_id,
      d.full_name,
      d.date_of_death,
      d.cause_of_death,
      d.place_of_death,
      d.gender,
      d.county,
      d.location,
      d.billing,
      d.status,
      d.date_admitted,
      d.admission_number,
      
      -- Get Next of Kin
      nk.full_name as nok_name,
      nk.relationship as nok_relationship,
      nk.contact as nok_contact,
      
      -- Coffin info
      dc.coffin_id,
      c.custom_id AS coffin_custom_id,
      c.type AS coffin_type,
      c.exact_price AS coffin_price,
      
      -- Vehicle dispatch info
      vd.dispatch_id,
      vd.vehicle_plate,
      vd.dispatch_date,
      vd.status AS vehicle_status,

      -- Totals
      COALESCE(SUM(p.amount), 0) AS total_payments,
      COALESCE(SUM(ec.amount), 0) 
        + COALESCE(c.exact_price, 0)
        + COALESCE(d.billing, 0) AS total_charges,
      (COALESCE(d.billing, 0) 
        + COALESCE(SUM(ec.amount), 0) 
        + COALESCE(c.exact_price, 0)
        - COALESCE(SUM(p.amount), 0)) AS balance

    FROM deceased d
    LEFT JOIN next_of_kin nk ON d.deceased_id = nk.deceased_id
    LEFT JOIN payments p ON d.id = p.deceased_id
    LEFT JOIN extra_charges ec ON d.deceased_id = ec.deceased_id
    LEFT JOIN deceased_coffin dc ON d.deceased_id = dc.deceased_id
    LEFT JOIN coffins c ON dc.coffin_id = c.coffin_id
    LEFT JOIN vehicle_dispatch vd ON d.deceased_id = vd.deceased_id

    GROUP BY d.id
    ORDER BY d.date_registered DESC;
  `;

  const deceased = await safeQuery(sql);
  res.json({ status: 'success', data: deceased });
});

// Get deceased financial details - COMPLETE with all data


const getDeceasedFinancialDetails = asyncHandler(async (req, res, next) => {
  const { deceased_id } = req.params;

  // Fetch deceased using numeric ID
  const deceasedSql = `
    SELECT d.*, nk.full_name as nok_name, nk.relationship, nk.contact, nk.email
    FROM deceased d
    LEFT JOIN next_of_kin nk ON d.deceased_id = nk.deceased_id
    WHERE d.id = ?
  `;
  const [deceased] = await safeQuery(deceasedSql, [deceased_id]);

  if (!deceased) {
    return next(new AppError('Deceased not found', 404));
  }

  const stringDeceasedId = deceased.deceased_id;

  // Payments
  const paymentsSql =
    'SELECT * FROM payments WHERE deceased_id = ? ORDER BY payment_date DESC';
  const payments = await safeQuery(paymentsSql, [deceased_id]);

  // Invoices
  const invoicesSql =
    'SELECT * FROM invoices WHERE deceased_id = ? ORDER BY created_at DESC';
  const invoices = await safeQuery(invoicesSql, [deceased_id]);

  // Extra charges
  const chargesSql =
    'SELECT * FROM extra_charges WHERE deceased_id = ? ORDER BY created_at DESC';
  const extraCharges = await safeQuery(chargesSql, [stringDeceasedId]);

  // Next of Kin
  const nokSql = 'SELECT * FROM next_of_kin WHERE deceased_id = ?';
  const nextOfKin = await safeQuery(nokSql, [stringDeceasedId]);

  // Coffin info
  let coffinInfo = null;
  const coffinSql = `
    SELECT dc.*, c.custom_id, c.type, c.category, c.material, c.exact_price,
           c.currency, c.status AS coffin_status, c.color, c.size, c.supplier, c.origin
    FROM deceased_coffin dc
    LEFT JOIN coffins c ON dc.coffin_id = c.coffin_id
    WHERE dc.deceased_id = ?
  `;
  const coffinDetails = await safeQuery(coffinSql, [stringDeceasedId]);

  if (coffinDetails && coffinDetails.length > 0) {
    coffinInfo = coffinDetails[0];
  }

  // Vehicle dispatch info
  let vehicleDispatchInfo = null;
  const vehicleSql = `
    SELECT * FROM vehicle_dispatch
    WHERE deceased_id = ?
  `;
  const vehicleDetails = await safeQuery(vehicleSql, [stringDeceasedId]);

  if (vehicleDetails && vehicleDetails.length > 0) {
    vehicleDispatchInfo = vehicleDetails[0];
  }

  // Available coffins
  const availableCoffinsSql = `
    SELECT coffin_id, custom_id, type, category, material, exact_price, currency, status
    FROM coffins 
    WHERE status = 'in-stock'
    ORDER BY created_at DESC
  `;
  const availableCoffins = await safeQuery(availableCoffinsSql);

  // Calculate totals
  const totalPayments = payments.reduce(
    (sum, payment) => sum + parseFloat(payment.amount || 0),
    0
  );
  
  const totalExtraCharges = extraCharges.reduce(
    (sum, charge) => sum + parseFloat(charge.amount || 0),
    0
  );
  
  const mortuaryCharges = parseFloat(deceased.billing || 0);
  const coffinCharge = parseFloat(coffinInfo?.exact_price || 0);
  const totalCharges = mortuaryCharges + totalExtraCharges + coffinCharge;
  const balance = totalCharges - totalPayments;

  const financialSummary = {
    deceased,
    nextOfKin,
    payments,
    extraCharges,
    invoices: invoices.map((inv) => ({
      ...inv,
      items: typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items,
    })),
    coffinInfo,
    vehicleDispatchInfo,
    availableCoffins,
    totals: {
      mortuary_charges: mortuaryCharges.toFixed(2),
      extra_charges: totalExtraCharges.toFixed(2),
      coffin_charges: coffinCharge.toFixed(2),
      total_charges: totalCharges.toFixed(2),
      total_payments: totalPayments.toFixed(2),
      balance: balance.toFixed(2),
    },
  };

  res.json({ status: 'success', data: financialSummary });
});

// Create payment
const createPayment = asyncHandler(async (req, res, next) => {
  const { deceased_id, amount, payment_method, reference_code, description } =
    req.body;

  if (!deceased_id || !amount || !payment_method) {
    return next(new AppError('Missing required payment fields', 400));
  }

  const sql = `
    INSERT INTO payments 
    (deceased_id, amount, payment_method, reference_code, description, payment_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const result = await safeQuery(sql, [
    deceased_id,
    amount,
    payment_method,
    reference_code || `PAY-${Date.now()}`,
    description || 'Mortuary Services Payment',
    getKenyaTimeISO(),
  ]);

  res.status(201).json({
    status: 'success',
    message: 'Payment recorded successfully',
    payment_id: result.insertId,
  });
});

// Create extra charge
const createExtraCharge = asyncHandler(async (req, res, next) => {
  const { deceased_id, charge_type, amount, description, notes, service_date } =
    req.body;

  if (!deceased_id || !charge_type || !amount) {
    return next(new AppError('Missing required charge fields', 400));
  }

  // First verify the deceased exists
  const deceasedSql = 'SELECT deceased_id FROM deceased WHERE id = ?';
  const [deceased] = await safeQuery(deceasedSql, [deceased_id]);

  if (!deceased) {
    return next(new AppError('Deceased not found', 404));
  }

  const sql = `
    INSERT INTO extra_charges 
    (deceased_id, charge_type, amount, description, notes, service_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const result = await safeQuery(sql, [
    deceased.deceased_id,
    charge_type,
    amount,
    description,
    notes || '',
    service_date || getKenyaTimeISO(),
    getKenyaTimeISO(),
  ]);

  res.status(201).json({
    status: 'success',
    message: 'Extra charge added successfully',
    charge_id: result.insertId,
  });
});

// Create system invoice - ENHANCED with complete data
const createSystemInvoice = asyncHandler(async (req, res, next) => {
  const { deceased_id } = req.body;

  if (!deceased_id) {
    return next(new AppError('Deceased ID is required', 400));
  }

  // Fetch deceased with all related data
  const deceasedSql = `
    SELECT d.*, nk.full_name as nok_name, nk.relationship, nk.contact, nk.email
    FROM deceased d
    LEFT JOIN next_of_kin nk ON d.deceased_id = nk.deceased_id
    WHERE d.id = ?
  `;
  const [deceased] = await safeQuery(deceasedSql, [deceased_id]);

  if (!deceased) {
    return next(new AppError('Deceased not found', 404));
  }

  // Fetch payments for this deceased
  const paymentsSql = 'SELECT SUM(amount) as total_paid FROM payments WHERE deceased_id = ?';
  const [paymentResult] = await safeQuery(paymentsSql, [deceased_id]);
  const amountPaid = parseFloat(paymentResult?.total_paid || 0);

  // Fetch unpaid extra charges
  const chargesSql = `
    SELECT * 
    FROM extra_charges 
    WHERE deceased_id = ? AND (status IS NULL OR status != "Paid")
  `;
  const extraCharges = await safeQuery(chargesSql, [deceased.deceased_id]);

  const systemItems = [];
  let systemTotal = 0;

  // === Basic Mortuary Services ===
  if (deceased.billing && deceased.billing > 0) {
    systemItems.push({
      service: 'Basic Mortuary Services',
      qty: 1,
      amount: parseFloat(deceased.billing),
      description: 'Standard mortuary care and maintenance',
    });
    systemTotal += parseFloat(deceased.billing);
  }

  // === Extra Charges ===
  extraCharges.forEach((charge) => {
    systemItems.push({
      service: charge.charge_type,
      qty: 1,
      amount: parseFloat(charge.amount),
      description: charge.description || charge.notes || charge.charge_type,
    });
    systemTotal += parseFloat(charge.amount);
  });

  // === Coffin Details ===
  const coffinSql = `
    SELECT dc.*, c.type, c.category, c.exact_price
    FROM deceased_coffin dc
    LEFT JOIN coffins c ON dc.coffin_id = c.coffin_id
    WHERE dc.deceased_id = ?
  `;
  const coffinDetails = await safeQuery(coffinSql, [deceased.deceased_id]);

  if (coffinDetails.length > 0) {
    const coffin = coffinDetails[0];
    const coffinPrice = parseFloat(coffin.exact_price || 0);
    if (coffinPrice > 0) {
      systemItems.push({
        service: `Coffin: ${coffin.type} (${coffin.category})`,
        qty: 1,
        amount: coffinPrice,
        description: 'Assigned coffin',
      });
      systemTotal += coffinPrice;
    }
  }

  // === Vehicle Dispatch ===
  const vehicleSql = `
    SELECT * 
    FROM vehicle_dispatch 
    WHERE deceased_id = ?
  `;
  const vehicleDispatch = await safeQuery(vehicleSql, [deceased.deceased_id]);

  if (vehicleDispatch.length > 0) {
    vehicleDispatch.forEach((vd) => {
      const dispatchCost = 5000; // Default dispatch cost
      systemItems.push({
        service: `Vehicle Dispatch: ${vd.vehicle_plate}`,
        qty: 1,
        amount: dispatchCost,
        description: `Driver: ${vd.driver_name || 'N/A'}`,
      });
      systemTotal += dispatchCost;
    });
  }

  // === Fallback Default Services ===
  if (systemItems.length === 0) {
    systemItems.push(
      { service: 'Mortuary Services', qty: 1, amount: 0, description: 'Basic mortuary care' },
      { service: 'Default Care and Maintenance', qty: 1, amount: 0, description: 'Daily maintenance' }
    );
    systemTotal = 00;
  }

  // === Invoice Metadata ===
  const stamp_hash = generateStampHash();
  const invoice_number = `SYS-INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const invoiceData = {
    deceased_name: deceased.full_name,
    nok: deceased.nok_name || 'N/A',
    admission_number: deceased.admission_number || deceased.deceased_id,
    id_number: deceased.national_id || 'N/A',
    dod: deceased.date_of_death ? new Date(deceased.date_of_death).toLocaleDateString('en-GB') : 'N/A',
    date_of_admission: deceased.date_admitted ? new Date(deceased.date_admitted).toLocaleDateString('en-GB') : 'N/A',
    address: `${deceased.location || 'N/A'}, ${deceased.county || 'N/A'}`,
    phone: deceased.nok_contact || 'N/A',
    items: systemItems,
    total_amount: systemTotal,
    subtotal: systemTotal,
    amount_paid: amountPaid,
    tax_amount: 0,
    tax_rate: 0,
    mortuary_name: 'Lee Funeral Home',
    mortuary_phone: '+254 740 045 355',
    stamp_hash,
    signature_url: '/uploads/signature/signature.png',
    created_at: getKenyaTimeISO(),
    invoice_number,
    deceased_id: deceased.id,
  };

  // === Generate PDF ===
  const pdfBuffer = await generateInvoicePDFBuffer(invoiceData);
  const baseInvoicesDir = path.join(__dirname, '../../uploads/invoices');
  if (!fs.existsSync(baseInvoicesDir)) fs.mkdirSync(baseInvoicesDir, { recursive: true });

  const deceasedFolderName = `${deceased.full_name.replace(/[^a-zA-Z0-9]/g, '_')}_${deceased.id}`;
  const deceasedInvoicesDir = path.join(baseInvoicesDir, deceasedFolderName);
  if (!fs.existsSync(deceasedInvoicesDir)) fs.mkdirSync(deceasedInvoicesDir, { recursive: true });

  const pdfPath = path.join(deceasedInvoicesDir, `${invoice_number}.pdf`);
  await fs.promises.writeFile(pdfPath, pdfBuffer);

  // === Save Invoice in Database ===
  const insertSql = `
    INSERT INTO invoices 
    (deceased_id, invoice_number, items, total_amount, pdf_url, stamp_hash, signature_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await safeQuery(insertSql, [
    deceased.id,
    invoice_number,
    JSON.stringify(invoiceData.items),
    invoiceData.total_amount,
    pdfPath,
    invoiceData.stamp_hash,
    invoiceData.signature_url,
    invoiceData.created_at,
  ]);

  // === Mark Extra Charges as Invoiced ===
  if (extraCharges.length > 0) {
    const updateChargesSql = `
      UPDATE extra_charges 
      SET status = "Invoiced" 
      WHERE deceased_id = ? AND (status IS NULL OR status = "Pending")
    `;
    await safeQuery(updateChargesSql, [deceased.deceased_id]);
  }

  // Cache invoice for quick access
  invoiceCache.set(invoice_number, invoiceData);

  // === Return Response ===
  res.status(201).json({
    status: 'success',
    message: 'System invoice created successfully',
    invoice_number,
    pdf_url: pdfPath,
    invoice_id: result.insertId,
    deceased_folder: deceasedFolderName,
    system_generated: true,
  });
});

// Create manual invoice
const createInvoice = asyncHandler(async (req, res, next) => {
  const {
    deceased_id,
    invoice_number,
    items,
    total_amount,
    subtotal,
    tax_amount,
    tax_rate,
    signature_url,
    deceased_name,
    nok,
    admission_number,
    dod,
    address,
    phone,
  } = req.body;

  // Validate required fields
  if (!deceased_name || !invoice_number || !items || !total_amount) {
    return next(new AppError('Missing required invoice fields', 400));
  }

  // Generate unique stamp hash
  const stamp_hash = generateStampHash();

  // Prepare invoice data object
  const invoiceData = {
    deceased_name,
    nok: nok || 'N/A',
    admission_number: admission_number || 'N/A',
    id_number: admission_number || 'N/A',
    dod: dod || 'N/A',
    address: address || 'N/A',
    phone: phone || 'N/A',
    items: Array.isArray(items) ? items : JSON.parse(items),
    total_amount: parseFloat(total_amount),
    subtotal: parseFloat(subtotal || total_amount),
    tax_amount: parseFloat(tax_amount || 0),
    tax_rate: parseFloat(tax_rate || 0),
    mortuary_name: 'Lee Funeral Home',
    mortuary_phone: '+254 740 045 355',
    stamp_hash,
    signature_url: signature_url || '/uploads/signature/signature.png',
    created_at: getKenyaTimeISO(),
    invoice_number,
  };

  // Generate PDF
  const pdfBuffer = await generateInvoicePDFBuffer(invoiceData);

  // Prepare directories
  const baseInvoicesDir = path.join(__dirname, '../../uploads/invoices');
  if (!fs.existsSync(baseInvoicesDir)) fs.mkdirSync(baseInvoicesDir, { recursive: true });

  const deceasedFolderName = `${deceased_name.replace(/[^a-zA-Z0-9]/g, '_')}_${admission_number || Date.now()}`;
  const deceasedInvoicesDir = path.join(baseInvoicesDir, deceasedFolderName);
  if (!fs.existsSync(deceasedInvoicesDir)) fs.mkdirSync(deceasedInvoicesDir, { recursive: true });

  // Save PDF
  const pdfPath = path.join(deceasedInvoicesDir, `${invoice_number}.pdf`);
  await fs.promises.writeFile(pdfPath, pdfBuffer);

  // Insert invoice record into database
  const sql = `
    INSERT INTO invoices 
    (deceased_id, invoice_number, items, total_amount, pdf_url, stamp_hash, signature_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await safeQuery(sql, [
    deceased_id || null,
    invoice_number,
    JSON.stringify(invoiceData.items),
    invoiceData.total_amount,
    pdfPath,
    stamp_hash,
    invoiceData.signature_url,
    invoiceData.created_at,
  ]);

  // Cache invoice for quick access
  invoiceCache.set(invoice_number, invoiceData);

  // Respond with success
  res.status(201).json({
    status: 'success',
    message: 'Invoice created successfully',
    invoice_number,
    pdf_url: pdfPath,
    invoice_id: result.insertId,
    deceased_folder: deceasedFolderName,
  });
});

// Get all invoices
const getAllInvoices = asyncHandler(async (req, res, next) => {
  const sql = `
    SELECT 
      i.*, 
      d.full_name as deceased_name, 
      d.deceased_id,
      d.admission_number,
      d.date_of_death,
      nk.full_name as nok_name
    FROM invoices i
    LEFT JOIN deceased d ON i.deceased_id = d.id
    LEFT JOIN next_of_kin nk ON d.deceased_id = nk.deceased_id
    ORDER BY i.created_at DESC
  `;
  const invoices = await safeQuery(sql);

  // Parse JSON items and add deceased information
  const parsedInvoices = invoices.map((invoice) => ({
    ...invoice,
    items: typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items,
    deceased_name: invoice.deceased_name || 'Unknown',
    admission_number: invoice.admission_number || invoice.deceased_id || 'N/A',
    nok: invoice.nok_name || 'N/A',
  }));

  res.json({ status: 'success', data: parsedInvoices });
});

// Get invoices by deceased ID
const getInvoicesByDeceased = asyncHandler(async (req, res, next) => {
  const { deceased_id } = req.params;

  const sql = `
    SELECT 
      i.*, 
      d.full_name as deceased_name, 
      d.deceased_id,
      d.admission_number,
      d.date_of_death,
      nk.full_name as nok_name
    FROM invoices i
    LEFT JOIN deceased d ON i.deceased_id = d.id
    LEFT JOIN next_of_kin nk ON d.deceased_id = nk.deceased_id
    WHERE i.deceased_id = ? 
    ORDER BY i.created_at DESC
  `;
  const invoices = await safeQuery(sql, [deceased_id]);

  const parsedInvoices = invoices.map((invoice) => ({
    ...invoice,
    items: typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items,
    deceased_name: invoice.deceased_name || 'Unknown',
    admission_number: invoice.admission_number || invoice.deceased_id || 'N/A',
    nok: invoice.nok_name || 'N/A',
  }));

  res.json({ status: 'success', data: parsedInvoices });
});

// Get invoice by ID
const getInvoiceById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      i.*, 
      d.full_name as deceased_name, 
      d.deceased_id,
      d.admission_number,
      d.date_of_death,
      d.date_admitted,
      d.location,
      d.county,
      d.national_id,
      nk.full_name as nok_name,
      nk.contact as nok_contact,
      COALESCE(SUM(p.amount), 0) as amount_paid
    FROM invoices i
    LEFT JOIN deceased d ON i.deceased_id = d.id
    LEFT JOIN next_of_kin nk ON d.deceased_id = nk.deceased_id
    LEFT JOIN payments p ON d.id = p.deceased_id
    WHERE i.id = ?
    GROUP BY i.id
  `;
  const invoices = await safeQuery(sql, [id]);

  if (invoices.length === 0) {
    return next(new AppError('Invoice not found', 404));
  }

  const invoice = invoices[0];
  invoice.items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;
  invoice.amount_paid = parseFloat(invoice.amount_paid || 0);

  // Add additional fields for PDF generation
  invoice.deceased_name = invoice.deceased_name || 'Unknown';
  invoice.admission_number = invoice.admission_number || invoice.deceased_id || 'N/A';
  invoice.nok = invoice.nok_name || 'N/A';
  invoice.id_number = invoice.national_id || 'N/A';
  invoice.dod = invoice.date_of_death ? new Date(invoice.date_of_death).toLocaleDateString('en-GB') : 'N/A';
  invoice.date_of_admission = invoice.date_admitted ? new Date(invoice.date_admitted).toLocaleDateString('en-GB') : 'N/A';
  invoice.address = `${invoice.location || 'N/A'}, ${invoice.county || 'N/A'}`;
  invoice.phone = invoice.nok_contact || 'N/A';

  res.json({ status: 'success', data: invoice });
});

// Update invoice
const updateInvoice = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { items, total_amount, signature_url } = req.body;

  const [currentInvoice] = await safeQuery(
    'SELECT * FROM invoices WHERE id = ?',
    [id],
  );
  if (!currentInvoice) {
    return next(new AppError('Invoice not found', 404));
  }

  // Get deceased info for PDF generation
  const deceasedSql = `
    SELECT d.*, nk.full_name as nok_name, nk.contact as nok_contact
    FROM deceased d
    LEFT JOIN next_of_kin nk ON d.deceased_id = nk.deceased_id
    WHERE d.id = ?
  `;
  const [deceased] = await safeQuery(deceasedSql, [currentInvoice.deceased_id]);

  const stamp_hash = generateStampHash();

  const updatedInvoice = {
    ...currentInvoice,
    items: items || JSON.parse(currentInvoice.items),
    total_amount: total_amount || currentInvoice.total_amount,
    signature_url: signature_url || currentInvoice.signature_url,
    stamp_hash,
    updated_at: getKenyaTimeISO(),
  };

  // Prepare data for PDF generation
  const pdfData = {
    ...updatedInvoice,
    deceased_name: deceased?.full_name || 'Unknown',
    admission_number: deceased?.admission_number || deceased?.deceased_id || 'N/A',
    nok: deceased?.nok_name || 'N/A',
    id_number: deceased?.national_id || 'N/A',
    dod: deceased?.date_of_death ? new Date(deceased.date_of_death).toLocaleDateString('en-GB') : 'N/A',
    date_of_admission: deceased?.date_admitted ? new Date(deceased.date_admitted).toLocaleDateString('en-GB') : 'N/A',
    address: `${deceased?.location || 'N/A'}, ${deceased?.county || 'N/A'}`,
    phone: deceased?.nok_contact || 'N/A',
    mortuary_name: 'Lee Funeral Home',
    mortuary_phone: '+254 740 045 355',
  };

  const pdfBuffer = await generateInvoicePDFBuffer(pdfData);
  await fs.promises.writeFile(currentInvoice.pdf_url, pdfBuffer);

  const updateSql = `
    UPDATE invoices 
    SET items = ?, total_amount = ?, signature_url = ?, stamp_hash = ?, updated_at = ?
    WHERE id = ?
  `;

  await safeQuery(updateSql, [
    JSON.stringify(updatedInvoice.items),
    updatedInvoice.total_amount,
    updatedInvoice.signature_url,
    updatedInvoice.stamp_hash,
    updatedInvoice.updated_at,
    id,
  ]);

  invoiceCache.set(currentInvoice.invoice_number, updatedInvoice);

  res.json({
    status: 'success',
    message: 'Invoice updated successfully',
    data: updatedInvoice,
  });
});

// Delete invoice
const deleteInvoice = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const [invoice] = await safeQuery('SELECT * FROM invoices WHERE id = ?', [id]);
  if (!invoice) {
    return next(new AppError('Invoice not found', 404));
  }

  try {
    if (fs.existsSync(invoice.pdf_url)) {
      await fs.promises.unlink(invoice.pdf_url);
    }
  } catch (error) {
    console.log('PDF file not found, continuing with database deletion');
  }

  await safeQuery('DELETE FROM invoices WHERE id = ?', [id]);
  invoiceCache.del(invoice.invoice_number);

  res.json({
    status: 'success',
    message: 'Invoice deleted successfully',
  });
});

// Download PDF
const downloadInvoice = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const [invoice] = await safeQuery(
    'SELECT pdf_url FROM invoices WHERE id = ?',
    [id],
  );
  if (!invoice || !invoice.pdf_url) {
    return next(new AppError('Invoice or PDF not found', 404));
  }

  if (!fs.existsSync(invoice.pdf_url)) {
    return next(new AppError('PDF file not found', 404));
  }

  res.download(invoice.pdf_url, `invoice-${id}.pdf`);
});

// Export all functions
module.exports = {
  getAllDeceasedWithFinancials,
  getDeceasedFinancialDetails,
  createPayment,
  createExtraCharge,
  createSystemInvoice,
  createInvoice,
  getAllInvoices,
  getInvoicesByDeceased,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  downloadInvoice,
};