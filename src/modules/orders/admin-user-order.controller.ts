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
import { Subject } from '../auth/policies.types';
import { Policies } from '../auth/decorators/policies.decorator';

@Roles(Role.SYSTEM_USER)
@Policies({ subject: Subject.orders })
@Controller('admin/users/:userId/orders')
export class AdminUserOrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly itemOrdersService: ItemsOrdersService,
    private readonly orderHistoryService: OrderHistoryService,
  ) {}

  @Get()
  findAll(
    @Param('userId') userId: string,
    @Paginate() query: QueryOptions,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.ordersService.findByUser(query, { id: userId } as AuthUserDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Param('userId') userId: string) {
    return this.ordersService.findOrderWithOtp(id, { id: userId } as any);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }

  @Post(':id/action')
  orderActions(
    @Param('id') id: string,
    @Body() orderActionDto: OrderActionDto,
    @Param('userId') userId: string,
  ) {
    switch (orderActionDto.type) {
      case OrderAction.APPLY_PROMO:
        return this.itemOrdersService.applyPromotion(
          id,
          orderActionDto.promoCode,
          userId,
        );
      case OrderAction.REMOVE_PROMO:
        return this.itemOrdersService.removePromotion(
          id,
          orderActionDto.promoCode,
          userId,
        );
      case OrderAction.CANCEL:
        return this.ordersService.cancelOrder(
          id,
          { id: userId } as any,
          orderActionDto.reason,
        );
      default:
        throw new BadRequestException({
          message: `Invalid action ${orderActionDto.type}`,
          code: ErrorCodes.INVALID_ACTION,
        });
    }
  }

  @Post(':id/payment-request')
  paymentRequest(
    @Param('id') id: string,
    @Body() orderPaymentRequestDto: OrderPaymentRequestDto,
    @Param('userId') userId: string,
  ) {
    return this.ordersService.orderPaymentRequest(
      id,
      orderPaymentRequestDto.user.id,
      { id: userId } as any,
    );
  }

  @Post(':id/payment-response')
  paymentResponse(
    @Param('id') id: string,
    @Body() orderPaymentRequestDto: OrderPaymentRequestDto,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.ordersService.rejectPaymentForOthersRequest(id, user);
  }

  @Get(':id/history')
  getOrderHistory(@Param('id') id: string) {
    return this.orderHistoryService.getOrderHistory(id);
  }
}
