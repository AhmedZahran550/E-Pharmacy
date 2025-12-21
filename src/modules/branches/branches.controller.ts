import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { ApiQuery } from '@/common/decorators/pagination-query.decorator';
import { Paginate } from 'nestjs-paginate';
import { QueryOptions } from '@/common/query-options';
import { Cacheable } from '@/common/decorators/cache.decorator';
import { CreateBranchDto } from './dto/create-branch.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';
import { NearbyBranchesDto } from './dto/nearby-branches.dto';

@ApiTags('Branches')
@Roles(Role.APP_USER, Role.GUEST, Role.ANONYMOUS)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @ApiQuery(CreateBranchDto)
  @Get()
  // Cache TTL: 86400 seconds (24 hours)
  @Cacheable({ key: 'branches:all', ttl: 86400 })
  findAll(@Paginate() query: QueryOptions) {
    return this.branchesService.findAll(query);
  }

  @Get('nearby')
  findNearby(@Query() params: NearbyBranchesDto) {
    return this.branchesService.findNearby(params);
  }

  @Get(':id')
  // Cache TTL: 3600 seconds (1 hour)
  @Cacheable({ key: 'branch:{{id}}', ttl: 3600 })
  findOne(@Param('id') id: string) {
    return this.branchesService.findById(id);
  }
}
