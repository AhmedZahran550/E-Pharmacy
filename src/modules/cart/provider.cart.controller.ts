import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { Role } from '../auth/role.model';
import { CartsService } from './carts.service';
import { EmployeeCreateCartDto } from './dto/create-cart.dto';
import { QueryOptions } from '@/common/query-options';
import { Paginate } from 'nestjs-paginate';

@Controller('provider/carts')
@Roles(Role.PROVIDER_USER)
export class ProviderCartController {
  constructor(private readonly cartService: CartsService) {}

  @Get()
  getCart(@AuthUser() authUser: AuthUserDto, @Paginate() query: QueryOptions) {
    return this.cartService.findAllByProvider(authUser.branchId, query);
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
