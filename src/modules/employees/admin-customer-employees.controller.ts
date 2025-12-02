import { ApiQuery } from '@/common/decorators/pagination-query.decorator';
import { QueryOptions } from '@/common/query-options';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Paginate } from 'nestjs-paginate';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';
import { Policies } from '../auth/decorators/policies.decorator';
import { Subject } from '../auth/policies.types';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';
import { EmployeeType } from '@/database/entities/employee.entity';

@Controller('admin/customers/:customerId/employees')
@Roles(Role.SYSTEM_ADMIN, Role.SYSTEM_USER)
@Policies({ subject: Subject.employee })
export class AdminCustomerEmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @ApiQuery(CreateEmployeeDto)
  @Get()
  async findAll(
    @Paginate() query: QueryOptions,
    @Param('customerId') customerId: string,
  ) {
    return this.employeesService.findCustomerEmployees(customerId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Param('customerId') customerId: string) {
    return this.employeesService.findOne({
      where: { id, customer: { id: customerId }, type: EmployeeType.CUSTOMER },
    });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @Param('customerId') customerId: string,
  ) {
    return this.employeesService.update(id, updateEmployeeDto, {
      where: {
        id,
        customer: { id: customerId },
        type: EmployeeType.CUSTOMER,
      },
    });
  }
}
