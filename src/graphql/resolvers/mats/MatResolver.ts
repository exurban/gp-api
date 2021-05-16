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
import Mat from '../../entities/Mat';
import ProductImage from '../../entities/ProductImage';
import SuccessMessageResponse from '../../abstract/SuccessMessageResponse';

//* Input Types
@InputType()
class AddMatInput {
  @Field({ nullable: true })
  id?: number;

  @Field()
  name: string;

  @Field()
  displayName: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  color: string;

  @Field()
  printType: string;

  @Field({ nullable: true })
  productImageId?: number;

  @Field()
  matSku: string;

  @Field(() => Float)
  dimension1: number;

  @Field(() => Float)
  dimension2: number;

  @Field(() => Float)
  cost: number;

  @Field(() => Float)
  shippingCost: number;

  @Field(() => Float)
  basePrice: number;

  @Field(() => Float)
  priceModifier: number;
}

@InputType()
class UpdateMatInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  displayName?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  color?: string;

  @Field({ nullable: true })
  printType?: string;

  @Field({ nullable: true })
  productImageId?: number;

  @Field({ nullable: true })
  matSku?: string;

  @Field(() => Float, { nullable: true })
  dimension1?: number;

  @Field(() => Float, { nullable: true })
  dimension2?: number;

  @Field(() => Float, { nullable: true })
  cost?: number;

  @Field(() => Float, { nullable: true })
  shippingCost?: number;

  @Field(() => Float, { nullable: true })
  basePrice?: number;

  @Field(() => Float, { nullable: true })
  priceModifier?: number;
}

@InputType()
class SearchMatsInput {
  @Field()
  searchString: string;
}

@ObjectType()
class SearchMatsResponse {
  @Field(() => [Mat])
  datalist: Mat[];
}

@ObjectType()
class AddMatResponse extends SuccessMessageResponse {
  @Field(() => Mat, { nullable: true })
  newMat?: Mat;
}

@ObjectType()
class UpdateMatResponse extends SuccessMessageResponse {
  @Field(() => Mat, { nullable: true })
  updatedMat?: Mat;
}

@Resolver(() => Mat)
export default class MatResolver {
  //* Repositories
  constructor(
    @InjectRepository(Mat)
    private matRepository: Repository<Mat>,
    @InjectRepository(ProductImage)
    private imageRepository: Repository<ProductImage>
  ) {}

  @FieldResolver()
  retailPrice(@Root() mat: Mat) {
    return mat.basePrice * mat.priceModifier;
  }

  // * Queries - Print + Cover Image Only
  @Query(() => SearchMatsResponse, {
    description: 'Search Mats. Returns Mat + Product Image.',
  })
  async searchMats(
    @Arg('input', () => SearchMatsInput) input: SearchMatsInput
  ): Promise<SearchMatsResponse> {
    const searchString = input.searchString;

    const mats = await this.matRepository
      .createQueryBuilder('mat')
      .leftJoinAndSelect('mat.productImage', 'pi')
      .where('mat.name ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .where('mat.matSku ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .orWhere('mat.description ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .getMany();

    const response = { datalist: mats };
    return response;
  }

  @Query(() => [Mat])
  async matsWithAspectRatio(
    @Arg('aspectRatio', () => String) aspectRatio: string
  ): Promise<Mat[]> {
    const mats = await this.matRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.productImage', 'pi')
      .where('m.aspectRatio = :aspectRatio', { aspectRatio: aspectRatio })
      .getMany();
    return mats;
  }

  @Query(() => [Mat])
  async matsWithAspectRatioAndSize(
    @Arg('aspectRatio', () => String) aspectRatio: string,
    @Arg('size', () => Int) size: number
  ): Promise<Mat[]> {
    const mats = await this.matRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.productImage', 'pi')
      .where('m.aspectRatio = :aspectRatio', { aspectRatio: aspectRatio })
      .andWhere('m.dimension1 = :dimension1', { dimension1: size })
      .getMany();
    return mats;
  }

  @Query(() => Mat)
  async mat(@Arg('id', () => Int) id: number): Promise<Mat | undefined> {
    return await this.matRepository.findOne(id, {
      relations: ['productImage'],
    });
  }

  //* Mutations
  @Authorized('ADMIN')
  @Mutation(() => AddMatResponse)
  async addMat(
    @Arg('input', () => AddMatInput) input: AddMatInput
  ): Promise<AddMatResponse> {
    let maxId = 0;

    if (!input.id) {
      const highId = await this.matRepository
        .createQueryBuilder('mat')
        .select('MAX(id)', 'max')
        .getRawOne();
      maxId = highId.max + 1;
    }

    input.id = input.id || maxId;

    const newMat = await this.matRepository.create(input);
    if (input.productImageId) {
      const imageId = input.productImageId;
      const productImage = await this.imageRepository.findOne(imageId);
      newMat.productImage = productImage;
    }
    await this.matRepository.insert(newMat);
    await this.matRepository.save(newMat);

    return {
      success: true,
      message: `Successfully created new Mat: ${input.name}`,
      newMat: newMat,
    };
  }

  @Authorized('ADMIN')
  @Mutation(() => UpdateMatResponse)
  async updateMat(
    @Arg('id', () => Int) id: number,
    @Arg('input', () => UpdateMatInput) input: UpdateMatInput
  ): Promise<UpdateMatResponse> {
    const mat = await this.matRepository.findOne({ id });
    if (!mat) {
      return {
        success: false,
        message: `Couldn't find mat with id: ${id}`,
      };
    }

    const updatedMat = { ...mat, ...input };
    if (input.productImageId) {
      const imageId = input.productImageId;
      const productImage = await this.imageRepository.findOne(imageId);
      updatedMat.productImage = productImage;
    }
    const m = await this.matRepository.save(updatedMat);

    return {
      success: true,
      message: `Successfully updated ${m.name}`,
      updatedMat: m,
    };
  }

  @Authorized('ADMIN')
  @Mutation(() => Boolean)
  async deleteMat(@Arg('id', () => Int) id: number): Promise<boolean> {
    const deleteResult = await this.matRepository.delete({ id });
    if (deleteResult && deleteResult.affected != 0) {
      return true;
    }
    return false;
  }
}
