import {
  Arg,
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

import Product from '../entities/Product';
import Photo from '../entities/Photo';
import Print from '../entities/Print';
import Mat from '../entities/Mat';
import Frame from '../entities/Frame';
import SuccessMessageResponse from '../abstract/SuccessMessageResponse';

//* Input Types
@InputType()
class CreateProductInput {
  @Field(() => Int)
  photoId: number;

  @Field(() => Int)
  printId: number;

  @Field(() => Int, { nullable: true })
  matId?: number;

  @Field(() => Int, { nullable: true })
  frameId?: number;
}

@InputType()
class UpdateProductInput {
  @Field(() => Int, { nullable: true })
  photoId?: number;

  @Field(() => Int, { nullable: true })
  printId?: number;

  @Field(() => Int, { nullable: true })
  matId?: number;

  @Field(() => Int, { nullable: true })
  frameId?: number;
}

@ObjectType()
class CreateProductResponse extends SuccessMessageResponse {
  @Field(() => Product, { nullable: true })
  newProduct?: Product;
}

@ObjectType()
class UpdateProductResponse extends SuccessMessageResponse {
  @Field(() => Product, { nullable: true })
  updatedProduct?: Product;
}

@Resolver(() => Product)
export default class ProductResolver {
  constructor(
    @InjectRepository(Product) private productRepository: Repository<Product>,
    @InjectRepository(Photo) private photoRepository: Repository<Photo>,
    @InjectRepository(Print) private printRepository: Repository<Print>,
    @InjectRepository(Mat) private matRepository: Repository<Mat>,
    @InjectRepository(Frame) private frameRepository: Repository<Frame>
  ) {}

  @FieldResolver(() => String)
  async productSummary(@Root() product: Product) {
    const material =
      product.print.type === 'paper' ? 'exhibition paper' : 'aluminum';

    let isPortrait = false;
    if (product.photo.photoImage) {
      isPortrait =
        product.photo.photoImage.height > product.photo.photoImage.width;
    }

    const dimensions = isPortrait
      ? `${product.print.dimension1}" w x ${product.print.dimension2}" h`
      : `${product.print.dimension2}" w x ${product.print.dimension1}" h`;

    let summary = `${product.photo.title}, ${dimensions}, printed on ${material}`;
    if (product.mat) {
      summary = summary + ` with a ${product.mat.color} mat`;
    }
    if (product.frame) {
      summary += ` in a ${product.frame.color} ${product.frame.material} frame.`;
    }

    return summary;
  }

  @FieldResolver()
  async totalRetailPrice(@Root() product: Product) {
    const dim1 = product.print.dimension1;

    let price;

    switch (dim1) {
      case 12:
        price = product.photo.basePrice12 * product.photo.priceModifier12;
        break;
      case 16:
        price = product.photo.basePrice16 * product.photo.priceModifier16;
        break;
      case 20:
        price = product.photo.basePrice20 * product.photo.priceModifier20;
        break;
      case 24:
        price = product.photo.basePrice24 * product.photo.priceModifier24;
        break;
      default:
        price = product.photo.basePrice30 * product.photo.priceModifier30;
        break;
    }

    price += product.print.basePrice * product.print.priceModifier;

    if (product.mat) {
      price += product.mat.basePrice * product.mat.priceModifier;
    }

    if (product.frame) {
      price += product.frame.basePrice * product.frame.priceModifier;
    }

    return price;
  }

  @Query(() => Product, { nullable: true })
  async product(
    @Arg('id', () => Int) id: number
  ): Promise<Product | undefined> {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.photo', 'p')
      .leftJoinAndSelect('p.photoImage', 'pi')
      .leftJoinAndSelect('product.print', 'pr')
      .leftJoinAndSelect('product.mat', 'm')
      .leftJoinAndSelect('m.coverImage', 'mci')
      .leftJoinAndSelect('product.frame', 'fr')
      .leftJoinAndSelect('fr.coverImage', 'frci')
      .where('product.id = :id', { id: id })
      .getOne();

    return product;
  }

  //* Mutations
  @Mutation(() => CreateProductResponse)
  async createProduct(
    @Arg('input', () => CreateProductInput) input: CreateProductInput
  ): Promise<CreateProductResponse> {
    const photo = await this.photoRepository.findOne(input.photoId, {
      relations: ['photoImage'],
    });
    if (!photo) {
      return {
        success: false,
        message: `Failed to find photo with id ${input.photoId}`,
      };
    }

    const print = await this.printRepository.findOne(input.printId);
    if (!print) {
      return {
        success: false,
        message: `Failed to find print with id ${input.printId}`,
      };
    }

    let mat, frame;
    if (input.matId) {
      mat = await this.matRepository.findOne(input.matId);
      if (!mat) {
        return {
          success: false,
          message: `Failed to find mat with id ${input.matId}`,
        };
      }
    }

    if (input.frameId) {
      frame = await this.frameRepository.findOne(input.frameId);
      if (!frame) {
        return {
          success: false,
          message: `Failed to find frame with id ${input.frameId}`,
        };
      }
    }

    const newProduct = await this.productRepository.create({
      photo: photo,
      print: print,
      mat: mat,
      frame: frame,
    });

    console.log(`New product: ${JSON.stringify(newProduct, null, 2)}`);

    await this.productRepository.insert(newProduct);
    await this.productRepository.save(newProduct);

    return {
      success: true,
      message: `Successfully created new product.`,
      newProduct: newProduct,
    };
  }

  @Mutation(() => UpdateProductResponse)
  async updateProduct(
    @Arg('id', () => Int) id: number,
    @Arg('input', () => UpdateProductInput) input: UpdateProductInput
  ): Promise<UpdateProductResponse> {
    const product = await this.productRepository.findOne(id);

    if (!product) {
      return {
        success: false,
        message: `Product with id ${id} does not exist.`,
      };
    }

    let photo, print, mat, frame;

    if (input.photoId) {
      photo = await this.photoRepository.findOne({ id: input.photoId });
      if (!photo) {
        return {
          success: false,
          message: `Failed to find photo with id ${input.photoId}`,
        };
      }
      product.photo = photo;
    }

    if (input.printId) {
      print = await this.printRepository.findOne({ id: input.printId });
      if (!print) {
        return {
          success: false,
          message: `Failed to find print with id ${input.printId}`,
        };
      }
      product.print = print;
    }

    if (input.matId) {
      mat = await this.matRepository.findOne({ id: input.matId });
      if (!mat) {
        return {
          success: false,
          message: `Failed to find mat with id ${input.matId}`,
        };
      }
      product.mat = mat;
    }

    if (input.frameId) {
      frame = await this.frameRepository.findOne({ id: input.frameId });
      if (!frame) {
        return {
          success: false,
          message: `Failed to find frame with id ${input.frameId}`,
        };
      }
      product.frame = frame;
    }
    const pr = await this.productRepository.save(product);

    return {
      success: true,
      message: `Successfully updated your order.`,
      updatedProduct: pr,
    };
  }

  @Mutation(() => SuccessMessageResponse)
  async deleteProduct(
    @Arg('id', () => Int) id: number
  ): Promise<SuccessMessageResponse> {
    const deleteResult = await this.productRepository.delete({ id });
    if (deleteResult && deleteResult.affected != 0) {
      return {
        success: true,
        message: `Successfully removed product from your shopping bag.`,
      };
    }
    return {
      success: false,
      message: `An error occurred. Failed to remove item from your shopping bag.`,
    };
  }
}
