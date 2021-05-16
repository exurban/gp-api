import { Field, ID, Int, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import PhotoCollection from './PhotoCollection';

@ObjectType()
@Entity({ name: 'collections' })
export default class Collection extends BaseEntity {
  @Index()
  @Field(() => ID)
  @PrimaryColumn()
  id: number;

  @Index({ unique: true })
  @Field()
  @Column({ unique: true })
  name: string;

  @Field()
  @Column({ unique: true })
  tag: string;

  @Field()
  @Column()
  description: string;

  @Field(() => [PhotoCollection], { nullable: true })
  @OneToMany(() => PhotoCollection, (pc) => pc.collection, { nullable: true })
  photosInCollection?: Promise<PhotoCollection[]>;

  @Field(() => Int, {
    description: 'Count of photos in the collection.',
  })
  countOfPhotos: number;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
