import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { BranchAvailabilityService } from './branch-availability.service';
import { QueryOptions } from '@/common/query-options';
import { Paginate } from 'nestjs-paginate';
import {
  AvailabilityListDto,
  CreateBranchAvailabilityDto,
} from './dto/create-availability.dto';
import { UpdateBranchAvailabilityDto } from './dto/update-availability.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';
import { ValidateBranchAccess } from '../auth/decorators/validate-branch-access.decorator';
import { UuidParam } from '@/common/decorators/uuid-param.decorator';
import { ValidateNested } from 'class-validator';

@Roles(Role.PROVIDER_USER)
@ValidateBranchAccess()
@Controller('provider/branches/:branchId/availability')
export class ProviderBranchAvailabilityController {
  constructor(
    private readonly branchAvailabilityService: BranchAvailabilityService,
  ) {}

  @Post()
  async create(
    @Body() createDto: AvailabilityListDto,
    @Param('branchId') branchId: string,
  ) {
    return this.branchAvailabilityService.createBranchAvailability(
      createDto,
      branchId,
    );
  }

  @Get()
  findAll(@Param('branchId') branchId: string) {
    return this.branchAvailabilityService.findAllByBranchId(branchId);
  }
}
