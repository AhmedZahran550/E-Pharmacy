import { ApiQuery } from '@/common/decorators/pagination-query.decorator';
import { UuidParam } from '@/common/decorators/uuid-param.decorator';
import { QueryOptions } from '@/common/query-options';
import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Paginate } from 'nestjs-paginate';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { BranchActionDto } from './dto/action-branch.dto';

@Roles(Role.PROVIDER_ADMIN)
@ApiTags('Branches')
@Controller('provider/branches')
export class ProviderBranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  create(
    @AuthUser() user: AuthUserDto,
    @Body() createBranchDto: CreateBranchDto,
  ) {
    if (user.providerId) {
      createBranchDto.provider = {
        id: user.providerId,
      };
    }
    return this.branchesService.create(createBranchDto);
  }

  @Roles(Role.PROVIDER_USER)
  @Get()
  @ApiQuery(BranchesService)
  findAll(@AuthUser() user: AuthUserDto, @Paginate() query: QueryOptions) {
    return this.branchesService.findByProviderId(user.providerId, query);
  }

  @Roles(Role.PROVIDER_USER)
  @Get(':branchId')
  findOne(@UuidParam('branchId') id: string, @AuthUser() user: AuthUserDto) {
    return this.branchesService.findById(id, {
      where: { provider: { id: user.providerId } },
    });
  }

  @Patch(':branchId')
  update(
    @UuidParam('branchId') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.branchesService.update(id, updateBranchDto, {
      where: { provider: { id: user.providerId } },
    });
  }

  @Post(':branchId/action')
  handleAction(
    @UuidParam('branchId') branchId: string,
    @Body() action: BranchActionDto,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.branchesService.handleAction(branchId, action, user);
  }
}
