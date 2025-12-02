import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { BranchAvailabilityService } from './branch-availability.service';
import { QueryOptions } from '@/common/query-options';
import { Paginate } from 'nestjs-paginate';
import { CreateBranchAvailabilityDto } from './dto/create-availability.dto';
import { UpdateBranchAvailabilityDto } from './dto/update-availability.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';
import { UuidParam } from '@/common/decorators/uuid-param.decorator';
import { Policies } from '../auth/decorators/policies.decorator';
import { Subject } from '../auth/policies.types';

@Roles(Role.SYSTEM_USER)
@Policies({ subject: Subject.branches })
@Controller('admin/branches/:branchId/availability')
export class AdminProviderBranchAvailabilityController {
  constructor(
    private readonly branchAvailabilityService: BranchAvailabilityService,
  ) {}

  @Post()
  async create(
    @Body() createDtoList: CreateBranchAvailabilityDto[],
    @Param('branchId') branchId: string,
  ) {
    createDtoList.map((dto) => (dto.branch = { id: branchId }));
    return this.branchAvailabilityService.batchCreate(createDtoList);
  }

  @Get()
  findAll(@Param('branchId') branchId: string) {
    return this.branchAvailabilityService.findAllByBranchId(branchId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @UuidParam('branchId') branchId: string,
  ) {
    return this.branchAvailabilityService.findOne({
      where: { id, branch: { id: branchId } },
    });
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateBranchAvailabilityDto,
    @UuidParam('branchId') branchId: string,
  ) {
    return this.branchAvailabilityService.update(id, updateDto, {
      where: { branch: { id: branchId } },
    });
  }
}
