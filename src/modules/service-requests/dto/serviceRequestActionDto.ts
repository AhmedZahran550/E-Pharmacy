import { IsEnum, IsString, ValidateIf } from 'class-validator';

export enum ServiceRequestAction {
  ACCEPT = 'accept',
  REJECT = 'reject',
}

export class ServiceRequestActionDto {
  @IsString()
  @ValidateIf((dto) => dto.action === ServiceRequestAction.REJECT)
  cancellationReason?: string;

  @IsEnum(ServiceRequestAction)
  action: ServiceRequestAction;
}
