import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import { Field, Int, Mutation, ObjectType, Resolver } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import SuccessMessageResponse from '../../abstract/SuccessMessageResponse';
import Location from '../../entities/Location';

type LocationData = {
  id: number;
  sortIndex: number;
  name: string;
  tag: string;
  description: string;
};

@ObjectType()
class UpdateLocationsFromCsvResponse extends SuccessMessageResponse {
  @Field(() => Int, { nullable: true })
  updated?: number;

  @Field(() => Int, { nullable: true })
  inserted?: number;
}

@Resolver(() => Location)
export default class LocationResolver {
  //* Repositories
  constructor(
    @InjectRepository(Location)
    private locationRepository: Repository<Location>
  ) {}

  //* Read from CSV to JSON
  async readLocationsCsvFileToJson(): Promise<LocationData[]> {
    const importedLocationData: LocationData[] = [];

    fs.createReadStream(
      path.resolve(__dirname, '../../..', 'data', 'locations.csv')
    )
      .pipe(csv.parse({ headers: true }))
      .on('error', (error) => console.error(error))
      .on('data', (row) => {
        const location: LocationData = {
          id: parseInt(row.id),
          sortIndex: parseInt(row.sortIndex),
          name: row.name,
          tag: row.tag,
          description: row.description,
        };
        importedLocationData.push(location);
      })
      .on('end', async () => {
        console.log(
          `Finished importing data for ${importedLocationData.length} locations.`
        );
      });
    return importedLocationData;
  }

  async updateLocations(toUpdate: LocationData[]) {
    console.log(`4. Updating ${toUpdate.length} existing locations.`);

    toUpdate.forEach(async (x) => {
      let locationToUpdate = await this.locationRepository.findOne({
        id: x.id,
      });
      locationToUpdate = Object.assign(locationToUpdate, x);

      await this.locationRepository.save(locationToUpdate);
    });
  }

  async insertLocations(toInsert: LocationData[]) {
    console.log(`4. Inserting ${toInsert.length} new locations.`);

    toInsert.forEach(async (x) => {
      const newLocation = this.locationRepository.create({ ...x });

      await this.locationRepository.insert(newLocation);
      await this.locationRepository.save(newLocation);
    });
  }

  //* Update from CSV
  @Mutation(() => UpdateLocationsFromCsvResponse)
  async updateLocationsFromCsv(): Promise<UpdateLocationsFromCsvResponse> {
    const importedLocationData = await this.readLocationsCsvFileToJson();
    if (importedLocationData) {
      console.log(
        `1. imported data for ${importedLocationData.length} locations.`
      );
    }

    //* get all ids
    const existingLocations: Location[] = await this.locationRepository.find();
    const existingLocationIds = existingLocations.map((x) => x.id);
    console.log(
      `2. collected ids for ${existingLocationIds.length} existing locations.`
    );

    //* seperate insert and update
    const toUpdate = importedLocationData.filter((x) =>
      existingLocationIds.includes(x.id)
    );
    const toInsert = importedLocationData.filter(
      (x) => !existingLocationIds.includes(x.id)
    );

    console.log(
      `3. separated imported csv data into:\n${toUpdate.length} to update\n${toInsert.length} to insert`
    );

    await this.updateLocations(toUpdate);
    await this.insertLocations(toInsert);

    console.log(`6. returning results.`);
    return {
      success: true,
      message: `Inserted: ${toInsert.length}\nUpdated: ${toUpdate.length}`,
      inserted: toInsert.length,
      updated: toUpdate.length,
    };
  }
}
