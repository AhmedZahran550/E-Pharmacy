import { PartialType } from '@nestjs/swagger';
import { CreateBranchAvailabilityDto } from './create-availability.dto';

export class UpdateBranchAvailabilityDto extends PartialType(
  CreateBranchAvailabilityDto,
) {}
