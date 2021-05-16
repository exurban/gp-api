import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import { Field, Int, Mutation, ObjectType, Resolver } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import SuccessMessageResponse from '../../abstract/SuccessMessageResponse';
import Subject from '../../entities/Subject';

type SubjectData = {
  id: number;
  sortIndex: number;
  name: string;
  description: string;
};

@ObjectType()
class UpdateSubjectsFromCsvResponse extends SuccessMessageResponse {
  @Field(() => Int, { nullable: true })
  updated?: number;

  @Field(() => Int, { nullable: true })
  inserted?: number;
}

@Resolver(() => Subject)
export default class SubjectResolver {
  //* Repositories
  constructor(
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>
  ) {}

  // * Read from CSV to JSON
  async readSubjectsCsvFileToJson(): Promise<SubjectData[]> {
    const importedSubjectData: SubjectData[] = [];

    fs.createReadStream(
      path.resolve(__dirname, '../../..', 'data', 'subjects.csv')
    )
      .pipe(csv.parse({ headers: true }))
      .on('error', (error) => console.error(error))
      .on('data', (row) => {
        const subject: SubjectData = {
          id: parseInt(row.id),
          sortIndex: parseInt(row.sortIndex),
          name: row.name,
          description: row.description,
        };
        importedSubjectData.push(subject);
      })
      .on('end', async () => {
        console.log(
          `Finished importing data for ${importedSubjectData.length} subjects.`
        );
      });
    return importedSubjectData;
  }

  // * Update existing Subjects
  async updateSubjects(toUpdate: SubjectData[]) {
    console.log(`4. Updating ${toUpdate.length} existing subjects.`);

    toUpdate.forEach(async (x) => {
      let subjectToUpdate = await this.subjectRepository.findOne({ id: x.id });
      subjectToUpdate = Object.assign(subjectToUpdate, x);

      await this.subjectRepository.save(subjectToUpdate);
    });
  }

  // * Insert New Subjects
  async insertSubjects(toInsert: SubjectData[]) {
    console.log(`4. Inserting ${toInsert.length} new subjects.`);

    toInsert.forEach(async (x) => {
      const newSubject = this.subjectRepository.create({ ...x });

      await this.subjectRepository.insert(newSubject);
      await this.subjectRepository.save(newSubject);
    });
  }

  //* Update from CSV
  @Mutation(() => UpdateSubjectsFromCsvResponse)
  async updateSubjectsFromCsv(): Promise<UpdateSubjectsFromCsvResponse> {
    const importedSubjectData = await this.readSubjectsCsvFileToJson();
    if (importedSubjectData) {
      console.log(
        `1. imported data for ${importedSubjectData.length} subjects.`
      );
    }

    //* get all ids
    const existingSubjects: Subject[] = await this.subjectRepository.find();
    const existingSubjectIds = existingSubjects.map((x) => x.id);
    console.log(
      `2. collected ids for ${existingSubjectIds.length} existing subjects.`
    );

    //* seperate insert and update
    const toUpdate = importedSubjectData.filter((x) =>
      existingSubjectIds.includes(x.id)
    );
    const toInsert = importedSubjectData.filter(
      (x) => !existingSubjectIds.includes(x.id)
    );

    console.log(
      `3. separated imported csv data into:\n${toUpdate.length} to update\n${toInsert.length} to insert`
    );

    await this.updateSubjects(toUpdate);
    await this.insertSubjects(toInsert);

    console.log(`6. returning results.`);
    return {
      success: true,
      message: `Inserted: ${toInsert.length}\nUpdated: ${toUpdate.length}`,
      inserted: toInsert.length,
      updated: toUpdate.length,
    };
  }
}
