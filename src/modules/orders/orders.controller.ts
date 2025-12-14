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
import { FileRequiredPipe } from '@/common/pipes/file-required.pipe';
import { UpdateOrderDto } from './dto/update-order.dto';

@ApiTags('Orders')
@Roles(Role.USER, Role.APP_USER)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(
    @AuthUser() user: AuthUserDto,
    @Body() body: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(body, user);
  }

  @Patch(':id/image')
  @UseInterceptors(FileInterceptor('image', imageInterceptorOptions))
  async updateOrderImage(
    @AuthUser() user: AuthUserDto,
    @UploadedFile(FileRequiredPipe) image: Express.Multer.File,
    @Param('id') id: string,
  ) {
    return this.ordersService.updateOrderImage(id, image, user);
  }

  @Get()
  async findAll(
    @AuthUser() user: AuthUserDto,
    @Paginate() query: QueryOptions,
  ) {
    return this.ordersService.findUserOrders(user.id, query);
  }

  @Get(':id')
  async findOne(@AuthUser() user: AuthUserDto, @Param('id') id: string) {
    return this.ordersService.findOrderDetails(id, user.id);
  }

  @Patch(':id')
  async updateOrder(
    @Param('id') id: string,
    @Body() body: UpdateOrderDto,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.ordersService.updateOrder(id, body, user.id);
  }
}
