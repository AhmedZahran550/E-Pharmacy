import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultationsController } from './consultations.controller';
import { DoctorConsultationsController } from './doctor-consultations.controller';
import { ConsultationSseController } from './consultation-sse.controller';
import { ConsultationsService } from './consultations.service';
import { Consultation } from '@/database/entities/consultation.entity';
import { ConsultationMessage } from '@/database/entities/consultation-message.entity';
import { ConsultationQueue } from '@/database/entities/consultation-queue.entity';
import { Employee } from '@/database/entities/employee.entity';
import { MedicineSchedulesModule } from '../medicine-schedules/medicine-schedules.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Consultation,
      ConsultationMessage,
      ConsultationQueue,
      Employee,
    ]),
    MedicineSchedulesModule,
  ],
  controllers: [
    ConsultationsController,
    DoctorConsultationsController,
    ConsultationSseController,
  ],
  providers: [ConsultationsService, ConsultationSseController],
  exports: [ConsultationsService, ConsultationSseController],
})
export class ConsultationsModule {}
