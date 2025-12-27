import {
  Controller,
  Get,
  UseGuards,
  Query,
  Post,
  Param,
  ParseUUIDPipe,
  BadRequestException,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { Role } from '@/modules/auth/role.model';
import { AuthUser } from '@/modules/auth/decorators/auth-user.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceRequestsService } from './service-requests.service';
import {
  ServiceRequest,
  ServiceRequestStatus,
} from '@/database/entities/service-request.entity';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { CreateOrderDto } from '../orders/dto/create-order.dto';

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

  @Get(':id')
  @ApiOperation({
    summary: 'Get service request details with user medical profile',
  })
  @ApiResponse({
    status: 200,
    description: 'Service request details with medical profile',
  })
  async getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() doctor: AuthUserDto,
  ) {
    if (!doctor.branchId) {
      // Should not happen due to guard, but good for safety
      throw new BadRequestException('Doctor must have a branch');
    }
    return this.serviceRequestsService.getOneWithMedicalProfile(
      id,
      doctor.branchId,
    );
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

  @Post(':requestId/create-order')
  @ApiOperation({ summary: 'Create an order from a service request' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiBody({ type: CreateOrderDto })
  async createOrder(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @AuthUser() doctor: AuthUserDto,
    @Body() dto: CreateOrderDto,
  ) {
    if (!doctor.branchId) {
      throw new BadRequestException('Doctor must belong to a branch');
    }
    return this.serviceRequestsService.createOrder(requestId, doctor, dto);
  }
}
