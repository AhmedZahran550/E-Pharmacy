import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Paginate } from 'nestjs-paginate';
import { QueryOptions } from '@/common/query-options';
import { EmployeesService } from './employees.service';
import { ApiQuery } from '@/common/decorators/pagination-query.decorator';
import { EmployeeDto } from './dto/employee.dto';
import { NearbyDoctorsDto } from './dto/nearby-doctors.dto';
import { RateDoctorDto } from './dto/rate-doctor.dto';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { Role } from '../auth/role.model';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Doctors')
@Roles(Role.USER, Role.APP_USER)
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

  @Post(':id/rating')
  @ApiOperation({
    summary: 'Rate a doctor',
    description: 'Allow users to rate a doctor once with a rating from 0-5',
  })
  @ApiResponse({
    status: 200,
    description: 'Doctor rated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'User has already rated this doctor or invalid rating',
  })
  @ApiResponse({
    status: 404,
    description: 'Doctor not found',
  })
  async rateDoctor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RateDoctorDto,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.employeesService.rateDoctor(id, user.id, dto.rating, dto.notes);
  }
}
