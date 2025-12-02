// implement storage service
import { Storage } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';
type FileMetadata = {
  originalname: string;
  filePath: string;
  size: number;
  mimetype: string;
};

@Injectable()
export class GCStorageService {
  private readonly directory: string;
  private storage: Storage;
  private bucketName: string;
  constructor() {
    this.storage = new Storage();
    this.bucketName = process.env.GC_BUCKET_NAME;
  }

  async saveFile(
    file: Express.Multer.File,
    filePath: string,
  ): Promise<{ url: string }> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
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
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            resolve({ url: publicUrl });
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

  // async readFile(filePath: string): Promise<Buffer> {
  //   // return await fs.promises.readFile(filePath);
  // }

  // async deleteFile(filePath: string): Promise<void> {
  //   // await fs.promises.unlink(filePath);
  // }
}
