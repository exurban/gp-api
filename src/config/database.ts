import { createConnection } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import 'reflect-metadata';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

export const connectToLocalDB = async () => {
  console.log(`Connecting to local db...`);
  const connection = await createConnection({
    type: 'postgres',
    synchronize: true,
    logging: false,
    namingStrategy: new SnakeNamingStrategy(),
    name: 'default',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'photos',
    entities: [
      'src/graphql/entities/*{.ts,.js}',
      'build/graphql/entities/*{.ts,.js}',
    ],
  });

  if (connection) {
    console.log(`Connected to local db.`);
  }
};

export const connectToRemoteDB = async () => {
  console.log(`connecting to remote at ${process.env.DATABASE_URL}`);
  const connection = await createConnection({
    type: 'postgres',
    synchronize: true,
    logging: false,
    namingStrategy: new SnakeNamingStrategy(),
    name: 'default',
    url: process.env.DATABASE_URL,
    ssl: true,
    extra: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
    entities: ['build/graphql/entities/*{.ts,.js}'],
  });

  if (connection) {
    console.log(`Connected to remote db.`);
  }
};
