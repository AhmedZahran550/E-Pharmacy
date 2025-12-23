import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Paginate } from 'nestjs-paginate';
import { QueryOptions } from '@/common/query-options';
import { EmployeesService } from './employees.service';
import { Public } from '../auth/decorators/public.decorator';
import { ApiQuery } from '@/common/decorators/pagination-query.decorator';
import { EmployeeDto } from './dto/employee.dto';
import { NearbyDoctorsDto } from './dto/nearby-doctors.dto';

@ApiTags('Employees')
@Public()
@Controller('doctors')
export class UserEmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @ApiQuery(EmployeeDto)
  @Get()
  async findDoctors(@Paginate() query: QueryOptions) {
    return this.employeesService.findDoctors(query);
  }

  @Get('nearby')
  async findNearbyDoctors(@Query() params: NearbyDoctorsDto) {
    return this.employeesService.findNearbyDoctors(
      params.lat,
      params.lng,
      params.radius || 10,
      params.isOnline,
    );
  }
}
