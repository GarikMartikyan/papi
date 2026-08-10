import type { MessageDescriptor } from 'react-intl';

import type { PapiApiError } from '../utils/apiError.util';
import { warn } from '../utils/logger.util';

/**
 * Пара показывателей тостов — всё, что `baseQuery` умеет попросить у antd.
 *
 * Успех принимает и строку, и дескриптор, потому что текст у него двух разных
 * происхождений. Строка пришла от бэкенда: она уже на языке пользователя, и
 * переводить её нечем. Дескриптор — строка ядра или панели, её перевести
 * нужно, и делает это показыватель: он один живёт внутри React, где есть intl.
 *
 * У ошибки то же деление, только внутри `PapiApiError`: там `message` и
 * `descriptor` лежат по отдельности.
 */
export interface ApiNotifiers {
  error: (error: PapiApiError) => void;
  success: (message: string | MessageDescriptor) => void;
}

let notifiers: ApiNotifiers | null = null;

/**
 * Мостик между `baseQuery` и antd.
 *
 * `baseQuery` — обычный модуль, он вызывается вне React и до всякого рендера,
 * а показывать тост нужно тем же `message`, что берётся из `App.useApp()`:
 * статический `message` из antd живёт вне `ConfigProvider` и остаётся без темы
 * и без локали. Поэтому инстанс кладёт сюда `ApiProvider`, а `baseQuery` берёт
 * его отсюда.
 *
 * Только для внутреннего пользования: в барель `api/index.ts` файл не входит.
 * Панель показывает свои сообщения через `App.useApp()` напрямую.
 */
export const setApiNotifiers = (next: ApiNotifiers | null): void => {
  notifiers = next;
};

/**
 * Показывает ошибку, если есть чем.
 *
 * Некому — пишем в консоль: провайдер не смонтирован, то есть либо панель
 * забыла `PapiProvider`, либо запрос ушёл раньше первого рендера. Молчать здесь
 * нельзя — ошибка исчезла бы бесследно.
 */
export const notifyApiError = (error: PapiApiError): void => {
  if (notifiers === null) {
    warn(`API error with no one to show it: ${error.message ?? error.descriptor.id}`);
    return;
  }

  notifiers.error(error);
};

/**
 * Показывает подтверждение удачной мутации, если есть чем.
 *
 * Провайдера нет — так же пишем в консоль. Пропажа тоста об успехе не так
 * заметна, как пропажа ошибки, но причина у обеих одна, и молчащая консоль
 * заставила бы искать её дважды.
 */
export const notifyApiSuccess = (message: string | MessageDescriptor): void => {
  if (notifiers === null) {
    warn(
      `API success with no one to show it: ${typeof message === 'string' ? message : message.id}`,
    );
    return;
  }

  notifiers.success(message);
};
