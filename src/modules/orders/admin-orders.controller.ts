import { QueryOptions } from '@/common/query-options';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { Paginate } from 'nestjs-paginate';
import { OrdersService } from './orders.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';
import { OrderAction, OrderActionDto } from './dto/order-action.dto';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { ItemsOrdersService } from './items-orders.service';
import { ErrorCodes } from '@/common/error-codes';
import { OrderHistoryService } from './order-history.service';
import { Policies } from '../auth/decorators/policies.decorator';
import { Subject } from '../auth/policies.types';

@Roles(Role.SYSTEM_USER)
@Policies({ subject: Subject.orders })
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly itemOrdersService: ItemsOrdersService,
    private readonly orderHistoryService: OrderHistoryService,
  ) {}

  @Get()
  findAll(@Paginate() query: QueryOptions) {
    return this.ordersService.findAllByAdmin(query);
  }

  @Get(':id')
  @Roles(Role.APP_USER, Role.PROVIDER_USER)
  findOne(@Param('id') id: string) {
    return this.ordersService.findOrder(id);
  }

  @Get(':id/history')
  getOrderHistory(@Param('id') id: string) {
    return this.orderHistoryService.getOrderHistory(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }

  @Post(':id/action')
  orderAction(
    @Param('id') id: string,
    @Body() orderActionDto: OrderActionDto,
    @AuthUser() user: AuthUserDto,
  ) {
    switch (orderActionDto.type) {
      case OrderAction.REJECT:
        return this.ordersService.rejectOrder(id, user, orderActionDto.reason);
      case OrderAction.CANCEL:
        return this.ordersService.cancelOrder(id, user, orderActionDto.reason);
      case OrderAction.REOPEN_CANCELED:
        return this.itemOrdersService.reOpenCanaledOrder(id, user);
      case OrderAction.APPROVE:
        return this.ordersService.approveOrder(id, user);
      default:
        throw new BadRequestException({
          message: `Invalid action ${orderActionDto.type}`,
          code: ErrorCodes.INVALID_ACTION,
        });
    }
  }
}
