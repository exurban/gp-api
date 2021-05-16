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
import PhotoImage from '../../entities/PhotoImage';
import SuccessMessageResponse from '../../abstract/SuccessMessageResponse';

// * Input Types
@InputType()
class AddPhotoImageInput {
  @Field({ nullable: true, defaultValue: 'New Image' })
  imageName: string;

  @Field({ nullable: true, defaultValue: 'XL' })
  fileExtension: string;

  @Field({ defaultValue: '' })
  jpegUrl: string;

  @Field({ defaultValue: '' })
  webpUrl: string;

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
class UpdatePhotoImageInput {
  @Field({ nullable: true })
  imageName?: string;

  @Field({ nullable: true })
  fileExtension?: string;

  @Field({ nullable: true })
  jpegUrl?: string;

  @Field({ nullable: true })
  webpUrl?: string;

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
class AddPhotoImageResponse extends SuccessMessageResponse {
  @Field(() => PhotoImage, { nullable: true })
  newPhotoImage?: PhotoImage;
}

@ObjectType()
class UpdatePhotoImageResponse extends SuccessMessageResponse {
  @Field(() => PhotoImage, { nullable: true })
  updatedPhotoImage?: PhotoImage;
}

@InputType()
class SearchPhotoImagesInput {
  @Field()
  searchString: string;
}

@ObjectType()
class SearchPhotoImagesResponse {
  @Field(() => [PhotoImage])
  datalist: PhotoImage[];
}

@Resolver(() => PhotoImage)
export default class PhotoImageResolver {
  // * Repositories
  constructor(
    @InjectRepository(PhotoImage)
    private photoImageRepository: Repository<PhotoImage>
  ) {}

  // * Queries
  @Query(() => [PhotoImage])
  async photoImages(): Promise<PhotoImage[]> {
    return await this.photoImageRepository.find();
  }

  @Query(() => PhotoImage)
  async photoImage(
    @Arg('id', () => Int) id: number
  ): Promise<PhotoImage | undefined> {
    return await this.photoImageRepository.findOne({ id: id });
  }

  @Query(() => SearchPhotoImagesResponse)
  async searchPhotoImages(
    @Arg('input', () => SearchPhotoImagesInput)
    input: SearchPhotoImagesInput
  ): Promise<SearchPhotoImagesResponse> {
    const searchString = input.searchString;

    const imgs = await this.photoImageRepository
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
  @Mutation(() => AddPhotoImageResponse)
  async addPhotoImage(
    @Arg('input', () => AddPhotoImageInput) input: AddPhotoImageInput
  ): Promise<AddPhotoImageResponse> {
    const newPhotoImage = await this.photoImageRepository.create({
      ...input,
    });
    await this.photoImageRepository.insert(newPhotoImage);
    await this.photoImageRepository.save(newPhotoImage);
    return {
      success: true,
      message: `Created new photo image with id: ${newPhotoImage.id}`,
      newPhotoImage: newPhotoImage,
    };
  }

  @Authorized('ADMIN')
  @Mutation(() => UpdatePhotoImageResponse)
  async updatePhotoImage(
    @Arg('id', () => Int) id: number,
    @Arg('input', () => UpdatePhotoImageInput) input: UpdatePhotoImageInput
  ): Promise<UpdatePhotoImageResponse> {
    let photoImage = await this.photoImageRepository.findOne({ id });

    if (!photoImage) {
      return {
        success: false,
        message: `Failed to find product image with id ${id}`,
      };
    }

    photoImage = Object.assign(photoImage, input);

    await this.photoImageRepository.save(photoImage);

    return {
      success: true,
      message: `Successfully updated prodcut image ${id}`,
      updatedPhotoImage: photoImage,
    };
  }

  @Authorized('ADMIN')
  @Mutation(() => Boolean)
  async deletePhotoImage(@Arg('id', () => Int) id: number): Promise<boolean> {
    let result = true;

    const deleteResult = await this.photoImageRepository.delete(id);

    if (!deleteResult || deleteResult.affected == 0) {
      result = false;
      throw new Error(`Failed to delete product image.`);
    }
    return result;
  }
}
