import User from '../../entities/User';
import UserFavorite from '../../entities/UserFavorite';
import Photo from '../../entities/Photo';
import SuccessMessageResponse from '../../abstract/SuccessMessageResponse';
import {
  Arg,
  Authorized,
  Ctx,
  Field,
  ID,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Repository } from 'typeorm';

interface Context {
  user: User;
}

@ObjectType()
class FavoritesResponse {
  @Field(() => [Photo], {
    nullable: true,
    description: "Returns list of Photo objects in user's favorites.",
  })
  photoList?: Photo[];
}

@ObjectType()
class AddPhotoToFavoritesResponse extends SuccessMessageResponse {
  @Field(() => ID, { nullable: true })
  addedPhotoWithId?: number;
}

@ObjectType()
class RemovePhotoFromFavoritesResponse extends SuccessMessageResponse {
  @Field(() => ID, { nullable: true })
  removedPhotoWithId?: number;
}

@Resolver(() => User)
export default class UserResolver {
  //* Repositories
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Photo) private photoRepository: Repository<Photo>,
    @InjectRepository(UserFavorite)
    private userFavoriteRepository: Repository<UserFavorite>
  ) {}

  // * GET USER FAVORITES
  @Authorized('USER')
  @Query(() => FavoritesResponse, {
    description: 'Returns all Photos favorited by the signed in User.',
  })
  async favorites(@Ctx() context: Context): Promise<FavoritesResponse> {
    const userId = context.user.id;

    if (!userId) {
      return {
        photoList: [],
      };
    }

    const favorites = await this.userFavoriteRepository.find({
      userId: userId,
    });

    const photoIds = favorites?.map((x) => x.photoId);
    let photos;

    if (photoIds.length > 0) {
      photos = await this.photoRepository
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.images', 'i')
        .leftJoinAndSelect('p.photographer', 'pg')
        .leftJoinAndSelect('p.location', 'l')
        .leftJoinAndSelect('p.subjectsInPhoto', 'ps')
        .leftJoinAndSelect('ps.subject', 's', 'ps.subjectId = s.id')
        .leftJoinAndSelect('p.tagsForPhoto', 'pt')
        .leftJoinAndSelect('pt.tag', 't', 'pt.tagId = t.id')
        .leftJoinAndSelect('p.collectionsForPhoto', 'pc')
        .leftJoinAndSelect('pc.collection', 'c', 'pc.collectionId = c.id')
        .where('p.id IN (:...photoIds)', { photoIds: photoIds })
        .getMany();
    }

    return { photoList: photos };
  }

  // * ADD
  @Authorized('USER')
  @Mutation(() => AddPhotoToFavoritesResponse)
  async addPhotoToFavorites(
    @Ctx() context: Context,
    @Arg('photoId') photoId: number
  ): Promise<AddPhotoToFavoritesResponse> {
    const userId = context.user.id;

    // * Check whether user favorite already exists, return if it does
    const userFavorite = await this.userFavoriteRepository.findOne({
      where: { userId: userId, photoId: photoId },
    });

    if (userFavorite) {
      return {
        success: false,
        message: `This photo is already in your favorites.`,
      };
    }

    //* get User and Photo
    const user = await this.userRepository.findOne(userId);

    const photo = await this.photoRepository.findOne(photoId);

    if (!user) {
      return {
        success: false,
        message: `failed to find user with id ${userId}`,
      };
    }

    if (!photo) {
      return {
        success: false,
        message: `failed to find photo with id ${photoId}`,
      };
    }

    const newItem = await this.userFavoriteRepository
      .create({
        userId: userId,
        photoId: photoId,
      })
      .save();

    if (newItem) {
      return {
        success: true,
        message: `Added ${photo.title} to favorites`,
        addedPhotoWithId: photoId,
      };
    }

    return {
      success: false,
      message: `Failed to add ${photo.title} to your favorites.`,
    };
  }

  // * REMOVE
  @Authorized('USER')
  @Mutation(() => RemovePhotoFromFavoritesResponse)
  async removePhotoFromFavorites(
    @Ctx() context: Context,
    @Arg('photoId') photoId: number
  ): Promise<RemovePhotoFromFavoritesResponse> {
    const userId = context.user.id;

    //* check to see whether UserFavorite already exists
    const userFavorite = await this.userFavoriteRepository.findOne({
      where: { userId: userId, photoId: photoId },
    });

    if (!userFavorite) {
      return {
        success: false,
        message: `Photo is not in your favorites.`,
      };
    }

    await this.userFavoriteRepository.remove(userFavorite);

    return {
      success: true,
      message: `Successfully removed photo from your favorites.`,
      removedPhotoWithId: photoId,
    };
  }
}
