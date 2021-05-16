import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import { Field, Int, Mutation, ObjectType, Resolver } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import SuccessMessageResponse from '../../abstract/SuccessMessageResponse';
import Tag from '../../entities/Tag';

type TagData = {
  id: number;
  sortIndex: number;
  name: string;
  description: string;
};

@ObjectType()
class UpdateTagsFromCsvResponse extends SuccessMessageResponse {
  @Field(() => Int, { nullable: true })
  updated?: number;

  @Field(() => Int, { nullable: true })
  inserted?: number;
}

@Resolver(() => Tag)
export default class TagResolver {
  //* Repositories
  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>
  ) {}

  // * Read from CSV to JSON
  async readTagsCsvFileToJson(): Promise<TagData[]> {
    const importedTagData: TagData[] = [];

    fs.createReadStream(path.resolve(__dirname, '../../..', 'data', 'tags.csv'))
      .pipe(csv.parse({ headers: true }))
      .on('error', (error) => console.error(error))
      .on('data', (row) => {
        const tag: TagData = {
          id: parseInt(row.id),
          sortIndex: parseInt(row.sortIndex),
          name: row.name,
          description: row.description,
        };
        importedTagData.push(tag);
      })
      .on('end', async () => {
        console.log(
          `Finished importing data for ${importedTagData.length} tags.`
        );
      });
    return importedTagData;
  }

  // * Update existing Tags
  async updateTags(toUpdate: TagData[]) {
    console.log(`4. Updating ${toUpdate.length} existing tags.`);

    toUpdate.forEach(async (x) => {
      let tagToUpdate = await this.tagRepository.findOne({ id: x.id });
      tagToUpdate = Object.assign(tagToUpdate, x);

      await this.tagRepository.save(tagToUpdate);
    });
  }

  // * Insert New Tag
  async insertTags(toInsert: TagData[]) {
    console.log(`4. Inserting ${toInsert.length} new tags.`);

    toInsert.forEach(async (x) => {
      const newTag = this.tagRepository.create({ ...x });

      await this.tagRepository.insert(newTag);
      await this.tagRepository.save(newTag);
    });
  }

  //* Update from CSV
  @Mutation(() => UpdateTagsFromCsvResponse)
  async updateTagsFromCsv(): Promise<UpdateTagsFromCsvResponse> {
    const importedTagData = await this.readTagsCsvFileToJson();
    if (importedTagData) {
      console.log(`1. imported data for ${importedTagData.length} tags.`);
    }

    //* get all ids
    const existingTags: Tag[] = await this.tagRepository.find();
    const existingTagIds = existingTags.map((x) => x.id);
    console.log(`2. collected ids for ${existingTagIds.length} existing tags.`);

    //* seperate insert and update
    const toUpdate = importedTagData.filter((x) =>
      existingTagIds.includes(x.id)
    );
    const toInsert = importedTagData.filter(
      (x) => !existingTagIds.includes(x.id)
    );

    console.log(
      `3. separated imported csv data into:\n${toUpdate.length} to update\n${toInsert.length} to insert`
    );

    await this.updateTags(toUpdate);
    await this.insertTags(toInsert);

    console.log(`6. returning results.`);
    return {
      success: true,
      message: `Inserted: ${toInsert.length}\nUpdated: ${toUpdate.length}`,
      inserted: toInsert.length,
      updated: toUpdate.length,
    };
  }
}
