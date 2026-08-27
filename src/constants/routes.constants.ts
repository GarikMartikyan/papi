import { papiRoutes } from '@papi/constants';

export const ROUTES = {
  ...papiRoutes,
  settings: '/settings',
} as const;
