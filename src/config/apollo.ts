import 'reflect-metadata';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { Container } from 'typedi';
import { useContainer } from 'typeorm';
import { connectToLocalDB } from './database';
import { authChecker } from '../utils/auth-checker';
import path from 'path';
// import { connectToRemoteDB } from './database';

export default async function () {
  useContainer(Container);

  await connectToLocalDB();
  // await connectToRemoteDB();

  console.log(`${__dirname}`);

  const pathname = path.join(
    __dirname,
    '../..',
    'src/graphql/resolvers/**/*.{ts,js}'
  );

  const schema = await buildSchema({
    resolvers: [pathname],

    emitSchemaFile: {
      path: __dirname + '/schema.gql',
      commentDescriptions: true,
      sortedSchema: false,
    },
    container: Container,
    authChecker: authChecker,
  });

  return new ApolloServer({
    schema,
    introspection: true,
    playground: true,
    // context: ({ req }) => {
    //   const user = req.user || null;
    //   return { user };
    // },
  });
}
