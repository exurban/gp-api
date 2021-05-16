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
import Tag from "./Tag";

@ObjectType()
@Entity({ name: "photo_tags" })
export default class PhotoTag extends BaseEntity {
  @Field(() => Tag)
  @PrimaryColumn()
  tagId: number;

  @Index()
  @Field(() => Tag)
  @ManyToOne(() => Tag, (tag) => tag.photosWithTag)
  @JoinColumn({ name: "tag_id" })
  tag: Tag;

  @Field(() => Photo)
  @PrimaryColumn()
  photoId: number;

  @Index()
  @Field(() => Photo)
  @ManyToOne(() => Photo, (photo) => photo.tagsForPhoto)
  @JoinColumn({ name: "photo_id" })
  photo: Photo;
}
