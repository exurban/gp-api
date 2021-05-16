import {
  Field,
  InputType,
  Int,
  Resolver,
  Query,
  Arg,
  Authorized,
  Mutation,
  ObjectType,
} from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import ShareImage from '../../entities/ShareImage';
import SuccessMessageResponse from '../../abstract/SuccessMessageResponse';

// * Input Types
@InputType()
class AddShareImageInput {
  @Field({ nullable: true })
  id?: number;

  @Field({ nullable: true, defaultValue: 'New Image' })
  imageName: string;

  @Field({ nullable: true, defaultValue: 'XL' })
  fileExtension: string;

  @Field({ defaultValue: '' })
  imageUrl: string;

  @Field({ nullable: true, defaultValue: 'new image' })
  altText: string;

  @Field({ nullable: true, defaultValue: 'XL' })
  size: string;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  width: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  height: number;
}

@InputType()
class UpdateShareImageInput {
  @Field({ nullable: true })
  id?: number;

  @Field({ nullable: true })
  imageName?: string;

  @Field({ nullable: true })
  fileExtension?: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field({ nullable: true })
  altText?: string;

  @Field({ nullable: true })
  size?: string;

  @Field(() => Int, { nullable: true })
  width?: number;

  @Field(() => Int, { nullable: true })
  height?: number;
}

@ObjectType()
class AddShareImageResponse extends SuccessMessageResponse {
  @Field(() => ShareImage, { nullable: true })
  newShareImage?: ShareImage;
}

@ObjectType()
class UpdateShareImageResponse extends SuccessMessageResponse {
  @Field(() => ShareImage, { nullable: true })
  updatedShareImage?: ShareImage;
}

@InputType()
class SearchShareImagesInput {
  @Field()
  searchString: string;
}

@ObjectType()
class SearchShareImagesResponse {
  @Field(() => [ShareImage])
  datalist: ShareImage[];
}

@Resolver(() => ShareImage)
export default class PhotoImageResolver {
  // * Repositories
  constructor(
    @InjectRepository(ShareImage)
    private shareImageRepository: Repository<ShareImage>
  ) {}

  // * Queries
  @Query(() => [ShareImage])
  async shareImages(): Promise<ShareImage[]> {
    return await this.shareImageRepository.find();
  }

  @Query(() => ShareImage)
  async shareImage(
    @Arg('id', () => Int) id: number
  ): Promise<ShareImage | undefined> {
    return await this.shareImageRepository.findOne({ id: id });
  }

  @Query(() => SearchShareImagesResponse)
  async searchPhotoImages(
    @Arg('input', () => SearchShareImagesInput)
    input: SearchShareImagesInput
  ): Promise<SearchShareImagesResponse> {
    const searchString = input.searchString;

    const imgs = await this.shareImageRepository
      .createQueryBuilder('i')
      .where('i.imageName ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .getMany();

    return {
      datalist: imgs,
    };
  }

  // * Mutations
  @Authorized('ADMIN')
  @Mutation(() => AddShareImageResponse)
  async addPhotoImage(
    @Arg('input', () => AddShareImageInput) input: AddShareImageInput
  ): Promise<AddShareImageResponse> {
    const newShareImage = await this.shareImageRepository.create({
      ...input,
    });
    await this.shareImageRepository.insert(newShareImage);
    await this.shareImageRepository.save(newShareImage);
    return {
      success: true,
      message: `Created new share image with id: ${newShareImage.id}`,
      newShareImage: newShareImage,
    };
  }

  @Authorized('ADMIN')
  @Mutation(() => UpdateShareImageResponse)
  async updateShareImage(
    @Arg('id', () => Int) id: number,
    @Arg('input', () => UpdateShareImageInput) input: UpdateShareImageInput
  ): Promise<UpdateShareImageResponse> {
    let shareImage = await this.shareImageRepository.findOne({ id });

    if (!shareImage) {
      return {
        success: false,
        message: `Failed to find share image with id ${id}`,
      };
    }

    shareImage = Object.assign(shareImage, input);

    await this.shareImageRepository.save(shareImage);

    return {
      success: true,
      message: `Successfully updated share image ${id}`,
      updatedShareImage: shareImage,
    };
  }

  @Authorized('ADMIN')
  @Mutation(() => Boolean)
  async deleteShareImage(
    @Arg('id', () => Int) id: number
  ): Promise<SuccessMessageResponse> {
    let result = true;

    const deleteResult = await this.shareImageRepository.delete(id);

    if (!deleteResult || deleteResult.affected == 0) {
      result = false;
      throw new Error(`Failed to delete share image.`);
    }
    return {
      success: result,
      message: result
        ? `Successfully deleted share image with id ${id}`
        : `Failed to delete share image with id ${id}`,
    };
  }
}
