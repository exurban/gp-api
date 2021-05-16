import {
  Arg,
  Field,
  Int,
  InputType,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import Photo from '../entities/Photo';
import Print from '../entities/Print';
import Mat from '../entities/Mat';
import Frame from '../entities/Frame';
import SuccessMessageResponse from '../abstract/SuccessMessageResponse';

@InputType()
class PrintsInput {
  @Field()
  type: string;

  @Field()
  aspectRatio: string;
}

@ObjectType()
class PrintsResponse extends SuccessMessageResponse {
  @Field(() => [Print], { nullable: true })
  prints: Print[];
}

@InputType()
class MatsInput {
  @Field()
  printType: string;

  @Field()
  dimension1: string;

  @Field()
  dimension2: string;
}

@ObjectType()
class MatsResponse extends SuccessMessageResponse {
  @Field(() => [Mat], { nullable: true })
  mats: Mat[];
}

@ObjectType()
class FinishOptions {
  @Field(() => [Print])
  prints: Print[];

  @Field(() => [Mat])
  mats: Mat[];

  @Field(() => [Frame])
  frames: Frame[];
}

@ObjectType()
class PhotoWithFinishOptionsResponse extends SuccessMessageResponse {
  @Field(() => Photo, { nullable: true })
  photo?: Photo;

  @Field(() => [Print], { nullable: true })
  prints?: Print[];

  @Field(() => [Mat], { nullable: true })
  mats?: Mat[];

  @Field(() => [Frame], { nullable: true })
  frames?: Frame[];
}

@Resolver()
export default class PhotoFinishesResolver {
  constructor(
    @InjectRepository(Photo) private photoRepository: Repository<Photo>,
    @InjectRepository(Print) private printRepository: Repository<Print>,
    @InjectRepository(Mat) private matRepository: Repository<Mat>,
    @InjectRepository(Frame) private frameRepository: Repository<Frame>
  ) {}

  @Query(() => PrintsResponse)
  async printsOfTypeAndAspectRatio(
    @Arg('input', () => PrintsInput) input: PrintsInput
  ): Promise<PrintsResponse> {
    const prints = await this.printRepository
      .createQueryBuilder('p')
      .where('p.aspectRatio = :aspectRatio', { aspectRatio: input.aspectRatio })
      .andWhere('p.type = :type', { type: input.type })
      .orderBy('p.dimension1', 'ASC')
      .getMany();

    return {
      success: true,
      message: `Returning ${prints.length} prints.`,
      prints: prints,
    };
  }

  @Query(() => MatsResponse)
  async matsOfTypeAndSize(
    @Arg('input', () => MatsInput) input: MatsInput
  ): Promise<MatsResponse> {
    console.log(
      `looking for mats of type ${input.printType} and size ${input.dimension1} x ${input.dimension2}`
    );
    const mats = await this.matRepository
      .createQueryBuilder('m')
      .where('m.printType = :printType', { printType: input.printType })
      .andWhere('m.dimension1 = :dimension1', {
        dimension1: input.dimension1,
      })
      .andWhere('m.dimension2 = :dimension2', {
        dimension2: input.dimension2,
      })
      .getMany();

    return {
      success: true,
      message: `Returning ${mats.length} mats.`,
      mats: mats,
    };
  }

  @Query(() => FinishOptions)
  async finishOptions(
    @Arg('aspectRatio', () => String) aspectRatio: string
  ): Promise<FinishOptions> {
    const prints = await this.printRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.coverImage', 'ci')
      .where('p.aspectRatio = :aspectRatio', { aspectRatio: aspectRatio })
      .getMany();

    const mats = await this.matRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.coverImage', 'ci')
      .where('m.aspectRatio = :aspectRatio', { aspectRatio: aspectRatio })
      .getMany();

    const frames = await this.frameRepository
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.coverImage', 'ci')
      .where('f.aspectRatio = :aspectRatio', { aspectRatio: aspectRatio })
      .getMany();

    return {
      prints: prints,
      mats: mats,
      frames: frames,
    };
  }

  //* photoAndFinishOptionsForSku
  @Query(() => PhotoWithFinishOptionsResponse)
  async photoAndFinishOptionsForSku(
    @Arg('sku', () => Int) sku: number
  ): Promise<PhotoWithFinishOptionsResponse> {
    const photo = await this.photoRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.location', 'l')
      .leftJoinAndSelect('p.photographer', 'pg')
      .leftJoinAndSelect('p.images', 'i')
      .leftJoinAndSelect('p.sharingImage', 'si')
      .leftJoinAndSelect('p.emailSharingImage', 'esi')
      .leftJoinAndSelect('p.subjectsInPhoto', 'ps')
      .leftJoinAndSelect('ps.subject', 's', 's.id = ps.subjectId')
      .leftJoinAndSelect('p.tagsForPhoto', 'pt')
      .leftJoinAndSelect('pt.tag', 't', 't.id = pt.tagId')
      .leftJoinAndSelect('p.collectionsForPhoto', 'pc')
      .leftJoinAndSelect('pc.collection', 'c', 'c.id = pc.collectionId')
      .where('p.sku = :sku', { sku: sku })

      .getOne();

    if (!photo) {
      return {
        success: false,
        message: `Failed to find photo with sku: ${sku}`,
      };
    }

    const aspectRatio = photo.photoImage?.aspectRatio;
    console.log(`images aspect ratio is ${aspectRatio}`);

    const prints = await this.printRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.coverImage', 'ci')
      .where('p.aspectRatio = :aspectRatio', { aspectRatio: aspectRatio })
      .orderBy('p.dimension1', 'ASC')
      .getMany();

    const mats = await this.matRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.coverImage', 'ci')
      .where('m.aspectRatio = :aspectRatio', { aspectRatio: aspectRatio })
      .orderBy('m.dimension1', 'ASC')
      .getMany();

    const frames = await this.frameRepository
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.coverImage', 'ci')
      .where('f.aspectRatio = :aspectRatio', { aspectRatio: aspectRatio })
      .orderBy('f.dimension1', 'ASC')
      .getMany();

    return {
      success: true,
      message: `Retrieved photos and finish options.`,
      photo: photo,
      prints: prints,
      mats: mats,
      frames: frames,
    };
  }
}
