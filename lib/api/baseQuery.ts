import {
  type BaseQueryFn,
  type FetchArgs,
  fetchBaseQuery,
  type FetchBaseQueryError,
  type FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query/react';
import type { MessageDescriptor } from 'react-intl';

import { papiMessage } from '../i18n/messages';
import { getApiBaseUrl } from '../services/env.service';
import { getAccessTokenLS } from '../services/localStorage.service';
import { loggedOut } from '../store/slices/auth.slice';
import { type PapiApiError, toApiError, UNAUTHORIZED_STATUS } from '../utils/apiError.util';
import { readApiMessage } from '../utils/apiMessage.util';

import { notifyApiError, notifyApiSuccess } from './notifier';

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
   * показывается «Готово» ядра. Для ручек, которые сами говорят, что сделали.
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

const prepareHeaders = (headers: Headers): Headers => {
  const token = getAccessTokenLS();

  if (token !== null && token !== '') {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
};

/**
 * Адрес читается один раз, при загрузке модуля: `VITE_API_BASE_URL` Vite
 * подставляет в сборку константой, и меняться на рантайме ему негде. Токен —
 * наоборот, на каждом запросе: он появляется после входа и исчезает после
 * выхода, а `prepareHeaders` вызывается заново каждый раз.
 */
const fetchQuery = fetchBaseQuery({ baseUrl: getApiBaseUrl(), prepareHeaders });

/**
 * baseQuery ядра: запрос, разбор ответа и реакция на него.
 *
 * Обёртка вокруг `fetchBaseQuery`, а не свой транспорт: сам запрос делает он,
 * здесь только то, что должно случаться одинаково на всех запросах панели.
 *
 * Ответ при этом продолжает возвращаться вызывающему как обычно. Показ — не
 * замена обработке: странице по-прежнему приходит и `isError`, и `data`, и она
 * вправе нарисовать своё пустое состояние.
 */
export const papiBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  PapiQueryExtraOptions,
  FetchBaseQueryMeta
> = async (args, api, extraOptions) => {
  const result = await fetchQuery(args, api, extraOptions);

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

  /*
   * 401 — токен протух или отозван. Убираем его здесь, а не в интерфейсе: с
   * этого момента он всё равно не работает, а `PapiRouter` следит за стором и
   * уводит на вход сам, откуда бы запрос ни ушёл.
   */
  if (error.status === UNAUTHORIZED_STATUS) api.dispatch(loggedOut());

  const shown = resolveError(extraOptions?.hideErrorMessage, error);

  if (shown !== undefined) notifyApiError(shown);

  return result;
};
