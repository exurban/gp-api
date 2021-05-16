import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import { Field, Int, Mutation, ObjectType, Resolver } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import SuccessMessageResponse from '../../abstract/SuccessMessageResponse';
import ShareImage from '../../entities/ShareImage';

type ShareImageData = {
  id: number;
  imageName: string;
  imageUrl: string;
  altText: string;
  size: string;
  width: number;
  height: number;
};

@ObjectType()
class UpdateShareImagesFromCsvResponse extends SuccessMessageResponse {
  @Field(() => Int, { nullable: true })
  updated?: number;

  @Field(() => Int, { nullable: true })
  inserted?: number;

  @Field(() => Int, { nullable: true })
  deleted?: number;
}

@Resolver(() => ShareImage)
export default class ShareImageCsvResolver {
  //* Repositories
  constructor(
    @InjectRepository(ShareImage)
    private shareImageRepository: Repository<ShareImage>
  ) {}

  async readShareImagesCsvFileToJson(): Promise<ShareImageData[]> {
    const importedShareImageData: ShareImageData[] = [];

    fs.createReadStream(
      path.resolve(__dirname, '../../..', 'data', 'share-images.csv')
    )
      .pipe(csv.parse({ headers: true }))
      .on('error', (error) => console.error(error))
      .on('data', (row) => {
        const shareImage: ShareImageData = {
          id: parseInt(row.id),
          imageName: row.imageName,
          imageUrl: row.imageUrl,
          altText: row.altText,
          size: row.size,
          width: parseInt(row.width),
          height: parseInt(row.height),
        };
        importedShareImageData.push(shareImage);
      })
      .on('end', () => {
        console.log(
          `finished importing data for ${importedShareImageData.length} share images.`
        );
      });
    return importedShareImageData;
  }

  //* delete
  async deleteShareImages(toDelete: number[]) {
    console.log(`4. Deleting ${toDelete.length} existing share images.`);
    toDelete.forEach(async (x) => {
      await this.shareImageRepository.delete({ id: x });
    });
  }

  //* update
  async updateShareImages(toUpdate: ShareImageData[]) {
    console.log(`4. Updating ${toUpdate.length} existing share images.`);
    toUpdate.forEach(async (x) => {
      let shareImageToUpdate = await this.shareImageRepository.findOne({
        id: x.id,
      });
      shareImageToUpdate = Object.assign(shareImageToUpdate, x);
      await this.shareImageRepository.save(shareImageToUpdate);
    });
  }

  //* insert
  async insertShareImages(toInsert: ShareImageData[]) {
    console.log(`5. Inserting ${toInsert.length} new share images.`);
    toInsert.forEach(async (x) => {
      const newShareImage = this.shareImageRepository.create({
        ...x,
      });

      console.log(`Used data: ${x.id}\nto create: ${newShareImage.id}`);

      await this.shareImageRepository.insert(newShareImage);
      await this.shareImageRepository.save(newShareImage);
    });
  }

  //* Update from CSV
  @Mutation(() => UpdateShareImagesFromCsvResponse)
  async updateShareImagesFromCsv(): Promise<UpdateShareImagesFromCsvResponse> {
    const importedShareImageData = await this.readShareImagesCsvFileToJson();
    if (importedShareImageData) {
      console.log(
        `1. imported data for ${importedShareImageData.length} share images.`
      );
    }

    //* get all ids
    const existingShareImages: ShareImage[] = await this.shareImageRepository.find();
    const existingShareImageIds = existingShareImages.map((x) => x.id);
    console.log(
      `2. collected ids for ${existingShareImageIds.length} existing share images.`
    );
    const importedShareImageIds = importedShareImageData.map((x) => x.id);

    //* updates
    const toUpdate = importedShareImageData.filter((x) =>
      existingShareImageIds.includes(x.id)
    );

    //* insertions
    const toInsert = importedShareImageData.filter(
      (x) => !existingShareImageIds.includes(x.id)
    );

    //* deletions
    const toDelete = existingShareImageIds.filter(
      (x) => !importedShareImageIds.includes(x)
    );

    console.log(
      `3. separated imported csv data into:\n${toUpdate.length} to update\n${toInsert.length} to insert\n${toDelete.length}`
    );

    await this.deleteShareImages(toDelete);
    await this.updateShareImages(toUpdate);
    await this.insertShareImages(toInsert);

    console.log(`6. returning results.`);
    return {
      success: true,
      message: '',
      updated: toUpdate.length,
      inserted: toInsert.length,
      deleted: toDelete.length,
    };
  }
}
