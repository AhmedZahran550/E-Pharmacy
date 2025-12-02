import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { IMetadata } from '@/database/entities/embeded/metadata.entity';

@Injectable()
export class MetadataInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;
    // if (body && request.user) {
    //   const metadata: Record<string, any> = {};
    //   metadata.requestedBy = request.user?.id;
    //   body.metadata = metadata;
    // }

    return next.handle();
  }
}
