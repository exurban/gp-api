import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import { Field, Int, Mutation, ObjectType, Resolver } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import SuccessMessageResponse from '../../abstract/SuccessMessageResponse';
import Photographer from '../../entities/Photographer';
import ProductImage from '../../entities/ProductImage';

type PhotographerData = {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  coverImageId?: number | null;
};

@ObjectType()
class UpdatePhotographersFromCsvResponse extends SuccessMessageResponse {
  @Field(() => Int, { nullable: true })
  updated?: number;

  @Field(() => Int, { nullable: true })
  inserted?: number;
}

@Resolver(() => Photographer)
export default class PhotographerResolver {
  //* Repositories
  constructor(
    @InjectRepository(Photographer)
    private photographerRepository: Repository<Photographer>,
    @InjectRepository(ProductImage)
    private productImageRepository: Repository<ProductImage>
  ) {}

  // * Read from CSV to JSON
  async readPhotographersCsvFileToJson(): Promise<PhotographerData[]> {
    const importedPhotographerData: PhotographerData[] = [];

    fs.createReadStream(
      path.resolve(__dirname, '../../..', 'data', 'photographers.csv')
    )
      .pipe(csv.parse({ headers: true }))
      .on('error', (error) => console.error(error))
      .on('data', (row) => {
        const photographer: PhotographerData = {
          id: parseInt(row.id),
          name: row.name,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          bio: row.bio,
          coverImageId: parseInt(row.coverImageId),
        };
        importedPhotographerData.push(photographer);
      })
      .on('end', async () => {
        console.log(
          `Finished importing data for ${importedPhotographerData.length} photographers.`
        );
      });
    return importedPhotographerData;
  }

  // * Update existing Photographers
  async updatePhotographers(toUpdate: PhotographerData[]) {
    console.log(`4. Updating ${toUpdate.length} existing photographers.`);

    toUpdate.forEach(async (x) => {
      let img: ProductImage | undefined;

      if (x.coverImageId) {
        img = await this.productImageRepository.findOne({
          id: x.coverImageId,
        });
      }

      delete x.coverImageId;

      let photographerToUpdate = await this.photographerRepository.findOne({
        id: x.id,
      });

      if (photographerToUpdate && img) {
        img.photographers?.push(photographerToUpdate);
        await this.productImageRepository.save(img);

        photographerToUpdate = Object.assign(photographerToUpdate, x);
        await this.photographerRepository.save(photographerToUpdate);
      }
    });
  }

  // * Insert New Photographers
  async insertPhotographers(toInsert: PhotographerData[]) {
    console.log(`5. Inserting ${toInsert.length} new photographers.`);
    toInsert.forEach(async (x) => {
      let img: ProductImage | undefined;

      if (x.coverImageId) {
        img = await this.productImageRepository.findOne({
          id: x.coverImageId,
        });
      }
      delete x.coverImageId;
      const newPhotographer = await this.photographerRepository.create({
        ...x,
      });

      if (img) {
        img.photographers?.push(newPhotographer);
        await this.productImageRepository.save(img);
      }

      newPhotographer.coverImage = img;

      console.log(`Used data: ${x.id}\nto create: ${newPhotographer.id}`);

      await this.photographerRepository.insert(newPhotographer);
      await this.photographerRepository.save(newPhotographer);
    });
  }

  //* Update from CSV
  @Mutation(() => UpdatePhotographersFromCsvResponse)
  async updatePhotographersFromCsv(): Promise<UpdatePhotographersFromCsvResponse> {
    const importedPhotographerData = await this.readPhotographersCsvFileToJson();
    if (importedPhotographerData) {
      console.log(
        `1. imported data for ${importedPhotographerData.length} subjects.`
      );
    }

    //* get all ids
    const existingPhotographers: Photographer[] = await this.photographerRepository.find();
    const existingPhotographerIds = existingPhotographers.map((x) => x.id);
    console.log(
      `2. collected ids for ${existingPhotographerIds.length} existing subjects.`
    );

    //* seperate insert and update
    const toUpdate = importedPhotographerData.filter((x) =>
      existingPhotographerIds.includes(x.id)
    );
    const toInsert = importedPhotographerData.filter(
      (x) => !existingPhotographerIds.includes(x.id)
    );

    console.log(
      `3. separated imported csv data into:\n${toUpdate.length} to update\n${toInsert.length} to insert`
    );

    await this.updatePhotographers(toUpdate);
    await this.insertPhotographers(toInsert);

    console.log(`6. returning results.`);
    return {
      success: true,
      message: `Inserted: ${toInsert.length}\nUpdated: ${toUpdate.length}`,
      inserted: toInsert.length,
      updated: toUpdate.length,
    };
  }
}
