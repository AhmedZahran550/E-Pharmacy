import { UuidParam } from '@/common/decorators/uuid-param.decorator';
import { QueryOptions } from '@/common/query-options';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { Paginate } from 'nestjs-paginate';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { Role } from '../auth/role.model';
import { VerifyOrderOtpDto } from './dto/verify-order-otp.dto';
import { OrdersService } from './orders.service';
import { ValidateBranchAccess } from '../auth/decorators/validate-branch-access.decorator';
import { OrderActionDto } from './dto/order-action.dto';
import { OrderAction } from './dto/order-action.dto';
import { ItemsOrdersService } from './items-orders.service';
import { ErrorCodes } from '@/common/error-codes';
import { OrderHistoryService } from './order-history.service';

@Controller('provider/branches/:branchId/orders')
@ValidateBranchAccess()
@Roles(Role.PROVIDER_USER)
export class BranchOrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly itemsOrdersService: ItemsOrdersService,
    private readonly orderHistoryService: OrderHistoryService,
  ) {}

  @Get()
  findAll(@AuthUser() user: AuthUserDto, @Paginate() query: QueryOptions) {
    return this.ordersService.findByBranch(user.branchId, query);
  }

  @Get(':id')
  findOne(@AuthUser() user: AuthUserDto, @UuidParam('id') id: string) {
    return this.ordersService.findOrder(id);
  }

  @Get(':id/history')
  getOrderHistory(@Param('id') id: string) {
    return this.orderHistoryService.getOrderHistoryWithMinimalCreator(id);
  }

  @Post(':id/otp-verification')
  verifyOTP(
    @UuidParam('id') id: string,
    @Body() verifyOrderOtpDto: VerifyOrderOtpDto,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.itemsOrdersService.verifyOrderOTP(
      id,
      verifyOrderOtpDto.otp,
      user,
    );
  }

  @Post(':id/action')
  orderAction(
    @Param('id') id: string,
    @Body() orderActionDto: OrderActionDto,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.itemsOrdersService.orderAction(id, orderActionDto, user);
  }
}
