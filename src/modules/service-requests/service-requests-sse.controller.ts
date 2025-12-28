import {
  Controller,
  Sse,
  MessageEvent,
  Req,
  Param,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { Role } from '@/modules/auth/role.model';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import {
  ServiceRequest,
  ServiceRequestStatus,
} from '@/database/entities/service-request.entity';
import { ServiceRequestsSseService } from './service-requests-sse.service';
import { ErrorCodes } from '@/common/error-codes';

@ApiTags('Service Requests Real-time Stream')
@Controller('')
@ApiBearerAuth()
export class ServiceRequestsSseController {
  constructor(
    private sseService: ServiceRequestsSseService,
    @InjectRepository(ServiceRequest)
    private serviceRequestRepository: Repository<ServiceRequest>,
  ) {}

  @Roles(Role.PROVIDER_DOCTOR, Role.PROVIDER_ADMIN)
  @Sse('doctor/service-requests/list/stream')
  @ApiOperation({ summary: 'Stream new service requests for doctor branch' })
  @ApiResponse({ status: 200, description: 'SSE stream established' })
  streamBranchRequests(@Req() req: Request): Observable<MessageEvent> {
    const user = req.user as any; // Cast to any to access branch link if AuthUserDto

    // Fallback or explicit check
    const branchId = user.branchId || user.branch?.id;

    if (!branchId) {
      throw new ForbiddenException({
        message: 'Doctor not associated with a branch',
        code: ErrorCodes.DOCTOR_NOT_ASSOCIATED_WITH_BRANCH,
      });
    }

    return this.sseService.createStream(branchId);
  }

  @Roles(Role.APP_USER)
  @Sse('service-requests/:requestId/stream')
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
