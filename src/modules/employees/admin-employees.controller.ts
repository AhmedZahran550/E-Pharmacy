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
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';
import { EmployeeType } from '@/database/entities/employee.entity';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { AuthUserDto } from '../auth/dto/auth-user.dto';

@Controller('admin/employees')
@Roles(Role.SYSTEM_ADMIN)
export class AdminEmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @ApiQuery(CreateEmployeeDto)
  @Get()
  async findAll(@Paginate() query: QueryOptions) {
    return this.employeesService.findSystemEmployees(query);
  }

  @Post()
  async create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.employeesService.create({
      ...createEmployeeDto,
      createdBy: user?.id,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne({
      where: {
        id,
        type: EmployeeType.SYSTEM,
      },
    });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, updateEmployeeDto, {
      where: {
        id,
        type: EmployeeType.SYSTEM,
      },
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeesService.delete(id, {
      where: {
        type: EmployeeType.SYSTEM,
      },
    });
  }
}
