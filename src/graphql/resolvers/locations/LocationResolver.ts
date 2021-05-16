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
import Location from '../../entities/Location';
import Photo from '../../entities/Photo';
import { SortDirection } from '../../abstract/Enum';
import SuccessMessageResponse from '../../abstract/SuccessMessageResponse';

//* Input Types
@InputType({
  description: 'Inputs to create a new Location entity.',
})
class AddLocationInput {
  @Field({ nullable: true })
  id?: number;

  @Field()
  sortIndex: number;

  @Field({
    description: 'Name of the location. Used in Photo Info links.',
  })
  name: string;

  @Field({
    nullable: true,
    description:
      'An optional string that can be used to refer to the location.',
  })
  tag?: string;

  @Field({
    nullable: true,
    description: 'A vignette used to introduce the location.',
  })
  description?: string;
}

@InputType({
  description: 'Optional inputs to be used to update the Location Info.',
})
class UpdateLocationInput {
  @Field({
    nullable: true,
    description: 'An index used to sort the locations.',
  })
  sortIndex?: number;

  @Field({
    nullable: true,
    description: 'Optional. Name of the location. Used in Photo Info links.',
  })
  name?: string;

  @Field({
    nullable: true,
    description:
      'An optional string that can be used to refer to the location.',
  })
  tag?: string;

  @Field({
    nullable: true,
    description: 'Optional. A vignette used to introduce the location.',
  })
  description?: string;
}

@InputType()
class LocationSearchSortInput {
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
class LocationsResponse {
  @Field(() => [Location])
  locations: Location[];
}

@InputType()
class SearchLocationsInput {
  @Field()
  searchString: string;
}

@ObjectType()
class SearchLocationsResponse {
  @Field(() => [Location])
  datalist: Location[];
}

// * ALL
@InputType()
class AllPhotosAtLocationInput {
  @Field({ nullable: true })
  id?: number;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  tag?: string;
}

@ObjectType()
class AllPhotosAtLocationResponse {
  @Field(() => Location)
  locationInfo: Location;

  @Field(() => Int)
  total: number;

  @Field(() => [Photo])
  photos: Photo[];
}

@ObjectType()
class AddLocationResponse extends SuccessMessageResponse {
  @Field(() => Location, { nullable: true })
  newLocation?: Location;
}

@ObjectType()
class UpdateLocationResponse extends SuccessMessageResponse {
  @Field(() => Location, { nullable: true })
  updatedLocation?: Location;
}

@Resolver(() => Location)
export default class LocationResolver {
  constructor(
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    @InjectRepository(Photo) private photoRepository: Repository<Photo>
  ) {}

  @FieldResolver()
  async countOfPhotos(@Root() location: Location): Promise<number> {
    return await this.photoRepository.count({
      where: { location: location },
    });
  }

  // * Queries - Location
  @Query(() => LocationsResponse, {
    description: 'Returns all Locations. Sortable and filterable.',
  })
  async locations(
    @Arg('input', () => LocationSearchSortInput) input: LocationSearchSortInput
  ): Promise<LocationsResponse> {
    const filter = input.filter || '';
    const orderString = `loc.${input.orderBy}` || 'name';
    const dir = input.direction || SortDirection.ASC;

    const loc = await this.locationRepository
      .createQueryBuilder('loc')
      .where('loc.name ilike :filter', { filter: `%${filter}%` })
      .orWhere('loc.description ilike :filter', { filter: `%${filter}%` })
      .orderBy(orderString, dir)
      .getMany();

    const response = { locations: loc };
    return response;
  }

