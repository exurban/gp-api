import { Field, ID, Int, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import Frame from './Frame';
import Mat from './Mat';
import Photographer from './Photographer';

@ObjectType()
@Entity({ name: 'product_images' })
export default class ProductImage extends BaseEntity {
  @Field(() => ID)
  @PrimaryColumn()
  id: number;

  @Field()
  @Column({ default: 'Product Image' })
  imageName: string;

  @Field()
  @Column({ default: 'webp' })
  fileExtension: string;

  @Field()
  @Column({ default: '' })
  imageUrl: string;

  @Field()
  @Column({ default: 'product image' })
  altText: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  aspectRatio?: string;

  @Field()
  @Column({ default: 'XL' })
  size: string;

  @Field(() => Int)
  @Column('int', { default: 0 })
  width: number;

  @Field(() => Int)
  @Column('int', { default: 0 })
  height: number;

  @Field(() => [Mat], {
    description: 'Optional. Product image for mats.',
    nullable: true,
  })
  @OneToMany(() => Mat, (mat) => mat.productImage, { nullable: true })
  mats?: Mat[];

  @Field(() => [Frame], {
    description: 'Optional. Product image for frames.',
    nullable: true,
  })
  @OneToMany(() => Frame, (frame) => frame.productImage, { nullable: true })
  frames?: Frame[];

  @Field(() => [Photographer], {
    description: 'Optional. Biographical image for photographer.',
    nullable: true,
  })
  @OneToMany(() => Photographer, (photographer) => photographer.coverImage, {
    nullable: true,
  })
  photographers?: Photographer[];

  @Field(() => Boolean)
  @Column('boolean', { default: false })
  isPortrait: boolean;

  @Field(() => Boolean)
  @Column('boolean', { default: false })
  isPanoramic: boolean;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @BeforeInsert()
  setIsPortrait() {
    this.isPortrait = this.height > this.width;
  }

  @BeforeInsert()
  setIsPanoramic() {
    this.isPanoramic = this.width / 2 > this.height;
  }

  @BeforeInsert()
  @BeforeUpdate()
  setAspectRatio() {
    // * set AR where width & height are defined
    console.log(`setting AR`);

    const dimension1 = this.width < this.height ? this.width : this.height;
    const dimension2 = this.width < this.height ? this.height : this.width;

    const ar = dimension1 / dimension2;
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
