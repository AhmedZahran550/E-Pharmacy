import { ErrorCodes } from '@/common/error-codes';
import { FieldError } from '@/common/models/error-response';
import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

const fileInterceptorOptions: MulterOptions = {
  fileFilter(req, file, callback) {
    const vError: FieldError = {
      property: 'file',
      value: 'file',
      constraints: {},
      code: ErrorCodes.INVALID_FILE,
    };
    if (!file) {
      vError.code = ErrorCodes.FILE_REQUIRED;
      return callback(new BadRequestException([vError]), false);
    }

    if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
      vError.message = 'Invalid file type';
      vError.code = ErrorCodes.INVALID_FILE_TYPE;
      vError.constraints.fileType = 'Invalid file type';
      return callback(new BadRequestException([vError]), false);
    }
    if (file.size > 20000) {
      vError.constraints.maxSize = 'File size too large';
      vError.code = ErrorCodes.FILE_SIZE_TOO_LARGE;
      return callback(new BadRequestException([vError]), false);
    }
    callback(null, true);
  },
};

export default fileInterceptorOptions;
