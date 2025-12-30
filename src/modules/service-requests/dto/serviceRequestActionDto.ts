import { IsEnum, IsString, ValidateIf } from 'class-validator';

export enum ServiceRequestAction {
  ACCEPT = 'accept',
  REJECT = 'reject',
}

export class ServiceRequestActionDto {
  @IsString()
  @ValidateIf((dto) => dto.type === ServiceRequestAction.REJECT)
  cancellationReason?: string;

  @IsEnum(ServiceRequestAction)
  type: ServiceRequestAction;
}
