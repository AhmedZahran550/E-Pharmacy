import { ErrorCodes } from '@/common/error-codes';
import { FieldError } from '@/common/models/error-response';
import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

const imageInterceptorOptions: MulterOptions = {
  fileFilter(req, file, callback) {
    const vError: FieldError = {
      property: 'image',
      value: 'image',
      constraints: {},
      code: ErrorCodes.INVALID_FILE,
    };
    if (!file) {
      // No file provided: treat as optional for endpoints that accept images
      return callback(null, true);
    }

    if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
      vError.message = 'Invalid file type';
      vError.code = ErrorCodes.INVALID_FILE_TYPE;
      vError.constraints.fileType = 'Invalid file type';
      return callback(new BadRequestException([vError]), false);
    }
    if (file.size > 2 * 1024 * 1024) {
      vError.constraints.maxSize = 'File size too large';
      vError.code = ErrorCodes.FILE_SIZE_TOO_LARGE;
      return callback(new BadRequestException([vError]), false);
    }
    callback(null, true);
  },
};

export default imageInterceptorOptions;
