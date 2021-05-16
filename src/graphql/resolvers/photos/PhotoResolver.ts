import {
  Arg,
  Authorized,
  Field,
  FieldResolver,
  Float,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
} from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import Photo from '../../entities/Photo';
import PhotoImage from '../../entities/PhotoImage';
import ShareImage from '../../entities/ShareImage';
import Photographer from '../../entities/Photographer';
import Location from '../../entities/Location';
import PhotoSubject from '../../entities/PhotoSubject';
import PhotoTag from '../../entities/PhotoTag';
import PhotoCollection from '../../entities/PhotoCollection';
import SuccessMessageResponse from '../../abstract/SuccessMessageResponse';

//* Input Types
@InputType()
class AddPhotoInput {
  @Field({ nullable: true })
  id?: number;

  @Field({ nullable: true, defaultValue: 'Untitled' })
  title: string;

  @Field({ nullable: true, defaultValue: 'No description provided.' })
  description: string;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  isFeatured: boolean;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  isLimitedEdition: boolean;

  @Field(() => Int, { nullable: true, defaultValue: 5 })
  rating: number;

  @Field(() => Float, { defaultValue: 120.0 })
  basePrice12: number;

  @Field(() => Float, { defaultValue: 1 })
  priceModifier12: number;

  @Field(() => Float, { defaultValue: 140.0 })
  basePrice16: number;

  @Field(() => Float, { defaultValue: 1 })
  priceModifier16: number;

  @Field(() => Float, { defaultValue: 175.0 })
  basePrice20: number;

  @Field(() => Float, { defaultValue: 1 })
  priceModifier20: number;

  @Field(() => Float, { defaultValue: 230.0 })
  basePrice24: number;

  @Field(() => Float, { defaultValue: 1 })
  priceModifier24: number;

  @Field(() => Float, { defaultValue: 275.0 })
  basePrice30: number;

  @Field(() => Float, { defaultValue: 1 })
  priceModifier30: number;

  @Field(() => Int, { nullable: true })
  photographerId?: number;

  @Field(() => Int, { nullable: true })
  locationId?: number;

  @Field(() => [Int], { nullable: true })
  subjectIds?: number[];

  @Field(() => [Int], { nullable: true })
  tagIds?: number[];

  @Field(() => [Int], { nullable: true })
  collectionIds?: number[];

  @Field(() => Int, { nullable: true })
  photoImageId?: number;

  @Field(() => Int, { nullable: true })
  shareImageId?: number;
}

@InputType()
class UpdatePhotoInput {
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Boolean, { nullable: true })
  isHidden?: boolean;

  @Field(() => Boolean, { nullable: true })
  isFeatured?: boolean;

  @Field(() => Boolean, { nullable: true })
  isLimitedEdition?: boolean;

  @Field(() => Int, { nullable: true })
  rating?: number;

  @Field(() => Float, { nullable: true, defaultValue: 100.0 })
  basePrice12?: number;

  @Field(() => Float, { nullable: true, defaultValue: 1 })
  priceModifier12?: number;

  @Field(() => Float, { nullable: true, defaultValue: 140.0 })
  basePrice16?: number;

  @Field(() => Float, { nullable: true, defaultValue: 1 })
  priceModifier16?: number;

  @Field(() => Float, { nullable: true, defaultValue: 180.0 })
  basePrice20?: number;

  @Field(() => Float, { nullable: true, defaultValue: 1 })
  priceModifier20?: number;

  @Field(() => Float, { nullable: true, defaultValue: 230.0 })
  basePrice24?: number;

  @Field(() => Float, { nullable: true, defaultValue: 1 })
  priceModifier24?: number;

  @Field(() => Float, { nullable: true, defaultValue: 275.0 })
  basePrice30?: number;

  @Field(() => Float, { nullable: true, defaultValue: 1 })
  priceModifier30?: number;

  @Field(() => Int, { nullable: true })
  photoImageId?: number;

  @Field(() => Int, { nullable: true })
  shareImageId?: number;

  @Field(() => Int, { nullable: true })
  photographerId?: number;

  @Field(() => Int, { nullable: true })
  locationId?: number;

  @Field(() => [Int], { nullable: true })
  subjectIds?: number[];

  @Field(() => [Int], { nullable: true })
  tagIds?: number[];

  @Field(() => [Int], { nullable: true })
  collectionIds?: number[];
}

@InputType()
class SearchPhotosInput {
  @Field()
  searchString: string;
}

@ObjectType()
class SearchPhotosResponse {
  @Field(() => [Photo])
  datalist: Photo[];
}

