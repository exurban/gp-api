/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import { Field, Int, Mutation, ObjectType, Resolver } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import SuccessMessageResponse from '../../abstract/SuccessMessageResponse';
import Photo from '../../entities/Photo';
import Photographer from '../../entities/Photographer';
import Location from '../../entities/Location';
import PhotoImage from '../../entities/PhotoImage';
import ShareImage from '../../entities/ShareImage';
import PhotoSubject from '../../entities/PhotoSubject';
import PhotoTag from '../../entities/PhotoTag';
import PhotoCollection from '../../entities/PhotoCollection';

type PhotoData = {
  id: number;
  title: string;
  description: string;
  isFeatured: boolean;
  isLimitedEdition: boolean;
  isHidden: boolean;
  rating: number;
  printTypes: string[];
  basePrice12: number;
  priceModifier12: number;
  basePrice16: number;
  priceModifier16: number;
  basePrice20: number;
  priceModifier20: number;
  basePrice24: number;
  priceModifier24: number;
  basePrice30: number;
  priceModifier30: number;
  photographerId: number;
  locationId: number;
  photoImageId: number;
  shareImageId: number;
  subjectIds: string;
  tagIds: string;
  collectionIds: string;
};

@ObjectType()
class UpdatePhotosFromCsvResponse extends SuccessMessageResponse {
  @Field(() => Int, { nullable: true })
  updated?: number;

  @Field(() => Int, { nullable: true })
  inserted?: number;

  @Field(() => Int, { nullable: true })
  deleted?: number;
}

@Resolver(() => Photo)
export default class PhotoCsvResolver {
  //* Repositories
  constructor(
    @InjectRepository(Photo)
    private photoRepository: Repository<Photo>,
    @InjectRepository(Photographer)
    private photographerRepository: Repository<Photographer>,
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    @InjectRepository(PhotoImage)
    private photoImageRepository: Repository<PhotoImage>,
    @InjectRepository(ShareImage)
    private shareImageRepository: Repository<ShareImage>,
    @InjectRepository(PhotoSubject)
    private photoSubjectRepository: Repository<PhotoSubject>,
    @InjectRepository(PhotoTag)
    private photoTagRepository: Repository<PhotoTag>,
    @InjectRepository(PhotoCollection)
    private photoCollectionRepository: Repository<PhotoCollection>
  ) {}

  async readPhotosCsvFileToJson(): Promise<PhotoData[]> {
    const importedPhotoData: PhotoData[] = [];

    fs.createReadStream(
      path.resolve(__dirname, '../../..', 'data', 'photos.csv')
    )
      .pipe(csv.parse({ headers: true }))
      .on('error', (error) => console.error(error))
      .on('data', (row) => {
        const photo: PhotoData = {
          id: parseInt(row.id),
          title: row.title,
          description: row.description,
          isFeatured: row.isFeatured,
          isLimitedEdition: row.isLimitedEdition,
          isHidden: row.isHidden,
          rating: parseInt(row.rating),
          printTypes: row.printTypes,
          basePrice12: parseInt(row.basePrice12),
          priceModifier12: parseInt(row.priceModifier12),
          basePrice16: parseInt(row.basePrice16),
          priceModifier16: parseInt(row.priceModifier16),
          basePrice20: parseInt(row.basePrice20),
          priceModifier20: parseInt(row.priceModifier20),
          basePrice24: parseInt(row.basePrice24),
          priceModifier24: parseInt(row.priceModifier24),
          basePrice30: parseInt(row.basePrice30),
          priceModifier30: parseInt(row.priceModifier30),
          photographerId: parseInt(row.photographerId),
          locationId: parseInt(row.locationId),
          photoImageId: parseInt(row.photoImageId),
          shareImageId: parseInt(row.shareImageId),
          subjectIds: row.subjectIds,
          tagIds: row.tagIds,
          collectionIds: row.collectionIds,
        };
        console.log({ photo });
        importedPhotoData.push(photo);
      })
      .on('end', () => {
        console.log(
          `finished importing data for ${importedPhotoData.length} photos.`
        );
        console.log(
          `Second photo is ${JSON.stringify(importedPhotoData[1], null, 2)}`
        );
      });
    return importedPhotoData;
  }

  //* delete
  async deletePhotos(toDelete: number[]) {
    console.log(`4. Deleting ${toDelete.length} existing photos.`);
    toDelete.forEach(async (x) => {
      await this.photoSubjectRepository.delete({ photoId: x });
      await this.photoTagRepository.delete({ photoId: x });
      await this.photoCollectionRepository.delete({ photoId: x });
      await this.photoRepository.delete({ id: x });
    });
  }

