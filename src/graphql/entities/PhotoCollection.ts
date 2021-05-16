import {
  BaseEntity,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import Photo from "./Photo";
import Collection from "./Collection";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
@Entity({ name: "photo_collections" })
export default class PhotoCollection extends BaseEntity {
  /**
   * Collection.photosInCollection <-->> PhotoCollection.collectionId
   */
  @Field(() => Collection)
  @PrimaryColumn()
  collectionId: number;

  @Field(() => Collection)
  @ManyToOne(() => Collection, (collection) => collection.photosInCollection)
  @JoinColumn({ name: "collection_id" })
  collection: Collection;
  /**
   * PhotoCollection.photoId <<--> Photo.collectionsForPhoto
   */

  @Field(() => Photo)
  @PrimaryColumn()
  photoId: number;

  @Field(() => Photo)
  @ManyToOne(() => Photo, (photo) => photo.collectionsForPhoto)
  @JoinColumn({ name: "photo_id" })
  photo: Photo;
}