  @Query(() => SearchLocationsResponse, {
    description: 'Search locations',
  })
  async searchLocations(
    @Arg('input', () => SearchLocationsInput) input: SearchLocationsInput
  ): Promise<SearchLocationsResponse> {
    const searchString = input.searchString;

    const locs = await this.locationRepository
      .createQueryBuilder('loc')
      .where('loc.name ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .where('loc.tag ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .orWhere('loc.description ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .getMany();

    const response = { datalist: locs };
    return response;
  }

  @Query(() => Location, { nullable: true })
  async location(
    @Arg('id', () => Int) id: number
  ): Promise<Location | undefined> {
    return await this.locationRepository.findOne(id);
  }

  @Query(() => Location, { nullable: true })
  async locationWithName(
    @Arg('name', () => String) name: string
  ): Promise<Location | undefined> {
    return await this.locationRepository.findOne({
      where: { name: name },
    });
  }

  // * Queries - ALL Photos at Location
  @Query(() => AllPhotosAtLocationResponse)
  async allPhotosAtLocation(
    @Arg('input', () => AllPhotosAtLocationInput)
    input: AllPhotosAtLocationInput
  ): Promise<AllPhotosAtLocationResponse | undefined> {
    let locationInfo;

    if (input.id) {
      locationInfo = await this.locationRepository
        .createQueryBuilder('l')
        .where('l.id = :id', { id: input.id })
        .getOne();
    } else if (input.name) {
      locationInfo = await this.locationRepository
        .createQueryBuilder('l')
        .where('l.name ilike :name', {
          name: `%${input.name}%`,
        })
        .getOne();
    } else if (input.tag) {
      locationInfo = await this.locationRepository
        .createQueryBuilder('l')
        .where('l.tag ilike :tag', {
          tag: `%${input.tag}%`,
        })
        .getOne();
    }

    if (!locationInfo) {
      return undefined;
    }

    const photos = await this.photoRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.location', 'l')
      .leftJoinAndSelect('p.photographer', 'pg')
      .leftJoinAndSelect('p.primaryImage', 'pi')
      .leftJoinAndSelect('p.shareImage', 'shi')
      .leftJoinAndSelect('p.subjectsInPhoto', 'ps')
      .leftJoinAndSelect('ps.subject', 's', 's.id = ps.subjectId')
      .leftJoinAndSelect('p.tagsForPhoto', 'pt')
      .leftJoinAndSelect('pt.tag', 't', 't.id = pt.tagId')
      .leftJoinAndSelect('p.collectionsForPhoto', 'pc')
      .leftJoinAndSelect('pc.collection', 'c', 'c.id = pc.collectionId')
      .where('p.location.id = :locationId', {
        locationId: locationInfo.id,
      })
      .andWhere('p.isHidden = false')
      .orderBy('p.sortIndex', 'DESC')
      .getMany();

    const total = photos.length;

    return {
      locationInfo,
      total,
      photos,
    };
  }

  //* Mutations
  @Authorized('ADMIN')
  @Mutation(() => AddLocationResponse)
  async addLocation(
    @Arg('input', () => AddLocationInput) input: AddLocationInput
  ): Promise<AddLocationResponse> {
    let maxId = 0;

    if (!input.id) {
      const highId = await this.locationRepository
        .createQueryBuilder('loc')
        .select('MAX(id)', 'max')
        .getRawOne();
      maxId = highId.max + 1;
    }
    input.id = input.id || maxId;

    const newLocation = await this.locationRepository.create(input);

    await this.locationRepository.insert(newLocation);
    await this.locationRepository.save(newLocation);

    return {
      success: true,
      message: `Successfully created new Location: ${input.name}`,
      newLocation: newLocation,
    };
  }

  @Authorized('ADMIN')
  @Mutation(() => UpdateLocationResponse)
  async updateLocation(
    @Arg('id', () => Int) id: number,
    @Arg('input', () => UpdateLocationInput) input: UpdateLocationInput
  ): Promise<UpdateLocationResponse> {
    const location = await this.locationRepository.findOne(id);
    if (!location) {
      return {
        success: false,
        message: `Couldn't find location with id: ${id}`,
      };
    }

    const updatedLocation = { ...location, ...input };

    const loc = await this.locationRepository.save(updatedLocation);

    return {
      success: true,
      message: `Successfully updated ${loc.name}`,
      updatedLocation: loc,
    };
  }

  @Authorized('ADMIN')
  @Mutation(() => Boolean)
  async deleteLocation(@Arg('id', () => Int) id: number): Promise<boolean> {
    const deleteResult = await this.locationRepository.delete({ id });
    if (deleteResult && deleteResult.affected != 0) {
      return true;
    }
    return false;
  }
}
