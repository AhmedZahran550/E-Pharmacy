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
import { ApiTags } from '@nestjs/swagger';
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

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(Role.USER, Role.APP_USER)
  @UseInterceptors(FileInterceptor('image', imageInterceptorOptions))
  async createOrder(
    @AuthUser() user: AuthUserDto,
    @UploadedFile() image: Express.Multer.File,
    @Body() body: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(body, image, user);
  }

  @Get()
  @Roles(Role.USER, Role.APP_USER)
  async findAll(
    @AuthUser() user: AuthUserDto,
    @Paginate() query: QueryOptions,
  ) {
    return this.ordersService.findUserOrders(user.id, query);
  }

  @Get(':id')
  @Roles(Role.USER, Role.APP_USER)
  async findOne(@AuthUser() user: AuthUserDto, @Param('id') id: string) {
    return this.ordersService.findOrderDetails(id, user.id);
  }

  @Patch(':id')
  @Roles(Role.USER, Role.APP_USER)
  async updateOrder(
    @Param('id') id: string,
    @Body() body: { status: string },
    @AuthUser() user: AuthUserDto,
  ) {
    return this.ordersService.updateStatus(id, body.status, user.id);
  }
}
