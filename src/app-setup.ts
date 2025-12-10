import { ExcludeNullInterceptor } from './common/interceptors/exclude-null.interceptor';
import { AppErrorResponse } from './common/models/error-response';
import {
  ClassSerializerInterceptor,
  HttpException,
  HttpStatus,
  INestApplication,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { json } from 'body-parser';
import { ValidationError } from 'class-validator';
import helmet from 'helmet';
import {
  I18nContext,
  I18nService,
  I18nValidationExceptionFilter,
  I18nValidationPipe,
} from 'nestjs-i18n';
export class RequestValidationError extends ValidationError {
  message: string;
  code: string;
}
export async function setupApp(app: INestApplication) {
  app.use(helmet());
  app.useGlobalInterceptors(new ExcludeNullInterceptor());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  // app.useGlobalInterceptors(new DelayInterceptor(5000)); // Delay time in milliseconds

  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  if (process.env.CORS_ALLOW_LIST) {
    app.enableCors({
      origin: process.env.CORS_ALLOW_LIST.includes(',')
        ? process.env.CORS_ALLOW_LIST.split(',')
        : process.env.CORS_ALLOW_LIST,
      credentials: Boolean(process.env.CORS_CREDENTIALS ?? true),
      exposedHeaders: ['Content-Range'],
    });
  }

  const i18nService = app.get(I18nService);

  app.use(json({ limit: '200kb' }));
  // app.useGlobalFilters(
  //   new I18nValidationExceptionFilter({
  //     errorFormatter: (errors) => {
  //       const newErrors = errors.map((error) => {
  //         const code = Object.keys(error.constraints)[0]?.toUpperCase();
  //         const lang = I18nContext.current().lang;
  //         for (const key in error.constraints) {
  //           const constraintMessage = i18nService.t(
  //             `validation.${key}` as never,
  //             {
  //               lang,
  //             },
  //           );
  //           error.constraints[key] = constraintMessage;
  //         }
  //         const message = i18nService.t(`validation.${code}` as never, {
  //           lang,
  //         });
  //         const validationError: RequestValidationError = {
  //           property: error.property,
  //           value: error.value,
  //           constraints: error.constraints,
  //           message,
  //           code,
  //         };
  //         return validationError;
  //       });
  //       return newErrors;
  //     },
  //   }),
  // );
  app.useGlobalFilters(
    new I18nValidationExceptionFilter({
      errorFormatter: (errors) => {
        const newErrors = errors.map((error) => {
          const firstConstraint = findFirstConstraint(error);
          const constraintKey = Object.keys(firstConstraint)[0];
          const constraintValue = firstConstraint[constraintKey];
          const lang = I18nContext.current().lang;
          if (lang === 'ar') {
            for (const key in error.constraints) {
              const constraintMessage = i18nService.t(
                `validation.${key}` as never,
                {
                  lang,
                },
              );
              error.constraints[key] =
                constraintMessage ?? error.constraints[key];
            }
          }

          const message = i18nService.t(
            `validation.${constraintKey}` as never,
            {
              lang,
            },
          );
          const validationError: RequestValidationError = {
            property: error.property,
            value: error.value,
            constraints: error.constraints,
            // message: error.constraints[Object.keys(error.constraints)[0]],
            message,
            code: constraintKey,
          };
          return validationError;
        });
        return newErrors;
      },
      responseBodyFormatter: (host, exc, errors) => {
        const errorCode = 'BAD_REQUEST';
        const statusCode =
          exc instanceof HttpException
            ? exc.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;
        const path = host.switchToHttp().getRequest().route.path;
        const responseBody: AppErrorResponse = {
          statusCode,
          errorCode,
          path,
          message: exc.getResponse() as any,
          errors: errors as any,
          requestId: host.switchToHttp().getResponse().locals.requestId,
          timestamp: new Date().toISOString(),
        };
        return responseBody;
      },
    }),
  );

  return app;
}

function findFirstConstraint(node) {
  // If the current node has non-empty constraints, return it
  if (node.constraints && Object.keys(node.constraints).length > 0) {
    return node.constraints; // Return the first constraint value
  }

  // Recursively check the children
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      const result = findFirstConstraint(child);
      if (result) {
        return result; // Return as soon as a constraint is found
      }
    }
  }

  // Return null if no constraints found
  return null;
}
