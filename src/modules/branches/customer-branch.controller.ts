import { QueryOptions } from '@/common/query-options';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Paginate } from 'nestjs-paginate';
import { BranchesService } from './branches.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';

@Roles(Role.CUSTOMER_USER)
@ApiTags('Branches')
@Controller('customer/branches')
export class CustomerBranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  findAll(@Paginate() query: QueryOptions) {
    return this.branchesService.findAll(query);
  }
}
