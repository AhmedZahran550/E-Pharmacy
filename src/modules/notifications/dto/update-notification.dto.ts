import { PartialType, PickType } from '@nestjs/mapped-types';
import {
  CreateNotificationDto,
  CreateSystemNotificationsDto,
} from './create-notification.dto';

export class UpdateNotificationDto extends PartialType(CreateNotificationDto) {}
export class UpdateSystemNotificationDto extends PartialType(
  PickType(CreateSystemNotificationsDto, ['isRead'] as const),
) {}
