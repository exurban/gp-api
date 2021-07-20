import User from '../../entities/User';
import Product from '../../entities/Product';

import SuccessMessageResponse from '../../abstract/SuccessMessageResponse';
import {
  Arg,
  Authorized,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Repository } from 'typeorm';

interface Context {
  user: User;
}

@ObjectType()
class ShoppingBagItemsResponse {
  @Field(() => [Product], {
    nullable: true,
    description: "Returns list of Products in user's shopping bag.",
  })
  dataList?: Product[];
}

@ObjectType()
class AddProductToShoppingBagResponse extends SuccessMessageResponse {
  @Field(() => Product, { nullable: true })
  addedProduct?: Product;
}

@Resolver(() => User)
export default class UserResolver {
  //* Repositories
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Product) private productRepository: Repository<Product>
  ) {}

  // * GET SHOPPING BAG ITEMS
  @Authorized('USER')
  @Query(() => ShoppingBagItemsResponse)
  async shoppingBagItems(
    @Ctx() context: Context
  ): Promise<ShoppingBagItemsResponse> {
    const userId = context.user.id;

    const shoppingBagItems = await this.productRepository.find({
      where: { shoppingBag: userId },
    });

    const productIds = shoppingBagItems?.map((x) => x.id);
    console.log(`retrieved shopping bag items: ${productIds}`);
    let products;

    if (productIds.length > 0) {
      products = await this.productRepository
        .createQueryBuilder('pr')
        .leftJoinAndSelect('pr.photo', 'p')
        .leftJoinAndSelect('p.photoImage', 'pi')
        .leftJoinAndSelect('pr.print', 'print')
        .leftJoinAndSelect('pr.mat', 'm')
        .leftJoinAndSelect('pr.frame', 'fr')
        .where('pr.id IN (:...productIds)', { productIds: productIds })
        .getMany();
    }

    return { dataList: products };
  }

  // * Add
  @Authorized('USER')
  @Mutation(() => AddProductToShoppingBagResponse)
  async addProductToShoppingBag(
    @Ctx() context: Context,
    @Arg('productId') productId: number
  ): Promise<AddProductToShoppingBagResponse> {
    const userId = context.user.id;

    // * Check whether product exists
    const shoppingBagItem = await this.productRepository
      .createQueryBuilder('prd')
      .leftJoinAndSelect('prd.photo', 'photo')
      .leftJoinAndSelect('photo.photoImage', 'image')
      .leftJoinAndSelect('prd.print', 'print')
      .leftJoinAndSelect('prd.mat', 'mat')
      .leftJoinAndSelect('prd.frame', 'frame')
      .where('prd.id = :productId', { productId: productId })
      .getOne();

    if (!shoppingBagItem) {
      return {
        success: false,
        message: `This product does not exist.`,
      };
    }

    // * get user & photo
    const user = await this.userRepository.findOne(userId);

    if (!user) {
      return {
        success: false,
        message: `failed to find user with id ${userId}`,
      };
    }

    shoppingBagItem.shoppingBag = user;
    await this.productRepository.save(shoppingBagItem);
    console.log(`bag item: ${JSON.stringify(shoppingBagItem, null, 2)}`);

    console.log(
      `shopping bag: ${JSON.stringify(shoppingBagItem.shoppingBag, null, 2)}`
    );
    console.log(`user: ${JSON.stringify(user, null, 2)}`);

    return {
      success: true,
      message: `Added product to bag.`,
      addedProduct: shoppingBagItem,
    };
  }

  // * Remove
  @Authorized('USER')
  @Mutation(() => SuccessMessageResponse)
  async removeProductFromShoppingBag(
    @Ctx() context: Context,
    @Arg('productId') productId: number
  ): Promise<SuccessMessageResponse> {
    const userId = context.user.id;

    // * check to see whether UserShoppingBagItem exists
    const productToRemove = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!productToRemove) {
      return {
        success: false,
        message: `Couldn't find product with id: ${productId}.`,
      };
    }

    const user = await this.userRepository.findOne(userId);

    if (!user) {
      return {
        success: false,
        message: `Couldn't find user with id: ${userId}`,
      };
    }

    if (productToRemove.shoppingBag?.id !== user.id) {
      return {
        success: false,
        message: `This product is not in your shopping bag.`,
      };
    }

    productToRemove.shoppingBag = null;
    productToRemove.removedAt = new Date();
    productToRemove.removedBy = user;

    return {
      success: true,
      message: `Removed photo from your shopping bag.`,
    };
  }
}
