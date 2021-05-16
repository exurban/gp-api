import 'reflect-metadata';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { Container } from 'typedi';

import { authChecker } from '../utils/auth-checker';
import path from 'path';
import { connectToLocalDB } from './database';
import { connectToRemoteDB } from './database';
import { ApolloServerPluginInlineTrace } from 'apollo-server-core';
import { useContainer } from 'typeorm';

export default async function () {
  useContainer(Container);

  if (process.env.NODE_ENV === 'production') {
    await connectToRemoteDB();
  } else {
    await connectToLocalDB();
  }

  const dirName = path.join(__dirname);
  console.log(`dirName is ${dirName}`);

  const pathname = path.join(__dirname, '..', 'graphql/resolvers/**/*.{ts,js}');

  console.log(`resolvers are at: ${pathname}`);

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
    plugins: [ApolloServerPluginInlineTrace()],
    // context: ({ req }) => {
    //   const user = req.user || null;
    //   return { user };
    // },
  });
}
