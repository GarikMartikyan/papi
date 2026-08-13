import type { MessageKey } from '../hooks/useTranslation';

declare global {
  namespace FormatjsIntl {
    interface Message {
      ids: MessageKey;
    }
  }
}
