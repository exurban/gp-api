import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import Photo from "./Photo";
import Subject from "./Subject";

@ObjectType()
@Entity({ name: "photo_subjects" })
export default class PhotoSubject extends BaseEntity {
  @Field(() => Subject)
  @PrimaryColumn()
  subjectId: number;

  @Index()
  @Field(() => Subject)
  @ManyToOne(() => Subject, (subject) => subject.photosOfSubject)
  @JoinColumn({ name: "subject_id" })
  subject: Subject;

  @Field(() => Photo)
  @PrimaryColumn()
  photoId: number;

  @Index()
  @Field(() => Photo)
  @ManyToOne(() => Photo, (photo) => photo.subjectsInPhoto)
  @JoinColumn({ name: "photo_id" })
  photo: Photo;
}
