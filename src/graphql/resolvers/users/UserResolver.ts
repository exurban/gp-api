import { Arg, Authorized, Ctx, Int, Query, Resolver } from 'type-graphql';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Repository } from 'typeorm';
import * as dotenv from 'dotenv';
import User from '../../entities/User';

dotenv.config();

type Context = {
  user: User;
};

@Resolver(() => User)
export default class UserResolver {
  //* Repositories
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>
  ) {}

  //* Queries
  // make this a query builder query
  @Authorized('ADMIN')
  @Query(() => [User])
  async users(): Promise<User[]> {
    return await this.userRepository.find();
  }

  @Authorized('ADMIN')
  @Query(() => User)
  async user(@Arg('id', () => Int) id: number): Promise<User | undefined> {
    return await this.userRepository.findOne(id);
  }

  @Authorized('USER')
  @Query(() => Int)
  async me(@Ctx() context: Context): Promise<number> {
    const userId = context.user.id;
    return userId;
  }
}
