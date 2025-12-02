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

@Controller('admin/providers/:providerId/employees')
@Roles(Role.SYSTEM_ADMIN, Role.SYSTEM_USER)
@Policies({ subject: Subject.employee })
export class AdminProviderEmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @ApiQuery(CreateEmployeeDto)
  @Get()
  async findAll(
    @Paginate() query: QueryOptions,
    @Param('providerId') providerId: string,
  ) {
    return this.employeesService.findProviderEmployees(providerId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Param('providerId') providerId: string) {
    return this.employeesService.findOne({
      where: {
        id,
        branch: { provider: { id: providerId } },
        type: EmployeeType.PROVIDER,
      },
    });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @Param('providerId') providerId: string,
  ) {
    return this.employeesService.update(id, updateEmployeeDto, {
      where: {
        id,
        branch: { provider: { id: providerId } },
        type: EmployeeType.PROVIDER,
      },
    });
  }
}
