import { PartialType } from '@nestjs/swagger';
import { CreateMedicineScheduleDto } from './create-medicine-schedule.dto';

export class UpdateMedicineScheduleDto extends PartialType(
  CreateMedicineScheduleDto,
) {}
