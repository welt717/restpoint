const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const mysql = require('mysql2/promise');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'supersecretrefreshkey';

// ============================================
// DATABASE CONNECTIONS (NO DATABASE SELECTED)
// ============================================

// Get connection to MariaDB server (no database selected)
const getServerConnection = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    // NO database selected here
  });
  return connection;
};

// Get connection to specific tenant database
const getTenantConnection = async (dbName) => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
  });
  return connection;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Find tenant by email from tenant_tracking database
 */
const findTenantByEmail = async (email) => {
  console.log('🔍 Searching for tenant with email:', email);
  
  try {
    const serverConn = await getServerConnection();
    
    // Check if tenant_tracking database exists
    const [databases] = await serverConn.query(
      "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'tenant_tracking'"
    );
    
    if (databases.length === 0) {
      console.log('❌ tenant_tracking database not found');
      await serverConn.end();
      return null;
    }
    
    // Query tenant from tenant_tracking database
    const [tenants] = await serverConn.query(
      `SELECT * FROM tenant_tracking.tenants 
       WHERE email = ? AND status = 'active'`,
      [email.toLowerCase()]
    );
    
    await serverConn.end();
    
    if (tenants.length > 0) {
      console.log('✅ Tenant found:', tenants[0].tenant_name);
      return tenants[0];
    }
    
    console.log('❌ No tenant found for email:', email);
    return null;
    
  } catch (error) {
    console.error('❌ Error finding tenant:', error.message);
    return null;
  }
};

/**
 * Find user in tenant database
 */
const findUserInTenantDB = async (dbName, email) => {
  try {
    const tenantConn = await getTenantConnection(dbName);
    const [users] = await tenantConn.execute(
      `SELECT * FROM users WHERE email = ?`,
      [email.toLowerCase()]
    );
    await tenantConn.end();
    
    if (users.length > 0) {
      return users[0];
    }
    return null;
  } catch (error) {
    console.error('❌ Error finding user in tenant DB:', error.message);
    return null;
  }
};

/**
 * Generate JWT tokens
 */
const generateTokens = (user, tenant) => {
  const payload = {
    userId: user.user_id,
    email: user.email,
    tenantId: tenant.tenant_id,
    tenantName: tenant.tenant_name,
    tenantSlug: tenant.tenant_slug,
    dbName: tenant.db_name,
    role: user.role || 'admin'
  };
  
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '30d' });
  
  return { accessToken, refreshToken };
};

// ============================================
// AUTH ENDPOINTS
// ============================================

/**
 * @route POST /login
 * @desc Login user - accepts both 'email' and 'identifier' fields
 * @body { email or identifier, password }
 */
exports.login = asyncHandler(async (req, res) => {
  // Accept both 'email' and 'identifier' fields
  const emailInput = req.body.email || req.body.identifier;
  const { password } = req.body;
  
  console.log('\n========== LOGIN REQUEST ==========');
  console.log('📧 Email/Identifier:', emailInput);
  console.log('📝 Request body:', req.body);
  
  // Validation
  if (!emailInput || !validator.isEmail(emailInput)) {
    console.log('❌ Invalid email format:', emailInput);
    return res.status(400).json({ 
      success: false, 
      message: 'Valid email is required' 
    });
  }
  
  if (!password || password.length < 6) {
    console.log('❌ Invalid password length');
    return res.status(400).json({ 
      success: false, 
      message: 'Password is required and must be at least 6 characters' 
    });
  }
  
  try {
    // Step 1: Find tenant by email from tracking database
    const tenant = await findTenantByEmail(emailInput);
    
    if (!tenant) {
      console.log('❌ No tenant found');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    console.log(`✅ Tenant found: ${tenant.tenant_name}`);
    console.log(`📁 Database: ${tenant.db_name}`);
    
    // Step 2: Find user in tenant's database
    const user = await findUserInTenantDB(tenant.db_name, emailInput);
    
    if (!user) {
      console.log('❌ No user found in tenant database');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    console.log(`👤 User found: ${user.full_name}`);
    console.log(`🔐 Verifying password...`);
    
    // Step 3: Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    console.log('✅ Password verified');
    
    // Step 4: Update last login
    try {
      const tenantConn = await getTenantConnection(tenant.db_name);
      await tenantConn.execute(
        `UPDATE users SET last_login_at = NOW() WHERE user_id = ?`,
        [user.user_id]
      );
      await tenantConn.end();
      console.log('✅ Last login updated');
    } catch (error) {
      console.warn('⚠️ Could not update last login:', error.message);
    }
    
    // Step 5: Generate tokens
    const { accessToken, refreshToken } = generateTokens(user, tenant);
    
    // Step 6: Return response
    console.log('✅ Login successful!\n');
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        userId: user.user_id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role: user.role,
        isActive: user.is_active === 1,
        isVerified: user.is_verified === 1
      },
      tenant: {
        tenantId: tenant.tenant_id,
        tenantName: tenant.tenant_name,
        tenantSlug: tenant.tenant_slug,
        dbName: tenant.db_name
      }
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /register
 * @desc Register new tenant (handled by your existing TenantModel)
 */
exports.register = asyncHandler(async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Please use /api/onboarding/organization endpoint for registration'
  });
});

/**
 * @route POST /refresh
 * @desc Refresh access token
 */
exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  console.log('\n========== REFRESH TOKEN REQUEST ==========');
  
  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required'
    });
  }
  
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    
    // Find tenant
    const serverConn = await getServerConnection();
    const [tenants] = await serverConn.query(
      `SELECT * FROM tenant_tracking.tenants WHERE tenant_id = ? AND status = 'active'`,
      [decoded.tenantId]
    );
    await serverConn.end();
    
    if (tenants.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Tenant not found or inactive'
      });
    }
    
    const tenant = tenants[0];
    
    // Find user in tenant database
    const tenantConn = await getTenantConnection(tenant.db_name);
    const [users] = await tenantConn.execute(
      `SELECT * FROM users WHERE user_id = ? AND is_active = 1`,
      [decoded.userId]
    );
    await tenantConn.end();
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }
    
    const user = users[0];
    
    // Generate new tokens
    const { accessToken } = generateTokens(user, tenant);
    
    console.log('✅ Token refreshed');
    
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken
    });
    
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
});

/**
 * @route POST /logout
 * @desc Logout user
 */
exports.logout = asyncHandler(async (req, res) => {
  console.log('\n========== LOGOUT REQUEST ==========');
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @route GET /me
 * @desc Get current user info
 */
exports.getMe = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    res.status(200).json({
      success: true,
      user: {
        userId: decoded.userId,
        email: decoded.email,
        tenantId: decoded.tenantId,
        tenantName: decoded.tenantName,
        role: decoded.role
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});