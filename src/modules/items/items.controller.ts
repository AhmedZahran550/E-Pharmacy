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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Paginate } from 'nestjs-paginate';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';
import { CreateServiceDto } from './dto/create-item.dto';
import { ItemsService } from './items.service';
import { ErrorCodes } from '@/common/error-codes';
import { Cacheable } from '@/common/decorators/cache.decorator';

@ApiTags('Items')
@Roles(Role.USER, Role.GUEST)
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all items',
    description: 'Get paginated list of all available items/services',
  })
  @ApiResponse({ status: 200, description: 'Items retrieved successfully' })
  @Cacheable({ key: 'item:all', ttl: 2592000 }) // 1 month
  @ApiQuery(CreateServiceDto)
  findAll(@Paginate() query: QueryOptions) {
    return this.itemsService.findAll(query);
  }
}
