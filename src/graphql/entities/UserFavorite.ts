import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import Photo from "./Photo";
import User from "./User";

/**
 * UserFavorites
 * Users <<-->> Photos
 */
@ObjectType()
@Entity({ name: "user_favorites" })
export default class UserFavorite extends BaseEntity {
  /**
   * User.favorites <-->> UserFavorite.userId
   */
  @Field(() => User)
  @PrimaryColumn()
  userId: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.userFavorites, { primary: true })
  @JoinColumn({ name: "user_id" })
  user: Promise<User>;

  /**
   * UserFavorites.photoId <<--> Photo.favoritedByUsers
   */
  @Field(() => Photo)
  @PrimaryColumn()
  photoId: number;

  @Field(() => Photo)
  @ManyToOne(() => Photo, (photo) => photo.favoritedByUsers, { primary: true })
  @JoinColumn({ name: "photo_id" })
  photo: Promise<Photo>;
}
