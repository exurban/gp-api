import { Field, Float, ID, ObjectType } from "type-graphql";
import {
  BaseEntity,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import Photo from "./Photo";
import Print from "./Print";
import Mat from "./Mat";
import Frame from "./Frame";
import User from "./User";
import Order from "./Order";

@ObjectType()
@Entity({ name: "products" })
export default class Product extends BaseEntity {
  @Index({ unique: true })
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  readonly id: number;

  @Field(() => Photo)
  @ManyToOne(() => Photo, (photo) => photo.products)
  @JoinColumn()
  photo: Photo;

  @Field(() => Print)
  @ManyToOne(() => Print, (print) => print.products)
  @JoinColumn()
  print: Print;

  @Field(() => Mat, { nullable: true })
  @ManyToOne(() => Mat, (mat) => mat.products, {
    nullable: true,
  })
  @JoinColumn()
  mat?: Mat;

  @Field(() => Frame, { nullable: true })
  @ManyToOne(() => Frame, (frame) => frame.products, {
    nullable: true,
  })
  @JoinColumn()
  frame?: Frame;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, (user) => user.shoppingBagItems, {
    nullable: true,
  })
  @JoinColumn()
  shoppingBag?: User;

  @Field(() => Order)
  @ManyToOne(() => Order, (order) => order.products)
  @JoinColumn()
  order: Order;

  @Field(() => Float)
  totalRetailPrice: number;

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
