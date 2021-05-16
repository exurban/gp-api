import {
  Arg,
  Authorized,
  Field,
  FieldResolver,
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
import Collection from '../../entities/Collection';
import Photo from '../../entities/Photo';
import PhotoCollection from '../../entities/PhotoCollection';
import { SortDirection } from '../../abstract/Enum';
import SuccessMessageResponse from '../../abstract/SuccessMessageResponse';

//* Input Types
@InputType({
  description: 'Inputs to create a new Collection entity.',
})
class AddCollectionInput {
  @Field({ nullable: true })
  id?: number;

  @Field({
    description: 'Name of the collection. Used in Photo Info links.',
  })
  name: string;

  @Field({
    nullable: true,
    description: 'A vignette used to introduce the collection.',
  })
  description?: string;
}

@InputType({
  description: 'Optional inputs to be used to update the Collection Info.',
})
class UpdateCollectionInput {
  @Field({
    nullable: true,
    description: 'An index used to sort the collections.',
  })
  sortIndex?: number;

  @Field({
    nullable: true,
    description: 'Optional. Name of the collection. Used in Photo Info links.',
  })
  name?: string;

  @Field({
    nullable: true,
    description: 'Optional. A vignette used to introduce the collection.',
  })
  description?: string;
}

@InputType()
class CollectionSearchSortInput {
  @Field({ nullable: true })
  filter?: string;

  @Field({ nullable: true, defaultValue: 'name' })
  orderBy?: string;

  @Field(() => SortDirection, {
    nullable: true,
    defaultValue: SortDirection.ASC,
  })
  direction?: SortDirection;
}

@ObjectType()
class CollectionsResponse {
  @Field(() => [Collection])
  collections: Collection[];
}

@InputType()
class SearchCollectionsInput {
  @Field()
  searchString: string;
}

@ObjectType()
class SearchCollectionsResponse {
  @Field(() => [Collection])
  datalist: Collection[];
}

// * ALL
@InputType()
class AllPhotosInCollectionInput {
  @Field()
  name: string;
}

@ObjectType()
class AllPhotosInCollectionResponse {
  @Field(() => Collection)
  collectionInfo: Collection;

  @Field(() => Int)
  total: number;

  @Field(() => [Photo])
  photos: Photo[];
}

@ObjectType()
class AddCollectionResponse extends SuccessMessageResponse {
  @Field(() => Collection, { nullable: true })
  newCollection?: Collection;
}

@ObjectType()
class UpdateCollectionResponse extends SuccessMessageResponse {
  @Field(() => Collection, { nullable: true })
  updatedCollection?: Collection;
}

@Resolver(() => Collection)
export default class CollectionResolver {
  constructor(
    @InjectRepository(Collection)
    private collectionRepository: Repository<Collection>,
    @InjectRepository(Photo) private photoRepository: Repository<Photo>,
    @InjectRepository(PhotoCollection)
    private photoCollectionRepository: Repository<PhotoCollection>
  ) {}

  @FieldResolver()
  async countOfPhotos(@Root() collection: Collection): Promise<number> {
    return await this.photoCollectionRepository.count({
      collectionId: collection.id,
    });
  }

  // * Queries - Collection
  @Query(() => CollectionsResponse, {
    description: 'Returns all Collections. Sortable and filterable.',
  })
  async collections(
    @Arg('input', () => CollectionSearchSortInput)
    input: CollectionSearchSortInput
  ): Promise<CollectionsResponse> {
    const filter = input.filter || '';
    const orderString = `sbj.${input.orderBy}` || 'name';
    const dir = input.direction || SortDirection.ASC;

    const collection = await this.collectionRepository
      .createQueryBuilder('collection')
      .where('collection.name ilike :filter', { filter: `%${filter}%` })
      .orWhere('collection.description ilike :filter', {
        filter: `%${filter}%`,
      })
      .orderBy(orderString, dir)
      .getMany();

    const response = { collections: collection };
    return response;
  }

  @Query(() => SearchCollectionsResponse, {
    description: 'Search collections',
  })
  async searchCollections(
    @Arg('input', () => SearchCollectionsInput) input: SearchCollectionsInput
  ): Promise<SearchCollectionsResponse> {
    const searchString = input.searchString;

    const collection = await this.collectionRepository
      .createQueryBuilder('collection')
      .where('collection.name ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .orWhere('collection.description ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .getMany();

    const response = { datalist: collection };
    return response;
  }

  @Query(() => Collection, { nullable: true })
  async collection(
    @Arg('id', () => Int) id: number
  ): Promise<Collection | undefined> {
    return await this.collectionRepository.findOne(id);
  }

  @Query(() => Collection, { nullable: true })
  async collectionWithName(
    @Arg('name', () => String) name: string
  ): Promise<Collection | undefined> {
    return await this.collectionRepository.findOne({
      where: { name: name },
    });
  }

  // * Queries - ALL Photos of Collection
  @Query(() => AllPhotosInCollectionResponse)
  async allPhotosInCollection(
    @Arg('input', () => AllPhotosInCollectionInput)
    input: AllPhotosInCollectionInput
  ): Promise<AllPhotosInCollectionResponse | undefined> {
    const collectionInfo = await this.collectionRepository
      .createQueryBuilder('t')
      .where('t.name ilike :name', { name: `%${input.name}%` })
      .getOne();

    if (!collectionInfo) {
      return undefined;
    }

    const photosOfCollection = await this.photoCollectionRepository.find({
      where: { collectionId: collectionInfo.id },
    });
    const photoIds = photosOfCollection.map((pt) => pt.photoId);

    const total = photoIds.length;

    const photos = await this.photoRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.location', 'l')
      .leftJoinAndSelect('p.photographer', 'pg')
      .leftJoinAndSelect('p.photoImage', 'pi')
      .leftJoinAndSelect('p.shareImage', 'si')
      .leftJoinAndSelect('p.collectionsInPhoto', 'pt')
      .leftJoinAndSelect('pt.collection', 't', 't.id = pt.collectionId')
      .leftJoinAndSelect('p.subjectsInPhoto', 'ps')
      .leftJoinAndSelect('ps.subject', 's', 's.id = ps.subjectId')
      .leftJoinAndSelect('p.collectionsForPhoto', 'pc')
      .leftJoinAndSelect('pc.collection', 'c', 'c.id = pc.collectionId')
      .where('p.id IN (:...photoIds)', { photoIds: photoIds })
      .andWhere('p.isHidden = false')
      .orderBy('p.sortIndex', 'DESC')
      .getMany();

    return {
      collectionInfo,
      total,
      photos,
    };
  }

  //* Mutations
  @Authorized('ADMIN')
  @Mutation(() => AddCollectionResponse)
  async addCollection(
    @Arg('input', () => AddCollectionInput) input: AddCollectionInput
  ): Promise<AddCollectionResponse> {
    let maxId = 0;

    if (!input.id) {
      const highId = await this.collectionRepository
        .createQueryBuilder('collection')
        .select('MAX(id)', 'max')
        .getRawOne();
      maxId = highId.max + 1;
    }

    input.id = input.id || maxId;

    const newCollection = await this.collectionRepository.create(input);

    await this.collectionRepository.insert(newCollection);
    await this.collectionRepository.save(newCollection);

    return {
      success: true,
      message: `Successfully created new Collection: ${input.name}`,
      newCollection: newCollection,
    };
  }

  @Authorized('ADMIN')
  @Mutation(() => UpdateCollectionResponse)
  async updateCollection(
    @Arg('id', () => Int) id: number,
    @Arg('input', () => UpdateCollectionInput) input: UpdateCollectionInput
  ): Promise<UpdateCollectionResponse> {
    const collection = await this.collectionRepository.findOne(id);
    if (!collection) {
      return {
        success: false,
        message: `Couldn't find collection with id: ${id}`,
      };
    }

    const updatedCollection = { ...collection, ...input };

    const sbj = await this.collectionRepository.save(updatedCollection);

    return {
      success: true,
      message: `Successfully updated ${sbj.name}`,
      updatedCollection: sbj,
    };
  }

  @Authorized('ADMIN')
  @Mutation(() => Boolean)
  async deleteCollection(@Arg('id', () => Int) id: number): Promise<boolean> {
    const deleteResult = await this.collectionRepository.delete(id);
    if (deleteResult && deleteResult.affected != 0) {
      return true;
    }
    return false;
  }
}
