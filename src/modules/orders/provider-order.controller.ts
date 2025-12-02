import { UuidParam } from '@/common/decorators/uuid-param.decorator';
import { QueryOptions } from '@/common/query-options';
import { Controller, Get, Param } from '@nestjs/common';
import { Paginate } from 'nestjs-paginate';
import { Roles } from '../auth/decorators/roles.decorator';
import { ValidateProviderAccess } from '../auth/decorators/validate-provider-access.decorator';
import { Role } from '../auth/role.model';
import { OrdersService } from './orders.service';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { AuthUserDto } from '../auth/dto/auth-user.dto';

@Controller('provider/orders')
@Roles(Role.PROVIDER_ADMIN)
export class ProviderOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@AuthUser() user: AuthUserDto, @Paginate() query: QueryOptions) {
    return this.ordersService.findByProvider(user.providerId, query);
  }
}
