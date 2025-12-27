import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard';
import { AuthUser } from '@/modules/auth/decorators/auth-user.decorator';
import { User } from '@/database/entities/user.entity';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { ServiceRequestsService } from './service-requests.service';
import fileInterceptorOptions from '@/common/interceptors/file-interceptor-options';

@ApiTags('Service Requests')
@Controller('service-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServiceRequestsController {
  constructor(
    private readonly serviceRequestsService: ServiceRequestsService,
  ) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 5, fileInterceptorOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new service request' })
  @ApiResponse({
    status: 201,
    description: 'Service request created successfully',
  })
  async create(
    @AuthUser() user: User,
    @Body() dto: CreateServiceRequestDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.serviceRequestsService.create(user, dto, files);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service request details' })
  @ApiParam({ name: 'id', description: 'Service request UUID' })
  @ApiResponse({ status: 200, description: 'Service request details' })
  async getOne(@AuthUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.serviceRequestsService.getOne(id, user.id);
  }
}
