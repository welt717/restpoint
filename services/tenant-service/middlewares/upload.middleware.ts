/**
 * Tenant Service Upload Middleware
 * 
 * Updated to use the global file storage service for unified upload handling.
 * This middleware now stores tenant logos in the global uploads structure:
 * uploads/{tenantSlug}/documents/
 */

import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileStorageService, FolderCategory } from '@montezuma/shared-services';

// Base uploads directory
const UPLOADS_BASE_DIR = process.env.UPLOADS_BASE_DIR || path.join(process.cwd(), 'uploads');

// Interface for multer file
interface UploadFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
  path?: string;
  filename?: string;
}

/**
 * Get tenant slug from request
 */
function getTenantSlug(req: any): string {
  return req.tenantSlug || 
         req.headers['x-tenant-slug'] || 
         req.params.tenantSlug || 
         req.query.tenantSlug ||
         (req.user?.tenantSlug);
}

/**
 * Storage configuration for tenant logo uploads
 * Stores in: uploads/{tenantSlug}/documents/logos/
 */
const logoStorage = multer.diskStorage({
  destination: (req: any, file: UploadFile, cb: (error: Error | null, destination?: string) => void) => {
    try {
      const tenantSlug = getTenantSlug(req);
      
      if (!tenantSlug) {
        // Fallback to a default folder if no tenant slug
        cb(null, path.join(UPLOADS_BASE_DIR, 'pending', 'logos'));
        return;
      }

      // Use fileStorageService to ensure folder exists
      const uploadPath = fileStorageService.getUploadPath({
        tenantSlug,
        category: FolderCategory.DOCUMENTS,
        subFolder: 'logos'
      });
      
      cb(null, uploadPath);
    } catch (error: any) {
      cb(error);
    }
  },
  filename: (req: any, file: UploadFile, cb: (error: Error | null, filename?: string) => void) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const sanitizedBaseName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 50);
    cb(null, `logo-${timestamp}-${randomBytes}${ext}`);
  }
});

/**
 * File filter for logo uploads (images only)
 */
const logoFileFilter = (req: any, file: UploadFile, cb: (error: Error | null, acceptFile?: boolean) => void) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for logos (JPEG, PNG, GIF, WebP)'));
  }
};

/**
 * Logo upload middleware
 * Usage: uploadLogo(req, res, next)
 */
export const uploadLogo = multer({
  storage: logoStorage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: logoFileFilter
}).single('logo');

/**
 * Generic document upload middleware for tenant service
 * Stores in: uploads/{tenantSlug}/documents/
 */
export const uploadDocument = multer({
  storage: multer.diskStorage({
    destination: (req: any, file: UploadFile, cb: (error: Error | null, destination?: string) => void) => {
      try {
        const tenantSlug = getTenantSlug(req);
        
        if (!tenantSlug) {
          cb(null, path.join(UPLOADS_BASE_DIR, 'pending', 'documents'));
          return;
        }

        const uploadPath = fileStorageService.getUploadPath({
          tenantSlug,
          category: FolderCategory.DOCUMENTS
        });
        
        cb(null, uploadPath);
      } catch (error: any) {
        cb(error);
      }
    },
    filename: (req: any, file: UploadFile, cb: (error: Error | null, filename?: string) => void) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const randomBytes = crypto.randomBytes(16).toString('hex');
      const timestamp = Date.now();
      cb(null, `${timestamp}-${randomBytes}${ext}`);
    }
  }),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
    files: 10
  },
  fileFilter: (req: any, file: UploadFile, cb: (error: Error | null, acceptFile?: boolean) => void) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
}).array('files', 10);

/**
 * Middleware to extract and set tenant slug on request
 * Should be used before upload middleware
 */
export const extractTenantSlug = (req: any, res: any, next: Function) => {
  const tenantSlug = getTenantSlug(req);
  
  if (!tenantSlug) {
    return res.status(400).json({
      success: false,
      message: 'Tenant slug is required. Please provide it via authentication, header, or query parameter.'
    });
  }

  req.tenantSlug = tenantSlug;
  next();
};

/**
 * Helper to get uploaded file info
 */
export const getUploadedFile = (req: any) => {
  if (!req.file) return null;
  
  return {
    originalName: req.file.originalname,
    storedName: req.file.filename,
    path: req.file.path,
    size: req.file.size,
    mimeType: req.file.mimetype
  };
};

/**
 * Helper to get uploaded files info (for array uploads)
 */
export const getUploadedFiles = (req: any) => {
  if (!req.files || !Array.isArray(req.files)) return [];
  
  return req.files.map((file: UploadFile) => ({
    originalName: file.originalname,
    storedName: file.filename,
    path: file.path,
    size: file.size,
    mimeType: file.mimetype
  }));
};