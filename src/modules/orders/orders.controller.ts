import { Controller, Get, Param } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { Paginate } from 'nestjs-paginate';
import { QueryOptions } from '@/common/query-options';

@ApiTags('Orders')
@Roles(Role.USER, Role.APP_USER)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'List user orders',
    description: 'Get paginated list of user orders',
  })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async findAll(
    @AuthUser() user: AuthUserDto,
    @Paginate() query: QueryOptions,
  ) {
    return this.ordersService.findUserOrders(user.id, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get order details',
    description: 'Retrieve detailed order information',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@AuthUser() user: AuthUserDto, @Param('id') id: string) {
    return this.ordersService.findOrderDetails(id, user.id);
  }

  @Get(':id/history')
  @ApiOperation({
    summary: 'Get order history',
    description: 'Retrieve order status history',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({
    status: 200,
    description: 'Order history retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOneHistory(@AuthUser() user: AuthUserDto, @Param('id') id: string) {
    return this.ordersService.findOrderHistory(id, user.id);
  }
}
