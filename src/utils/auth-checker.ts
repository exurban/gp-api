import { AuthChecker } from 'type-graphql';
import User from '../graphql/entities/User';

interface Context {
  user?: User;
}

export const authChecker: AuthChecker<Context> = (
  { context: { user } },
  roles
) => {
  if (roles.length === 0) {
    return user !== undefined;
  }

  if (!user) {
    return false;
  }

  if (user.roles.some((role) => roles.includes(role))) {
    return true;
  }

  return false;
};
