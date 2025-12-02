import { ApiQuery } from '@/common/decorators/pagination-query.decorator';
import { UuidParam } from '@/common/decorators/uuid-param.decorator';
import { ErrorCodes } from '@/common/error-codes';
import { multerOptions } from '@/common/multer/multer.config';
import { QueryOptions } from '@/common/query-options';
import { UploadBranchesConfigDto } from '@/modules/branches/dto/upload-branches.dto';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Paginate } from 'nestjs-paginate';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';
import {
  BRANCHES_PAGINATION_CONFIG,
  BranchesService,
} from './branches.service';
import { NearByBranchDto } from './dto/NearBy-branch.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { Cacheable } from '@/common/decorators/cache.decorator';
import { BranchRatingDto } from './dto/branch-rating.dto';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { AuthUser } from '../auth/decorators/auth-user.decorator';

@ApiTags('Branches')
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @ApiQuery(CreateBranchDto, BRANCHES_PAGINATION_CONFIG)
  @Roles(Role.USER, Role.ANONYMOUS)
  findAll(@Query() dto: NearByBranchDto) {
    return this.branchesService.findNearby(dto);
  }

  @Get('total-count')
  @Cacheable({ key: 'branch:total-count', ttl: 2592000 }) // 1 month
  @Roles(Role.APP_USER, Role.GUEST)
  findBranchCount() {
    return this.branchesService.getTotal();
  }

  @Get('nearby')
  @Roles(Role.USER, Role.GUEST)
  findNearby(@Query() dto: NearByBranchDto) {
    return this.branchesService.findNearby(dto);
  }

  @Get(':id')
  @Roles(Role.USER)
  @Cacheable({ key: 'branch:{{id}}', ttl: 2592000 }) // 1 month
  findOne(@UuidParam() id: string) {
    return this.branchesService.findById(id);
  }

  @Post(':id/rating')
  @Roles(Role.USER)
  branchRating(
    @UuidParam() id: string,
    @Body() ratingDto: BranchRatingDto,
    @AuthUser() user: AuthUserDto,
  ) {
    ratingDto.branch = { id };
    return this.branchesService.branchRating(ratingDto, user);
  }
}
