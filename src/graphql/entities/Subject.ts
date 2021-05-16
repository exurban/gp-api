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
import PhotoSubject from './PhotoSubject';

@ObjectType()
@Entity({ name: 'subjects' })
export default class Subject extends BaseEntity {
  @Index()
  @Field(() => ID)
  @PrimaryColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  sortIndex: number;

  @Index({ unique: true })
  @Field()
  @Column({ unique: true })
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field(() => [PhotoSubject], { nullable: true })
  @OneToMany(() => PhotoSubject, (ps) => ps.subject, { nullable: true })
  photosOfSubject?: Promise<PhotoSubject[]>;

  @Field(() => Int, {
    description: 'Count of photos of the subject on the site.',
  })
  countOfPhotos: number;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
