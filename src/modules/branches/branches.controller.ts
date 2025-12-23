import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
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
import { RateBranchDto } from './dto/rate-branch.dto';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { AuthUserDto } from '../auth/dto/auth-user.dto';

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
  // Cache TTL: 600 seconds (10 minutes)
  @Cacheable({ key: 'branches:nearby:{{lat}}:{{lng}}:{{radius}}', ttl: 600 })
  findNearby(@Query() params: NearbyBranchesDto) {
    return this.branchesService.findNearby(params);
  }

  @Get(':id')
  // Cache TTL: 3600 seconds (1 hour)
  @Cacheable({ key: 'branch:{{id}}', ttl: 3600 })
  findOne(@Param('id') id: string) {
    return this.branchesService.findById(id);
  }

  @Post(':id/rate')
  @Roles(Role.APP_USER)
  async rateBranch(
    @Param('id') id: string,
    @Body() ratingDto: RateBranchDto,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.branchesService.rateBranch(
      id,
      user.id,
      ratingDto.rating,
      ratingDto.notes,
    );
  }
}
