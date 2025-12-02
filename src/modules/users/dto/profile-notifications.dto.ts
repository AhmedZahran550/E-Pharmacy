import { IsBoolean } from 'class-validator';

export class ProfileNotificationsDto {
  @IsBoolean()
  enabled: boolean;
}
