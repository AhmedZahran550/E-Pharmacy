import { ApiQuery } from '@/common/decorators/pagination-query.decorator';
import { UuidParam } from '@/common/decorators/uuid-param.decorator';
import { multerOptions } from '@/common/multer/multer.config';
import { QueryOptions } from '@/common/query-options';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Paginate } from 'nestjs-paginate';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';
import { CreateServiceDto } from './dto/create-item.dto';
import { UpdateServiceDto } from './dto/update-item.dto';
import { ItemsService } from './items.service';
import { UploadItemsService } from './upload-items.service';
import { ErrorCodes } from '@/common/error-codes';
import { Subject } from '../auth/policies.types';
import { Policies } from '../auth/decorators/policies.decorator';

@Roles(Role.SYSTEM_USER)
@Policies({ subject: Subject.items })
@Controller('admin/items')
export class AdminItemsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly uploadService: UploadItemsService,
  ) {}

  @Post()
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.itemsService.create(createServiceDto);
  }

  @Post('batch')
  createBatch(@Body() createServiceDtos: CreateServiceDto[]) {
    return this.itemsService.batchCreate(createServiceDtos);
  }

  @Post('batch')
  batchCreate(@Body() createServiceDtos: CreateServiceDto[]) {
    return this.itemsService.batchCreate(createServiceDtos);
  }

  @Get()
  @ApiQuery(CreateServiceDto)
  findAll(@Paginate() query: QueryOptions, @Query('type') type?: string) {
    return this.itemsService.findByType(query, type);
  }

  @Get(':id')
  findOne(@UuidParam() id: string) {
    return this.itemsService.findById(id);
  }

  @Patch(':id')
  update(@UuidParam() id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.itemsService.update(id, updateServiceDto);
  }
  @Put(':id')
  async put(
    @UuidParam() id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return await this.itemsService.update(id, updateServiceDto);
  }

  @Delete(':id')
  remove(@UuidParam() id: string) {
    return this.itemsService.delete(id);
  }

  @Post('csv')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadCSV(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException({
        message: 'File is not provided',
        code: ErrorCodes.FILE_NOT_PROVIDED,
      });
    }
    return this.uploadService.procesServicesCSV(file);
  }
  @Post('pharmacy/csv')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadPharmacyItemsCSV(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException({
        message: 'File is not provided',
        code: ErrorCodes.FILE_NOT_PROVIDED,
      });
    }
    return this.uploadService.procesPharmacyItemsCSV(file);
  }
}
