import type { rtkTags } from '../constants/tags.constants';

declare global {
  namespace Papi {
    interface ApiTags {
      values: (typeof rtkTags)[keyof typeof rtkTags];
    }
  }
}
