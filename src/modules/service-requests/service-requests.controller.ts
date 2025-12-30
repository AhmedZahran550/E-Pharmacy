import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseInterceptors,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@/modules/auth/decorators/auth-user.decorator';
import { User } from '@/database/entities/user.entity';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { ServiceRequestsService } from './service-requests.service';
import fileInterceptorOptions from '@/common/interceptors/file-interceptor-options';
import { Role } from '../auth/role.model';
import { Roles } from '../auth/decorators/roles.decorator';
import { ServiceRequestMessagesService } from './service-request-messages.service';
import { SenderRole } from '@/database/entities/service-request-message.entity';
import { CreateServiceRequestMessageDto } from './dto/create-service-request-message.dto';
import { QueryOptions } from '@/common/query-options';
import { Paginate } from 'nestjs-paginate';

@ApiTags('Service Requests')
@Controller('service-requests')
@Roles(Role.APP_USER)
export class ServiceRequestsController {
  constructor(
    private readonly serviceRequestsService: ServiceRequestsService,
    private readonly serviceRequestMessagesService: ServiceRequestMessagesService,
  ) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 5, fileInterceptorOptions))
  async create(
    @AuthUser() user: AuthUserDto,
    @Body() dto: CreateServiceRequestDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.serviceRequestsService.createRequest(user, dto, files);
  }

  @Get()
  async getAll(@AuthUser() user: AuthUserDto, @Paginate() query: QueryOptions) {
    return this.serviceRequestsService.findAllByUser(query, user);
  }

  @Get(':id')
  async getOne(@AuthUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.serviceRequestsService.getOne(id, user.id);
  }

  @Post(':requestId/messages')
  @UseInterceptors(FilesInterceptor('attachments', 5, fileInterceptorOptions))
  async createMessage(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @AuthUser() user: AuthUserDto,
    @Body() dto: CreateServiceRequestMessageDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.serviceRequestMessagesService.createMessage(
      requestId,
      user,
      dto,
      files,
      SenderRole.USER,
    );
  }
  @Get(':requestId/messages')
  async getRequestMessages(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.serviceRequestMessagesService.getMessages(requestId, user);
  }
}
