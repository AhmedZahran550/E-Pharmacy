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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Provider - Employees')
@Controller('provider/employees')
@Roles(Role.PROVIDER_ADMIN)
export class ProviderEmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @ApiQuery(CreateEmployeeDto)
  @Get()
  @ApiOperation({
    summary: 'List provider employees',
    description: 'Get paginated list of provider employees',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee list retrieved successfully',
  })
  async findAll(
    @Paginate() query: QueryOptions,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.employeesService.findProviderEmployees(user.providerId, query);
  }

  @Post()
  @ApiOperation({
    summary: 'Create provider employee',
    description: 'Create a new employee (doctor) for the provider',
  })
  @ApiResponse({ status: 201, description: 'Employee created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
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
  @ApiOperation({
    summary: 'Get provider employee',
    description: 'Retrieve provider employee by ID',
  })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'Employee retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
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
  @ApiOperation({
    summary: 'Update provider employee',
    description: 'Update provider employee information',
  })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'Employee updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
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
  @ApiOperation({
    summary: 'Delete provider employee',
    description: 'Remove provider employee account',
  })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'Employee deleted successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  remove(@Param('id') id: string, @AuthUser() user: AuthUserDto) {
    return this.employeesService.delete(id, {
      where: {
        branch: { provider: { id: user.providerId } },
        type: EmployeeType.PROVIDER,
      },
    });
  }
}
