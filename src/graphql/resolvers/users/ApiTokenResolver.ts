import { Arg, Field, InputType, Mutation, Resolver } from 'type-graphql';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Repository } from 'typeorm';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import User from '../../entities/User';

dotenv.config();

@InputType()
class GetApiTokenInput {
  @Field()
  userId: number;

  @Field()
  email: string;
}

@Resolver(() => User)
export default class UserResolver {
  //* Repositories
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>
  ) {}

  @Mutation(() => String)
  async getApiToken(
    @Arg('input', () => GetApiTokenInput) input: GetApiTokenInput
  ): Promise<string> {
    console.log(`received Get API Token request`);
    // look up compoundId, get its user and check that the email uses the one sent
    const user = await this.userRepository.findOne(input.userId);

    // * verify email
    if (user && user.email === input.email) {
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
        },
        process.env.JWT_SECRET as string
      );

      console.log(`Sending token to user already in DB.`);
      return token;
    } else {
      throw new Error(`Sign in credentials don't match.`);
    }
  }
}
