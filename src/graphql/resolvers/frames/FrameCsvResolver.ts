import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import { Field, Int, Mutation, ObjectType, Resolver } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import SuccessMessageResponse from '../../abstract/SuccessMessageResponse';
import ProductImage from '../../entities/ProductImage';
import Frame from '../../entities/Frame';

type FrameData = {
  id: number;
  sortIndex: number;
  displayName: string;
  description: string;
  material: string;
  color: string;
  printType: string;
  frameSku: string;
  dimension1: number;
  dimension2: number;
  cost: number;
  basePrice: number;
  priceModifier: number;
  productImageId?: number | null;
};

@ObjectType()
class UpdateFramesFromCsvResponse extends SuccessMessageResponse {
  @Field(() => Int)
  updated: number;

  @Field(() => Int)
  inserted: number;
}

@Resolver(() => Frame)
export default class FrameResolver {
  //* Repositories
  constructor(
    @InjectRepository(Frame)
    private frameRepository: Repository<Frame>,
    @InjectRepository(ProductImage)
    private productImageRepository: Repository<ProductImage>
  ) {}

  async readFramesCsvFileToJson(): Promise<FrameData[]> {
    const importedFrameData: FrameData[] = [];

    fs.createReadStream(
      path.resolve(__dirname, '../../..', 'data', 'frames.csv')
    )
      .pipe(csv.parse({ headers: true }))
      .on('error', (error) => console.error(error))
      .on('data', (row) => {
        const frame: FrameData = {
          id: parseInt(row.id),
          sortIndex: parseInt(row.sortIndex),
          productImageId: row.productImageId
            ? parseInt(row.productImageId)
            : null,
          displayName: row.displayName,
          description: row.description,
          material: row.material,
          color: row.color,
          printType: row.printType,
          frameSku: row.frameSku,
          dimension1: parseFloat(row.dimension1),
          dimension2: parseFloat(row.dimension2),
          cost: parseFloat(row.cost),
          basePrice: parseFloat(row.basePrice),
          priceModifier: parseFloat(row.priceModifier),
        };
        importedFrameData.push(frame);
      })
      // .on('end', (rowCount: number) => console.log(`Parsed ${rowCount} rows`));
      .on('end', () => {
        console.log(
          `finished importing data for ${importedFrameData.length} mats.`
        );
      });
    return importedFrameData;
  }

  async updateFrames(toUpdate: FrameData[]) {
    console.log(`4. Updating ${toUpdate.length} existing frames.`);
    toUpdate.forEach(async (x) => {
      let img: ProductImage | undefined;

      if (x.productImageId) {
        img = await this.productImageRepository.findOne({
          id: x.productImageId,
        });
      }

      delete x.productImageId;

      let frameToUpdate = await this.frameRepository.findOne({
        id: x.id,
      });

      if (frameToUpdate && img) {
        img.frames?.push(frameToUpdate);
        await this.productImageRepository.save(img);

        frameToUpdate = Object.assign(frameToUpdate, x);
        await this.frameRepository.save(frameToUpdate);
      }
    });
  }

  async insertFrames(toInsert: FrameData[]) {
    console.log(`5. Inserting ${toInsert.length} new frames.`);
    toInsert.forEach(async (x) => {
      let img: ProductImage | undefined;

      if (x.productImageId) {
        img = await this.productImageRepository.findOne({
          id: x.productImageId,
        });
      }
      delete x.productImageId;
      const newFrame = await this.frameRepository.create({
        ...x,
      });

      if (img) {
        img.frames?.push(newFrame);
        await this.productImageRepository.save(img);
      }

      newFrame.productImage = img;

      console.log(`Used data: ${x.id}\nto create: ${newFrame.id}`);

      await this.frameRepository.insert(newFrame);
      await this.frameRepository.save(newFrame);
    });
  }

  //* Update from CSV
  @Mutation(() => UpdateFramesFromCsvResponse)
  async updateFramesFromCsv(): Promise<UpdateFramesFromCsvResponse> {
    const importedFrameData = await this.readFramesCsvFileToJson();
    if (importedFrameData) {
      console.log(`1. imported data for ${importedFrameData.length} mats.`);
    }

    //* get all ids
    const existingFrames: Frame[] = await this.frameRepository.find();
    const existingFrameIds = existingFrames.map((x) => x.id);
    console.log(
      `2. collected ids for ${existingFrameIds.length} existing frames.`
    );

    //* seperate insert and update
    const toUpdate = importedFrameData.filter((x) =>
      existingFrameIds.includes(x.id)
    );
    const toInsert = importedFrameData.filter(
      (x) => !existingFrameIds.includes(x.id)
    );

    console.log(
      `3. separated imported csv data into:\n${toUpdate.length} to update\n${toInsert.length} to insert`
    );

    await this.updateFrames(toUpdate);
    await this.insertFrames(toInsert);

    console.log(`6. returning results.`);
    return {
      success: true,
      message: `Inserted: ${toInsert.length}\nUpdated: ${toUpdate.length}`,
      inserted: toInsert.length,
      updated: toUpdate.length,
    };
  }
}
