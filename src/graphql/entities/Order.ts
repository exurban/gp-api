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
  @Index()
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  readonly id: number;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, (user) => user.orders, { nullable: true })
  @JoinColumn()
  user?: User;

  @Field(() => OrderStatus)
  @Column()
  orderStatus: OrderStatus;

  @Field(() => [Product], { nullable: true })
  @OneToMany(() => Product, (product) => product.order)
  products?: Product[];

  @Field({ nullable: true })
  @Column({ nullable: true })
  line1?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  line2?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  postalCode?: string;

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
