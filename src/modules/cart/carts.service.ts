import { QueryConfig, QueryOptions } from '@/common/query-options';
import { handleError } from '@/database/db.errors';
import { DBService } from '@/database/db.service';
import { Branch } from '@/database/entities/branch.entity';
import { CartItem } from '@/database/entities/cart-item.entity';
import { Cart } from '@/database/entities/cart.entity';
import { Item } from '@/database/entities/item.entity';
import { Offer, PricingType } from '@/database/entities/offer.entity';
import { User } from '@/database/entities/user.entity';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterOperator } from 'nestjs-paginate';
import {
  DataSource,
  EntityManager,
  FindOptionsWhere,
  In,
  LessThan,
  MoreThan,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { ItemsOrdersService } from '../orders/items-orders.service';
import { CartItemDto, CreateCartDto } from './dto/create-cart.dto';
import { ErrorCodes } from '@/common/error-codes';
import { CartOffer } from '@/database/entities/cart-offer.entity';
import { OrderStatus } from '@/database/entities/order.entity';
import { CartAction, CartActionDto } from './dto/cart-action.dto';
const CART_PAGINATION_CONFIG: QueryConfig<Cart> = {
  sortableColumns: ['metadata.createdAt'],
  filterableColumns: {
    'branch.id': [FilterOperator.EQ],
    'user.id': [FilterOperator.EQ],
    'user.familyId': [FilterOperator.EQ],
    'metadata.createdAt': [
      FilterOperator.GTE,
      FilterOperator.LTE,
      FilterOperator.EQ,
      FilterOperator.BTW,
    ],
  },
  defaultSortBy: [['metadata.createdAt', 'DESC']],
  relations: [
    'cartItems',
    'cartItems.item',
    'cartOffers.offer.offerItems.item',
    'branch',
    'branch.city',
  ],
};

@Injectable()
export class CartsService extends DBService<Cart, CreateCartDto> {
  async deleteItem(cartId: string, itemId: string) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;

      // Find the cart with its items and offers
      const cart = await manager.findOneOrFail(Cart, {
        where: { id: cartId, isCheckedOut: false },
        relations: [
          'cartItems',
          'cartItems.item',
          'cartOffers',
          'cartOffers.offer',
          'cartOffers.offer.offerItems',
        ],
      });

      // Find the specific cart item to delete
      const cartItemToDelete = cart.cartItems.find(
        (cartItem) => cartItem.item.id === itemId,
      );

      if (!cartItemToDelete) {
        throw new NotFoundException({
          message: `Item with ID ${itemId} not found in cart`,
          code: ErrorCodes.ITEM_NOT_FOUND,
        });
      }

      // Delete the cart item
      await manager.delete(CartItem, { id: cartItemToDelete.id });

      // Remove the item from the cart's items array
      cart.cartItems = cart.cartItems.filter(
        (cartItem) => cartItem.item.id !== itemId,
      );

      // Recalculate totals
      const { subTotal, totalDiscount, totalAmount } = this.calculateSubTotal(
        cart.cartItems,
        cart.cartOffers.map((co) => co.offer), // Use the offers from the cart
      );

      cart.subTotal = subTotal;
      cart.totalDiscount = totalDiscount;
      cart.totalAmount = totalAmount;

      // Save the updated cart
      const updatedCart = await manager.save(cart);
      await queryRunner.commitTransaction();

      return updatedCart;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
    } finally {
      await queryRunner.release();
    }
  }

  async deleteByIdAndUser(id: string, user: AuthUserDto) {
    // First, find the cart to verify it exists and user has access
    const qb = this.repository.createQueryBuilder('cart');
    qb.innerJoin('cart.user', 'user')
      .where('cart.id = :id', { id })
      .andWhere('cart.isCheckedOut = false');

    if (user.isFamilyManager) {
      qb.andWhere('user.familyId = :familyId', { familyId: user.familyId });
    } else {
      qb.andWhere('user.id = :userId', { userId: user.id });
    }

    const cartExists = await qb.getOne();

    if (!cartExists) {
      throw new NotFoundException({
        message: `Cart with ID ${id} not found`,
        code: ErrorCodes.CART_NOT_FOUND,
      });
    }

    // If cart exists and user has access, delete it using simple delete
    const result = await this.repository.delete({ id });

    return result;
  }

  constructor(
    @InjectRepository(Cart)
    public repository: Repository<Cart>,
    @InjectRepository(User)
    public userRepo: Repository<User>,
    private dataSource: DataSource,
    private itemsOrdersService: ItemsOrdersService,
  ) {
    super(repository, CART_PAGINATION_CONFIG);
  }

  async findAllByProvider(branchId: string, options?: QueryOptions) {
    const qb = this.repository.createQueryBuilder('cart');
    const cartQuery = this.buildCartQuery(qb);
    cartQuery.andWhere('branch.id = :branchId', { branchId });
    // Execute the query and get one result
    return super.findAll(options, qb);
  }

  async getUserCart(id: string, user: AuthUserDto) {
    const qb = this.repository.createQueryBuilder('cart');
    // Use the common query builder
    const cartQuery = this.buildCartQuery(qb);
    cartQuery
      .addSelect('branch')
      .leftJoinAndSelect('branch.provider', 'provider')
      .leftJoinAndSelect('provider.type', 'providerType')
      .leftJoinAndSelect('branch.city', 'city');
    if (user.isFamilyManager) {
      qb.andWhere('user.familyId = :familyId', { familyId: user.familyId });
    } else {
      qb.andWhere('user.id = :userId', { userId: user.id });
    }
    // Add specific where clause for cart ID
    cartQuery.andWhere('cart.id = :cartId', { cartId: id });
    // Execute the query and get one result
    const cart = await cartQuery.getOneOrFail();
    return {
      ...cart,
      offers: cart.cartOffers.map((cartOffer) => cartOffer.offer),
    };
  }

  getAllByCustomer(query: QueryOptions, customerId: string, userId?: string) {
    const qb = this.repository.createQueryBuilder('cart');
    qb.innerJoin('cart.user', 'user')
      .where('cart.isCheckedOut = false')
      .andWhere(' user.customer_id = :customerId ', {
        customerId,
      });
    if (userId) {
      qb.andWhere('user.id = :userId', { userId });
    }
    return super.findAll(query, qb);
  }

  async getOneByCustomer(id: string, customerId?: string, userId?: string) {
    const qb = this.repository.createQueryBuilder('cart');
    // Load branch explicitly for the item price logic in buildCartQuery
    // Use the common query builder, passing the branch ID from the loaded relation
    const cartQuery = this.buildCartQuery(qb); // Pass branch.id if loaded
    if (userId) {
      cartQuery.andWhere('user.id = :userId', { userId });
    }
    if (customerId) {
      cartQuery.andWhere('customer.id = :customerId', { customerId });
    }
    // Add specific where clause for cart ID
    cartQuery.andWhere('cart.id = :cartId', { cartId: id });
    // Execute the query and get one result
    const cart = await cartQuery.getOneOrFail();
    return cart;
  }
  // add get carts
  async getCartsByUser(query: QueryOptions, user: AuthUserDto) {
    const qb = this.repository.createQueryBuilder('c');
    qb.innerJoinAndSelect('c.user', 'user').where('c.isCheckedOut = false');
    if (user.isFamilyManager) {
      qb.andWhere('user.familyId = :familyId', { familyId: user.familyId });
    } else {
      qb.andWhere('user.id = :userId', { userId: user.id });
    }
    const resp = await super.findAll(query, qb);
    if (resp.data) {
      resp.data = resp.data.map((cart) => ({
        ...cart,
        offers: cart.cartOffers?.map((cartOffer) => cartOffer.offer) || [],
      }));
    }
    return resp;
  }

  async cartAction(
    id: string,
    AuthUser: AuthUserDto,
    actionDto: CartActionDto,
  ) {
    if (actionDto.type === CartAction.SAVE) {
      const whereCondition: FindOptionsWhere<Cart> = {
        id,
        isCheckedOut: false,
      };
      const cart = await this.repository.findOneOrFail({
        where: whereCondition,
      });
      // Update isSavedFlag to true
      cart.isSaved = true;
      // Save the updated cart
      return this.repository.save(cart);
    } else if (actionDto.type === CartAction.RE_ORDER) {
      return this.reorder(id, AuthUser, actionDto?.user?.id);
    }
  }

  async saveCart(createCartDto: CreateCartDto, createdBy: AuthUserDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;
      const cartUserId = createCartDto.user?.id;

      // Find or create cart
      const cart = await this.findOrCreateCart(
        manager,
        cartUserId,
        createCartDto.branch.id,
      );

      // Clear existing items if any
      if (cart.cartItems?.length > 0) {
        await manager.delete(CartItem, { cart: { id: cart.id } });
      }
      // Process new items
      const cartItems = await this.createCartItems(
        manager,
        createCartDto.cartItems,
        cart,
      );
      // Clear existing offers if any
      if (cart.cartOffers?.length > 0) {
        cart.cartOffers = [];
        await manager.delete(CartOffer, { cart: { id: cart.id } });
      }
      // Handle offers if present
      let offers = [];
      if (createCartDto.offerIds && createCartDto.offerIds?.length > 0) {
        offers = await this.getCartOffers(createCartDto.offerIds, manager);
      }

      const { subTotal, totalDiscount, totalAmount } = this.calculateSubTotal(
        cartItems,
        offers, // Pass the new offers array instead of cart.cartOffers
      );
      cart.subTotal = subTotal;
      cart.totalDiscount = totalDiscount;
      cart.totalAmount = totalAmount;
      cart.cartItems = cartItems;
      cart.coverageAmount = createCartDto.coverageAmount;
      cart.metadata = {
        ...cart.metadata,
        createdBy: createdBy.id,
      };
      const savedCart = await manager.save(cart);
      if (offers?.length > 0) {
        const cartOffers = offers?.map((offer) =>
          manager.create(CartOffer, {
            offer,
            cart: { id: savedCart.id },
            metadata: { createdBy: createdBy.id },
          }),
        );
        await manager.save(cartOffers);
      }

      await queryRunner.commitTransaction();
      return savedCart;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error); // Map PostgreSQL errors to friendly ones and throw
    } finally {
      await queryRunner.release();
    }
  }

  async reorder(cartId: string, user: AuthUserDto, userId?: string) {
    // 1. Find the old order
    const cart = await this.findOneOrFail({
      where: {
        id: cartId,
        isCheckedOut: true,
      },
      relations: ['cartItems.item', 'branch'],
    });
    const newCart = await this.saveCart(
      {
        user: { id: userId || user.id },
        branch: { id: cart.branch.id },
        cartItems: cart.cartItems.map((cartItem) => ({
          id: cartItem.item.id,
          quantity: cartItem.quantity,
          extras: cartItem.extras,
          price: cartItem.unitPrice,
          notes: cartItem.notes,
        })),
        coverageAmount: cart.coverageAmount,
      },
      user,
    );
    return newCart;
  }
  async addCartItem(
    cartId: string,
    items: CartItemDto[],
    user: AuthUserDto,
  ): Promise<Cart> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;

      // Find the cart
      const cart = await manager.findOneOrFail(Cart, {
        where: { id: cartId, isCheckedOut: false, user: { id: user.id } },
        relations: ['cartItems.item', 'branch.provider', 'cartOffers.offer'],
      });
      cart.cartItems.forEach((ci) => {
        const existItemIndex = items.findIndex(
          (item) => item.id === ci.item.id,
        );
        if (existItemIndex !== -1) {
          // Update existing item quantity and total price
          ci.quantity += items[existItemIndex].quantity; // Default to 1 if not provided
          ci.totalPrice = ci.unitPrice * ci.quantity;
          items.splice(existItemIndex, 1); // Remove the updated item from the new items array
        }
      });
      // Process new items
      const cartItems = await this.createCartItems(manager, items, cart);

      // Recalculate totals
      const { subTotal, totalDiscount, totalAmount } = this.calculateSubTotal(
        [...cartItems, ...cart.cartItems],
        cart.cartOffers.map((co) => co.offer), // Use the offers from the cart
      );

      // Update the cart totals
      cart.cartItems = [...cartItems, ...cart.cartItems];
      cart.subTotal = subTotal;
      cart.totalDiscount = totalDiscount;
      cart.totalAmount = totalAmount;

      // Save the updated cart
      const updatedCart = await manager.save(cart);
      await queryRunner.commitTransaction();

      return updatedCart;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
    } finally {
      await queryRunner.release();
    }
  }

  async addCartOffer(cartId: string, offerId: string, createdBy: AuthUserDto) {
    const queryRunner = await this.startTransaction(this.dataSource);
    try {
      const manager = queryRunner.manager;

      // Find the cart with its items and offers
      const cart = await manager.findOneOrFail(Cart, {
        where: { id: cartId, isCheckedOut: false },
        relations: [
          'cartItems.item',
          'cartOffers.offer.offerItems.item',
          'branch.provider',
        ],
      });
      if (cart.cartOffers.find((co) => co.offer.id === offerId)) {
        throw new ConflictException({
          message: `Offer with ID ${offerId} already exists in the cart`,
          code: ErrorCodes.OFFER_ALREADY_APPLIED,
        });
      }
      // Get the active offers from the database
      const offer = await manager.findOneOrFail(Offer, {
        where: {
          id: offerId,
          isActive: true,
        },
        relations: ['offerItems.item'],
      });
      const cartOffer = manager.create(CartOffer, {
        offer,
        cart: { id: cart.id },
        metadata: { createdBy: createdBy.id },
      });
      // Save the new CartOffer entities
      const savedCart = await manager.save(cartOffer);
      cart.cartOffers.push(savedCart); // Add the new offer to the cart's offers
      // Recalculate totals after adding offers
      const { subTotal, totalDiscount, totalAmount } = this.calculateSubTotal(
        cart.cartItems,
        cart.cartOffers.map((co) => co.offer), // Use the offers from the cart
      );
      cart.subTotal = subTotal;
      cart.totalDiscount = totalDiscount;
      cart.totalAmount = totalAmount;

      // Save the updated cart
      const updatedCart = await manager.save(cart);
      await queryRunner.commitTransaction();

      return updatedCart;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error); // Map PostgreSQL errors to friendly ones and throw
    } finally {
      await queryRunner.release();
    }
  }

  private async getCartOffers(offerIds: string[], manager: EntityManager) {
    const offers = await manager.find(Offer, {
      where: {
        id: In(offerIds),
        isActive: true,
        startDate: LessThan(new Date()),
        endDate: MoreThan(new Date()),
      },
      relations: ['offerItems.item'],
    });

    if (!offers.length || offers.length !== offerIds.length) {
      throw new NotFoundException({
        message: 'Offer not found or not active',
        code: ErrorCodes.OFFER_NOT_FOUND,
      });
    }
    return offers;
  }
  private async findOrCreateCart(
    manager: EntityManager,
    userId: string,
    branchId: string,
  ): Promise<Cart> {
    const existingCart = await manager.findOne(Cart, {
      where: {
        user: { id: userId },
        branch: { id: branchId },
        isCheckedOut: false,
      },
      relations: ['cartItems', 'branch.provider', 'cartOffers'],
    });

    if (existingCart) {
      return existingCart;
    }
    const branch = await manager.findOneOrFail(Branch, {
      where: { id: branchId },
    });
    const newCart = new Cart();
    newCart.user = { id: userId } as User;
    newCart.branch = branch;
    return newCart;
  }

  private async createCartItems(
    manager: EntityManager,
    items: CartItemDto[],
    cart: Cart,
  ): Promise<CartItem[]> {
    if (!items?.length) {
      return [];
    }

    const itemIds = items.map((item) => item.id);
    const existingItems = await manager
      .createQueryBuilder(Item, 'item')
      .leftJoin(
        'item.providerItems',
        'pi',
        'pi.item_id = item.id AND pi.provider_id = :providerId',
        { providerId: cart.branch.provider.id },
      )
      // Add the COALESCE expression to select the effective price
      .addSelect('COALESCE(pi.sellingPrice, item.price)', 'item_price')
      .where({ id: In(itemIds), isActive: true })
      .getMany();
    if (!existingItems.length || existingItems.length !== items.length) {
      this.logger.warn(`No active items found for item IDs: ${itemIds}`);
      throw new NotFoundException({
        message: 'Items not found',
        code: ErrorCodes.ITEM_NOT_FOUND,
      });
    }

    return existingItems.map((item) => {
      const cartItem = new CartItem();
      const inputItem = items.find((i) => i.id === item.id);
      const price = inputItem.price ?? item.price;
      cartItem.unitPrice = price;
      cartItem.quantity = inputItem?.quantity || 1;
      cartItem.totalPrice = price * cartItem.quantity;
      cartItem.notes = inputItem.notes;
      if (inputItem.extras) {
        cartItem.extras = {
          ...inputItem.extras,
          lengthOfStayInDays: inputItem.extras.lengthOfStayInDays || 0, // Provide default value for required property
        };
      }
      cartItem.item = item;
      cartItem.cart = cart;
      return cartItem;
    });
  }

  private calculateSubTotal(
    cartItems: CartItem[],
    offers: Offer[],
  ): { subTotal: number; totalDiscount: number; totalAmount: number } {
    // 1. Calculate the initial subTotal (sum of all cart items' original prices)
    const subTotal = cartItems.reduce(
      (total, item) => total + item.totalPrice,
      0,
    );
    // 2. Handle the case where there is no offer
    if (!offers || offers.length === 0) {
      // If offer is undefined, null, or has no items defined, treat as no offer
      return {
        subTotal,
        totalDiscount: 0,
        totalAmount: subTotal,
      };
    }
    let totalDiscount = 0;
    const cartItemsMap = new Map(cartItems.map((ci) => [ci.item.id, ci]));
    for (const offer of offers) {
      // 3. Validate Cart against Offer Requirements and calc the total discount of the offer
      let offerItemsBasePrice = 0; // Original price of items/quantities covered by the offer before the discount
      for (const offerItem of offer?.offerItems) {
        if (!cartItemsMap.get(offerItem.item.id)) {
          // If validation failed, throw the specific error
          throw new ConflictException({
            message: `Cart Item miss One or More Offer Items`,
          });
        }
        // Add the price of the quantity covered by the offer to the base price
        offerItemsBasePrice += cartItemsMap.get(offerItem.item.id).unitPrice;
      }
      // 5. Calculate Discount for the Offer Portion
      let offerDisCount = 0; // offer discount
      switch (offer.pricingType) {
        case PricingType.FIXED_PRICE:
          // The price of the offer items becomes exactly offer.fixedPrice
          offerDisCount = Math.max(0, offerItemsBasePrice - offer.fixedPrice);
          break;

        case PricingType.FIXED_DISCOUNT:
          // Apply a fixed discount amount to the offer base price
          const discountAmount = offer.discountAmount ?? 0;
          offerDisCount = discountAmount;
          break;

        case PricingType.PERCENTAGE_DISCOUNT:
          // Apply a percentage discount to the offer base price
          const discountPercentage = offer.discountPercentage ?? 0;
          offerDisCount = (offerItemsBasePrice * discountPercentage) / 100;
          break;

        default:
          // Should not happen if types are correct, but handle defensively
          console.warn(
            `Unknown pricing type: ${offer.pricingType}. Applying no discount.`,
          );
          break;
      }
      // 6. update the total discount with the order discount
      totalDiscount += offerDisCount;
    }
    const totalAmount = Math.max(0, subTotal - totalDiscount);
    return {
      subTotal, // Original total before any discounts
      totalDiscount, // Ensure discount isn't negative
      totalAmount, // Final payable amount
    };
  }

  async softDeleteCart(cartId: string, deletedBy: AuthUserDto) {
    try {
      const whereCondition: FindOptionsWhere<Cart> = {
        id: cartId,
        isCheckedOut: false,
      };
      if (deletedBy.branchId) {
        whereCondition.branch = { id: deletedBy.branchId };
      } else if (deletedBy.customerId) {
        whereCondition.user = { customer: { id: deletedBy.customerId } };
      } else {
        whereCondition.user = { id: deletedBy.id };
      }
      const cart = await this.repository.findOne({
        where: whereCondition,
        relations: ['branch', 'user', 'user.customer'],
      });

      if (!cart) {
        throw new NotFoundException({
          message: `Cart with ID ${cartId} not found`,
          code: ErrorCodes.CART_NOT_FOUND,
        });
      }
      cart.metadata.deletedBy = deletedBy.id;
      // Update the cart to store who deleted it
      await this.repository.save(cart);

      // Use the inherited `softDelete` method from DBService
      await this.softDelete(cartId);

      return;
    } catch (error) {
      throw error;
    }
  }

  private buildCartQuery(
    qb: SelectQueryBuilder<Cart>,
  ): SelectQueryBuilder<Cart> {
    qb.leftJoinAndSelect('cart.cartItems', 'cartItems')
      .leftJoinAndSelect('cartItems.item', 'item')
      .leftJoinAndSelect('cart.cartOffers', 'cartOffers')
      .leftJoinAndSelect('cartOffers.offer', 'offer')
      .leftJoinAndSelect('offer.offerItems', 'offerItems')
      .leftJoinAndSelect('offerItems.item', 'offerItem')
      .leftJoinAndSelect('cart.user', 'user') // Join with the User entity
      .leftJoin('user.customer', 'customer') // Join with customer
      .leftJoin('cart.branch', 'branch'); // Load branch relation
    qb.leftJoin(
      'ProviderItem',
      'pi',
      'pi.item_id = item.id AND pi.provider_id = branch.provider_id', // Assuming branch.provider_id exists
    ).addSelect('COALESCE(pi.sellingPrice, item.price)', 'item_price');

    qb.where('cart.isCheckedOut = :isCheckedOut', {
      isCheckedOut: false,
    });
    return qb;
  }

  checkoutByProvider(cartId: string, checkoutBy?: AuthUserDto) {
    return this.itemsOrdersService.createItemsOrder(cartId, checkoutBy);
  }
}
