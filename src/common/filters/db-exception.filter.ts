import { DBErrorCode } from '@/database/db.errors';
import {
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { EntityNotFoundError, QueryFailedError, TypeORMError } from 'typeorm';
import { ErrorCodes } from '../error-codes';

@Catch(TypeORMError)
export class DBExceptionFilter implements ExceptionFilter {
  constructor() {}

  catch(exception: unknown) {
    console.log(exception);

    if (exception instanceof QueryFailedError) {
      const code = (exception as any).code;
      if (!code) {
        throw exception;
      }
      let message = exception.message as any;
      const fieldlastIndex = (exception as any).detail?.indexOf(')');
      let property;
      if ((exception as any).detail && fieldlastIndex !== -1) {
        property = ((exception as any).detail as string).substring(
          5,
          fieldlastIndex,
        );
      }
      switch (code) {
        case DBErrorCode.UNIQUE_VOILATION:
          message = [
            {
              property: property ?? undefined,
              code: ErrorCodes.UNIQUE_VOILATION,
              constraint: (exception as any).constraint,
            },
          ];
          throw new ConflictException(message);
        case DBErrorCode.NOT_NULL_CONSTRAINT:
          message = [
            {
              property: (exception as any).column ?? property ?? undefined,
              code: ErrorCodes.NOT_NULL_CONSTRAINT,
              constraint: (exception as any).constraint,
            },
          ];
          throw new ConflictException(message);
        case DBErrorCode.CHECK_VOILATION:
          message = [
            {
              property: property ?? undefined,
              code: ErrorCodes.UNIQUE_VOILATION,
              constraint: (exception as any).constraint,
            },
          ];
          throw new ConflictException(message);
        case DBErrorCode.FORIGN_KEY_VIOLATION:
          const forignKeyError = this.getForignKeyViolationError(
            (exception as any).detail,
          );
          message = [forignKeyError];
          throw new ConflictException(message);
        case DBErrorCode.INVALID_TEXT_REPRESENTATION:
          message = [
            {
              property: property ?? undefined,
              code: ErrorCodes.INVALID_FORMAT,
            },
          ];
          throw new BadRequestException(message);
      }
      throw exception;
    } else if (exception instanceof EntityNotFoundError) {
      // For EntityNotFound, we can directly throw a NotFoundException
      throw new NotFoundException({
        message: 'Resource not found.',
        code: ErrorCodes.RESOURCE_NOT_FOUND,
      });
    } else {
      throw exception;
    }
  }

  getForignKeyViolationError(message: string) {
    const regex = /Key \(([^)]+)\)=\(([^)]+)\)/;
    const matches = message.match(regex);
    if (!matches || matches.length < 2) {
      console.warn('no matches found while error mapping', message);
      return null;
    }
    const key = matches[1];
    const value = matches[2];
    return {
      property: key,
      value,
      code: ErrorCodes.UNIQUE_VOILATION,
    };
  }
}
