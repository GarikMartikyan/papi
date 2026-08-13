import type { Permission } from './enums/permissions.enums';

declare global {
  namespace Papi {
    interface Permissions {
      values: Permission;
    }
  }
}
