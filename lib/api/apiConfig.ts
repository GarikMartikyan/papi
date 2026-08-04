import { warn } from '../utils/logger.util';

/** Без переменной запросы уходят на тот же origin, откуда открыта панель. */
const FALLBACK_BASE_URL = '/';

/**
 * Про ненастроенное окружение сообщаем один раз. `baseQuery` спрашивает адрес
 * однажды, при загрузке модуля, но панель вправе позвать `getApiBaseUrl` и на
 * рендере — тогда без флага одинаковая строка забила бы консоль.
 */
let hasWarned = false;

/**
 * Префикс, который приписывается ко всем путям эндпоинтов.
 *
 * Берётся из окружения, а не из вызова панели: адрес известен на сборке и на
 * рантайме не меняется, а второе место, где его можно задать, рано или поздно
 * разойдётся с `.env` — и разойдётся молча.
 *
 * Переменная объявлена в `lib/vite-env.d.ts`, значение по умолчанию —
 * в `.env.example`.
 *
 * Выходит наружу, потому что адрес нужен и вне RTK Query — на ссылку в новой
 * вкладке или на `src` картинки. Собирать его там из переменной заново значит
 * завести второй источник правды.
 */
export const getApiBaseUrl = (): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  if (baseUrl === undefined || baseUrl === '') {
    if (!hasWarned) {
      hasWarned = true;
      warn(`VITE_API_BASE_URL is not set — requests will go to "${FALLBACK_BASE_URL}".`);
    }

    return FALLBACK_BASE_URL;
  }

  return baseUrl;
};
