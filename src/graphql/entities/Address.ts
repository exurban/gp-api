import { Field, ID, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import Order from "./Order";

@ObjectType()
@Entity({ name: "addresses" })
export default class Address extends BaseEntity {
  @Index()
  @Field(() => ID)
  @PrimaryGeneratedColumn("increment")
  readonly id: number;

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

  @Field(() => [Order])
  @OneToMany(() => Order, (order) => order.shipToAddress)
  orders: Order[];

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
