import { UuidParam } from '@/common/decorators/uuid-param.decorator';
import { QueryOptions } from '@/common/query-options';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Paginate } from 'nestjs-paginate';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';
import { OrdersService } from './orders.service';
import { ValidateCustomerAccess } from '../auth/decorators/validate-customer-access.decorator';
import { UpdateOrderCoverageDto } from './dto/update-order.dto';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { OrderAction, OrderActionDto } from './dto/order-action.dto';
import { ErrorCodes } from '@/common/error-codes';
import { OrderHistoryService } from './order-history.service';
import { Auth } from 'firebase-admin/lib/auth/auth';

@Controller('customer/orders')
@Roles(Role.CUSTOMER_USER)
export class CustomerOrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private orderHistoryService: OrderHistoryService,
  ) {}

  @Get()
  findAll(@AuthUser() user: AuthUserDto, @Paginate() query: QueryOptions) {
    return this.ordersService.findByCustomer(user.customerId, query);
  }

  @Get(':id')
  findOne(@UuidParam('id') id: string, @AuthUser() user: AuthUserDto) {
    return this.ordersService.findOrder(id);
  }

  @Get(':id/history')
  getOrderHistory(@Param('id') id: string) {
    return this.orderHistoryService.getOrderHistoryWithMinimalCreator(id);
  }

  @Patch(':id/coverage')
  updateCoverage(
    @AuthUser() user: AuthUserDto,
    @UuidParam('id') id: string,
    @Body() updateOrderCoverageDto: UpdateOrderCoverageDto,
  ) {
    return this.ordersService.update(id, updateOrderCoverageDto, {
      where: { user: { customer: { id: user.customerId } } },
    });
  }

  @Post(':orderId/action')
  orderAction(
    @Param('orderId') orderId: string,
    @Body() orderActionDto: OrderActionDto,
    @AuthUser() user: AuthUserDto,
  ) {
    switch (orderActionDto.type) {
      case OrderAction.CANCEL:
        return this.ordersService.cancelOrder(
          orderId,
          user,
          orderActionDto.reason,
        );
      default:
        throw new BadRequestException({
          message: `Invalid action ${orderActionDto.type}`,
          code: ErrorCodes.INVALID_ACTION,
        });
    }
  }
}
