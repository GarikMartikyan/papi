import { papiRoutes } from '@papi/constants';

export const ROUTES = {
  ...papiRoutes,
  users: '/users',
  settings: '/settings',
} as const;
