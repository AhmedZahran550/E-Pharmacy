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
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { ServiceRequestsService } from './service-requests.service';
import fileInterceptorOptions from '@/common/interceptors/file-interceptor-options';
import { Role } from '../auth/role.model';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Service Requests')
@Controller('service-requests')
@Roles(Role.APP_USER)
export class ServiceRequestsController {
  constructor(
    private readonly serviceRequestsService: ServiceRequestsService,
  ) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 5, fileInterceptorOptions))
  async create(
    @AuthUser() user: User,
    @Body() dto: CreateServiceRequestDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.serviceRequestsService.createRequest(user, dto, files);
  }

  @Get(':id')
  async getOne(@AuthUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.serviceRequestsService.getOne(id, user.id);
  }
}
