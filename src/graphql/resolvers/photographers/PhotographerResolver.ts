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
import Photographer from '../../entities/Photographer';
import Photo from '../../entities/Photo';
import ProductImage from '../../entities/ProductImage';
import SuccessMessageResponse from '../../abstract/SuccessMessageResponse';

//* Input Types
@InputType({
  description: 'Inputs to create a new Photographer entity.',
})
class AddPhotographerInput {
  @Field({ nullable: true })
  id?: number;

  @Field({ description: "Photographer's full name." })
  name: string;

  @Field({ description: "Photographer's first name." })
  firstName: string;

  @Field({ description: "Photographer's last name." })
  lastName: string;

  @Field({ description: "Photographer's email address." })
  email: string;

  @Field(() => String, {
    description:
      "Short biography for Photographer. Displayed at the top of the Photographer's photo gallery.",
  })
  bio: string;

  @Field(() => Int, {
    description: 'id for cover image.',
    nullable: true,
  })
  coverImageId?: number;
}

@InputType({
  description: 'Inputs to update a Photographer entity.',
})
class UpdatePhotographerInput {
  @Field({
    nullable: true,
    description: "Optional: Photographer's full name.",
  })
  name?: string;

  @Field({
    nullable: true,
    description: "Optional: Photographer's first name.",
  })
  firstName?: string;

  @Field({ nullable: true, description: "Optional: Photographer's last name." })
  lastName?: string;

  @Field({
    nullable: true,
    description: "Optional: Photographer's email address.",
  })
  email?: string;

  @Field(() => String, {
    nullable: true,
    description:
      "Optional: Short biography for Photographer. Displayed at the top of the Photographer's photo gallery.",
  })
  bio?: string;

  @Field(() => Int, {
    description: 'id for cover image.',
    nullable: true,
  })
  coverImageId?: number;
}

@InputType()
class SearchPhotographersInput {
  @Field()
  searchString: string;
}

@ObjectType()
class SearchPhotographersResponse {
  @Field(() => [Photographer])
  datalist: Photographer[];
}

@ObjectType()
class PhotographersResponse {
  @Field(() => [Photographer])
  photographers: Photographer[];
}

// * ALL
@InputType()
class AllPhotosByPhotographerInput {
  @Field({ nullable: true })
  id?: number;

  @Field({ nullable: true })
  name?: string;
}

@ObjectType()
class AllPhotosByPhotographerResponse {
  @Field(() => Photographer)
  photographerInfo: Photographer;

  @Field(() => Int)
  total: number;

  @Field(() => [Photo])
  photos: Photo[];
}

@ObjectType()
class AddPhotographerResponse extends SuccessMessageResponse {
  @Field(() => Photographer, { nullable: true })
  newPhotographer?: Photographer;
}

@ObjectType()
class UpdatePhotographerResponse extends SuccessMessageResponse {
  @Field(() => Photographer, { nullable: true })
  updatedPhotographer?: Photographer;
}

@Resolver(() => Photographer)
export default class PhotographerResolver {
  //* Repositories
  constructor(
    @InjectRepository(Photographer)
    private photographerRepository: Repository<Photographer>,
    @InjectRepository(Photo) private photoRepository: Repository<Photo>,
    @InjectRepository(ProductImage)
    private productImageRepository: Repository<ProductImage>
  ) {}

  @FieldResolver()
  async countOfPhotos(@Root() photographer: Photographer): Promise<number> {
    return await this.photoRepository.count({
      where: { photographer: photographer },
    });
  }

