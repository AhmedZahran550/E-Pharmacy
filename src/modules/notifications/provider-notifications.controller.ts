import { Paginate, QueryOptions } from '@/common/query-options';
import { Controller, Get, Param, Patch } from '@nestjs/common';
import { SystemNotificationsService } from './system-notification.service';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';
import { NotificationChannel } from './dto/notification.enum';

@Controller('provider/notifications')
@Roles(Role.PROVIDER_USER)
export class ProviderNotificationsController {
  constructor(
    private readonly systemNotificationsService: SystemNotificationsService,
  ) {}

  @Get()
  findAll(@Paginate() query: QueryOptions, @AuthUser() user: AuthUserDto) {
    return this.systemNotificationsService.findAllByProvider(user, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AuthUser() user: AuthUserDto) {
    return this.systemNotificationsService.find({
      where: { id },
    });
  }

  @Patch(':id')
  update(@Param('id') id: string) {
    return this.systemNotificationsService.markAsRead(id, {
      channel: NotificationChannel.PROVIDER_PORTAL,
    });
  }
}
