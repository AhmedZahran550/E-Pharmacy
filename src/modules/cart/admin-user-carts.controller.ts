import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { Role } from '../auth/role.model';
import { CartsService } from './carts.service';
import {
  CreateCartDto,
  CreateCartOfferDto,
  CreateCartItemDto,
} from './dto/create-cart.dto';
import { QueryOptions } from '@/common/query-options';
import { Paginate } from 'nestjs-paginate';
import { UpdateCartDto } from './dto/update-cart.dto';
import { CartActionDto } from './dto/cart-action.dto';
import { UUID } from 'crypto';
import { Policies } from '../auth/decorators/policies.decorator';
import { Subject } from '../auth/policies.types';

@Roles(Role.SYSTEM_USER)
@Policies({ subject: Subject.carts })
@Controller('admin/users/:userId/carts')
@Roles(Role.APP_USER)
export class AdminUserCartsController {
  constructor(private readonly cartService: CartsService) {}

  @Post()
  post(
    @Body() createCartDto: CreateCartDto,
    @Param('userId') userId: string,
    @AuthUser() user: AuthUserDto,
  ) {
    createCartDto.user = { id: userId };
    return this.cartService.saveCart(createCartDto, user);
  }

  @Get()
  getCarts(
    @Paginate() query: QueryOptions,
    @Param('userId') userId: string,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.cartService.getCartsByUser(query, { id: userId } as any);
  }

  @Get(':id')
  getCart(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.cartService.getUserCart(id, { id: userId } as any);
  }

  @Delete(':id')
  deleteCart(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.cartService.deleteByIdAndUser(id, { id: userId } as any);
  }

  @Post(':cartId/items')
  addItems(
    @Param('cartId') cartId: string,
    @Body() cartDto: CreateCartItemDto,
    @Param('userId') userId: string,
  ) {
    return this.cartService.addCartItem(cartId, cartDto.items, {
      id: userId,
    } as any);
  }

  @Delete(':id/items/:itemId')
  deleteCartItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.cartService.deleteItem(id, itemId);
  }

  @Put(':id/offers/:offerId')
  addOffer(
    @Param('id') id: string,
    @Param('offerId') offerId: UUID,
    @AuthUser() createdByUser: AuthUserDto,
  ) {
    return this.cartService.addCartOffer(id, offerId, createdByUser);
  }

  @Post(':id/action')
  cartAction(
    @Param('id') id: string,
    @AuthUser() createdByUser: AuthUserDto,
    @Body() actionDto: CartActionDto,
  ) {
    return this.cartService.cartAction(id, createdByUser, actionDto);
  }
}
