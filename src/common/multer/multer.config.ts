// src/common/multer.config.ts

import { ErrorCodes } from '@/common/error-codes';
import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

export const multerOptions: MulterOptions = {
  storage: memoryStorage(), // Switch to memoryStorage
  fileFilter: (req, file, cb) => {
    // Accept only TSV or plain text files
    if (
      file.mimetype !== 'text/comma-separated-values' &&
      file.mimetype !== 'text/csv' &&
      file.mimetype !== 'application/octet-stream' // Some browsers may send this for .tsv
    ) {
      return cb(
        new BadRequestException([
          {
            property: 'file',
            code: ErrorCodes.INVALID_FILE_TYPE,
            message: 'Invalid file type. Only TSV or CSV files are allowed.',
          },
        ]),
        false,
      );
    }
    cb(null, true);
  },
  limits: { fileSize: 2 * 1024 * 1024, files: 10 }, // 1 MB limit
};
