import { RequestValidationError } from '@/app-setup';
import { AppErrorResponse, FieldError } from '@/common/models/error-response';
import { getError } from '@/database/db.errors';
import { LocalizationService } from '@/i18n/localization.service';
import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';

@Catch()
export class GeneralExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GeneralExceptionFilter.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly localizationService: LocalizationService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    this.logger.error(
      'Exception caught',
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    );

    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = this.localizationService.t('errors.INTERNAL_SERVER_ERROR');
    let errors: FieldError[] = undefined;

    if (exception instanceof QueryFailedError) {
      const dbError = getError(exception);
      statusCode = dbError?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = dbError?.errorCode || 'INTERNAL_SERVER_ERROR';
      message = dbError?.message || 'INTERNAL_SERVER_ERROR';
      errors = dbError?.errors;
    } else if (exception instanceof EntityNotFoundError) {
      statusCode = HttpStatus.NOT_FOUND;
      errorCode = exception?.['code'] || 'NOT_FOUND';
      message = this.localizationService.t(`errors.${errorCode}`);
    } else if (exception instanceof BadRequestException) {
      statusCode = HttpStatus.BAD_REQUEST;
      const appError = exception.getResponse();
      errorCode = appError?.['code'] || 'BAD_REQUEST';
      message = this.getLocalizedMessage(exception);
      errors = this.extractErrors(appError);
    } else if (exception instanceof ConflictException) {
      statusCode = HttpStatus.CONFLICT;
      const resp = exception.getResponse();
      errorCode = resp?.['code'] || 'CONFLICT';
      message = this.getLocalizedMessage(exception);
      errors = this.extractErrors(resp?.['message']);
    } else if (exception instanceof UnauthorizedException) {
      statusCode = HttpStatus.UNAUTHORIZED;
      const resp = exception.getResponse();
      errorCode = resp?.['code'] || 'UNAUTHORIZED';
      message = this.getLocalizedMessage(exception);
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      errorCode = 'HTTP_EXCEPTION';
      message = exception.message || 'HTTP exception';
      const resp = exception.getResponse();
      errors = this.extractErrors(resp);
    } else if (exception instanceof RequestValidationError) {
      message = exception.message || message;
      errorCode = exception.code || errorCode;
    } else if (exception instanceof Error) {
      errorCode = exception?.['code'] || errorCode;
      message = this.localizationService.t(`errors.${errorCode}`) || message;
    }
    const localizedErrors = errors?.map((error) => {
      if (error.code) {
        const message = this.localizationService.t(`errors.${error.code}`);
        if (!message) {
          console.warn(`Missing translation for error code: ${error.code}`);
        }
        error.message = message ?? error.message;
      }
      return error;
    });

    const responseBody: AppErrorResponse = {
      statusCode,
      errorCode,
      path: httpAdapter.getRequestUrl(request),
      errors: localizedErrors,
      message,
      requestId: response.locals.requestId,
      timestamp: new Date().toISOString(),
    };

    httpAdapter.reply(response, responseBody, statusCode);
  }
  private getLocalizedMessage(exception: HttpException) {
    let message = exception.message;
    const code = exception.getResponse()?.['code'];
    if (code) {
      message = this.localizationService.t(`errors.${code}`);
    }
    return message || 'Unauthorized';
  }

  /**
   * Extracts errors from the exception response.
   * @param response The response object from the exception.
   * @returns An array of error details.
   */
  private extractErrors(response: any): any {
    if (Array.isArray(response)) {
      return response;
    }
    if (response?.message && Array.isArray(response.message)) {
      return response.message;
    }
    return [response];
  }
}
