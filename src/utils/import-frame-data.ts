import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import { Pool } from 'pg';

type FrameData = {
  id: number;
  sort_index: number;
  cover_image_id: number | null;
  display_name: string;
  description: string;
  material: string;
  color: string;
  print_type: string;
  frame_sku: string;
  dimension1: number;
  dimension2: number;
  cost: number;
  base_price: number;
  price_modifier: number;
};

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'photos',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const frames: any[] = [];

fs.createReadStream(path.resolve(__dirname, '..', 'data', 'frames.csv'))
  .pipe(csv.parse({ headers: true }))
  .on('error', (error) => console.error(error))
  .on('data', (row) => {
    const frame: FrameData = {
      id: row.id,
      sort_index: parseInt(row.sort_index),
      cover_image_id: row.cover_image_id ? parseInt(row.cover_image_id) : null,
      display_name: row.display_name,
      description: row.description,
      material: row.material,
      color: row.color,
      print_type: row.print_type,
      frame_sku: row.frame_sku,
      dimension1: parseInt(row.dimension1),
      dimension2: parseInt(row.dimension2),
      cost: parseFloat(row.cost),
      base_price: parseFloat(row.base_price),
      price_modifier: parseFloat(row.price_modifier),
    };
    frames.push(frame);
  })
  // .on('end', (rowCount: number) => console.log(`Parsed ${rowCount} rows`));
  .on('end', () => {
    console.log(`finished.`);
    const query =
      'INSERT INTO frames (id, sort_index, cover_image_id, display_name, description, material, color, print_type, frame_sku, dimension1, dimension2, cost, base_price, price_modifier) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)';

    pool.connect((err, client, done) => {
      if (err) throw err;

      try {
        frames.forEach((frame) => {
          client.query(query, Object.values(frame), (err, res) => {
            if (err) {
              console.log(err.stack);
            } else {
              console.log('inserted ' + res.rowCount + ' row:', frame);
            }
          });
        });
      } finally {
        done();
      }
    });
  });
