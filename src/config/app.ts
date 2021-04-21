import express from 'express';
import jwt from 'express-jwt';
import jwksClient from 'jwks-rsa';

import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();

const jwtCheck = jwt({
  secret: jwksClient.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${process.env.AUTH0_ISSUER}.well-known/jwks.json`,
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: process.env.AUTH0_ISSUER,
  algorithms: ['RS256'],
  credentialsRequired: false,
});

interface Error {
  code?: string;
}

app.use(
  jwtCheck,
  (
    err: Error,
    _req: express.Request,
    _res: express.Response,
    next: express.NextFunction
  ) => {
    if (err.code === 'invalid token') {
      return next();
    }
    return next(err);
  }
);

export default app;
