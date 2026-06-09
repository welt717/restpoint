import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { TenantModel } from '../models/tenant.model';
import { fileStorageService } from '../../global/services/fileStorageService';

export class OnboardingController {
  
  async createOrganization(req: Request, res: Response): Promise<Response> {
    try {
      const { organizationName, email, location, password, phone } = req.body;
      const logoUrl = (req as any).file ? `/uploads/${(req as any).file.filename}` : null;

      console.log('📝 Received onboarding request:', { organizationName, email, location });

      if (!organizationName || !email || !location || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields' 
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: 'Password must be at least 6 characters' 
        });
      }

      console.log(`📦 Creating dedicated database for: ${organizationName}`);
      
      const { tenant, token } = await TenantModel.registerTenant({
        tenant_name: organizationName,
        email,
        password,
        full_name: organizationName,
        phone: phone || null,
        location: location
      });

      console.log(`✅ Tenant registered! Database: ${tenant.db_name}`);

      // Create tenant folder structure for file uploads
      try {
        const folderInfo = fileStorageService.createTenantFolders(tenant.tenant_slug);
        console.log(`📁 Created folder structure for tenant: ${tenant.tenant_slug}`, folderInfo.rootPath);
      } catch (folderError: any) {
        console.warn(`⚠️ Could not create folder structure: ${folderError.message}`);
        // Don't fail the registration if folder creation fails
      }

      return res.status(201).json({
        success: true,
        message: 'Organization setup completed successfully! A dedicated database has been created.',
        organizationId: tenant.tenant_id,
        token,
        logoUrl,
        database: {
          name: tenant.db_name,
          host: process.env.DB_HOST || 'localhost'
        },
        user: {
          id: 1,
          organizationId: tenant.tenant_id,
          email: tenant.email,
          role: 'admin',
          isActive: true,
          isVerified: true,
          fullName: organizationName
        }
      });
      
    } catch (error: any) {
      console.error('❌ Onboarding error:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Internal server error'
      });
    }
  }

  async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email and password required' 
        });
      }

      // Find tenant by email
      const tenant = await TenantModel.findByEmail(email);
      
      if (!tenant) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email or password' 
        });
      }

      // Get tenant database connection
      const connection = await TenantModel.getTenantDatabase(tenant.tenant_id);
      
      if (!connection) {
        return res.status(500).json({ 
          success: false, 
          message: 'Unable to connect to tenant database' 
        });
      }
      
      // Query user from tenant database
      const [users] = await connection.promise().execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      
      const user = users[0];
      
      if (!user) {
        await connection.end();
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email or password' 
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        await connection.end();
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email or password' 
        });
      }

      // Update last login
      await connection.promise().execute(
        'UPDATE users SET last_login_at = NOW() WHERE user_id = ?',
        [user.user_id]
      );

      await connection.end();

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
      const token = jwt.sign(
        { 
          userId: user.user_id, 
          email: user.email, 
          tenantId: tenant.tenant_id,
          tenantSlug: tenant.tenant_slug,
          role: user.role 
        },
        jwtSecret,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.user_id,
          organizationId: tenant.tenant_id,
          email: user.email,
          role: user.role,
          isActive: user.is_active === 1,
          fullName: user.full_name
        }
      });
      
    } catch (error: any) {
      console.error('❌ Login error:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Internal server error' 
      });
    }
  }

  async logout(req: Request, res: Response): Promise<Response> {
    return res.status(200).json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  }

  async getOrganization(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      
      if (!user || !user.tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized' 
        });
      }

      // Find tenant by ID
      const tenant = await TenantModel.findById(user.tenantId);
      
      if (!tenant) {
        return res.status(404).json({ 
          success: false, 
          message: 'Organization not found' 
        });
      }

      // Get tenant database connection
      const connection = await TenantModel.getTenantDatabase(tenant.tenant_id);
      
      if (!connection) {
        return res.status(500).json({ 
          success: false, 
          message: 'Unable to connect to tenant database' 
        });
      }
      
      // Get all users from tenant database
      const [users] = await connection.promise().execute(
        `SELECT user_id, email, full_name, role, is_active, created_at 
         FROM users ORDER BY created_at DESC`
      );
      
      await connection.end();

      return res.status(200).json({
        success: true,
        data: {
          organization: {
            id: tenant.tenant_id,
            name: tenant.tenant_name,
            tenantSlug: tenant.tenant_slug,
            email: tenant.email,
            location: tenant.location,
            database: tenant.db_name
          },
          users: users,
          totalUsers: users.length
        }
      });
      
    } catch (error: any) {
      console.error('❌ Get organization error:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Internal server error' 
      });
    }
  }

  // New method to test tenant database connection
  async testTenantConnection(req: Request, res: Response): Promise<Response> {
    try {
      const { tenantId } = req.params;
      
      const tenant = await TenantModel.findById(parseInt(tenantId));
      
      if (!tenant) {
        return res.status(404).json({ 
          success: false, 
          message: 'Tenant not found' 
        });
      }
      
      const connection = await TenantModel.getTenantDatabase(tenant.tenant_id);
      
      if (!connection) {
        return res.status(500).json({ 
          success: false, 
          message: 'Could not connect to tenant database' 
        });
      }
      
      // Test query
      const [result] = await connection.promise().execute('SELECT 1 as test, DATABASE() as db_name');
      await connection.end();
      
      return res.status(200).json({
        success: true,
        message: 'Tenant database connection successful',
        database: result[0]
      });
      
    } catch (error: any) {
      console.error('❌ Test connection error:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Connection test failed' 
      });
    }
  }
}