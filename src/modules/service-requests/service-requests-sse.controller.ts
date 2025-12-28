import {
  Controller,
  Sse,
  UseGuards,
  MessageEvent,
  Req,
  ForbiddenException,
  Param,
  NotFoundException,
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
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import {
  ServiceRequest,
  ServiceRequestStatus,
} from '@/database/entities/service-request.entity';
import { ServiceRequestsSseService } from './service-requests-sse.service';

@ApiTags('Service Requests Real-time Stream')
@Controller('service-requests')
@ApiBearerAuth()
export class ServiceRequestsSseController {
  constructor(
    private sseService: ServiceRequestsSseService,
    @InjectRepository(ServiceRequest)
    private serviceRequestRepository: Repository<ServiceRequest>,
  ) {}

  // @Roles(Role.PROVIDER_DOCTOR, Role.PROVIDER_ADMIN)
  // @Sse('doctor/stream')
  // @ApiOperation({ summary: 'Stream new service requests for doctor branch' })
  // @ApiResponse({ status: 200, description: 'SSE stream established' })
  // streamBranchRequests(@Req() req: Request): Observable<MessageEvent> {
  //   const user = req.user as any; // Cast to any to access branch link if AuthUserDto

  //   // Fallback or explicit check
  //   const branchId = user.branchId || user.branch?.id;

  //   if (!branchId) {
  //     throw new ForbiddenException('Doctor not associated with a branch');
  //   }

  //   return this.sseService.createStream(branchId);
  // }

  @Roles(Role.APP_USER)
  @Sse(':requestId/stream')
  @ApiOperation({ summary: 'Stream updates for a specific service request' })
  @ApiResponse({ status: 200, description: 'SSE stream established' })
  async streamRequestUpdates(
    @Param('requestId') requestId: string,
    @Req() req: Request,
  ): Promise<Observable<MessageEvent>> {
    const user = req.user as any;

    const request = await this.serviceRequestRepository.findOneOrFail({
      where: {
        id: requestId,
        userId: user.id,
        status: Not(
          In([ServiceRequestStatus.CANCELLED, ServiceRequestStatus.COMPLETED]),
        ),
      },
    });

    return this.sseService.createRequestStream(requestId);
  }
}
