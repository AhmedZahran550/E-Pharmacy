import { Body, Controller, Post } from '@nestjs/common';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { Role } from '../auth/role.model';
import {
  CreateSubscriptionOrderDto,
  SubscriptionActionType,
} from './dto/create-subscription-order.dto';
import { SubscriptionOrdersService } from './subscription-orders.service';

@Controller('subscription-orders')
export class SubscriptionOrdersController {
  constructor(private readonly ordersService: SubscriptionOrdersService) {}

  @Post()
  @Roles(Role.APP_USER)
  create(
    @Body() createSubscriptionOrderDto: CreateSubscriptionOrderDto,
    @AuthUser() user: AuthUserDto,
  ) {
    if (
      createSubscriptionOrderDto.action === SubscriptionActionType.ADD_MEMBERS
    ) {
      return this.ordersService.updateFamilySubscription(
        createSubscriptionOrderDto,
        user,
      );
    }
    return this.ordersService.createNewSubscription(
      createSubscriptionOrderDto,
      user,
    );
  }
}
