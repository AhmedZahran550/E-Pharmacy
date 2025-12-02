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
import { Role } from '../auth/role.model';
import { Roles } from '../auth/decorators/roles.decorator';
import { EmployeeType } from '@/database/entities/employee.entity';

@Controller('admin/employees')
@Roles(Role.SYSTEM_USER)
@Policies({ subject: Subject.employee })
export class AdminEmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @ApiQuery(CreateEmployeeDto)
  @Get()
  async findAll(@Paginate() query: QueryOptions) {
    return this.employeesService.findSystemEmployees(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findById(id, {
      where: { type: EmployeeType.SYSTEM },
    });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, updateEmployeeDto, {
      where: { type: EmployeeType.SYSTEM },
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeesService.softDelete(id, {
      where: { type: EmployeeType.SYSTEM },
    });
  }
}
