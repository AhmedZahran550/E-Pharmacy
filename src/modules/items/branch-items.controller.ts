import { UuidParam } from '@/common/decorators/uuid-param.decorator';
import { QueryOptions } from '@/common/query-options';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Paginate } from 'nestjs-paginate';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';
import { CreateBranchItemDto } from './dto/create-branch-item.dto';
import { ItemsService } from './items.service';
import { Cacheable } from '@/common/decorators/cache.decorator';

@Controller('branches/:branchId/items')
@Roles(Role.APP_USER)
export class BranchItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @Cacheable({ key: 'item:all:branch:{{branchId}}', ttl: 2592000 }) // 1 month
  findAll(
    @UuidParam('branchId') branchId: string,
    @Paginate() query: QueryOptions,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.itemsService.findBranchItems(branchId, sectionId, query);
  }
}
