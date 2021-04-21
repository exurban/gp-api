import { AuthChecker } from 'type-graphql';

type UserToken = {
  iss: string;
  sub: string;
  aud: string[];
  iat: Date;
  exp: Date;
  azp: string;
  scope: string;
  gty: string;
};

type Context = {
  user: UserToken;
};

export const authChecker: AuthChecker<Context> = async (
  { context: { user } },
  roles
) => {
  console.log(`user ${user}`);
  console.log(`roles ${roles}`);
  return true;
};
