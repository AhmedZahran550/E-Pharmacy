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

@Controller('provider/employees')
@Roles(Role.PROVIDER_ADMIN)
export class ProviderEmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @ApiQuery(CreateEmployeeDto)
  @Get()
  async findAll(
    @Paginate() query: QueryOptions,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.employeesService.findProviderEmployees(user.providerId, query);
  }

  @Post()
  async create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.employeesService.create({
      ...createEmployeeDto,
      type: EmployeeType.PROVIDER,
      branch: { id: user.branchId },
      roles: [Role.PROVIDER_DOCTOR],
      createdBy: user.id,
    } as CreateEmployeeDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AuthUser() user: AuthUserDto) {
    return this.employeesService.findOne({
      where: {
        id,
        branch: { provider: { id: user.providerId } },
        type: EmployeeType.PROVIDER,
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
        branch: { provider: { id: user.providerId } },
        type: EmployeeType.PROVIDER,
      },
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string, @AuthUser() user: AuthUserDto) {
    return this.employeesService.delete(id, {
      where: {
        branch: { provider: { id: user.providerId } },
        type: EmployeeType.PROVIDER,
      },
    });
  }
}