  // * Queries - Photographer
  @Query(() => SearchPhotographersResponse, {
    description:
      'Returns all Photographers + portraits, only. Meant to be used on the backend.',
  })
  async searchPhotographers(
    @Arg('input', () => SearchPhotographersInput)
    input: SearchPhotographersInput
  ): Promise<SearchPhotographersResponse> {
    const searchString = input.searchString;

    const pg = await this.photographerRepository
      .createQueryBuilder('pg')
      .leftJoinAndSelect('pg.coverImage', 'ci')
      .where('pg.name ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .orWhere('pg.email ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .orWhere('pg.bio ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .getMany();

    const response = { datalist: pg };
    return response;
  }

  @Query(() => PhotographersResponse, {
    description:
      'Returns all Photographers + portraits, only. Meant to be used on the backend.',
  })
  async sortedPhotographers(
    @Arg('filter', () => String) filter: string,
    @Arg('orderBy', () => String) orderBy: string,
    @Arg('asc', () => Boolean) asc: boolean
  ): Promise<PhotographersResponse> {
    const dir = asc ? 'ASC' : 'DESC';
    const orderString = `pg.${orderBy}`;
    console.log(`ORDER BY: ${orderString}\nFILTER:${filter}`);

    const pg = await this.photographerRepository
      .createQueryBuilder('pg')
      .leftJoinAndSelect('pg.coverImage', 'ci')
      .where('pg.name ilike :filter', { filter: `%${filter}%` })
      .orWhere('pg.email ilike :filter', { filter: `%${filter}%` })
      .orWhere('pg.bio ilike :filter', { filter: `%${filter}%` })
      .orderBy(orderString, dir)
      .getMany();

    const resp = { photographers: pg };
    return resp;
  }

  @Query(() => Photographer, {
    nullable: true,
    description:
      'Returns one Photographer + portrait, only or null, if no matching id is found. Meant to be used on the backend.',
  })
  async photographer(@Arg('id', () => Int) id: number) {
    console.log(`fetching photographer.`);
    return this.photographerRepository.findOne(id, {
      relations: ['coverImage'],
    });
  }

  // * photographerWithName:()
  @Query(() => Photographer, {
    nullable: true,
    description:
      "Returns one Photographer + portrait AND Photographer's Photos and related data. Meant to be used on the frontend. Used for the Photographer's Gallery.",
  })
  async photographerWithName(@Arg('name', () => String) name: string) {
    const photographer = await this.photographerRepository
      .createQueryBuilder('pg')
      .leftJoinAndSelect('pg.coverImage', 'img')
      .where('pg.name ilike :name', { name: `%${name}%` })
      .getOne();
    return photographer;
  }

  // * All Photos by Photographer
  @Query(() => AllPhotosByPhotographerResponse)
  async allPhotosByPhotographer(
    @Arg('input', () => AllPhotosByPhotographerInput)
    input: AllPhotosByPhotographerInput
  ): Promise<AllPhotosByPhotographerResponse | undefined> {
    let photographerInfo;
    if (input.id) {
      photographerInfo = await this.photographerRepository
        .createQueryBuilder('pg')
        .where('pg.id = :id', { id: input.id })
        .getOne();
    } else if (input.name) {
      photographerInfo = await this.photographerRepository
        .createQueryBuilder('pg')
        .where('pg.name ilike :name', {
          name: `%${input.name}%`,
        })
        .getOne();
    }

    if (!photographerInfo) {
      return undefined;
    }

    const photos = await this.photoRepository
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
      .where('p.photographer.id = :photographerId', {
        photographerId: photographerInfo.id,
      })
      .orderBy('p.sortIndex', 'DESC')
      .getMany();

    const total = photos.length;

    return {
      photographerInfo,
      total,
      photos,
    };
  }

  // * Add Photographer
  @Authorized('ADMIN')
  @Mutation(() => AddPhotographerResponse)
  async addPhotographer(
    @Arg('input', () => AddPhotographerInput)
    input: AddPhotographerInput
  ): Promise<AddPhotographerResponse> {
    let maxId = 0;

    if (!input.id) {
      const highId = await this.photographerRepository
        .createQueryBuilder('pg')
        .select('MAX(id)', 'max')
        .getRawOne();
      maxId = highId.max + 1;
    }

    input.id = input.id || maxId;

    const newPhotographer = await this.photographerRepository.create(input);
    if (input.coverImageId) {
      const imageId = input.coverImageId;
      const coverImage = await this.productImageRepository.findOne(imageId);
      newPhotographer.coverImage = coverImage;
    }
    await this.photographerRepository.insert(newPhotographer);
    await this.photographerRepository.save(newPhotographer);

    return {
      success: true,
      message: `Successfully created new Photographer: ${input.name}`,
      newPhotographer: newPhotographer,
    };
  }

  // * Update Photographer
  @Authorized('ADMIN')
  @Mutation(() => UpdatePhotographerResponse)
  async updatePhotographer(
    @Arg('id', () => Int) id: number,
    @Arg('input', () => UpdatePhotographerInput) input: UpdatePhotographerInput
  ): Promise<UpdatePhotographerResponse> {
    const photographer = await this.photographerRepository.findOne({ id });
    if (!photographer) {
      return {
        success: false,
        message: `Couldn't find photographer with id: ${id}`,
      };
    }

    const updatedPhotographer = { ...photographer, ...input };
    if (input.coverImageId) {
      const imageId = input.coverImageId;
      const coverImage = await this.productImageRepository.findOne(imageId);
      updatedPhotographer.coverImage = coverImage;
    }
    const pg = await this.photographerRepository.save(updatedPhotographer);

    return {
      success: true,
      message: `Successfully updated ${pg.name}`,
      updatedPhotographer: pg,
    };
  }

  // * Delete Photographer
  @Authorized('ADMIN')
  @Mutation(() => Boolean)
  async deletePhotographer(@Arg('id', () => Int) id: number): Promise<boolean> {
    const deleteResult = await this.photographerRepository.delete({ id });
    if (deleteResult && deleteResult.affected != 0) {
      return true;
    }
    return false;
  }
}
