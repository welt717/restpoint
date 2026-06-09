/**
 * Global File Storage Service
 * 
 * Centralized service for managing all file uploads across the application.
 * Provides a unified folder structure for each tenant:
 * 
 * uploads/
 *   {tenantSlug}/
 *     deceased/
 *       {deceasedId}/
 *         documents/
 *         images/
 *         exports/
 *     marketplace/
 *       products/
 *       categories/
 *     documents/
 *     invoices/
 *     misc/
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Base uploads directory
const UPLOADS_BASE_DIR = process.env.UPLOADS_BASE_DIR || path.join(process.cwd(), 'uploads');

// Folder categories
export enum FolderCategory {
  DECEASED = 'deceased',
  MARKETPLACE = 'marketplace',
  DOCUMENTS = 'documents',
  INVOICES = 'invoices',
  EXPORTS = 'exports',
  MISC = 'misc'
}

// File types for validation
export enum FileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  SPREADSHEET = 'spreadsheet',
  PDF = 'pdf',
  ARCHIVE = 'archive',
  OTHER = 'other'
}

// Allowed MIME types
const ALLOWED_MIME_TYPES: Record<FileType, string[]> = {
  [FileType.IMAGE]: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  [FileType.DOCUMENT]: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  [FileType.SPREADSHEET]: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  [FileType.PDF]: ['application/pdf'],
  [FileType.ARCHIVE]: ['application/zip', 'application/x-rar-compressed'],
  [FileType.OTHER]: ['*']
};

// File extension to type mapping
const EXTENSION_TO_TYPE: Record<string, FileType> = {
  '.jpg': FileType.IMAGE,
  '.jpeg': FileType.IMAGE,
  '.png': FileType.IMAGE,
  '.gif': FileType.IMAGE,
  '.webp': FileType.IMAGE,
  '.doc': FileType.DOCUMENT,
  '.docx': FileType.DOCUMENT,
  '.xls': FileType.SPREADSHEET,
  '.xlsx': FileType.SPREADSHEET,
  '.csv': FileType.SPREADSHEET,
  '.pdf': FileType.PDF,
  '.zip': FileType.ARCHIVE,
  '.rar': FileType.ARCHIVE
};

export interface UploadConfig {
  tenantSlug: string;
  category: FolderCategory;
  subFolder?: string | undefined;
  maxFileSize?: number;
  allowedTypes?: FileType[];
}

export interface UploadedFile {
  originalName: string;
  storedName: string;
  path: string;
  relativePath: string;
  size: number;
  mimeType: string;
  fileType: FileType;
  uploadedAt: string;
}

export interface TenantFolderInfo {
  tenantSlug: string;
  rootPath: string;
  folders: {
    deceased: string;
    marketplace: string;
    documents: string;
    invoices: string;
    exports: string;
    misc: string;
  };
}

export interface MulterFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
  path?: string;
}

/**
 * File Storage Service
 * Centralized service for all file operations
 */
class FileStorageService {
  private static instance: FileStorageService;

  private constructor() {
    this.initializeBaseDirectory();
  }

  public static getInstance(): FileStorageService {
    if (!FileStorageService.instance) {
      FileStorageService.instance = new FileStorageService();
    }
    return FileStorageService.instance;
  }

  /**
   * Initialize the base uploads directory
   */
  private initializeBaseDirectory(): void {
    if (!fs.existsSync(UPLOADS_BASE_DIR)) {
      fs.mkdirSync(UPLOADS_BASE_DIR, { recursive: true });
      console.log(`[FileStorage] Created base uploads directory: ${UPLOADS_BASE_DIR}`);
    }
  }

  /**
   * Get the root path for a tenant
   */
  getTenantRootPath(tenantSlug: string): string {
    const sanitizedSlug = this.sanitizeFolderName(tenantSlug);
    return path.join(UPLOADS_BASE_DIR, sanitizedSlug);
  }

  /**
   * Get the upload path for a specific category
   */
  getUploadPath(config: UploadConfig): string {
    const { tenantSlug, category, subFolder } = config;
    const sanitizedSlug = this.sanitizeFolderName(tenantSlug);
    
    let basePath = path.join(UPLOADS_BASE_DIR, sanitizedSlug, category);
    
    if (subFolder) {
      basePath = path.join(basePath, this.sanitizeFolderName(subFolder));
    }

    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }

    return basePath;
  }

  /**
   * Sanitize folder name
   */
  private sanitizeFolderName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  }

  /**
   * Generate unique filename
   */
  generateFileName(originalName: string): string {
    const ext = path.extname(originalName).toLowerCase();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}-${randomBytes}${ext}`;
  }

  /**
   * Detect file type
   */
  detectFileType(mimeType: string, fileName: string): FileType {
    for (const [type, mimeTypes] of Object.entries(ALLOWED_MIME_TYPES)) {
      if (mimeTypes.includes(mimeType)) {
        return type as FileType;
      }
    }

    const ext = path.extname(fileName).toLowerCase();
    return EXTENSION_TO_TYPE[ext] || FileType.OTHER;
  }

  /**
   * Validate file
   */
  validateFile(
    file: MulterFile,
    allowedTypes?: FileType[],
    maxFileSize?: number
  ): { valid: boolean; error?: string } {
    if (maxFileSize && file.size > maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds maximum of ${this.formatFileSize(maxFileSize)}`
      };
    }

    if (allowedTypes && allowedTypes.length > 0) {
      const fileType = this.detectFileType(file.mimetype, file.originalname);
      if (!allowedTypes.includes(fileType)) {
        return {
          valid: false,
          error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
        };
      }
    }

    return { valid: true };
  }

  /**
   * Format file size
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Delete file
   */
  async deleteFile(relativePath: string): Promise<boolean> {
    const fullPath = path.join(UPLOADS_BASE_DIR, relativePath);
    
    if (!fs.existsSync(fullPath)) {
      return false;
    }

    await fs.promises.unlink(fullPath);
    return true;
  }

  /**
   * Check if file exists
   */
  fileExists(relativePath: string): boolean {
    const fullPath = path.join(UPLOADS_BASE_DIR, relativePath);
    return fs.existsSync(fullPath);
  }
}

// Export singleton instance
export const fileStorageService = FileStorageService.getInstance();

export default fileStorageService;
