import { Field, ID, Int, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@ObjectType()
@Entity({ name: 'photo_images' })
export default class PhotoImage extends BaseEntity {
  @Field(() => ID)
  @PrimaryColumn()
  id: number;

  @Field()
  @Column({ default: 'New Image' })
  imageName: string;

  @Field()
  @Column({ default: '' })
  jpegUrl: string;

  @Field()
  @Column({ default: '' })
  webpUrl: string;

  @Field()
  @Column({ default: 'new image' })
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
