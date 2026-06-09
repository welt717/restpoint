const { safeQuery } = require('../../configurations/sqlConfig/db');
const asyncHandler = require('express-async-handler');
const validator = require('validator');
const crypto = require('crypto');

// ------------------- LOGIN -------------------
const loginToPortal = asyncHandler(async (req, res) => {
  // Trim and log the identifier
  const identifier = req.body.identifier?.trim();
  console.log('Received identifier:', identifier);

  if (!identifier) {
    console.log('Identifier missing in request body.');
    return res.status(400).json({ status: 'fail', message: 'Identifier is required' });
  }

  const isPhone = validator.isMobilePhone(identifier, 'en-KE');
  console.log('Is phone number:', isPhone);

  let query = '';
  let params = [];

  if (isPhone) {
    // Login via next-of-kin contact
    query = `
      SELECT d.*
      FROM deceased d
      JOIN next_of_kin n ON n.deceased_id = d.deceased_id
      WHERE n.contact = ?
      LIMIT 1
    `;
    params = [identifier];
  } else {
    // Login via admission_number (case-insensitive)
    query = `
      SELECT *
      FROM deceased
      WHERE LOWER(TRIM(admission_number)) = LOWER(?)
      LIMIT 1
    `;
    params = [identifier];
  }

  console.log('Executing SQL query:', query);
  console.log('With parameters:', params);

  const rows = await safeQuery(query, params); // Do NOT destructure
  console.log('SQL rows returned:', rows);

  // Handle both array and single row responses
  const deceased = Array.isArray(rows) ? rows[0] : rows;

  if (!deceased) {
    console.log('No matching deceased record found for identifier:', identifier);
    return res.status(404).json({ status: 'fail', message: 'No matching deceased record found' });
  }

  console.log('Found deceased record:', deceased);

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const now = new Date();

  const insertSessionQuery = `
    INSERT INTO portal_sessions (
      deceased_id,
      session_token,
      logged_in_at,
      last_activity,
      ip_address,
      user_agent,
      active
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const insertParams = [
    deceased.deceased_id,
    sessionToken,
    now,
    now,
    req.ip,
    req.get('User-Agent'),
    true
  ];

  console.log('Inserting session with params:', insertParams);
  await safeQuery(insertSessionQuery, insertParams);

  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    deceased: {
      deceased_id: deceased.deceased_id,
      full_name: deceased.full_name,
      admission_number: deceased.admission_number
    },
    session_token: sessionToken,
    logged_in_at: now
  });
});

// ------------------- LOGOUT -------------------
const logoutFromPortal = asyncHandler(async (req, res) => {
  const sessionToken = req.body.session_token?.trim();
  console.log('Logging out session token:', sessionToken);

  if (!sessionToken) {
    console.log('Session token missing in request body.');
    return res.status(400).json({ status: 'fail', message: 'Session token is required' });
  }

  const updateQuery = `
    UPDATE portal_sessions
    SET active = FALSE,
        last_activity = NOW()
    WHERE session_token = ? AND active = TRUE
  `;
  const result = await safeQuery(updateQuery, [sessionToken]);
  console.log('Logout query result:', result);

  // Handle result depending on safeQuery implementation
  const affectedRows = Array.isArray(result) ? result[0]?.affectedRows || 0 : result.affectedRows || 0;

  if (affectedRows === 0) {
    console.log('Invalid or already logged out session:', sessionToken);
    return res.status(400).json({ status: 'fail', message: 'Invalid or already logged out session' });
  }

  res.status(200).json({
    status: 'success',
    message: 'Logout successful'
  });
});

module.exports = { loginToPortal, logoutFromPortal };
