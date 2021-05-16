import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import { Field, Int, Mutation, ObjectType, Resolver } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import Print from '../../entities/Print';

type PrintData = {
  id: number;
  displayName: string;
  description: string;
  type: string;
  printSku: string;
  dimension1: number;
  dimension2: number;
  cost: number;
  shippingCost: number;
  basePrice: number;
  priceModifier: number;
};

@ObjectType()
class UpdatePrintsFromCsvResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => Int)
  updated: number;

  @Field(() => Int)
  inserted: number;
}

@Resolver(() => Print)
export default class PrintResolver {
  //* Repositories
  constructor(
    @InjectRepository(Print)
    private printRepository: Repository<Print>
  ) {}

  //* Update from CSV

  @Mutation(() => UpdatePrintsFromCsvResponse)
  async updatePrintsFromCsv(): Promise<UpdatePrintsFromCsvResponse> {
    const importedPrintData: PrintData[] = [];

    fs.createReadStream(
      path.resolve(__dirname, '../../..', 'data', 'prints.csv')
    )
      .pipe(csv.parse({ headers: true }))
      .on('error', (error) => console.error(error))
      .on('data', (row) => {
        const print: PrintData = {
          id: parseInt(row.id),
          displayName: row.displayName,
          description: row.description,
          type: row.type,
          printSku: row.printSku,
          dimension1: parseFloat(row.dimension1),
          dimension2: parseFloat(row.dimension2),
          cost: parseFloat(row.cost),
          shippingCost: parseFloat(row.shippingCost),
          basePrice: parseFloat(row.basePrice),
          priceModifier: parseFloat(row.priceModifier),
        };
        importedPrintData.push(print);
      })
      // .on('end', (rowCount: number) => console.log(`Parsed ${rowCount} rows`));
      .on('end', async () => {
        console.log(`imported ${importedPrintData.length}`);
        const first = importedPrintData[0];
        console.log(`First imported item: ${JSON.stringify(first, null, 2)}`);
      });
    //* get all ids
    const existingPrints: Print[] = await this.printRepository.find();
    let existingPrintIds: number[] = [];
    if (existingPrints) {
      existingPrintIds = existingPrints.map((x) => x.id);
      console.log(
        `existing print ${JSON.stringify(existingPrints[0], null, 2)}`
      );
    }

    //* seperate insert and update
    const toUpdate = importedPrintData.filter((x) =>
      existingPrintIds.includes(x.id)
    );
    const toInsert = importedPrintData.filter(
      (x) => !existingPrintIds.includes(x.id)
    );

    console.log(`updating: ${toUpdate.length}\ninserting:${toInsert.length}`);
    console.log(`first to update is ${JSON.stringify(toUpdate[0], null, 2)}`);

    //* insert new
    toInsert.forEach(async (x) => {
      console.log({ x });
      // console.log(`Inserting: ${JSON.stringify(x, null, 2)}`);
      const newPrint = await this.printRepository.create({
        ...x,
      });
      console.log({ newPrint });

      await this.printRepository.insert(newPrint);
      await this.printRepository.save(newPrint);
    });

    //* update existing
    toUpdate.forEach(async (x) => {
      console.log({ x });
      await this.printRepository.update(x.id, {
        ...x,
      });
    });

    return {
      success: true,
      updated: toUpdate.length,
      inserted: toInsert.length,
    };
  }
}
