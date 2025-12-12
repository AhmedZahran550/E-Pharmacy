import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { FieldError } from '@/common/models/error-response';
import { ErrorCodes } from '@/common/error-codes';

@Injectable()
export class FileRequiredPipe implements PipeTransform {
  transform(file: Express.Multer.File) {
    if (!file) {
      const vError: FieldError = {
        property: 'file',
        value: 'file',
        constraints: {},
        code: ErrorCodes.FILE_REQUIRED,
      };
      throw new BadRequestException([vError]);
    }
    return file;
  }
}
