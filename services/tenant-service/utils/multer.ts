import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directory exists
fs.ensureDirSync(UPLOAD_DIR);

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tenantId = req.body.tenantId || (req as any).tenantId || 'temp';
    const tenantUploadDir = path.join(UPLOAD_DIR, tenantId, 'logos');
    fs.ensureDirSync(tenantUploadDir);
    cb(null, tenantUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// File filter
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and SVG images are allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 2 * 1024 * 1024, // 2MB
  },
});