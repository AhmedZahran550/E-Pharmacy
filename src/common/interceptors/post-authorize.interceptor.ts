import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { POST_AUTHORIZE_KEY } from '../decorators/post-authorize.decorator';

@Injectable()
export class PostAuthorizeInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const predicate = this.reflector.get<
      (data: any, context: { user: any }) => boolean
    >(POST_AUTHORIZE_KEY, context.getHandler());

    if (!predicate) return next.handle();

    return next.handle().pipe(
      tap((data) => {
        const request = context.switchToHttp().getRequest();
        if (!predicate(data, { user: request.user })) {
          throw new ForbiddenException('Post authorization failed');
        }
      }),
    );
  }
}
