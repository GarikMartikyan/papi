import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { getAccessTokenLS } from '../services/localStorage.service';

import { getApiConfig } from './apiConfig';

type FetchQuery = ReturnType<typeof fetchBaseQuery>;

const prepareHeaders = (headers: Headers): Headers => {
  const token = getAccessTokenLS();

  if (token !== null && token !== '') {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
};

/**
 * `fetchBaseQuery` принимает `baseUrl` строкой, а не функцией, поэтому запрос
 * пересобирается при смене адреса и переиспользуется, пока адрес тот же.
 */
let cached: { baseUrl: string; query: FetchQuery } | null = null;

const getFetchQuery = (): FetchQuery => {
  const { baseUrl } = getApiConfig();

  if (cached?.baseUrl !== baseUrl) {
    cached = { baseUrl, query: fetchBaseQuery({ baseUrl, prepareHeaders }) };
  }

  return cached.query;
};

/**
 * baseQuery ядра: адрес из `configureApi`, токен из localStorage.
 *
 * Обёртка нужна ровно затем, чтобы адрес читался в момент запроса — см.
 * `getApiConfig`.
 */
export const papiBaseQuery: FetchQuery = (args, api, extraOptions) => {
  return getFetchQuery()(args, api, extraOptions);
};
