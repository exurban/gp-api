import { Field, Float, ID, Int, ObjectType } from 'type-graphql';
import {
  BeforeInsert,
  BaseEntity,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  PrimaryColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import ProductImage from './ProductImage';
import Product from './Product';

@ObjectType()
@Entity({ name: 'mats' })
export default class Mat extends BaseEntity {
  @Index({ unique: true })
  @Field(() => ID)
  @PrimaryColumn()
  id: number;

  @Field(() => Int)
  @Column()
  sortIndex: number;

  @Field()
  @Column({ nullable: true })
  displayName?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field()
  @Column()
  color: string;

  @Field()
  @Column()
  printType: string;

  @Field()
  @Column()
  matSku: string;

  @Index()
  @Field()
  @Column({ nullable: true })
  aspectRatio: string;

  @Field(() => Float)
  @Column('float')
  dimension1: number;

  @Field(() => Float)
  @Column('float')
  dimension2: number;

  @Field(() => Float)
  @Column('float')
  cost: number;

  @Field(() => Float)
  @Column('float')
  basePrice: number;

  @Field(() => Float)
  @Column('float', { default: 1.0 })
  priceModifier: number;

  @Field(() => Float)
  retailPrice: number;

  @Field(() => ProductImage, { nullable: true })
  @ManyToOne(() => ProductImage, (productImage) => productImage.mats, {
    nullable: true,
  })
  @JoinColumn()
  productImage?: ProductImage;

  @Field(() => [Product], { nullable: true })
  @OneToMany(() => Product, (product) => product.mat, { nullable: true })
  products?: Product[];

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  setAspectRatio() {
    if (this.dimension1 === this.dimension2) {
      this.aspectRatio = '1:1';
    }

    const ar = this.dimension1 / this.dimension2;
    switch (true) {
      case ar < 0.3:
        this.aspectRatio = '1:4';
        break;
      case ar < 0.4:
        this.aspectRatio = '1:3';
        break;
      case ar < 0.6:
        this.aspectRatio = '1:2';
        break;
      case ar < 0.72:
        this.aspectRatio = '2:3';
        break;
      case ar < 0.94:
        this.aspectRatio = '4:5';
        break;
      default:
        this.aspectRatio = '1:1';
    }
  }
}
