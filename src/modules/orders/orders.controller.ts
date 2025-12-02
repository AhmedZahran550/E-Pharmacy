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
import { ErrorCodes } from '@/common/error-codes';
import { CreateOrderPaymentsDto } from './dto/orderPayments.dto';
import {
  PayerType,
  Payment,
  PaymentStatus,
} from '@/database/entities/payment.entity';
import {
  TransactionStatus,
  TransactionType,
} from '@/database/entities/transaction.entity';
import { BranchRatingDto } from '../branches/dto/branch-rating.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles(Role.APP_USER)
  findAll(@Paginate() query: QueryOptions, @AuthUser() user: AuthUserDto) {
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

  // @Roles(Role.APP_USER)
  // @Post(':id/payments')
  // async orderPayment(
  //   @Param('id') id: string,
  //   @Body() orderPaymentsDto: CreateOrderPaymentsDto,
  //   @AuthUser() user: AuthUserDto,
  // ) {
  //   orderPaymentsDto.payerType = PayerType.USER;
  //   let payment: Payment = await this.itemOrdersService.createOrderPayment(
  //     orderPaymentsDto,
  //     id,
  //     user,
  //   );
  //   const onLineTransaction = payment.transactions.find(
  //     (t) => t.type === TransactionType.ONLINE_PAYMENT,
  //   );
  //   if (onLineTransaction) {
  //     return await this.webHookService.handleWebhook({
  //       status: TransactionStatus.SUCCEEDED,
  //       amount: onLineTransaction.amount,
  //       referenceId: onLineTransaction.id,
  //     });
  //   }
  //   return payment;
  // }

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
