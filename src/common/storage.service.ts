// implement storage service
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { User } from '@/database/entities/user.entity';
import { Storage } from '@google-cloud/storage';

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
    options?: {
      bucketName: string;
    },
  ): Promise<FileMetadata>;
  readFile(filePath: string): Promise<Buffer>;
  deleteFile(filePath: string): Promise<void>;
}

@Injectable()
export class StorageService {
  private readonly directory: string;
  private storage: Storage;
  private bucketName: string;
  constructor() {
    this.storage = new Storage();
    this.bucketName = process.env.BUCKET_NAME;
    // this.directory = path.join(__dirname, '..', 'storage');
    // if (!fs.existsSync(this.directory)) {
    //   fs.mkdirSync(this.directory, { recursive: true });
    // }
  }

  async saveFile(
    file: Express.Multer.File,
    filePath: string,
    options?: {
      bucketName: string;
    },
  ) {
    try {
      const bucketName = options?.bucketName || this.bucketName;
      const bucket = this.storage.bucket(bucketName);
      const blob = bucket.file(filePath);
      const blobStream = blob.createWriteStream({
        resumable: false,
      });

      return new Promise((resolve, reject) => {
        blobStream.on('error', (err) => {
          reject(err);
        });

        blobStream.on('finish', async () => {
          try {
            await blob.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;
            resolve({ publicUrl });
          } catch (err) {
            reject(err);
          }
        });

        blobStream.end(file.buffer);
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async readFile(filePath: string): Promise<Buffer> {
    return await fs.promises.readFile(filePath);
  }

  async deleteFile(filePath: string): Promise<void> {
    await fs.promises.unlink(filePath);
  }
}
