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
import ProductImage from '../../entities/ProductImage';
import Mat from '../../entities/Mat';
import Frame from '../../entities/Frame';
import SuccessMessageResponse from '../../abstract/SuccessMessageResponse';

// * Input Types
@InputType()
class AddProductImageInput {
  @Field({ nullable: true, defaultValue: 'New Image' })
  imageName: string;

  @Field({ nullable: true, defaultValue: 'XL' })
  fileExtension: string;

  @Field({ nullable: true, defaultValue: '' })
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
class UpdateProductImageInput {
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
class AddProductImageResponse extends SuccessMessageResponse {
  @Field(() => ProductImage, { nullable: true })
  newProductImage?: ProductImage;
}

@ObjectType()
class UpdateProductImageResponse extends SuccessMessageResponse {
  @Field(() => ProductImage, { nullable: true })
  updatedProductImage?: ProductImage;
}

@InputType()
class SearchProductImagesInput {
  @Field()
  searchString: string;
}

@ObjectType()
class SearchProductImagesResponse {
  @Field(() => [ProductImage])
  datalist: ProductImage[];
}

@ObjectType()
class addProductImageToMatResponse extends SuccessMessageResponse {
  @Field(() => ProductImage, { nullable: true })
  productImage?: ProductImage;

  @Field(() => Mat, { nullable: true })
  mat?: Mat;
}

@ObjectType()
class addProductImageToFrameResponse extends SuccessMessageResponse {
  @Field(() => ProductImage, { nullable: true })
  productImage?: ProductImage;

  @Field(() => Frame, { nullable: true })
  frame?: Frame;
}

@Resolver(() => ProductImage)
export default class ProductImageResolver {
  // * Repositories
  constructor(
    @InjectRepository(ProductImage)
    private productImageRepository: Repository<ProductImage>,
    @InjectRepository(Mat) private matRepository: Repository<Mat>,
    @InjectRepository(Frame) private frameRepository: Repository<Frame>
  ) {}

  // * Queries
  @Query(() => [ProductImage])
  async productImages(): Promise<ProductImage[]> {
    const productImages = this.productImageRepository.find({
      relations: ['mats', 'frames'],
    });
    return productImages;
  }

  @Query(() => ProductImage)
  async productImage(
    @Arg('id', () => Int) id: number
  ): Promise<ProductImage | undefined> {
    const image = await this.productImageRepository.findOne(id, {
      relations: ['mats', 'frames'],
    });
    return image;
  }

  @Query(() => SearchProductImagesResponse)
  async searchImages(
    @Arg('input', () => SearchProductImagesInput)
    input: SearchProductImagesInput
  ): Promise<SearchProductImagesResponse> {
    const searchString = input.searchString;

    const imgs = await this.productImageRepository
      .createQueryBuilder('i')
      .where('i.imageName ilike :searchString', {
        searchString: `%${searchString}%`,
      })
      .getMany();

    const response = { datalist: imgs };

    return response;
  }

  // * Mutations
  @Authorized('ADMIN')
  @Mutation(() => AddProductImageResponse)
  async addImage(
    @Arg('input', () => AddProductImageInput) input: AddProductImageInput
  ): Promise<AddProductImageResponse> {
    const newProductImage = await this.productImageRepository.create({
      ...input,
    });
    await this.productImageRepository.insert(newProductImage);
    await this.productImageRepository.save(newProductImage);
    return {
      success: true,
      message: `Created new image with id: ${newProductImage.id}`,
      newProductImage: newProductImage,
    };
  }

  @Authorized('ADMIN')
  @Mutation(() => UpdateProductImageResponse)
  async updateProductImage(
    @Arg('id', () => Int) id: number,
    @Arg('input', () => UpdateProductImageInput) input: UpdateProductImageInput
  ): Promise<UpdateProductImageResponse> {
    let productImage = await this.productImageRepository.findOne({ id });

    if (!productImage) {
      return {
        success: false,
        message: `Failed to find product image with id ${id}`,
      };
    }

    productImage = Object.assign(productImage, input);

    await this.productImageRepository.save(productImage);

    return {
      success: true,
      message: `Successfully updated prodcut image ${id}`,
      updatedProductImage: productImage,
    };
  }

  @Authorized('ADMIN')
  @Mutation(() => Boolean)
  async deleteProductImage(@Arg('id', () => Int) id: number): Promise<boolean> {
    let result = true;

    const deleteResult = await this.productImageRepository.delete(id);

    if (!deleteResult || deleteResult.affected == 0) {
      result = false;
      throw new Error(`Failed to delete product image.`);
    }
    return result;
  }

  // * Add Product Image to Mat
  @Authorized('ADMIN')
  @Mutation(() => addProductImageToMatResponse)
  async addProductImageToMat(
    @Arg('matId', () => Int) matId: number,
    @Arg('productImageId', () => Int) productImageId: number
  ): Promise<addProductImageToMatResponse | undefined> {
    const productImage = await this.productImageRepository.findOne(
      productImageId
    );
    const mat = await this.matRepository.findOne(matId);

    if (!mat) {
      return {
        success: false,
        message: `Failed to find mat with id ${matId}`,
      };
    }

    if (!productImage) {
      return {
        success: false,
        message: `Failed to find product image with id ${productImageId}`,
      };
    }

    productImage.mats?.push(mat);
    const saveResult = await this.productImageRepository.save(productImage);
    console.log(`save result: ${JSON.stringify(saveResult, null, 2)}`);

    return {
      success: true,
      message: `Successfully added product image with id ${productImage.id} for mat with id ${mat.id}.`,
      productImage: productImage,
      mat: mat,
    };
  }

  // * Add Product Image to Frame
  @Authorized('ADMIN')
  @Mutation(() => addProductImageToFrameResponse)
  async addProductImageToFrame(
    @Arg('frameId', () => Int) frameId: number,
    @Arg('productImageId', () => Int) productImageId: number
  ): Promise<addProductImageToFrameResponse | undefined> {
    const productImage = await this.productImageRepository.findOne(
      productImageId
    );
    const frame = await this.frameRepository.findOne(frameId);

    if (!frame) {
      return {
        success: false,
        message: `Failed to find frame with id ${frameId}`,
      };
    }

    if (!productImage) {
      return {
        success: false,
        message: `Failed to find product image with id ${productImageId}`,
      };
    }

    productImage.frames?.push(frame);
    await this.productImageRepository.save(productImage);

    frame.productImage = productImage;
    await this.frameRepository.save(frame);

    return {
      success: true,
      message: `Successfully added product image with id ${productImage.id} for frame with id ${frame.id}.`,
      productImage: productImage,
      frame: frame,
    };
  }
}
