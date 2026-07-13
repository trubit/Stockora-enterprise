import sharp from 'sharp';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { logger } from '../logger.js';

export class UploadService {
  private static UPLOADS_DIR = join(process.cwd(), 'public', 'uploads');

  public static async processAndSaveImage(file: Express.Multer.File): Promise<string> {
    if (!existsSync(this.UPLOADS_DIR)) {
      mkdirSync(this.UPLOADS_DIR, { recursive: true });
    }

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const outputFilename = `optimized-${uniqueSuffix}.webp`;
    const outputPath = join(this.UPLOADS_DIR, outputFilename);

    try {
      await sharp(file.path)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);

      logger.info(`Image optimized with sharp: ${outputFilename}`);
      return `/uploads/${outputFilename}`;
    } catch (err: unknown) {
      logger.error('Failed to optimize image with sharp, using original file upload details:', err);
      return `/uploads/${file.filename}`;
    }
  }
}
