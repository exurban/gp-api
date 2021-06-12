import 'reflect-metadata';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { Container } from 'typedi';

import { authChecker } from '../utils/auth-checker';
import jwt from 'jsonwebtoken';
import User from '../graphql/entities/User';
import path from 'path';
import { connectToLocalDB } from './database';
import { connectToRemoteDB } from './database';
import { ApolloServerPluginInlineTrace } from 'apollo-server-core';
import { useContainer } from 'typeorm';

interface ITokenPayload {
  id: number;
  email: string;
  iat: number;
}

// get the user info from a JWT token
const getUser = async (token: string): Promise<User | undefined> => {
  // verify token
  const decodedToken = jwt.verify(
    token,
    process.env.JWT_SECRET as jwt.Secret
  ) as ITokenPayload;
  if (decodedToken.id) {
    return await User.findOne({ id: decodedToken.id });
  } else {
    // user has a temp token after first signin. Let's replace it with a regular userId token
    console.error(`REQUEST HAS TEMPORARY JWT TOKEN.`);
  }
  return undefined;
};

export default async function () {
  useContainer(Container);

  if (process.env.NODE_ENV === 'production') {
    await connectToRemoteDB();
  } else {
    await connectToLocalDB();
  }

  const pathname = path.join(__dirname, '..', 'graphql/resolvers/**/*.{ts,js}');

  const schema = await buildSchema({
    resolvers: [pathname],

    emitSchemaFile: {
      path: __dirname + '/graphql/schema.gql',
      commentDescriptions: true,
      sortedSchema: true,
    },
    container: Container,
    authChecker: authChecker,
  });

  return new ApolloServer({
    schema,
    introspection: true,
    playground: true,
    plugins: [ApolloServerPluginInlineTrace()],
    context: async ({ req }) => {
      // let user;

      if (
        req.headers.authorization &&
        req.headers.authorization.split(' ')[0] === 'Bearer'
      ) {
        const token = req.headers.authorization.split(' ')[1] as string;
        // user = await getUser(token);
        const user = await getUser(token);
        return { req, user };
      }

      return { req };
    },
  });
}
