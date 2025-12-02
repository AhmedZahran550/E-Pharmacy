import { QueryOptions } from '@/common/query-options';
import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Paginate } from 'nestjs-paginate';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';
import { ItemsService } from './items.service';
import { Cacheable } from '@/common/decorators/cache.decorator';

@ApiTags('Items')
@Controller('sections/:sectionId/items')
export class SectionItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @Roles(Role.USER, Role.ANONYMOUS)
  @Cacheable({ key: 'item:all:section:{{sectionId}}', ttl: 2592000 }) // 1 month
  findAll(
    @Param('sectionId') sectionId: string,
    @Paginate() query: QueryOptions,
  ) {
    return this.itemsService.findBySection(query, sectionId);
  }
}
