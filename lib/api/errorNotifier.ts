import type { PapiApiError } from '../utils/apiError.util';
import { warn } from '../utils/logger.util';

type ApiErrorNotifier = (error: PapiApiError) => void;

let notifier: ApiErrorNotifier | null = null;

/**
 * Мостик между `baseQuery` и antd.
 *
 * `baseQuery` — обычный модуль, он вызывается вне React и до всякого рендера,
 * а показывать ошибку нужно тем же `message`, что берётся из `App.useApp()`:
 * статический `message` из antd живёт вне `ConfigProvider` и остаётся без темы
 * и без локали. Поэтому инстанс кладёт сюда `ApiProvider`, а `baseQuery` берёт
 * его отсюда.
 *
 * Только для внутреннего пользования: в барель `api/index.ts` файл не входит.
 * Панель показывает свои сообщения через `App.useApp()` напрямую.
 */
export const setApiErrorNotifier = (next: ApiErrorNotifier | null): void => {
  notifier = next;
};

/**
 * Показывает ошибку, если есть чем.
 *
 * Некому — пишем в консоль: провайдер не смонтирован, то есть либо панель
 * забыла `PapiProvider`, либо запрос ушёл раньше первого рендера. Молчать здесь
 * нельзя — ошибка исчезла бы бесследно.
 */
export const notifyApiError = (error: PapiApiError): void => {
  if (notifier === null) {
    warn(`API error with no one to show it: ${error.message ?? error.descriptor.id}`);
    return;
  }

  notifier(error);
};
