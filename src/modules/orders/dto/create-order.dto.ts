import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateMedicineScheduleDto } from '@/modules/medicine-schedules/dto/create-medicine-schedule.dto';
import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';

export class OrderItemScheduleDto extends OmitType(CreateMedicineScheduleDto, [
  'medicineName',
  'itemId',
] as const) {}

export class OrderItemDto {
  @ApiProperty({ description: 'ID of the item from catalog' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Price of the item' })
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'Quantity of the item' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Instructions for the user' })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiPropertyOptional({ description: 'Medication schedule if applicable' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrderItemScheduleDto)
  schedule?: OrderItemScheduleDto;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({ description: 'Note for the entire order' })
  @IsString()
  @IsOptional()
  notes?: string;
}
