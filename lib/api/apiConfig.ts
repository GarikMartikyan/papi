import { warn } from '../utils/logger.util';

export interface ApiConfig {
  /** Префикс, который приписывается ко всем путям эндпоинтов. */
  baseUrl: string;
}

const FALLBACK_BASE_URL = '/';

let currentBaseUrl = FALLBACK_BASE_URL;
let isConfigured = false;
let hasWarned = false;

/** Ставится один раз из `configureApi` на старте панели. */
export const setApiConfig = (config: ApiConfig): void => {
  currentBaseUrl = config.baseUrl;
  isConfigured = true;
};

/**
 * Читается в момент запроса, а не при создании `baseApi`.
 *
 * Стор ядра — синглтон и создаётся при импорте, то есть раньше, чем панель
 * успевает вызвать `configureApi`. Запросы же уходят после монтирования, когда
 * адрес уже известен, поэтому здесь ловушки порядка нет.
 */
export const getApiConfig = (): ApiConfig => {
  if (!isConfigured && !hasWarned) {
    hasWarned = true;
    warn(`configureApi was not called — requests will go to "${FALLBACK_BASE_URL}".`);
  }

  return { baseUrl: currentBaseUrl };
};
