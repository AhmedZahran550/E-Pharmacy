import {
  Controller,
  Get,
  UseGuards,
  Query,
  Post,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { Role } from '@/modules/auth/role.model';
import { AuthUser } from '@/modules/auth/decorators/auth-user.decorator';
import { Employee } from '@/database/entities/employee.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceRequestsService } from './service-requests.service';
import {
  ServiceRequest,
  ServiceRequestStatus,
} from '@/database/entities/service-request.entity';
import { AuthUserDto } from '../auth/dto/auth-user.dto';

@ApiTags('Doctor Service Requests')
@Controller('doctor/service-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PROVIDER_DOCTOR, Role.PROVIDER_ADMIN)
@ApiBearerAuth()
export class DoctorServiceRequestsController {
  constructor(
    @InjectRepository(ServiceRequest)
    private serviceRequestRepository: Repository<ServiceRequest>,
    private serviceRequestsService: ServiceRequestsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List pending service requests for doctor branch' })
  @ApiResponse({ status: 200, description: 'List of service requests' })
  async findAll(@AuthUser() doctor: AuthUserDto) {
    const branchId = doctor.branch?.id;

    return this.serviceRequestRepository.find({
      where: {
        branchId: branchId,
        status: ServiceRequestStatus.PENDING,
      },
      order: {
        metadata: {
          createdAt: 'DESC',
        },
      },
      relations: ['user'],
    });
  }

  @Post(':requestId/accept')
  @ApiOperation({ summary: 'Accept a service request' })
  @ApiResponse({ status: 200, description: 'Request accepted' })
  async acceptRequest(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @AuthUser() doctor: AuthUserDto,
  ) {
    return this.serviceRequestsService.acceptRequest(requestId, doctor);
  }
}
