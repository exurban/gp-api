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
import Tag from '../../entities/Tag';
import Photo from '../../entities/Photo';
import PhotoTag from '../../entities/PhotoTag';
import { SortDirection } from '../../abstract/Enum';
import SuccessMessageResponse from '../../abstract/SuccessMessageResponse';

//* Input Types
@InputType({
  description: 'Inputs to create a new Tag entity.',
})
class AddTagInput {
  @Field({ nullable: true })
  id?: number;

  @Field({
    description: 'Name of the tag. Used in Photo Info links.',
  })
  name: string;

  @Field({
    nullable: true,
    description: 'A vignette used to introduce the tag.',
  })
  description?: string;
}

@InputType({
  description: 'Optional inputs to be used to update the Tag Info.',
})
class UpdateTagInput {
  @Field({
    nullable: true,
    description: 'An index used to sort the tags.',
  })
  sortIndex?: number;

  @Field({
    nullable: true,
    description: 'Optional. Name of the tag. Used in Photo Info links.',
  })
  name?: string;

  @Field({
    nullable: true,
    description: 'Optional. A vignette used to introduce the tag.',
  })
  description?: string;
}

@InputType()
class TagSearchSortInput {
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
class TagsResponse {
  @Field(() => [Tag])
  tags: Tag[];
}

@InputType()
class SearchTagsInput {
  @Field()
  searchString: string;
}

@ObjectType()
class SearchTagsResponse {
  @Field(() => [Tag])
  datalist: Tag[];
}

// * ALL
@InputType()
class AllPhotosWithTagInput {
  @Field()
  name: string;
}

@ObjectType()
class AllPhotosWithTagResponse {
  @Field(() => Tag)
  tagInfo: Tag;

  @Field(() => Int)
  total: number;

  @Field(() => [Photo])
  photos: Photo[];
}

@ObjectType()
class AddTagResponse extends SuccessMessageResponse {
  @Field(() => Tag, { nullable: true })
  newTag?: Tag;
}

@ObjectType()
class UpdateTagResponse extends SuccessMessageResponse {
  @Field(() => Tag, { nullable: true })
  updatedTag?: Tag;
}

@Resolver(() => Tag)
export default class TagResolver {
  constructor(
    @InjectRepository(Tag) private tagRepository: Repository<Tag>,
    @InjectRepository(Photo) private photoRepository: Repository<Photo>,
    @InjectRepository(PhotoTag)
    private photoTagRepository: Repository<PhotoTag>
  ) {}

  @FieldResolver()
  async countOfPhotos(@Root() tag: Tag): Promise<number> {
    return await this.photoTagRepository.count({
      tagId: tag.id,
    });
  }

  // * Queries - Tag
  @Query(() => TagsResponse, {
    description: 'Returns all Tags. Sortable and filterable.',
  })
  async tags(
    @Arg('input', () => TagSearchSortInput) input: TagSearchSortInput
  ): Promise<TagsResponse> {
    const filter = input.filter || '';
    const orderString = `sbj.${input.orderBy}` || 'name';
    const dir = input.direction || SortDirection.ASC;

    const tag = await this.tagRepository
      .createQueryBuilder('tag')
      .where('tag.name ilike :filter', { filter: `%${filter}%` })
      .orWhere('tag.description ilike :filter', { filter: `%${filter}%` })
      .orderBy(orderString, dir)
      .getMany();

    const response = { tags: tag };
    return response;
  }

