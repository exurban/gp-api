import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import { Field, Int, Mutation, ObjectType, Resolver } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import SuccessMessageResponse from '../../abstract/SuccessMessageResponse';
import Collection from '../../entities/Collection';

type CollectionData = {
  id: number;
  sortIndex: number;
  name: string;
  description: string;
};

@ObjectType()
class UpdateCollectionsFromCsvResponse extends SuccessMessageResponse {
  @Field(() => Int, { nullable: true })
  updated?: number;

  @Field(() => Int, { nullable: true })
  inserted?: number;
}

@Resolver(() => Collection)
export default class CollectionResolver {
  //* Repositories
  constructor(
    @InjectRepository(Collection)
    private collectionRepository: Repository<Collection>
  ) {}

  // * Read from CSV to JSON
  async readCollectionsCsvFileToJson(): Promise<CollectionData[]> {
    const importedCollectionData: CollectionData[] = [];

    fs.createReadStream(
      path.resolve(__dirname, '../../..', 'data', 'collections.csv')
    )
      .pipe(csv.parse({ headers: true }))
      .on('error', (error) => console.error(error))
      .on('data', (row) => {
        const collection: CollectionData = {
          id: parseInt(row.id),
          sortIndex: parseInt(row.sortIndex),
          name: row.name,
          description: row.description,
        };
        importedCollectionData.push(collection);
      })
      .on('end', async () => {
        console.log(
          `Finished importing data for ${importedCollectionData.length} collections.`
        );
      });
    return importedCollectionData;
  }

  // * Update existing Collections
  async updateCollections(toUpdate: CollectionData[]) {
    console.log(`4. Updating ${toUpdate.length} existing collections.`);

    toUpdate.forEach(async (x) => {
      let collectionToUpdate = await this.collectionRepository.findOne({
        id: x.id,
      });
      collectionToUpdate = Object.assign(collectionToUpdate, x);

      await this.collectionRepository.save(collectionToUpdate);
    });
  }

  // * Insert New Collection
  async insertCollections(toInsert: CollectionData[]) {
    console.log(`4. Inserting ${toInsert.length} new collections.`);

    toInsert.forEach(async (x) => {
      const newCollection = this.collectionRepository.create({ ...x });

      await this.collectionRepository.insert(newCollection);
      await this.collectionRepository.save(newCollection);
    });
  }

  //* Update from CSV
  @Mutation(() => UpdateCollectionsFromCsvResponse)
  async updateCollectionsFromCsv(): Promise<UpdateCollectionsFromCsvResponse> {
    const importedCollectionData = await this.readCollectionsCsvFileToJson();
    if (importedCollectionData) {
      console.log(
        `1. imported data for ${importedCollectionData.length} collections.`
      );
    }

    //* get all ids
    const existingCollections: Collection[] = await this.collectionRepository.find();
    const existingCollectionIds = existingCollections.map((x) => x.id);
    console.log(
      `2. collected ids for ${existingCollectionIds.length} existing collections.`
    );

    //* seperate insert and update
    const toUpdate = importedCollectionData.filter((x) =>
      existingCollectionIds.includes(x.id)
    );
    const toInsert = importedCollectionData.filter(
      (x) => !existingCollectionIds.includes(x.id)
    );

    console.log(
      `3. separated imported csv data into:\n${toUpdate.length} to update\n${toInsert.length} to insert`
    );

    await this.updateCollections(toUpdate);
    await this.insertCollections(toInsert);

    console.log(`6. returning results.`);
    return {
      success: true,
      message: `Inserted: ${toInsert.length}\nUpdated: ${toUpdate.length}`,
      inserted: toInsert.length,
      updated: toUpdate.length,
    };
  }
}
