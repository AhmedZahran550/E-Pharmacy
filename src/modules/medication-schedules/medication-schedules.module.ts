import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicationSchedulesController } from './medication-schedules.controller';
import { MedicationSchedulesService } from './medication-schedules.service';
import { MedicationSchedule } from '@/database/entities/medication-schedule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MedicationSchedule])],
  controllers: [MedicationSchedulesController],
  providers: [MedicationSchedulesService],
  exports: [MedicationSchedulesService],
})
export class MedicationSchedulesModule {}
