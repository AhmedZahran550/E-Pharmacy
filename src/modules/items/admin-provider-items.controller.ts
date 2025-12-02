import { ApiQuery } from '@/common/decorators/pagination-query.decorator';
import { UuidParam } from '@/common/decorators/uuid-param.decorator';
import { QueryOptions } from '@/common/query-options';
import { Controller, Get, Query } from '@nestjs/common';
import { Paginate } from 'nestjs-paginate';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';
import { CreateServiceDto } from './dto/create-item.dto';
import { ItemsService } from './items.service';
import { UploadItemsService } from './upload-items.service';
import { Subject } from '../auth/policies.types';
import { Policies } from '../auth/decorators/policies.decorator';

@Roles(Role.SYSTEM_USER)
@Policies({ subject: Subject.items })
@Controller('admin/providers/:providerId/items')
export class AdminProviderItemsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly uploadService: UploadItemsService,
  ) {}

  @Get()
  @ApiQuery(CreateServiceDto)
  findAll(
    @Paginate() query: QueryOptions,
    @UuidParam('providerId') providerId: string,
  ) {
    return this.itemsService.findProviderItems(providerId, query);
  }

  @Get(':id')
  findOne(
    @UuidParam() id: string,
    @UuidParam('providerId') providerId: string,
  ) {
    return this.itemsService.findProviderItem(id, providerId);
  }
}
