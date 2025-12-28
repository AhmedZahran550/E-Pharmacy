import { Injectable, MessageEvent } from '@nestjs/common';
import { EventEmitter } from 'events';
import { fromEvent, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ServiceRequest } from '@/database/entities/service-request.entity';

@Injectable()
export class ServiceRequestsSseService {
  private eventEmitter = new EventEmitter();

  notifyNewServiceRequest(branchId: string, serviceRequest: ServiceRequest) {
    this.eventEmitter.emit(`branch:${branchId}`, serviceRequest);
  }

  createStream(branchId: string): Observable<MessageEvent> {
    return fromEvent(this.eventEmitter, `branch:${branchId}`).pipe(
      map((data: any) => ({
        data,
        type: 'new_service_request',
      })),
    );
  }

  notifyServiceRequestUpdate(
    requestId: string,
    data: any,
    type: string = 'service_request_update',
  ) {
    this.eventEmitter.emit(`request:${requestId}`, { data, type });
  }

  createRequestStream(requestId: string): Observable<MessageEvent> {
    return fromEvent(this.eventEmitter, `request:${requestId}`).pipe(
      map((payload: any) => ({
        data: payload.data,
        type: payload.type,
      })),
    );
  }
}
