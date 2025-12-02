import { QueryOptions } from '@/common/query-options';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { Paginate } from 'nestjs-paginate';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { Role } from '../auth/role.model';
import { OrdersService } from './orders.service';
import { ErrorCodes } from '@/common/error-codes';
import { ItemsOrdersService } from './items-orders.service';
import { OrderAction, OrderActionDto } from './dto/order-action.dto';
import { OrderPaymentRequestDto } from './dto/update-order.dto';
import { OrderHistoryService } from './order-history.service';

@Controller('users/:userId/orders')
export class UserOrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly itemOrdersService: ItemsOrdersService,
    private readonly orderHistoryService: OrderHistoryService,
  ) {}

  @Get()
  @Roles(Role.APP_USER)
  findAll(
    @Param('userId') userId: string,
    @Paginate() query: QueryOptions,
    @AuthUser() user: AuthUserDto,
  ) {
    if (!user.roles.includes(Role.ADMIN) && user.id !== userId) {
      throw new ForbiddenException({
        message: 'You are not authorized to view this resource',
        code: ErrorCodes.FORBIDDEN,
      });
    }
    return this.ordersService.findByUser(query, user);
  }

  @Get(':id')
  @Roles(Role.APP_USER)
  findOne(@Param('id') id: string, @AuthUser() user: AuthUserDto) {
    return this.ordersService.findOrderWithOtp(id, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }

  @Roles(Role.APP_USER)
  @Post(':id/action')
  orderActions(
    @Param('id') id: string,
    @Body() orderActionDto: OrderActionDto,
    @AuthUser() user: AuthUserDto,
  ) {
    switch (orderActionDto.type) {
      case OrderAction.APPLY_PROMO:
        return this.itemOrdersService.applyPromotion(
          id,
          orderActionDto.promoCode,
          user.id,
        );
      case OrderAction.REMOVE_PROMO:
        return this.itemOrdersService.removePromotion(
          id,
          orderActionDto.promoCode,
          user.id,
        );
      case OrderAction.CANCEL:
        return this.ordersService.cancelOrder(id, user, orderActionDto.reason);
      default:
        throw new BadRequestException({
          message: `Invalid action ${orderActionDto.type}`,
          code: ErrorCodes.INVALID_ACTION,
        });
    }
  }

  @Roles(Role.APP_USER)
  @Post(':id/payment-request')
  paymentRequest(
    @Param('id') id: string,
    @Body() orderPaymentRequestDto: OrderPaymentRequestDto,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.ordersService.orderPaymentRequest(
      id,
      orderPaymentRequestDto.user.id,
      user,
    );
  }

  @Roles(Role.APP_USER)
  @Post(':id/payment-response')
  paymentResponse(
    @Param('id') id: string,
    @Body() orderPaymentRequestDto: OrderPaymentRequestDto,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.ordersService.rejectPaymentForOthersRequest(id, user);
  }

  @Roles(Role.APP_USER)
  @Get(':id/history')
  getOrderHistory(@Param('id') id: string) {
    return this.orderHistoryService.getOrderHistory(id);
  }
}