@ObjectType()
class AddPhotoResponse extends SuccessMessageResponse {
  @Field(() => Photo, { nullable: true })
  newPhoto?: Photo;
}

@ObjectType()
class UpdatePhotoResponse extends SuccessMessageResponse {
  @Field(() => Photo, { nullable: true })
  updatedPhoto?: Photo;
}

// * ALL
@ObjectType()
class AllFeaturedPhotosResponse {
  @Field(() => Int)
  total: number;

  @Field(() => [Photo])
  photos: Photo[];
}

@Resolver(() => Photo)
export default class PhotoResolver {
  //* Repositories
  constructor(
    @InjectRepository(Photo) private photoRepository: Repository<Photo>,
    @InjectRepository(PhotoImage)
    private photoImageRepository: Repository<PhotoImage>,
    @InjectRepository(ShareImage)
    private shareImageRepository: Repository<ShareImage>,

    @InjectRepository(Photographer)
    private photographerRepository: Repository<Photographer>,
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,

    @InjectRepository(PhotoSubject)
    private photoSubjectRepository: Repository<PhotoSubject>,

    @InjectRepository(PhotoTag)
    private photoTagRepository: Repository<PhotoTag>,

    @InjectRepository(PhotoCollection)
    private photoCollectionRepository: Repository<PhotoCollection>
  ) {}

  @FieldResolver()
  retailPrice12(@Root() photo: Photo) {
    return photo.basePrice12 * photo.priceModifier12;
  }

  @FieldResolver()
  retailPrice16(@Root() photo: Photo) {
    return photo.basePrice16 * photo.priceModifier16;
  }

  @FieldResolver()
  retailPrice20(@Root() photo: Photo) {
    return photo.basePrice20 * photo.priceModifier20;
  }

  @FieldResolver()
  retailPrice24(@Root() photo: Photo) {
    return photo.basePrice24 * photo.priceModifier24;
  }

  @FieldResolver()
  retailPrice30(@Root() photo: Photo) {
    return photo.basePrice30 * photo.priceModifier30;
  }

  // * ALL FEATURED PHOTOS
  @Query(() => AllFeaturedPhotosResponse)
  async allFeaturedPhotos(): Promise<AllFeaturedPhotosResponse> {
    const total = await this.photoRepository.count({
      where: { isFeatured: true },
    });

    const photos = await this.photoRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.location', 'l')
      .leftJoinAndSelect('p.photographer', 'pg')
      .leftJoinAndSelect('p.photoImage', 'pi')
      .leftJoinAndSelect('p.shareImage', 'si')
      .leftJoinAndSelect('p.subjectsInPhoto', 'ps')
      .leftJoinAndSelect('ps.subject', 's', 'ps.subjectId = s.id')
      .leftJoinAndSelect('p.tagsForPhoto', 'pt')
      .leftJoinAndSelect('pt.tag', 't', 'pt.tagId = t.id')
      .leftJoinAndSelect('p.collectionsForPhoto', 'pc')
      .leftJoinAndSelect('pc.collection', 'c', 'pc.collectionId = c.id')
      .where('p.isFeatured = true')
      .andWhere('p.isHidden = false')
      .orderBy('p.sortIndex', 'DESC')
      .getMany();

    return {
      total,
      photos,
    };
  }

