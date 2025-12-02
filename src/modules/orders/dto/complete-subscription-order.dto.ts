import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';

export class CompleteSubscriptionOrderDto {
  @IsString()
  action: string;

  @ValidateIf((object) => object.action === 'cancel')
  @IsString()
  cancelReason?: string;
}
