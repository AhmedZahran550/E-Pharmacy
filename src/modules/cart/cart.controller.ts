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

@Controller('carts')
@Roles(Role.APP_USER)
export class CartController {
  constructor(private readonly cartService: CartsService) {}

  @Post()
  post(@Body() createCartDto: CreateCartDto, @AuthUser() user: AuthUserDto) {
    if (!createCartDto.user) {
      createCartDto.user = { id: user.id };
    }
    return this.cartService.saveCart(createCartDto, user);
  }

  @Get()
  getCarts(@Paginate() query: QueryOptions, @AuthUser() user: AuthUserDto) {
    return this.cartService.getCartsByUser(query, user);
  }

  @Get(':id')
  getCart(@Param('id') id: string, @AuthUser() user: AuthUserDto) {
    return this.cartService.getUserCart(id, user);
  }

  @Delete(':id')
  deleteCart(@Param('id') id: string, @AuthUser() user: AuthUserDto) {
    return this.cartService.deleteByIdAndUser(id, user);
  }

  @Post(':cartId/items')
  addItems(
    @Param('cartId') cartId: string,
    @Body() cartDto: CreateCartItemDto,
    @AuthUser() savedByUser: AuthUserDto,
  ) {
    return this.cartService.addCartItem(cartId, cartDto.items, savedByUser);
  }

  @Delete(':id/items/:itemId')
  deleteCartItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.cartService.deleteItem(id, itemId);
  }

  @Put(':id/offers/:offerId')
  addOffer(
    @Param('id') id: string,
    @Param('offerId') offerId: UUID,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.cartService.addCartOffer(id, offerId, user);
  }

  @Post(':id/action')
  cartAction(
    @Param('id') id: string,
    @AuthUser() user: AuthUserDto,
    @Body() actionDto: CartActionDto,
  ) {
    return this.cartService.cartAction(id, user, actionDto);
  }
}
