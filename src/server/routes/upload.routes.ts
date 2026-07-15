import { Router } from 'express';
import { fileUploader } from '../storage/uploader.js';
import { UploadService } from '../services/upload.service.js';
import { authMiddleware } from '../middleware/auth.js';
import { ValidationError } from '../errors/AppError.js';

export const uploadRouter = Router();

uploadRouter.use(authMiddleware);

uploadRouter.post('/image', fileUploader.single('file'), async (req, res, next) => {
  if (!req.file) {
    return next(new ValidationError('Please upload an image file.'));
  }
  try {
    const url = await UploadService.processAndSaveImage(req.file);
    res.json({ url });
  } catch (err: unknown) {
    next(err);
  }
});
