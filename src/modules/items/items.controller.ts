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
import { Cacheable } from '@/common/decorators/cache.decorator';
@ApiTags('Items')
@Controller('items')
export class ItemsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly uploadService: UploadItemsService,
  ) {}

  @Get()
  @Roles(Role.USER, Role.GUEST)
  @Cacheable({ key: 'item:all', ttl: 2592000 }) // 1 month
  @ApiQuery(CreateServiceDto)
  findAll(@Paginate() query: QueryOptions, @Query('type') type?: string) {
    return this.itemsService.findByType(query, type);
  }

  @Post('csv')
  @Roles(Role.USER)
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
  @Roles(Role.USER)
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