  @Query(() => SearchTagsResponse, {
    description: 'Search tags',
  })
  async searchTags(
    @Arg('input', () => SearchTagsInput) input: SearchTagsInput
  ): Promise<SearchTagsResponse> {
    const searchString = input.searchString;

    const tag = await this.tagRepository
      .createQueryBuilder('tag')
      .where('tag.name ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .orWhere('tag.description ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .getMany();

    const response = { datalist: tag };
    return response;
  }

  @Query(() => Tag, { nullable: true })
  async tag(@Arg('id', () => Int) id: number): Promise<Tag | undefined> {
    return await this.tagRepository.findOne(id);
  }

  @Query(() => Tag, { nullable: true })
  async tagWithName(
    @Arg('name', () => String) name: string
  ): Promise<Tag | undefined> {
    return await this.tagRepository.findOne({
      where: { name: name },
    });
  }

  // * Queries - ALL Photos of Tag
  @Query(() => AllPhotosWithTagResponse)
  async allPhotosWithTag(
    @Arg('input', () => AllPhotosWithTagInput)
    input: AllPhotosWithTagInput
  ): Promise<AllPhotosWithTagResponse | undefined> {
    const tagInfo = await this.tagRepository
      .createQueryBuilder('t')
      .where('t.name ilike :name', { name: `%${input.name}%` })
      .getOne();

    if (!tagInfo) {
      return undefined;
    }

    const photosOfTag = await this.photoTagRepository.find({
      where: { tagId: tagInfo.id },
    });
    const photoIds = photosOfTag.map((pt) => pt.photoId);

    const total = photoIds.length;

    const photos = await this.photoRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.location', 'l')
      .leftJoinAndSelect('p.photographer', 'pg')
      .leftJoinAndSelect('p.photoImage', 'pi')
      .leftJoinAndSelect('p.shareImage', 'si')
      .leftJoinAndSelect('p.tagsInPhoto', 'pt')
      .leftJoinAndSelect('pt.tag', 't', 't.id = pt.tagId')
      .leftJoinAndSelect('p.subjectsInPhoto', 'ps')
      .leftJoinAndSelect('ps.subject', 's', 's.id = ps.subjectId')
      .leftJoinAndSelect('p.collectionsForPhoto', 'pc')
      .leftJoinAndSelect('pc.collection', 'c', 'c.id = pc.collectionId')
      .where('p.id IN (:...photoIds)', { photoIds: photoIds })
      .andWhere('p.isHidden = false')
      .orderBy('p.sortIndex', 'DESC')
      .getMany();

    return {
      tagInfo,
      total,
      photos,
    };
  }

  //* Mutations
  @Authorized('ADMIN')
  @Mutation(() => AddTagResponse)
  async addTag(
    @Arg('input', () => AddTagInput) input: AddTagInput
  ): Promise<AddTagResponse> {
    let maxId = 0;

    if (!input.id) {
      const highId = await this.tagRepository
        .createQueryBuilder('tag')
        .select('MAX(id)', 'max')
        .getRawOne();
      maxId = highId.max + 1;
    }

    input.id = input.id || maxId;

    const newTag = await this.tagRepository.create(input);

    await this.tagRepository.insert(newTag);
    await this.tagRepository.save(newTag);

    return {
      success: true,
      message: `Successfully created new Tag: ${input.name}`,
      newTag: newTag,
    };
  }

  @Authorized('ADMIN')
  @Mutation(() => UpdateTagResponse)
  async updateTag(
    @Arg('id', () => Int) id: number,
    @Arg('input', () => UpdateTagInput) input: UpdateTagInput
  ): Promise<UpdateTagResponse> {
    const tag = await this.tagRepository.findOne(id);
    if (!tag) {
      return {
        success: false,
        message: `Couldn't find tag with id: ${id}`,
      };
    }

    const updatedTag = { ...tag, ...input };

    const sbj = await this.tagRepository.save(updatedTag);

    return {
      success: true,
      message: `Successfully updated ${sbj.name}`,
      updatedTag: sbj,
    };
  }

  @Authorized('ADMIN')
  @Mutation(() => Boolean)
  async deleteTag(@Arg('id', () => Int) id: number): Promise<boolean> {
    const deleteResult = await this.tagRepository.delete(id);
    if (deleteResult && deleteResult.affected != 0) {
      return true;
    }
    return false;
  }
}
