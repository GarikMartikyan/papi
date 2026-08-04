import {
  type BaseQueryFn,
  type FetchArgs,
  fetchBaseQuery,
  type FetchBaseQueryError,
  type FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query/react';

import { getApiBaseUrl } from '../services/env.service';
import { getAccessTokenLS } from '../services/localStorage.service';
import { loggedOut } from '../store/slices/auth.slice';
import { toApiError, UNAUTHORIZED_STATUS } from '../utils/apiError.util';

import { notifyApiError } from './errorNotifier';

/** Настройки, которые эндпоинт передаёт baseQuery через `extraOptions`. */
export interface PapiQueryExtraOptions {
  /**
   * Не показывать тост на ошибку.
   *
   * Для мест, где ошибку показывает сама страница: форма входа с подписью под
   * полем, таблица с пустым состоянием. Тост там дублировал бы то, что уже
   * видно, — и накрывал бы собой поле, в которое нужно вернуться.
   */
  silent?: boolean;
}

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
 * baseQuery ядра: запрос, разбор ошибки и реакция на неё.
 *
 * Обёртка вокруг `fetchBaseQuery`, а не свой транспорт: сам запрос делает он,
 * здесь только то, что должно случаться одинаково на всех запросах панели.
 *
 * Ошибка при этом продолжает возвращаться вызывающему как обычно. Показ — не
 * замена обработке: странице по-прежнему приходит `isError`, и она вправе
 * нарисовать своё пустое состояние.
 */
export const papiBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  PapiQueryExtraOptions,
  FetchBaseQueryMeta
> = async (args, api, extraOptions) => {
  const result = await fetchQuery(args, api, extraOptions);

  if (result.error === undefined) return result;

  const error = toApiError(result.error);

  /*
   * 401 — токен протух или отозван. Убираем его здесь, а не в интерфейсе: с
   * этого момента он всё равно не работает, а `PapiRouter` следит за стором и
   * уводит на вход сам, откуда бы запрос ни ушёл.
   */
  if (error.status === UNAUTHORIZED_STATUS) api.dispatch(loggedOut());

  if (extraOptions?.silent !== true) notifyApiError(error);

  return result;
};
