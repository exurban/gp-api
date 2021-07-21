import { Field, ID, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import User from './User';
import Product from './Product';
import { OrderStatus } from '../abstract/Enum';

@ObjectType()
@Entity({ name: 'orders' })
export default class Order extends BaseEntity {
  @Index({ unique: true })
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  readonly id: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.orders, { primary: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field(() => OrderStatus)
  @Column()
  orderStatus: OrderStatus;

  @Field(() => [Product], { nullable: true })
  @OneToMany(() => Product, (product) => product.order)
  products: Product[];

  @Field()
  @Column()
  line1: string;

  @Field()
  @Column()
  line2: string;

  @Field()
  @Column()
  city: string;

  @Field()
  @Column()
  state: string;

  @Field()
  @Column()
  country: string;

  @Field()
  @Column()
  postalCode: string;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

/**
 * customer
 * orderStatus ('order placed', 'order placed with lab', 'lab shipped', 'closed')
 * shipToAddress
 *  street1
 *  street2
 *  city
 *  state
 *  zip
 *  country
 * products (1-to-Many)
 * orderStatus - canceled, payment failed or paid
 * orderDate
 * labOrderStatus - pending or placed
 * labOrderDate
 * labReceiptUrl - order receipts stored in S3
 * labShippedDate
 */
