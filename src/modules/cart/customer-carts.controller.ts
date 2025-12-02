import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';
import { CartsService } from './carts.service';
import { Paginate } from 'nestjs-paginate';
import { QueryOptions } from '@/common/query-options';
import { ValidateCustomerAccess } from '../auth/decorators/validate-customer-access.decorator';
import { CreateCartDto, EmployeeCreateCartDto } from './dto/create-cart.dto';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { AuthUserDto } from '../auth/dto/auth-user.dto';

@Controller('customer/carts')
@Roles(Role.CUSTOMER_USER)
export class CustomerCartController {
  constructor(private readonly cartService: CartsService) {}

  @Get()
  findAll(@Paginate() query: QueryOptions, @AuthUser() authUser: AuthUserDto) {
    return this.cartService.getAllByCustomer(query, authUser.customerId);
  }

  @Get(':id')
  getCart(@AuthUser() authUser: AuthUserDto, @Param('id') id: string) {
    return this.cartService.getOneByCustomer(id, authUser.customerId);
  }

  @Post()
  post(
    @Body() cartDto: EmployeeCreateCartDto,
    @AuthUser() savedByUser: AuthUserDto,
  ) {
    return this.cartService.saveCart(cartDto, savedByUser);
  }

  @Delete(':cartId')
  async softDeleteCart(
    @AuthUser() deletedByUser: AuthUserDto,
    @Param('cartId') cartId: string,
  ) {
    return this.cartService.softDeleteCart(cartId, deletedByUser);
  }
}
