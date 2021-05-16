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
import Subject from '../../entities/Subject';
import Photo from '../../entities/Photo';
import PhotoSubject from '../../entities/PhotoSubject';
import { SortDirection } from '../../abstract/Enum';
import SuccessMessageResponse from '../../abstract/SuccessMessageResponse';

//* Input Types
@InputType({
  description: 'Inputs to create a new Subject entity.',
})
class AddSubjectInput {
  @Field({ nullable: true })
  id?: number;

  @Field({
    description: 'Name of the subject. Used in Photo Info links.',
  })
  name: string;

  @Field({
    nullable: true,
    description: 'A vignette used to introduce the subject.',
  })
  description?: string;

  @Field(() => Int, {
    nullable: true,
    description: 'A cover image to be displayed next to the opening vignette.',
  })
  coverImageId?: number;
}

@InputType({
  description: 'Optional inputs to be used to update the Subject Info.',
})
class UpdateSubjectInput {
  @Field({
    nullable: true,
    description: 'An index used to sort the subjects.',
  })
  sortIndex?: number;

  @Field({
    nullable: true,
    description: 'Optional. Name of the subject. Used in Photo Info links.',
  })
  name?: string;

  @Field({
    nullable: true,
    description: 'Optional. A vignette used to introduce the subject.',
  })
  description?: string;

  @Field({
    nullable: true,
    description:
      'Optional. A cover image to be displayed next to the opening vignette.',
  })
  coverImageId?: number;
}

@InputType()
class SubjectSearchSortInput {
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
class SubjectsResponse {
  @Field(() => [Subject])
  subjects: Subject[];
}

@InputType()
class SearchSubjectsInput {
  @Field()
  searchString: string;
}

@ObjectType()
class SearchSubjectsResponse {
  @Field(() => [Subject])
  datalist: Subject[];
}

// * ALL
@InputType()
class AllPhotosOfSubjectInput {
  @Field()
  name: string;
}

@ObjectType()
class AllPhotosOfSubjectResponse extends SuccessMessageResponse {
  @Field(() => Subject, { nullable: true })
  subjectInfo?: Subject;

  @Field(() => Int)
  total: number;

  @Field(() => [Photo])
  photos: Photo[];
}

@ObjectType()
class AddSubjectResponse extends SuccessMessageResponse {
  @Field(() => Subject, { nullable: true })
  newSubject?: Subject;
}

@ObjectType()
class UpdateSubjectResponse extends SuccessMessageResponse {
  @Field(() => Subject, { nullable: true })
  updatedSubject?: Subject;
}

@Resolver(() => Subject)
export default class SubjectResolver {
  constructor(
    @InjectRepository(Subject) private subjectRepository: Repository<Subject>,
    @InjectRepository(Photo) private photoRepository: Repository<Photo>,
    @InjectRepository(PhotoSubject)
    private photoSubjectRepository: Repository<PhotoSubject>
  ) {}

  @FieldResolver()
  async countOfPhotos(@Root() subject: Subject): Promise<number> {
    return await this.photoSubjectRepository.count({
      subjectId: subject.id,
    });
  }

  // * Queries - Subject
  @Query(() => SubjectsResponse, {
    description: 'Returns all Subjects. Sortable and filterable.',
  })
  async subjects(
    @Arg('input', () => SubjectSearchSortInput) input: SubjectSearchSortInput
  ): Promise<SubjectsResponse> {
    const filter = input.filter || '';
    const orderString = `sbj.${input.orderBy}` || 'name';
    const dir = input.direction || SortDirection.ASC;

    const sbj = await this.subjectRepository
      .createQueryBuilder('sbj')
      .where('sbj.name ilike :filter', { filter: `%${filter}%` })
      .orWhere('sbj.description ilike :filter', { filter: `%${filter}%` })
      .orderBy(orderString, dir)
      .getMany();

    const response = { subjects: sbj };
    return response;
  }

