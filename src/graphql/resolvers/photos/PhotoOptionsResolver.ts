import { Field, ObjectType, Query, Resolver } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import Photo from '../../entities/Photo';
import SelectionOption from '../../../abstract/SelectionOption';
import Photographer from '../../entities/Photographer';
import Location from '../../entities/Location';
import Subject from '../../entities/Subject';
import Tag from '../../entities/Tag';
import Collection from '../../entities/Collection';

@ObjectType()
class PhotographerSelectionOption extends SelectionOption {}

@ObjectType()
class LocationSelectionOption extends SelectionOption {}

@ObjectType()
class SubjectSelectionOption extends SelectionOption {}

@ObjectType()
class TagSelectionOption extends SelectionOption {}

@ObjectType()
class CollectionSelectionOption extends SelectionOption {}

@ObjectType()
class PhotoEditSelectionOptions {
  @Field(() => [PhotographerSelectionOption])
  photographers: PhotographerSelectionOption[];

  @Field(() => [LocationSelectionOption])
  locations: LocationSelectionOption[];

  @Field(() => [SubjectSelectionOption])
  subjects: SubjectSelectionOption[];

  @Field(() => [TagSelectionOption])
  tags: TagSelectionOption[];

  @Field(() => [CollectionSelectionOption])
  collections: CollectionSelectionOption[];
}

@Resolver(() => Photo)
export default class PhotoResolver {
  //* Repositories
  constructor(
    @InjectRepository(Photographer)
    private photographerRepository: Repository<Photographer>,
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,

    @InjectRepository(Subject) private subjectRepository: Repository<Subject>,

    @InjectRepository(Tag) private tagRepository: Repository<Tag>,

    @InjectRepository(Collection)
    private collectionRepository: Repository<Collection>
  ) {}

  @Query(() => PhotoEditSelectionOptions)
  async photoEditOptions(): Promise<PhotoEditSelectionOptions> {
    const pgs = await this.photographerRepository.find({
      select: ['id', 'name'],
    });
    const photographers = pgs.map((pg) => ({ id: pg.id, name: pg.name }));
    photographers.sort((a, b) => (a.id < b.id ? -1 : 1));

    const locs = await this.locationRepository.find({
      select: ['id', 'name'],
    });
    const locations = locs.map((loc) => ({ id: loc.id, name: loc.name }));
    locations.sort((a, b) => (a.id < b.id ? -1 : 1));

    const subj = await this.subjectRepository.find({
      select: ['id', 'name'],
    });
    const subjects = subj.map((s) => ({ id: s.id, name: s.name }));
    subjects.sort((a, b) => (a.id < b.id ? -1 : 1));

    const tgs = await this.tagRepository.find({
      select: ['id', 'name'],
    });
    const tags = tgs.map((t) => ({ id: t.id, name: t.name }));
    tags.sort((a, b) => (a.id < b.id ? -1 : 1));

    const colls = await this.collectionRepository.find({
      select: ['id', 'name'],
    });
    const collections = colls.map((c) => ({ id: c.id, name: c.name }));
    colls.sort((a, b) => (a.id < b.id ? -1 : 1));

    return {
      photographers: photographers,
      locations: locations,
      subjects: subjects,
      tags: tags,
      collections: collections,
    };
  }
}
