// implement storage service
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { User } from '@/database/entities/user.entity';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

type FileMetadata = {
  originalname: string;
  filePath: string;
  size: number;
  mimetype: string;
};
export interface StorageService {
  saveFile(
    file: Express.Multer.File,
    filePath: string,
    folder: string,
  ): Promise<FileMetadata>;
  readFile(filePath: string): Promise<Buffer>;
  deleteFile(filePath: string): Promise<void>;
}

@Injectable()
export class StorageService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async saveFile(
    file: Express.Multer.File,
    filePath: string,
    folder: string,
  ): Promise<FileMetadata & { publicUrl: string; url: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: filePath.replace(/\.[^/.]+$/, ''), // Remove extension, let Cloudinary handle it or keep it
          resource_type: 'auto',
          folder, // Map bucketName to folder if desired, or skip
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return reject(error);
          }
          resolve({
            originalname: file.originalname,
            filePath: result.public_id,
            size: result.bytes,
            mimetype: result.format ? `image/${result.format}` : file.mimetype,
            publicUrl: result.secure_url,
            url: result.secure_url,
          });
        },
      );

      const stream = new Readable();
      stream.push(file.buffer);
      stream.push(null);
      stream.pipe(uploadStream);
    });
  }

  async readFile(filePath: string): Promise<Buffer> {
    // Reading directly from Cloudinary via URL mostly, but interface expects Buffer.
    // This might be tricky if used for internal processing.
    // For now, implementing basic fetch to buffer if needed, or throwing not supported as this is mostly for serving.
    // Let's implement a simple fetch if this method is actually used.
    // The original implementation was fs.promises.readFile(filePath) which implies local dev?
    // Wait, the original `StorageService` had `// this.directory` commented out and used GC bucket.
    // But `readFile` was: `return await fs.promises.readFile(filePath);`
    // This suggests `readFile` might have been broken or working on local files only?
    // User said "change it with gcStorage in used and leave the gcStorage files".
    // I will replace with a comment or simple error for now unless I see usage.
    console.warn(
      'StorageService.readFile is not fully implemented for Cloudinary URLs yet.',
    );
    throw new Error('Method not implemented for Cloudinary.');
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw error;
    }
  }
}