  @Query(() => SearchSubjectsResponse, {
    description: 'Search subjects.',
  })
  async searchSubjects(
    @Arg('input', () => SearchSubjectsInput) input: SearchSubjectsInput
  ): Promise<SearchSubjectsResponse> {
    const searchString = input.searchString;

    const subj = await this.subjectRepository
      .createQueryBuilder('subj')
      .where('subj.name ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .orWhere('subj.description ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .getMany();

    const response = { datalist: subj };
    return response;
  }

  @Query(() => Subject, { nullable: true })
  async subject(
    @Arg('id', () => Int) id: number
  ): Promise<Subject | undefined> {
    return await this.subjectRepository.findOne(id);
  }

  @Query(() => Subject, { nullable: true })
  async subjectWithName(
    @Arg('name', () => String) name: string
  ): Promise<Subject | undefined> {
    return await this.subjectRepository.findOne({
      where: { name: name },
    });
  }

  // * Queries - ALL Photos of Subject
  @Query(() => AllPhotosOfSubjectResponse)
  async allPhotosOfSubject(
    @Arg('input', () => AllPhotosOfSubjectInput)
    input: AllPhotosOfSubjectInput
  ): Promise<AllPhotosOfSubjectResponse> {
    const subjectInfo = await this.subjectRepository
      .createQueryBuilder('s')
      .where('s.name ilike :name', { name: `%${input.name}%` })
      .getOne();

    if (!subjectInfo) {
      return {
        success: false,
        message: `Failed to find subject: ${input.name}`,
        total: 0,
        photos: [],
      };
    }

    const photosOfSubject = await this.photoSubjectRepository.find({
      where: { subjectId: subjectInfo?.id },
    });
    const photoIds = photosOfSubject.map((ps) => ps.photoId);

    const total = photoIds.length;

    console.log(`Returning ${total} ${subjectInfo.name} photos`);

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
      .where('p.id IN (:...photoIds)', { photoIds: photoIds })
      .andWhere('p.isHidden = false')
      .orderBy('p.sortIndex', 'DESC')
      .getMany();

    return {
      success: true,
      message: `returning subject info + photos`,
      subjectInfo,
      total,
      photos,
    };
  }

  //* Mutations
  @Authorized('ADMIN')
  @Mutation(() => AddSubjectResponse)
  async addSubject(
    @Arg('input', () => AddSubjectInput) input: AddSubjectInput
  ): Promise<AddSubjectResponse> {
    let maxId = 0;

    if (!input.id) {
      const highId = await this.subjectRepository
        .createQueryBuilder('sbj')
        .select('MAX(id)', 'max')
        .getRawOne();
      maxId = highId.max + 1;
    }

    input.id = input.id || maxId;
    const newSubject = await this.subjectRepository.create(input);

    await this.subjectRepository.insert(newSubject);
    await this.subjectRepository.save(newSubject);

    return {
      success: true,
      message: `Successfully created new Subject: ${input.name}`,
      newSubject: newSubject,
    };
  }

  @Authorized('ADMIN')
  @Mutation(() => UpdateSubjectResponse)
  async updateSubject(
    @Arg('id', () => Int) id: number,
    @Arg('input', () => UpdateSubjectInput) input: UpdateSubjectInput
  ): Promise<UpdateSubjectResponse> {
    const subject = await this.subjectRepository.findOne(id);
    if (!subject) {
      return {
        success: false,
        message: `Couldn't find subject with id: ${id}`,
      };
    }

    const updatedSubject = { ...subject, ...input };

    const sbj = await this.subjectRepository.save(updatedSubject);

    return {
      success: true,
      message: `Successfully updated ${sbj.name}`,
      updatedSubject: sbj,
    };
  }

  @Authorized('ADMIN')
  @Mutation(() => Boolean)
  async deleteSubject(@Arg('id', () => Int) id: number): Promise<boolean> {
    const deleteResult = await this.subjectRepository.delete(id);
    if (deleteResult && deleteResult.affected != 0) {
      return true;
    }
    return false;
  }
}
