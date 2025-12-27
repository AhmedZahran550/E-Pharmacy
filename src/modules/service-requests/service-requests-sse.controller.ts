import {
  Controller,
  Sse,
  UseGuards,
  MessageEvent,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Observable, fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard';
import { EventEmitter } from 'events';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesGuard } from '@/modules/auth/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { Role } from '@/modules/auth/role.model';
import { Request } from 'express';
import { Employee } from '@/database/entities/employee.entity';

@ApiTags('Service Requests Real-time Stream')
@Controller('service-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ServiceRequestsSseController {
  private eventEmitter = new EventEmitter();

  @Roles(Role.PROVIDER_DOCTOR, Role.PROVIDER_ADMIN)
  @Sse('doctor/stream')
  @ApiOperation({ summary: 'Stream new service requests for doctor branch' })
  @ApiResponse({ status: 200, description: 'SSE stream established' })
  streamBranchRequests(@Req() req: Request): Observable<MessageEvent> {
    const user = req.user as any; // Cast to any to access branch link if AuthUserDto

    // Fallback or explicit check
    const branchId = user.branchId || user.branch?.id;

    if (!branchId) {
      throw new ForbiddenException('Doctor not associated with a branch');
    }

    return fromEvent(this.eventEmitter, `branch:${branchId}`).pipe(
      map((data: any) => ({
        data,
        type: 'new_service_request',
      })),
    );
  }

  notifyNewServiceRequest(branchId: string, serviceRequest: any) {
    this.eventEmitter.emit(`branch:${branchId}`, serviceRequest);
  }
}
