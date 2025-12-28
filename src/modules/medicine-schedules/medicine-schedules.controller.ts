import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Param,
  Body,
  Query,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { AuthUser } from '@/modules/auth/decorators/auth-user.decorator';
import { User } from '@/database/entities/user.entity';
import { MedicineSchedulesService } from './medicine-schedules.service';
import { UpdateMedicineScheduleDto } from './dto/update-medicine-schedule.dto';
import { MarkAsTakenDto } from './dto/mark-as-taken.dto';
import { MedicineSchedule } from '@/database/entities/medicine-schedule.entity';
import { Role } from '@/modules/auth/role.model';

@ApiTags('Medicine Schedules')
@Controller('medicine-schedules')
@Roles(Role.APP_USER)
@ApiBearerAuth()
export class MedicineSchedulesController {
  constructor(
    private readonly medicineSchedulesService: MedicineSchedulesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user medicine schedules' })
  @ApiResponse({ status: 200, description: 'List of medicine schedules' })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  async getSchedules(
    @AuthUser() user: User,
    @Query('active', new ParseBoolPipe({ optional: true })) active?: boolean,
  ): Promise<MedicineSchedule[]> {
    return await this.medicineSchedulesService.findUserSchedules(
      user.id,
      active,
    );
  }

  @Get('today/list')
  @ApiOperation({ summary: "Get today's medicines" })
  @ApiResponse({ status: 200, description: "Today's medicine schedules" })
  async getTodaysMedicines(
    @AuthUser() user: User,
  ): Promise<MedicineSchedule[]> {
    return await this.medicineSchedulesService.getTodaySchedules(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get medicine schedule details' })
  @ApiResponse({ status: 200, description: 'Medicine schedule details' })
  async getSchedule(
    @AuthUser() user: User,
    @Param('id') id: string,
  ): Promise<MedicineSchedule> {
    return await this.medicineSchedulesService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update medicine schedule' })
  @ApiResponse({ status: 200, description: 'Medicine schedule updated' })
  async updateSchedule(
    @AuthUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateMedicineScheduleDto,
  ): Promise<MedicineSchedule> {
    return await this.medicineSchedulesService.update(id, user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete medicine schedule' })
  @ApiResponse({ status: 200, description: 'Medicine schedule deleted' })
  async deleteSchedule(
    @AuthUser() user: User,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.medicineSchedulesService.delete(id, user.id);
    return { message: 'Schedule deleted successfully' };
  }

  @Post(':id/taken')
  @ApiOperation({ summary: 'Mark medicine as taken' })
  @ApiResponse({ status: 200, description: 'Medicine marked as taken' })
  async markAsTaken(
    @AuthUser() user: User,
    @Param('id') scheduleId: string,
    @Body() dto: MarkAsTakenDto,
  ): Promise<{ message: string }> {
    await this.medicineSchedulesService.markAsTaken(
      scheduleId,
      user.id,
      new Date(dto.takenAt),
      dto.notes,
    );
    return { message: 'Medicine marked as taken' };
  }
}