  @Query(() => SearchPhotosResponse, {
    description: 'Returns all Photos + all relations. Searchable.',
  })
  async searchPhotos(
    @Arg('input', () => SearchPhotosInput) input: SearchPhotosInput
  ): Promise<SearchPhotosResponse> {
    const searchString = input.searchString;

    const ps = await this.photoRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.location', 'l')
      .leftJoinAndSelect('p.photographer', 'pg')
      .leftJoinAndSelect('p.photoImage', 'pi')
      .leftJoinAndSelect('p.shareImage', 'si')
      .leftJoinAndSelect('p.subjectsInPhoto', 'ps')
      .leftJoinAndSelect('ps.subject', 's', 'ps.subjectId = s.id')
      .leftJoinAndSelect('p.tagsForPhoto', 'pt')
      .leftJoinAndSelect('pt.tag', 't', 'pt.tagId = t.id')
      .leftJoinAndSelect('p.collectionsForPhoto', 'pc')
      .leftJoinAndSelect('pc.collection', 'c', 'pc.collectionId = c.id')
      .where('p.title ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .orWhere('p.description ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .orWhere('s.name ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .orWhere('s.description ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .orWhere('t.name ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .orWhere('t.description ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .orWhere('c.name ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .orWhere('c.description ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .orWhere('l.name ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .orWhere('l.tag ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .orWhere('l.description ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .orWhere('pg.name ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .orWhere('pg.firstName ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .orWhere('pg.lastName ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .orWhere('pg.email ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .orWhere('pg.bio ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .orderBy('p.sku', 'DESC')
      .getMany();

    let intPs;

    if (parseInt(searchString)) {
      const searchInt = parseInt(searchString);

      console.log(searchInt);

      intPs = await this.photoRepository
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.location', 'l')
        .leftJoinAndSelect('p.photographer', 'pg')
        .leftJoinAndSelect('p.photoImage', 'pi')
        .leftJoinAndSelect('p.shareImage', 'si')
        .leftJoinAndSelect('p.subjectsInPhoto', 'ps')
        .leftJoinAndSelect('ps.subject', 's', 'ps.subjectId = s.id')
        .leftJoinAndSelect('p.tagsForPhoto', 'pt')
        .leftJoinAndSelect('pt.tag', 't', 'pt.tagId = t.id')
        .leftJoinAndSelect('p.collectionsForPhoto', 'pc')
        .leftJoinAndSelect('pc.collection', 'c', 'pc.collectionId = c.id')
        .where('p.sku = :searchInt', {
          searchInt: `${searchInt}`,
        })
        .orWhere('p.sortIndex = :searchInt', {
          searchInt: `${searchInt}`,
        })
        .orderBy('p.sku', 'DESC')
        .getMany();

      console.log(intPs);
      ps.concat(intPs);
    }

    let allPhotos;

    if (intPs) {
      allPhotos = ps.concat(intPs);
    } else {
      allPhotos = ps;
    }

    const response = { datalist: allPhotos };
    return response;
  }

  // * photo with id
  @Query(() => Photo, { nullable: true })
  async photo(@Arg('id', () => Int) id: number): Promise<Photo | undefined> {
    const photo = await this.photoRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.location', 'l')
      .leftJoinAndSelect('p.photographer', 'pg')
      .leftJoinAndSelect('p.photoImage', 'pi')
      .leftJoinAndSelect('p.shareImage', 'si')
      .leftJoinAndSelect('p.subjectsInPhoto', 'ps')
      .leftJoinAndSelect('ps.subject', 's', 'ps.subjectId = s.id')
      .leftJoinAndSelect('p.tagsForPhoto', 'pt')
      .leftJoinAndSelect('pt.tag', 't', 'pt.tagId = t.id')
      .leftJoinAndSelect('p.collectionsForPhoto', 'pc')
      .leftJoinAndSelect('pc.collection', 'c', 'pc.collectionId = c.id')
      .where('p.isHidden = false')
      .andWhere('p.id = :id', { id: id })
      .getOne();
    return photo;
  }

  //* photo with sku
  @Query(() => Photo)
  async photoWithSku(
    @Arg('sku', () => Int) sku: number
  ): Promise<Photo | undefined> {
    const photo = await this.photoRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.location', 'l')
      .leftJoinAndSelect('p.photographer', 'pg')
      .leftJoinAndSelect('p.photoImage', 'pi')
      .leftJoinAndSelect('p.shareImage', 'si')
      .leftJoinAndSelect('p.subjectsInPhoto', 'ps')
      .leftJoinAndSelect('ps.subject', 's', 's.id = ps.subjectId')
      .leftJoinAndSelect('p.tagsForPhoto', 'pt')
      .leftJoinAndSelect('pt.tag', 't', 't.id = pt.tagId')
      .leftJoinAndSelect('p.collectionsForPhoto', 'pc')
      .leftJoinAndSelect('pc.collection', 'c', 'c.id = pc.collectionId')
      .where('p.sku = :sku', { sku: sku })

      .getOne();
    return photo;
  }

  // * Mutations

  // * add photo
  @Authorized('ADMIN')
  @Mutation(() => AddPhotoResponse)
  async addPhoto(
    @Arg('input', () => AddPhotoInput) input: AddPhotoInput
  ): Promise<AddPhotoResponse> {
    let maxId = 0;

    if (!input.id) {
      const highId = await this.photoRepository
        .createQueryBuilder('photo')
        .select('MAX(id)', 'max')
        .getRawOne();
      maxId = highId.max + 1;
    }

    input.id = input.id || maxId;

    const newPhoto = this.photoRepository.create(input);

    console.log({ newPhoto });

    await this.photoRepository.insert(newPhoto);
    // await this.photoRepository.save(newPhoto);

    if (input.photoImageId) {
      const img = await this.photoImageRepository.findOne({
        id: input.photoImageId,
      });
      if (!img) {
        return {
          success: false,
          message: `Failed to find image with id ${input.photoImageId}`,
        };
      }
      newPhoto.photoImage = img;
    }

    if (input.shareImageId) {
      const img = await this.shareImageRepository.findOne({
        id: input.shareImageId,
      });
      if (!img) {
        return {
          success: false,
          message: `Failed to find image with id ${input.shareImageId}`,
        };
      }
      newPhoto.shareImage = img;
    }

    if (input.photographerId) {
      const pg = await this.photographerRepository.findOne(
        input.photographerId
      );
      newPhoto.photographer = pg;
    }

    if (input.locationId) {
      const loc = await this.locationRepository.findOne(input.locationId);
      newPhoto.location = loc;
    }

    // * subjects
    if (input.subjectIds) {
      const newPhotoSubjects: PhotoSubject[] = [];
      for await (const subjectId of input.subjectIds) {
        const newPhotoSubject = await this.photoSubjectRepository.create({
          photoId: newPhoto.id,
          subjectId: subjectId,
        });
        console.log({ newPhotoSubject });
        newPhotoSubjects.push(newPhotoSubject);
      }

      await this.photoSubjectRepository.save(newPhotoSubjects);
      newPhoto.subjectsInPhoto = newPhotoSubjects;
    }

    // // * tags
    // if (input.tagIds) {
    //   const newPhotoTags: PhotoTag[] = [];
    //   for await (const tagId of input.tagIds) {
    //     const newPhotoTag = await this.photoTagRepository.create({
    //       photoId: newPhoto.id,
    //       tagId: tagId,
    //     });
    //     newPhotoTags.push(newPhotoTag);
    //   }

    //   await this.photoTagRepository.save(newPhotoTags);
    //   newPhoto.tagsForPhoto = newPhotoTags;
    // }

    // // * collections
    // if (input.collectionIds) {
    //   const newPhotoCollections: PhotoCollection[] = [];
    //   for await (const collectionId of input.collectionIds) {
    //     const newPhotoCollection = await this.photoCollectionRepository.create({
    //       photoId: newPhoto.id,
    //       collectionId: collectionId,
    //     });
    //     newPhotoCollections.push(newPhotoCollection);
    //   }

    //   await this.photoCollectionRepository.save(newPhotoCollections);
    //   newPhoto.collectionsForPhoto = newPhotoCollections;
    // }

    // await this.photoRepository.insert(newPhoto);
    await this.photoRepository.save(newPhoto);

    const photo = await this.photoWithSku(newPhoto.sku);

    return {
      success: true,
      message: `Successfully created new photo.`,
      newPhoto: photo,
    };
  }

  // * update photo
  @Authorized('ADMIN')
  @Mutation(() => UpdatePhotoResponse)
  async updatePhoto(
    @Arg('id', () => Int) id: number,
    @Arg('input', () => UpdatePhotoInput) input: UpdatePhotoInput
  ): Promise<UpdatePhotoResponse> {
    let photo = await this.photoRepository.findOne(id);

    if (!photo) {
      return {
        success: false,
        message: `Photo with id ${id} does not exist.`,
      };
    }

    photo.title = input.title || photo.title;
    photo.description = input.description || photo.description;
    photo.isFeatured =
      input.isFeatured != null ? input.isFeatured : photo.isFeatured;
    photo.isLimitedEdition =
      input.isLimitedEdition != null
        ? input.isLimitedEdition
        : photo.isLimitedEdition;
    photo.isHidden = input.isHidden != null ? input.isHidden : photo.isHidden;
    photo.rating = input.rating != null ? input.rating : photo.rating;
    photo.basePrice12 =
      input.basePrice12 != null ? input.basePrice12 : photo.basePrice12;
    photo.priceModifier12 =
      input.priceModifier12 != null
        ? input.priceModifier12
        : photo.priceModifier12;
    photo.basePrice16 =
      input.basePrice16 != null ? input.basePrice16 : photo.basePrice16;
    photo.priceModifier16 =
      input.priceModifier16 != null
        ? input.priceModifier16
        : photo.priceModifier16;
    photo.basePrice20 =
      input.basePrice20 != null ? input.basePrice20 : photo.basePrice20;
    photo.priceModifier20 =
      input.priceModifier20 != null
        ? input.priceModifier20
        : photo.priceModifier20;
    photo.basePrice24 =
      input.basePrice24 != null ? input.basePrice24 : photo.basePrice24;
    photo.priceModifier24 =
      input.priceModifier24 != null
        ? input.priceModifier24
        : photo.priceModifier24;
    photo.basePrice30 =
      input.basePrice30 != null ? input.basePrice30 : photo.basePrice30;
    photo.priceModifier30 =
      input.priceModifier30 != null
        ? input.priceModifier30
        : photo.priceModifier30;
    photo.sortIndex = input.rating
      ? parseInt(input.rating.toString() + photo.sku.toString())
      : photo.sortIndex;

    if (input.photoImageId) {
      const img = await this.photoImageRepository.findOne({
        id: input.photoImageId,
      });
      if (!img) {
        return {
          success: false,
          message: `Failed to find image with id ${input.photoImageId}`,
        };
      }
      photo.photoImage = img;
    }

    if (input.shareImageId) {
      const img = await this.shareImageRepository.findOne({
        id: input.shareImageId,
      });
      if (!img) {
        return {
          success: false,
          message: `Failed to find image with id ${input.shareImageId}`,
        };
      }
      photo.shareImage = img;
    }

    if (input.photographerId) {
      const pg = await this.photographerRepository.findOne({
        id: input.photographerId,
      });
      photo.photographer = pg;
    }

    if (input.locationId) {
      const loc = await this.locationRepository.findOne({
        id: input.locationId,
      });
      if (loc) {
        photo.location = loc;
      }
    }

    // * subjects
    if (input.subjectIds) {
      // use photo.id to find all existing entries and remove them
      const photoSubjectsToDelete = await this.photoSubjectRepository.find({
        where: { photoId: photo.id },
      });
      await this.photoSubjectRepository.remove(photoSubjectsToDelete);

      const newPhotoSubjects: PhotoSubject[] = [];
      for await (const subjectId of input.subjectIds) {
        const newPhotoSubject = await this.photoSubjectRepository.create({
          photoId: photo.id,
          subjectId: subjectId,
        });
        newPhotoSubjects.push(newPhotoSubject);
      }

      await this.photoSubjectRepository.save(newPhotoSubjects);
      photo.subjectsInPhoto = newPhotoSubjects;
    }

    // * tags
    if (input.tagIds) {
      // use photo.id to find all existing entries and remove them
      const photoTagsToDelete = await this.photoTagRepository.find({
        where: { photoId: photo.id },
      });
      await this.photoTagRepository.remove(photoTagsToDelete);

      const newPhotoTags: PhotoTag[] = [];
      for await (const tagId of input.tagIds) {
        const newPhotoTag = await this.photoTagRepository.create({
          photoId: photo.id,
          tagId: tagId,
        });
        newPhotoTags.push(newPhotoTag);
      }

      await this.photoTagRepository.save(newPhotoTags);
      photo.tagsForPhoto = newPhotoTags;
    }

    // * collections
    if (input.collectionIds) {
      // use photo.id to find all existing entries and remove them
      const photoCollectionsToDelete = await this.photoCollectionRepository.find(
        {
          where: { photoId: photo.id },
        }
      );
      await this.photoCollectionRepository.remove(photoCollectionsToDelete);

      const newPhotoCollections: PhotoCollection[] = [];
      for await (const collectionId of input.collectionIds) {
        const newPhotoCollection = await this.photoCollectionRepository.create({
          photoId: photo.id,
          collectionId: collectionId,
        });
        newPhotoCollections.push(newPhotoCollection);
      }

      await this.photoCollectionRepository.save(newPhotoCollections);
      photo.collectionsForPhoto = newPhotoCollections;
    }

    photo = await photo.save();

    // console.log(`Updated photo is ${JSON.stringify(photo, null, 2)}`);

    const updatedPhoto = await this.photoWithSku(photo.sku);

    return {
      success: true,
      message: `Successfully updated photo ${photo.sku}.`,
      updatedPhoto: updatedPhoto,
    };
  }

  //! when deleting Photo, also need to delete from:
  /**-PhotoCollection
   * - UserFavorites
   * - UserShoppingBagItems
   * - PhotoSubject
   * - PhotoTag
   */
  @Authorized('ADMIN')
  @Mutation(() => Boolean)
  async deletePhoto(@Arg('id', () => Int) id: number): Promise<boolean> {
    let result = true;

    // remove photo from Collections
    await this.photoCollectionRepository.delete({ photoId: id });

    const deleteResult = await this.photoRepository.delete({ id });
    if (!deleteResult || deleteResult.affected == 0) {
      result = false;
      throw new Error(`Failed to delete photo.`);
    }
    return result;
  }
}
