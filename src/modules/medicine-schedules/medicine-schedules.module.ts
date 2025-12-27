import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicineSchedulesController } from './medicine-schedules.controller';
import { MedicineSchedulesService } from './medicine-schedules.service';
import { MedicineSchedule } from '@/database/entities/medicine-schedule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MedicineSchedule])],
  controllers: [MedicineSchedulesController],
  providers: [MedicineSchedulesService],
  exports: [MedicineSchedulesService],
})
export class MedicineSchedulesModule {}
