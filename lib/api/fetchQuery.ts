import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { getApiBaseUrl } from '../services/env.service';
import { getAccessTokenLS } from '../services/localStorage.service';

/**
 * Заголовки, одинаковые для каждого запроса панели.
 *
 * Токен читается из хранилища, а не из стора: `prepareHeaders` вызывается вне
 * React, до стора ему не дотянуться. Читается он заново каждый раз — токен
 * появляется после входа, меняется на каждой ротации и исчезает после выхода.
 */
const prepareHeaders = (headers: Headers): Headers => {
  const token = getAccessTokenLS();

  if (token !== null && token !== '') {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
};

/**
 * Голый запрос: адрес, заголовок с токеном и разбор ответа — и ничего больше.
 *
 * Отдельным модулем, а не константой внутри `baseQuery`, ради `refreshSession`:
 * он ходит за новой парой токенов этим же транспортом, но **мимо**
 * `papiBaseQuery` — иначе 401 от самой ротации запускал бы ротацию, и так до
 * упора. Лежи он в `baseQuery`, два модуля импортировали бы друг друга по кругу.
 *
 * Адрес читается один раз, при загрузке модуля: `VITE_API_BASE_URL` Vite
 * подставляет в сборку константой, и меняться на рантайме ему негде.
 */
export const fetchQuery = fetchBaseQuery({ baseUrl: getApiBaseUrl(), prepareHeaders });
