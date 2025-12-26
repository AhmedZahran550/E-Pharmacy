import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { AuthUser } from '@/modules/auth/decorators/auth-user.decorator';
import { User } from '@/database/entities/user.entity';
import { MedicationSchedulesService } from './medication-schedules.service';
import { UpdateMedicationScheduleDto } from './dto/update-medication-schedule.dto';
import { MarkAsTakenDto } from './dto/mark-as-taken.dto';
import { MedicationSchedule } from '@/database/entities/medication-schedule.entity';
import { Role } from '@/modules/auth/role.model';

@ApiTags('Medication Schedules')
@Controller('medication-schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.APP_USER)
@ApiBearerAuth()
export class MedicationSchedulesController {
  constructor(
    private readonly medicationSchedulesService: MedicationSchedulesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user medication schedules' })
  @ApiResponse({ status: 200, description: 'List of medication schedules' })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  async getSchedules(
    @AuthUser() user: User,
    @Query('active', new ParseBoolPipe({ optional: true })) active?: boolean,
  ): Promise<MedicationSchedule[]> {
    return await this.medicationSchedulesService.findUserSchedules(
      user.id,
      active,
    );
  }

  @Get('today/list')
  @ApiOperation({ summary: "Get today's medications" })
  @ApiResponse({ status: 200, description: "Today's medication schedules" })
  async getTodaysMedications(
    @AuthUser() user: User,
  ): Promise<MedicationSchedule[]> {
    return await this.medicationSchedulesService.getTodaySchedules(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get medication schedule details' })
  @ApiResponse({ status: 200, description: 'Medication schedule details' })
  async getSchedule(
    @AuthUser() user: User,
    @Param('id') id: string,
  ): Promise<MedicationSchedule> {
    return await this.medicationSchedulesService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update medication schedule' })
  @ApiResponse({ status: 200, description: 'Medication schedule updated' })
  async updateSchedule(
    @AuthUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateMedicationScheduleDto,
  ): Promise<MedicationSchedule> {
    return await this.medicationSchedulesService.update(id, user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete medication schedule' })
  @ApiResponse({ status: 200, description: 'Medication schedule deleted' })
  async deleteSchedule(
    @AuthUser() user: User,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.medicationSchedulesService.delete(id, user.id);
    return { message: 'Schedule deleted successfully' };
  }

  @Post(':id/taken')
  @ApiOperation({ summary: 'Mark medication as taken' })
  @ApiResponse({ status: 200, description: 'Medication marked as taken' })
  async markAsTaken(
    @AuthUser() user: User,
    @Param('id') scheduleId: string,
    @Body() dto: MarkAsTakenDto,
  ): Promise<{ message: string }> {
    await this.medicationSchedulesService.markAsTaken(
      scheduleId,
      user.id,
      new Date(dto.takenAt),
      dto.notes,
    );
    return { message: 'Medication marked as taken' };
  }
}
