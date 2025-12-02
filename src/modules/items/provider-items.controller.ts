import { UuidParam } from '@/common/decorators/uuid-param.decorator';
import { QueryOptions } from '@/common/query-options';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Paginate } from 'nestjs-paginate';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';
import { ItemsService } from './items.service';

@Controller('provider/branches/:branchId/items')
@Roles(Role.PROVIDER_USER)
export class ProviderBranchItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  findAll(
    @UuidParam('branchId') branchId: string,
    @Paginate() query: QueryOptions,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.itemsService.findBranchItems(branchId, sectionId, query);
  }
}
