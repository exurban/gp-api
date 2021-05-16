import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import { Field, Int, Mutation, ObjectType, Resolver } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import SuccessMessageResponse from '../../abstract/SuccessMessageResponse';
import PhotoImage from '../../entities/PhotoImage';

type PhotoImageData = {
  id: number;
  imageName: string;
  jpegUrl: string;
  webpUrl: string;
  altText: string;
  size: string;
  width: number;
  height: number;
};

@ObjectType()
class UpdatePhotoImagesFromCsvResponse extends SuccessMessageResponse {
  @Field(() => Int, { nullable: true })
  updated?: number;

  @Field(() => Int, { nullable: true })
  inserted?: number;
}

@Resolver(() => PhotoImage)
export default class PhotoImageCsvResolver {
  //* Repositories
  constructor(
    @InjectRepository(PhotoImage)
    private photoImageRepository: Repository<PhotoImage>
  ) {}

  async readPhotoImagesCsvFileToJson(): Promise<PhotoImageData[]> {
    const importedPhotoImageData: PhotoImageData[] = [];

    fs.createReadStream(
      path.resolve(__dirname, '../../..', 'data', 'photo-images.csv')
    )
      .pipe(csv.parse({ headers: true }))
      .on('error', (error) => console.error(error))
      .on('data', (row) => {
        const photoImage: PhotoImageData = {
          id: parseInt(row.id),
          imageName: row.imageName,
          jpegUrl: row.jpegUrl,
          webpUrl: row.webpUrl,
          altText: row.altText,
          size: row.size,
          width: parseInt(row.width),
          height: parseInt(row.height),
        };
        importedPhotoImageData.push(photoImage);
      })
      .on('end', () => {
        console.log(
          `finished importing data for ${importedPhotoImageData.length} photo images.`
        );
      });
    return importedPhotoImageData;
  }

  async updatePhotoImages(toUpdate: PhotoImageData[]) {
    console.log(`4. Updating ${toUpdate.length} existing photo images.`);
    toUpdate.forEach(async (x) => {
      let photoImageToUpdate = await this.photoImageRepository.findOne({
        id: x.id,
      });
      photoImageToUpdate = Object.assign(photoImageToUpdate, x);
      await this.photoImageRepository.save(photoImageToUpdate);
    });
  }

  async insertPhotoImages(toInsert: PhotoImageData[]) {
    console.log(`5. Inserting ${toInsert.length} new photo images.`);
    toInsert.forEach(async (x) => {
      const newPhotoImage = this.photoImageRepository.create({
        ...x,
      });

      console.log(`Used data: ${x.id}\nto create: ${newPhotoImage.id}`);

      await this.photoImageRepository.insert(newPhotoImage);
      await this.photoImageRepository.save(newPhotoImage);
    });
  }

  //* Update from CSV
  @Mutation(() => UpdatePhotoImagesFromCsvResponse)
  async updatePhotoImagesFromCsv(): Promise<UpdatePhotoImagesFromCsvResponse> {
    const importedPhotoImageData = await this.readPhotoImagesCsvFileToJson();
    if (importedPhotoImageData) {
      console.log(
        `1. imported data for ${importedPhotoImageData.length} photo images.`
      );
    }

    //* get all ids
    const existingPhotoImages: PhotoImage[] = await this.photoImageRepository.find();
    const existingPhotoImageIds = existingPhotoImages.map((x) => x.id);
    console.log(
      `2. collected ids for ${existingPhotoImageIds.length} existing photo images.`
    );

    //* seperate insert and update
    const toUpdate = importedPhotoImageData.filter((x) =>
      existingPhotoImageIds.includes(x.id)
    );
    const toInsert = importedPhotoImageData.filter(
      (x) => !existingPhotoImageIds.includes(x.id)
    );

    console.log(
      `3. separated imported csv data into:\n${toUpdate.length} to update\n${toInsert.length} to insert`
    );

    await this.updatePhotoImages(toUpdate);
    await this.insertPhotoImages(toInsert);

    console.log(`6. returning results.`);
    return {
      success: true,
      message: '',
      updated: toUpdate.length,
      inserted: toInsert.length,
    };
  }
}
