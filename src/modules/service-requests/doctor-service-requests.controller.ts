import {
  Controller,
  Get,
  Query,
  Post,
  Param,
  ParseUUIDPipe,
  BadRequestException,
  Body,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import fileInterceptorOptions from '@/common/interceptors/file-interceptor-options';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
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
import { Paginate } from 'nestjs-paginate';
import { QueryOptions } from '@/common/query-options';
import { CreateServiceRequestMessageDto } from './dto/create-service-request-message.dto';
import { ServiceRequestMessagesService } from './service-request-messages.service';
import { SenderRole } from '@/database/entities/service-request-message.entity';
import { HttpCode } from '@nestjs/common';
import { ServiceRequestActionDto } from './dto/serviceRequestActionDto';

@ApiTags('Doctor Service Requests')
@Controller('doctor/service-requests')
@Roles(Role.PROVIDER_DOCTOR, Role.PROVIDER_ADMIN)
@ApiBearerAuth()
export class DoctorServiceRequestsController {
  constructor(
    private serviceRequestsService: ServiceRequestsService,
    private serviceRequestMessagesService: ServiceRequestMessagesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List pending service requests for doctor branch' })
  @ApiResponse({ status: 200, description: 'List of service requests' })
  async findAll(
    @AuthUser() doctor: AuthUserDto,
    @Paginate() query: QueryOptions,
  ) {
    const branchId = doctor.branchId;
    return this.serviceRequestsService.findAllByBranchId(query, branchId);
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

  @Post(':requestId/action')
  @ApiOperation({ summary: 'Accept a service request' })
  @ApiResponse({ status: 200, description: 'Request accepted' })
  async handleRequestAction(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() dto: ServiceRequestActionDto,
    @AuthUser() doctor: AuthUserDto,
  ) {
    return this.serviceRequestsService.handleRequestAction(
      requestId,
      doctor,
      dto.type,
      dto.cancellationReason,
    );
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

  @Post(':requestId/messages')
  @ApiOperation({ summary: 'Send a message to a service request' })
  @HttpCode(201)
  @UseInterceptors(FilesInterceptor('attachments', 5, fileInterceptorOptions))
  async createMessage(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @AuthUser() doctor: AuthUserDto,
    @Body() dto: CreateServiceRequestMessageDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.serviceRequestMessagesService.createMessage(
      requestId,
      doctor,
      dto,
      files,
      SenderRole.DOCTOR,
    );
  }

  @Get(':requestId/messages')
  @ApiOperation({ summary: 'Get messages for a service request' })
  @ApiResponse({ status: 200, description: 'List of messages' })
  async getMessages(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @AuthUser() doctor: AuthUserDto,
  ) {
    return this.serviceRequestMessagesService.getMessages(requestId, doctor);
  }
}
