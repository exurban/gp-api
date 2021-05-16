import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import { Field, Int, Mutation, ObjectType, Resolver } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import ProductImage from '../../entities/ProductImage';

type ProductImageData = {
  id: number;
  imageName: string;
  fileExtension: string;
  imageUrl: string;
  altText: string;
  size: string;
  width: number;
  height: number;
};

@ObjectType()
class UpdateProductImagesFromCsvResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => Int)
  updated: number;

  @Field(() => Int)
  inserted: number;
}

@Resolver(() => ProductImage)
export default class ProductImageCsvResolver {
  //* Repositories
  constructor(
    @InjectRepository(ProductImage)
    private productImageRepository: Repository<ProductImage>
  ) {}

  //* Update from CSV
  @Mutation(() => UpdateProductImagesFromCsvResponse)
  async updateProductImagesFromCsv(): Promise<UpdateProductImagesFromCsvResponse> {
    const importedProductImageData: ProductImageData[] = [];

    fs.createReadStream(
      path.resolve(__dirname, '../../..', 'data', 'product-images.csv')
    )
      .pipe(csv.parse({ headers: true }))
      .on('error', (error) => console.error(error))
      .on('data', (row) => {
        const productImage: ProductImageData = {
          id: parseInt(row.id),
          imageName: row.name,
          fileExtension: row.fileExtension,
          imageUrl: row.imageUrl,
          altText: row.altText,
          size: row.size,
          width: parseInt(row.width),
          height: parseInt(row.height),
        };
        importedProductImageData.push(productImage);
      })
      .on('end', async () => {
        console.log(`imported ${importedProductImageData.length}`);
      });
    //* get all ids
    const existingProductImages: ProductImage[] = await this.productImageRepository.find();
    let existingProductImageIds: number[] = [];
    if (existingProductImages) {
      existingProductImageIds = existingProductImages.map((x) => x.id);
    }

    console.log(
      `existing product image ids: ${JSON.stringify(
        existingProductImageIds,
        null,
        2
      )}`
    );

    //* seperate insert and update
    const toUpdate = importedProductImageData.filter((x) =>
      existingProductImageIds.includes(x.id)
    );
    const toInsert = importedProductImageData.filter(
      (x) => !existingProductImageIds.includes(x.id)
    );

    console.log(`updating: ${toUpdate.length}\ninserting:${toInsert.length}`);
    console.log(`first to update is ${JSON.stringify(toUpdate[0], null, 2)}`);

    //* insert new
    toInsert.forEach(async (x) => {
      const newProductImage = await this.productImageRepository.create({
        ...x,
      });
      // * add any mat relations

      // * add any frame relations
      console.log({ newProductImage });

      await this.productImageRepository.insert(newProductImage);
      await this.productImageRepository.save(newProductImage);
    });

    //* update existing
    toUpdate.forEach(async (x) => {
      await this.productImageRepository.update(x.id, {
        ...x,
      });
    });

    return {
      success: true,
      updated: toUpdate.length,
      inserted: toInsert.length,
    };
  }
}
