import { Max, Min } from 'class-validator';
import { Field, Float, ID, Int, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
  Index,
  BeforeInsert,
  OneToOne,
} from 'typeorm';

import Location from './Location';
import PhotoCollection from './PhotoCollection';
import PhotoImage from './PhotoImage';
import ShareImage from './ShareImage';
import Photographer from './Photographer';
import PhotoSubject from './PhotoSubject';
import PhotoTag from './PhotoTag';
import UserFavorite from './UserFavorite';
import Product from './Product';

@ObjectType()
@Entity({ name: 'photos' })
export default class Photo extends BaseEntity {
  @Index()
  @Field(() => ID)
  @PrimaryColumn()
  id: number;

  @Index()
  @Field(() => Int)
  @Column({ type: 'int' })
  sku: number;

  @Index()
  @Field(() => Int)
  @Column({ type: 'int' })
  sortIndex: number;

  @Index()
  @Field()
  @Column({ default: 'Untitled' })
  title: string;

  @Field()
  @Column({ default: 'No description provided.' })
  description: string;

  @Field()
  @Column('boolean', { default: false })
  isFeatured: boolean;

  @Field()
  @Column('boolean', { default: false })
  isLimitedEdition: boolean;

  @Field()
  @Column('boolean', { default: false })
  isHidden: boolean;

  @Field(() => Int)
  @Column('int', { default: 5 })
  @Min(1)
  @Max(10)
  rating: number;

  @Field(() => [String])
  @Column('simple-array', { default: 'PAPER,ALU' })
  printTypes: string[];

  @Field(() => Float)
  @Column('float')
  basePrice12: number;

  @Field(() => Float)
  @Column('float', { default: 1 })
  priceModifier12: number;

  @Field(() => Float)
  retailPrice12: number;

  @Field(() => Float)
  @Column('float')
  basePrice16: number;

  @Field(() => Float)
  @Column('float', { default: 1 })
  priceModifier16: number;

  @Field(() => Float)
  retailPrice16: number;

  @Field(() => Float)
  @Column('float')
  basePrice20: number;

  @Field(() => Float)
  @Column('float', { default: 1 })
  priceModifier20: number;

  @Field(() => Float)
  retailPrice20: number;

  @Field(() => Float)
  @Column('float')
  basePrice24: number;

  @Field(() => Float)
  @Column('float', { default: 1 })
  priceModifier24: number;

  @Field(() => Float)
  retailPrice24: number;

  @Field(() => Float)
  @Column('float')
  basePrice30: number;

  @Field(() => Float)
  @Column('float', { default: 1 })
  priceModifier30: number;

  @Field(() => Float)
  retailPrice30: number;

  @Field(() => Photographer, { nullable: true })
  @ManyToOne(() => Photographer, (photographer) => photographer.photos, {
    nullable: true,
  })
  @JoinColumn()
  photographer?: Photographer;

  @Field(() => Location, { nullable: true })
  @ManyToOne(() => Location, (location) => location.photos, { nullable: true })
  @JoinColumn()
  location?: Location;

  @Field(() => PhotoImage, {
    description:
      'Primary image for the photo with a maximum dimension of 1,400px, saved to .webp format and converted to .jpeg for email sharing.',
    nullable: true,
  })
  @OneToOne(() => PhotoImage, { nullable: true })
  @JoinColumn()
  photoImage?: PhotoImage;

  @Field(() => ShareImage, {
    description: 'A 1,200px x 630px image for sharing.',
    nullable: true,
  })
  @OneToOne(() => ShareImage, { nullable: true })
  @JoinColumn()
  shareImage?: ShareImage;

  @Field(() => [PhotoSubject], { nullable: true })
  @OneToMany(() => PhotoSubject, (ps) => ps.photo, { cascade: true })
  subjectsInPhoto: PhotoSubject[];

  @Field(() => [PhotoTag], { nullable: true })
  @OneToMany(() => PhotoTag, (ps) => ps.photo)
  tagsForPhoto: PhotoTag[];

  @Field(() => [PhotoCollection], { nullable: true })
  @OneToMany(() => PhotoCollection, (pc) => pc.photo)
  collectionsForPhoto: PhotoCollection[];

  @Field(() => [UserFavorite], { nullable: true })
  @OneToMany(() => UserFavorite, (fav) => fav.photo)
  favoritedByUsers: Promise<UserFavorite[]>;

  @Field(() => [Product], { nullable: true })
  @OneToMany(() => Product, (product) => product.photo)
  products?: Product[];

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @BeforeInsert()
  setSku() {
    this.sku = this.id + 1000;
  }

  @BeforeInsert()
  setSortIndex() {
    const siString = this.rating.toString() + this.sku.toString();
    this.sortIndex = parseInt(siString);
  }
}
