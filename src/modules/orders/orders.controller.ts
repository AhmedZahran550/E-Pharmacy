import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  Patch,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import imageInterceptorOptions from '@/common/interceptors/image-interceptor-options';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApiQuery } from '@/common/decorators/pagination-query.decorator';
import { Paginate } from 'nestjs-paginate';
import { QueryOptions } from '@/common/query-options';
import { FileRequiredPipe } from '@/common/pipes/file-required.pipe';
import { UpdateOrderDto } from './dto/update-order.dto';

@ApiTags('Orders')
@Roles(Role.USER, Role.APP_USER)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create order', description: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createOrder(
    @AuthUser() user: AuthUserDto,
    @Body() body: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(body, user);
  }

  @Patch(':id/image')
  @UseInterceptors(FileInterceptor('image', imageInterceptorOptions))
  @ApiOperation({
    summary: 'Upload order image',
    description: 'Upload prescription or document image for order',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Order image file',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file format or size' })
  async updateOrderImage(
    @AuthUser() user: AuthUserDto,
    @UploadedFile(FileRequiredPipe) image: Express.Multer.File,
    @Param('id') id: string,
  ) {
    return this.ordersService.updateOrderImage(id, image, user);
  }

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

  @Patch(':id')
  @ApiOperation({
    summary: 'Update order',
    description: 'Update order information or status',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateOrder(
    @Param('id') id: string,
    @Body() body: UpdateOrderDto,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.ordersService.updateOrder(id, body, user.id);
  }
}
