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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Admin - Employees')
@Controller('admin/employees')
@Roles(Role.SYSTEM_ADMIN)
export class AdminEmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @ApiQuery(CreateEmployeeDto)
  @Get()
  @ApiOperation({
    summary: 'List all system employees',
    description: 'Get paginated list of system employees',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee list retrieved successfully',
  })
  async findAll(@Paginate() query: QueryOptions) {
    return this.employeesService.findSystemEmployees(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Create system employee',
    description: 'Create a new system employee account',
  })
  @ApiResponse({ status: 201, description: 'Employee created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.employeesService.create({
      ...createEmployeeDto,
      createdBy: user.id,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get system employee',
    description: 'Retrieve system employee by ID',
  })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'Employee retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne({
      where: {
        id,
        type: EmployeeType.SYSTEM,
      },
    });
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update system employee',
    description: 'Update system employee information',
  })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'Employee updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
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
  @ApiOperation({
    summary: 'Delete system employee',
    description: 'Remove system employee account',
  })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'Employee deleted successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  remove(@Param('id') id: string) {
    return this.employeesService.delete(id, {
      where: {
        type: EmployeeType.SYSTEM,
      },
    });
  }
}
