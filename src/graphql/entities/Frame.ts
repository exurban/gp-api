import { Field, Float, ID, ObjectType } from 'type-graphql';
import {
  BeforeInsert,
  BeforeUpdate,
  BaseEntity,
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
@Entity({ name: 'frames' })
export default class Frame extends BaseEntity {
  @Index({ unique: true })
  @Field(() => ID)
  @PrimaryColumn()
  id: number;

  @Field()
  @Column()
  sortIndex: number;

  @Field()
  @Column()
  displayName: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field()
  @Column()
  material: string;

  @Field()
  @Column()
  color: string;

  @Field()
  @Column()
  printType: string;

  @Field()
  @Column()
  frameSku: string;

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

  @Field(() => ProductImage, {
    nullable: true,
    description: 'Optional. An image of the frame.',
  })
  @ManyToOne(() => ProductImage, (productImage) => productImage.frames, {
    nullable: true,
  })
  @JoinColumn()
  productImage?: ProductImage;

  @Field(() => [Product], { nullable: true })
  @OneToMany(() => Product, (product) => product.frame, { nullable: true })
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
    console.log(`setting AR`);

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
