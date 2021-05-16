import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import { Field, Int, Mutation, ObjectType, Resolver } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import SuccessMessageResponse from '../../abstract/SuccessMessageResponse';
import ProductImage from '../../entities/ProductImage';
import Mat from '../../entities/Mat';

type MatData = {
  id: number;
  sortIndex: number;
  displayName: string;
  description: string;
  color: string;
  printType: string;
  matSku: string;
  dimension1: number;
  dimension2: number;
  cost: number;
  basePrice: number;
  priceModifier: number;
  productImageId?: number | null;
};

@ObjectType()
class UpdateMatsFromCsvResponse extends SuccessMessageResponse {
  @Field(() => Int, { nullable: true })
  updated?: number;

  @Field(() => Int, { nullable: true })
  inserted?: number;
}

@Resolver(() => Mat)
export default class MatCsvResolver {
  //* Repositories
  constructor(
    @InjectRepository(Mat)
    private matRepository: Repository<Mat>,
    @InjectRepository(ProductImage)
    private productImageRepository: Repository<ProductImage>
  ) {}

  async readMatsCsvFileToJson(): Promise<MatData[]> {
    const importedMatData: MatData[] = [];

    fs.createReadStream(path.resolve(__dirname, '../../..', 'data', 'mats.csv'))
      .pipe(csv.parse({ headers: true }))
      .on('error', (error) => console.error(error))
      .on('data', (row) => {
        const mat: MatData = {
          id: parseInt(row.id),
          sortIndex: parseInt(row.sortIndex),
          displayName: row.displayName,
          description: row.description,
          color: row.color,
          printType: row.printType,
          matSku: row.matSku,
          dimension1: parseFloat(row.dimension1),
          dimension2: parseFloat(row.dimension2),
          cost: parseFloat(row.cost),
          basePrice: parseFloat(row.basePrice),
          priceModifier: parseFloat(row.priceModifier),
          productImageId: row.productImageId
            ? parseInt(row.productImageId)
            : null,
        };
        importedMatData.push(mat);
      })
      // .on('end', (rowCount: number) => console.log(`Parsed ${rowCount} rows`));
      .on('end', () => {
        console.log(
          `finished importing data for ${importedMatData.length} mats.`
        );
      });
    return importedMatData;
  }

  async updateMats(toUpdate: MatData[]) {
    console.log(`4. Updating ${toUpdate.length} existing mats.`);
    toUpdate.forEach(async (x) => {
      let img: ProductImage | undefined;

      if (x.productImageId) {
        img = await this.productImageRepository.findOne({
          id: x.productImageId,
        });
      }

      delete x.productImageId;

      let matToUpdate = await this.matRepository.findOne({
        id: x.id,
      });

      if (matToUpdate && img) {
        img.mats?.push(matToUpdate);
        await this.productImageRepository.save(img);

        matToUpdate = Object.assign(matToUpdate, x);
        await this.matRepository.save(matToUpdate);
      }
    });
  }

  async insertMats(toInsert: MatData[]) {
    console.log(`5. Inserting ${toInsert.length} new mats.`);
    toInsert.forEach(async (x) => {
      let img: ProductImage | undefined;

      if (x.productImageId) {
        img = await this.productImageRepository.findOne({
          id: x.productImageId,
        });
      }
      delete x.productImageId;
      const newMat = this.matRepository.create({
        ...x,
      });

      if (img) {
        img.mats?.push(newMat);
        await this.productImageRepository.save(img);
      }

      newMat.productImage = img;

      console.log(`Used data: ${x.id}\nto create: ${newMat.id}`);

      await this.matRepository.insert(newMat);
      await this.matRepository.save(newMat);
    });
  }

  //* Update from CSV
  @Mutation(() => UpdateMatsFromCsvResponse)
  async updateMatsFromCsv(): Promise<UpdateMatsFromCsvResponse> {
    const importedMatData = await this.readMatsCsvFileToJson();
    if (importedMatData) {
      console.log(`1. imported data for ${importedMatData.length} mats.`);
    }

    //* get all ids
    const existingMats: Mat[] = await this.matRepository.find();
    const existingMatIds = existingMats.map((x) => x.id);
    console.log(`2. collected ids for ${existingMatIds.length} existing mats.`);

    //* seperate insert and update
    const toUpdate = importedMatData.filter((x) =>
      existingMatIds.includes(x.id)
    );
    const toInsert = importedMatData.filter(
      (x) => !existingMatIds.includes(x.id)
    );

    console.log(
      `3. separated imported csv data into:\n${toUpdate.length} to update\n${toInsert.length} to insert`
    );

    await this.updateMats(toUpdate);
    await this.insertMats(toInsert);

    console.log(`6. returning results.`);
    return {
      success: true,
      message: `Inserted: ${toInsert.length}\nUpdated: ${toUpdate.length}`,
      inserted: toInsert.length,
      updated: toUpdate.length,
    };
  }
}
