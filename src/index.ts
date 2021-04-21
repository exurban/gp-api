import 'reflect-metadata';
import app from './config/app';
import initServer from './config/apollo';

import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

(async () => {
  const port = process.env.PORT;
  const server = await initServer();

  server.applyMiddleware({ path: '/api', app });

  app.listen({ port }, () => {
    console.log(`Server started at http://localhost:${port}/api`);
  });
})();
