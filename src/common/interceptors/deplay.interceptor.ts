import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { delay } from 'rxjs/operators';
  
  @Injectable()
  export class DelayInterceptor implements NestInterceptor {
    constructor(private readonly delayTime: number = 1000) {} // Default delay time in milliseconds
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      return next.handle().pipe(delay(this.delayTime));
    }
  }