  //* insert
  async insertPhotos(toInsert: PhotoData[]): Promise<boolean> {
    console.log(`5. Inserting ${toInsert.length} new photos.`);
    toInsert.forEach(async (x) => {
      // * extract relations
      const {
        photographerId,
        locationId,
        photoImageId,
        shareImageId,
        subjectIds,
        tagIds,
        collectionIds,
      } = x;

      const newPhoto = this.photoRepository.create({ ...x });
      await this.photoRepository.insert(newPhoto);

      if (photographerId) {
        const pg = await this.photographerRepository.findOne({
          id: photographerId,
        });
        newPhoto.photographer = pg;
      }

      if (locationId) {
        const loc = await this.locationRepository.findOne({ id: locationId });
        newPhoto.location = loc;
      }

      if (photoImageId) {
        const pi = await this.photoImageRepository.findOne({
          id: photoImageId,
        });
        if (pi) {
          newPhoto.photoImage = pi;
        }
      }

      if (shareImageId) {
        const si = await this.shareImageRepository.findOne({
          id: shareImageId,
        });
        newPhoto.shareImage = si;
      }

      if (subjectIds) {
        const subjArr = subjectIds.split(',');

        subjArr.map(async (s) => {
          const ps = this.photoSubjectRepository.create({
            photoId: newPhoto.id,
            subjectId: parseInt(s),
          });
          await this.photoSubjectRepository.insert(ps);
          await this.photoSubjectRepository.save(ps);
        });
      }

      if (tagIds) {
        const tagArr = tagIds.split(',');

        tagArr.map(async (t) => {
          const pt = this.photoTagRepository.create({
            photoId: newPhoto.id,
            tagId: parseInt(t),
          });
          await this.photoTagRepository.insert(pt);
          await this.photoTagRepository.save(pt);
        });
      }

      if (collectionIds) {
        const collArr = collectionIds.split(',');

        collArr.map(async (c) => {
          const pc = this.photoCollectionRepository.create({
            photoId: newPhoto.id,
            collectionId: parseInt(c),
          });
          await this.photoCollectionRepository.insert(pc);
          await this.photoCollectionRepository.save(pc);
        });
      }
      await this.photoRepository.save(newPhoto);
    });
    return true;
  }

  //* update
  async updatePhotos(toUpdate: PhotoData[]) {
    console.log(`4. Updating ${toUpdate.length} existing photos.`);

    //* extract relationships from input
    // * extract relations
    toUpdate.forEach(async (x) => {
      const {
        photographerId,
        locationId,
        photoImageId,
        shareImageId,
        subjectIds,
        tagIds,
        collectionIds,
      } = x;

      //* delete existing relationships
      await this.photoSubjectRepository.delete({ photoId: x.id });
      await this.photoTagRepository.delete({ photoId: x.id });
      await this.photoCollectionRepository.delete({ photoId: x.id });

      let photoToUpdate = await this.photoRepository.findOne({ id: x.id });
      if (!photoToUpdate) {
        return;
      }

      photoToUpdate = Object.assign(photoToUpdate, x);

      if (photographerId) {
        const pg = await this.photographerRepository.findOne({
          id: photographerId,
        });
        photoToUpdate.photographer = pg;
      }

      if (locationId) {
        const loc = await this.locationRepository.findOne({ id: locationId });
        photoToUpdate.location = loc;
      }

      if (photoImageId) {
        const pi = await this.photoImageRepository.findOne({
          id: photoImageId,
        });
        if (pi) {
          photoToUpdate.photoImage = pi;
        }
      }

      if (shareImageId) {
        const si = await this.shareImageRepository.findOne({
          id: shareImageId,
        });
        photoToUpdate.shareImage = si;
      }

      if (subjectIds) {
        const subjArr = subjectIds.split(',');

        subjArr.map(async (s) => {
          const ps = this.photoSubjectRepository.create({
            photoId: photoToUpdate?.id,
            subjectId: parseInt(s),
          });
          await this.photoSubjectRepository.insert(ps);
          await this.photoSubjectRepository.save(ps);
        });
      }

      if (tagIds) {
        const tagArr = tagIds.split(',');

        tagArr.map(async (t) => {
          const pt = this.photoTagRepository.create({
            photoId: photoToUpdate?.id,
            tagId: parseInt(t),
          });
          await this.photoTagRepository.insert(pt);
          await this.photoTagRepository.save(pt);
        });
      }

      if (collectionIds) {
        const collArr = collectionIds.split(',');

        collArr.map(async (c) => {
          const pc = this.photoCollectionRepository.create({
            photoId: photoToUpdate?.id,
            collectionId: parseInt(c),
          });
          await this.photoCollectionRepository.insert(pc);
          await this.photoCollectionRepository.save(pc);
        });
      }
      await this.photoRepository.save(photoToUpdate);
    });
  }

  //* Update from CSV
  @Mutation(() => UpdatePhotosFromCsvResponse)
  async updatePhotosFromCsv(): Promise<UpdatePhotosFromCsvResponse> {
    const importedPhotoData = await this.readPhotosCsvFileToJson();
    if (importedPhotoData) {
      console.log(`1. imported data for ${importedPhotoData.length} photos.`);
    }

    //* get all ids
    const existingPhotos: Photo[] = await this.photoRepository.find();
    const existingPhotoIds = existingPhotos.map((x) => x.id);
    console.log(
      `2. collected ids for ${existingPhotoIds.length} existing photos.`
    );
    const importedPhotoIds = importedPhotoData.map((x) => x.id);

    //* updates
    const toUpdate = importedPhotoData.filter((x) =>
      existingPhotoIds.includes(x.id)
    );

    //* insertions
    const toInsert = importedPhotoData.filter(
      (x) => !existingPhotoIds.includes(x.id)
    );

    //* deletions
    const toDelete = existingPhotoIds.filter(
      (x) => !importedPhotoIds.includes(x)
    );

    console.log(
      `3. separated imported csv data into:\n${toUpdate.length} to update\n${toInsert.length} to insert`
    );

    await this.updatePhotos(toUpdate);
    await this.deletePhotos(toDelete);

    const insertSuccess = await this.insertPhotos(toInsert);

    if (insertSuccess) {
    }

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
