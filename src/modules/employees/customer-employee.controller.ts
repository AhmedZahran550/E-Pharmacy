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
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { EmployeeType } from '@/database/entities/employee.entity';

@Controller('customer/employees')
@Roles(Role.CUSTOMER_ADMIN)
export class CustomerEmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @ApiQuery(CreateEmployeeDto)
  @Get()
  async findAll(
    @Paginate() query: QueryOptions,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.employeesService.findCustomerEmployees(user.customerId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AuthUser() user: AuthUserDto) {
    return this.employeesService.findOne({
      where: {
        id,
        customer: { id: user.customerId },
        type: EmployeeType.CUSTOMER,
      },
    });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.employeesService.update(id, updateEmployeeDto, {
      where: {
        id,
        customer: { id: user.customerId },
        type: EmployeeType.CUSTOMER,
      },
    });
  }
}
