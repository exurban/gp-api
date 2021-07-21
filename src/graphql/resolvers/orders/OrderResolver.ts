import {
  Arg,
  Authorized,
  Ctx,
  Mutation,
  Query,
  ObjectType,
  Resolver,
  Int,
  Field,
  InputType,
} from 'type-graphql';

import { InjectRepository } from 'typeorm-typedi-extensions';
import { Repository } from 'typeorm';

import { OrderStatus } from '../../abstract/Enum';
import SuccessMessageResponse from '../../abstract/SuccessMessageResponse';
import Order from '../../entities/Order';
import User from '../../entities/User';
import Product from '../../entities/Product';
import Address from '../../entities/Address';

interface Context {
  user: User;
}

//* orderStatus, products, shipToAddress, user
@InputType()
class UpdateOrderInput implements Partial<Order> {
  @Field(() => OrderStatus, {
    nullable: true,
    description: `Current status of the order.`,
  })
  orderStatus?: OrderStatus;

  @Field(() => Address, {
    nullable: true,
    description: `Shipping address for the order.`,
  })
  shipToAddress?: Address;

  @Field(() => User, {
    nullable: true,
    description: `The user who placed the order.`,
  })
  user?: User;

  @Field(() => [Product], {
    nullable: true,
    description: `Products on the order.`,
  })
  products?: Product[];
}

@ObjectType()
class UpdateOrderResponse extends SuccessMessageResponse {
  @Field(() => Order, { nullable: true })
  updatedOrder?: Order;
}

@Resolver(() => Order)
export default class OrderResolver {
  //* Repositories
  constructor(
    @InjectRepository(Order) private orderRepository: Repository<Order>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Product) private productRepository: Repository<Product>
  ) {}

  @Authorized('ADMIN')
  @Query(() => [Order])
  async allOrders(): Promise<Order[]> {
    return this.orderRepository.find();
  }

  //* Mutations
  @Authorized('USER')
  @Mutation(() => Order)
  async createOrder(@Ctx() context: Context): Promise<Order | null> {
    const userId = context.user.id;
    const user = await this.userRepository.findOne(userId);

    const newOrder = await this.orderRepository.create({
      user: user,
      orderStatus: OrderStatus.CREATED,
    });
    return newOrder;
  }

  @Authorized('USER')
  @Mutation(() => UpdateOrderResponse)
  async updateOrder(
    @Arg('id', () => Int) id: number,
    @Arg('input', () => UpdateOrderInput) input: UpdateOrderInput
  ): Promise<UpdateOrderResponse> {
    const order = await this.orderRepository.findOne(id);

    if (!order || order === undefined) {
      return {
        success: false,
        message: `Couldn't find order with id: ${id}`,
      };
    }

    const updated = { ...order, ...input };

    const updatedOrder = await this.orderRepository.save(updated);

    if (input.products) {
      input.products.map(async (x) => {
        const prd = await this.productRepository.findOne(x.id);
        if (!prd) {
          console.error(`ERROR: Failed to find product with id ${x.id}`);
        } else {
          prd.order = updatedOrder;
          prd.shoppingBag = null;
        }
      });
    }

    return {
      success: true,
      message: `Successfully updated order ${id}.`,
      updatedOrder: updatedOrder,
    };
  }
}
