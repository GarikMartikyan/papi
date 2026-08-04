import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { getAccessTokenLS } from '../services/localStorage.service';

import { getApiBaseUrl } from './apiConfig';

const prepareHeaders = (headers: Headers): Headers => {
  const token = getAccessTokenLS();

  if (token !== null && token !== '') {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
};

/**
 * baseQuery ядра: адрес из окружения, токен из localStorage.
 *
 * Адрес читается один раз, при загрузке модуля: `VITE_API_BASE_URL` Vite
 * подставляет в сборку константой, и меняться на рантайме ему негде. Токен —
 * наоборот, на каждом запросе: он появляется после входа и исчезает после
 * выхода, а `prepareHeaders` вызывается заново каждый раз.
 */
export const papiBaseQuery = fetchBaseQuery({ baseUrl: getApiBaseUrl(), prepareHeaders });
