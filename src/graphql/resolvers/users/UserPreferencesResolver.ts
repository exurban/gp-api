import {
  Authorized,
  Ctx,
  Field,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Repository } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

import User from '../../entities/User';
import UserFavorite from '../../entities/UserFavorite';
import Product from '../../entities/Product';

interface Context {
  user: User;
}

@ObjectType()
class UserPreferencesResponse {
  @Field(() => [UserFavorite], { nullable: true })
  favorites?: UserFavorite[];
  @Field(() => [Product], { nullable: true })
  shoppingBagItems?: Product[];
}

@Resolver(() => User)
export default class UserResolver {
  //* Repositories
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(UserFavorite)
    private userFavoriteRepository: Repository<UserFavorite>,
    @InjectRepository(Product) private productRepository: Repository<Product>
  ) {}

  //* Queries
  @Authorized('ADMIN')
  @Query(() => [User])
  async userSummaries(): Promise<[User[], number]> {
    return await this.userRepository.findAndCount({
      relations: ['userFavorites', 'userShoppingBagItems'],
    });
  }

  @Authorized('ADMIN')
  @Query(() => [User])
  async newsletterSubscribers(): Promise<User[]> {
    return await this.userRepository.find({ where: { isSubscribed: true } });
  }

  @Authorized('USER')
  @Query(() => UserPreferencesResponse)
  async getUserPreferences(
    @Ctx() context: Context
  ): Promise<UserPreferencesResponse> {
    const userId = context.user.id;

    // get photoIds in favorites
    const userFavorites = await this.userFavoriteRepository
      .createQueryBuilder('uf')
      .leftJoinAndSelect('uf.photo', 'p')
      .leftJoinAndSelect('p.images', 'i')
      .leftJoinAndSelect('p.photographer', 'pg')
      .leftJoinAndSelect('p.location', 'l')
      .leftJoinAndSelect('p.subjectsInPhoto', 'ps')
      .leftJoinAndSelect('ps.subject', 's', 'ps.subjectId = s.id')
      .leftJoinAndSelect('p.tagsForPhoto', 'pt')
      .leftJoinAndSelect('pt.tag', 't', 'pt.tagId = t.id')
      .leftJoinAndSelect('p.collectionsForPhoto', 'pc')
      .leftJoinAndSelect('pc.collection', 'c', 'pc.collectionId = c.id')
      .where('uf.userId = :userId', { userId: userId })
      .getMany();

    // get photoIds in bag
    const userShoppingBagItems = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.photo', 'p')
      .leftJoinAndSelect('p.images', 'i')
      .leftJoinAndSelect('product.print', 'pr')
      .leftJoinAndSelect('product.mat', 'm')
      .leftJoinAndSelect('product.frame', 'fr')

      .where('product.userId = :userId', { userId: userId })
      .getMany();

    return {
      favorites: userFavorites,
      shoppingBagItems: userShoppingBagItems,
    };
  }
}
