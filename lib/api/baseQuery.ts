import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query/react';
import type { MessageDescriptor } from 'react-intl';

import { papiMessage } from '../i18n/messages';
import { type PapiApiError, toApiError, UNAUTHORIZED_STATUS } from '../utils/apiError.util';
import { readApiMessage } from '../utils/apiMessage.util';

import { fetchQuery } from './fetchQuery';
import { notifyApiError, notifyApiSuccess } from './notifier';
import { refreshSession } from './refreshSession';

/**
 * Настройки, которые эндпоинт передаёт baseQuery через `extraOptions`.
 *
 * Умолчания у двух тостов разные, и это не случайность. Ошибку человек не
 * ждёт: она приходит вместо результата, и не сказать о ней — оставить его перед
 * экраном, который просто не изменился. Успех он, наоборот, и так видит —
 * строка в таблице появилась, форма закрылась, — и тост об этом чаще всего
 * лишний. Поэтому ошибка показывается всегда, пока её не выключат, а успех
 * молчит, пока его не попросят.
 */
export interface PapiQueryExtraOptions {
  /**
   * Убрать обычный тост на ошибку — совсем или заменив его текст.
   *
   * `true` — не показывать ничего. Для мест, где ошибку показывает сама
   * страница: форма входа с подписью под полем, таблица с пустым состоянием.
   * Тост там дублировал бы то, что уже видно, — и накрывал бы собой поле, в
   * которое нужно вернуться.
   *
   * Дескриптор — своя строка вместо разобранного ответа: она и покажется, а
   * текст бэкенда и строка ядра под статус не смотрятся вовсе. Для ручек, у
   * которых любая неудача значит для человека одно и то же, как бы бэкенд её ни
   * назвал.
   *
   * Не задан или `false` — обычный тост ядра: текст бэкенда, а нет его — строка
   * под статус ответа.
   */
  hideErrorMessage?: boolean | MessageDescriptor;
  /**
   * Показать тост на удачный ответ. Только для мутаций — см. `papiBaseQuery`.
   *
   * `true` — текст берётся из поля `message` в теле ответа, а нет его —
   * показывается «Готово» ядра. Для ручек, которые сами говорят, что сделали;
   * на само «Готово» полагаться не стоит — оно одинаково на создание, удаление
   * и сохранение, и человеку не сообщает ничего.
   *
   * Дескриптор — своя строка эндпоинта, она и покажется; текст бэкенда в этом
   * случае не смотрится вовсе. Так пишется точная формулировка вроде
   * «Пользователь создан», которой ядро знать не может.
   *
   * Дескриптор, а не готовая строка, потому что `extraOptions` задаются на
   * определении эндпоинта — вне React и до первого рендера, где перевести
   * нечем. Переводится строка в момент показа.
   *
   * И потому, что готовая строка здесь тоже бывает — та, что пришла от бэкенда
   * по `true`. Ключ у нас сам выглядит текстом, так что различить их можно
   * только по форме: объект идёт в `t`, строка показывается как есть.
   */
  showSuccessMessage?: boolean | MessageDescriptor;
}

/**
 * Ошибка в том виде, в каком её показывать, — или `undefined`, когда показывать
 * её не просили.
 *
 * Своя строка встаёт на место `descriptor`, а `message` при этом убирается:
 * показыватель предпочитает текст бэкенда своему, и оставленный он перебил бы
 * ровно ту строку, ради которой проп и передали.
 */
const resolveError = (
  hideErrorMessage: PapiQueryExtraOptions['hideErrorMessage'],
  error: PapiApiError,
): PapiApiError | undefined => {
  if (hideErrorMessage === true) return undefined;

  if (hideErrorMessage === undefined || hideErrorMessage === false) return error;

  return { ...error, message: undefined, descriptor: hideErrorMessage };
};

/**
 * Текст тоста об успехе — или `undefined`, когда показывать нечего.
 */
