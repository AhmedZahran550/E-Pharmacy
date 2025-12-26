import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleAvailabilityDto {
  @ApiProperty({
    description: 'Whether the doctor is available for consultations',
  })
  @IsBoolean()
  available: boolean;
}
