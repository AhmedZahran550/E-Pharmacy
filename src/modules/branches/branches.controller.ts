import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
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
  @ApiOperation({
    summary: 'List all branches',
    description: 'Get paginated list of all pharmacy branches',
  })
  @ApiResponse({ status: 200, description: 'Branches retrieved successfully' })
  // Cache TTL: 86400 seconds (24 hours)
  @Cacheable({ key: 'branches:all', ttl: 86400 })
  findAll(@Paginate() query: QueryOptions) {
    return this.branchesService.findAll(query);
  }

  @Get('nearby')
  @ApiOperation({
    summary: 'Find nearby branches',
    description: 'Get branches near specified location by latitude/longitude',
  })
  @ApiResponse({
    status: 200,
    description: 'Nearby branches retrieved successfully',
  })
  // Cache TTL: 600 seconds (10 minutes)
  @Cacheable({ key: 'branches:nearby:{{lat}}:{{lng}}:{{radius}}', ttl: 600 })
  findNearby(@Query() params: NearbyBranchesDto) {
    return this.branchesService.findNearby(params);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get branch details',
    description: 'Retrieve detailed information about a specific branch',
  })
  @ApiParam({ name: 'id', description: 'Branch UUID' })
  @ApiResponse({ status: 200, description: 'Branch retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  // Cache TTL: 3600 seconds (1 hour)
  @Cacheable({ key: 'branch:{{id}}', ttl: 3600 })
  findOne(@Param('id') id: string) {
    return this.branchesService.findById(id);
  }

  @Post(':id/rating')
  @Roles(Role.APP_USER)
  @ApiOperation({
    summary: 'Rate branch',
    description: 'Submit rating and feedback for a branch',
  })
  @ApiParam({ name: 'id', description: 'Branch UUID' })
  @ApiResponse({ status: 201, description: 'Rating submitted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid rating data or already rated',
  })
  @ApiResponse({ status: 404, description: 'Branch not found' })
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
