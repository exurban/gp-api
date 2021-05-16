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
import PhotoTag from './PhotoTag';

@ObjectType()
@Entity({ name: 'tags' })
export default class Tag extends BaseEntity {
  @Index()
  @Field(() => ID)
  @PrimaryColumn()
  id: number;

  @Field(() => Int)
  @Column({ unique: true })
  sortIndex: number;

  @Index({ unique: true })
  @Field({ description: 'The name of the tag.' })
  @Column({ unique: true })
  name: string;

  @Field({
    description:
      "Optional. A description of the tag used in connection with the vignette at the top of the Tag's photo page.",
  })
  @Column()
  description: string;

  @Field(() => [PhotoTag], {
    description:
      'A connection through a join table to the photos tagged with the tag.',
    nullable: true,
  })
  @OneToMany(() => PhotoTag, (pt) => pt.tag, { nullable: true })
  photosWithTag?: Promise<PhotoTag[]>;

  @Field(() => Int, {
    description: 'Count of photos of the tag on the site.',
  })
  countOfPhotos: number;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