const resolveSuccess = (
  showSuccessMessage: PapiQueryExtraOptions['showSuccessMessage'],
  data: unknown,
): string | MessageDescriptor | undefined => {
  if (showSuccessMessage === undefined || showSuccessMessage === false) return undefined;

  if (showSuccessMessage !== true) return showSuccessMessage;

  return readApiMessage(data) ?? papiMessage('done');
};

/** Пути сессии: их 401 значит «неверные данные», а не «токен протух». */
const SESSION_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

/**
 * Стоит ли пытаться продлить сессию, получив от этого запроса 401.
 *
 * На самих ручках сессии — нет. Их 401 отвечает не про токен доступа: на входе
 * это неверный пароль, а на ротации — конец сессии, и `refreshSession` уже
 * сделал из этого выводы. Пустить их по общему пути значило бы отвечать на
 * неверный пароль попыткой продлить сессию, которой ещё нет.
 */
const isSessionRequest = (args: string | FetchArgs): boolean => {
  const url = typeof args === 'string' ? args : args.url;

  return SESSION_PATHS.some((path) => url.startsWith(path));
};

/**
 * baseQuery ядра: запрос, разбор ответа и реакция на него.
 *
 * Обёртка вокруг `fetchQuery`, а не свой транспорт: сам запрос делает он,
 * здесь только то, что должно случаться одинаково на всех запросах панели.
 *
 * Ответ при этом продолжает возвращаться вызывающему как обычно. Показ — не
 * замена обработке: странице по-прежнему приходит и `isError`, и `data`, и она
 * вправе нарисовать своё пустое состояние.
 *
 * Панель его не подключает — он уже стоит в `api` ядра. Сюда стоит заглядывать
 * за тем, что происходит с запросом само: продление сессии по 401 с повтором
 * запроса и тосты на ошибку и на успех.
 *
 * @param args Адрес запроса или объект `FetchArgs` — то, что вернул `query`
 * эндпоинта.
 * @param api Контекст RTK Query: `dispatch`, `getState`, тип операции.
 * @param extraOptions Настройки эндпоинта — см. `PapiQueryExtraOptions`.
 * @returns Ответ `fetchBaseQuery` как есть: `{ data }` или `{ error }`.
 * @example
 * ```ts
 * // Настройки читаются отсюда, а задаются на эндпоинте:
 * createUser: build.mutation<User, UserPayload>({
 *   query: (body) => ({ url: '/users', method: 'POST', body }),
 *   extraOptions: { showSuccessMessage: { id: 'user created' } },
 * });
 * ```
 */
export const papiBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  PapiQueryExtraOptions,
  FetchBaseQueryMeta
> = async (args, api, extraOptions) => {
  let result = await fetchQuery(args, api, extraOptions);

  /*
   * 401 — токен доступа истёк или отозван. Он живёт минуты, поэтому это
   * рутинный ответ, а не конец сессии: меняем пару токенов и повторяем запрос,
   * и вызывающий не узнаёт, что запрос ушёл дважды.
   *
   * Ротация одна на все запросы сразу — см. `refreshSession`. Не вышло — она же
   * и завершает сессию, поэтому отдельной ветки под выход здесь нет: результат
   * с 401 просто едет дальше, к тосту, а `PapiRouter` уводит на вход.
   */
  if (result.error?.status === UNAUTHORIZED_STATUS && !isSessionRequest(args)) {
    if (await refreshSession(api)) {
      result = await fetchQuery(args, api, extraOptions);
    }
  }

  if (result.error === undefined) {
    /*
     * Успех показывается только на мутациях. У запроса ответ приходит не один
     * раз: на первом рендере, на возврате фокуса в окно, на каждой инвалидации
     * тега, — и тост на них сообщал бы «готово» там, где человек ничего не
     * делал. Мутация же случается ровно от его действия, и подтверждать есть
     * что.
     */
    if (api.type === 'mutation') {
      const success = resolveSuccess(extraOptions?.showSuccessMessage, result.data);

      if (success !== undefined) notifyApiSuccess(success);
    }

    return result;
  }

  const error = toApiError(result.error);

  const shown = resolveError(extraOptions?.hideErrorMessage, error);

  if (shown !== undefined) notifyApiError(shown);

  return result;
};
