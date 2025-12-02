import { Controller, Get, Param, Patch } from '@nestjs/common';
import { SystemNotificationsService } from './system-notification.service';
import { QueryOptions } from '@/common/query-options';
import { Paginate } from 'nestjs-paginate';
import { NotificationChannel } from './dto/notification.enum';
import { Role } from '../auth/role.model';
import { Roles } from '../auth/decorators/roles.decorator';
import { Policies } from '../auth/decorators/policies.decorator';
import { Subject } from '../auth/policies.types';

@Roles(Role.SYSTEM_USER)
@Policies({ subject: Subject.notifications })
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(
    private readonly systemNotifications: SystemNotificationsService,
  ) {}

  @Get()
  async findAll(@Paginate() query: QueryOptions) {
    return this.systemNotifications.findAllByAdmin(query);
  }

  @Patch(':id')
  update(@Param('id') id: string) {
    return this.systemNotifications.markAsRead(id, {
      channel: NotificationChannel.ADMIN_PORTAL,
    });
  }
}
