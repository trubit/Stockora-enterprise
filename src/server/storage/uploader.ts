import multer from 'multer';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ValidationError } from '../errors/AppError.js';
import { config } from '../../config/environment.js';

const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads');
if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = file.originalname.split('.').pop() || '';
    cb(null, `${file.fieldname}-${uniqueSuffix}.${ext}`);
  },
});

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError('Unallowed file format. Only JPEG, PNG, and WEBP are accepted.'));
  }
};

export const fileUploader = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.uploadMaxSize,
  },
});
