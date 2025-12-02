import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ExcludeNullInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.excludeNullValues(data)));
  }

  private excludeNullValues(data: any): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.excludeNullValues(item));
    } else if (typeof data === 'object' && data !== null) {
      if (data instanceof Date) {
        return data;
      }
      return Object.entries(data)
        .filter(([_, value]) => value !== null)
        .reduce(
          (result, [key, value]) => ({
            ...result,
            [key]: this.excludeNullValues(value),
          }),
          {},
        );
    } else {
      return data;
    }
  }
}
