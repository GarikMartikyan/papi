import { type ApiConfig, setApiConfig } from './apiConfig';
import { baseApi } from './baseApi';

export interface ConfigureApiParams<Tags extends readonly string[]> extends ApiConfig {
  /**
   * Теги кеша панели.
   *
   * Передаются здесь, а не в каждом файле эндпоинтов, потому что `createApi`
   * фиксирует набор тегов при создании: расширить его можно только
   * `enhanceEndpoints`, и результат — новый тип api.
   */
  tagTypes?: Tags;
}

/**
 * Настройка api для панели: адрес и теги кеша.
 *
 * Возвращает api уже с этими тегами. Эндпоинты добавляются к результату, а не к
 * `baseApi`: в рантайме это тот же объект, но теги расширяются только на уровне
 * типов — через `baseApi` TS не пропустит их в `providesTags`.
 *
 * Вызывается один раз на старте, до первого запроса.
 */
export const configureApi = <const Tags extends readonly string[] = []>(
  params: ConfigureApiParams<Tags>,
) => {
  const { baseUrl, tagTypes } = params;

  setApiConfig({ baseUrl });

  return baseApi.enhanceEndpoints<Tags[number]>({ addTagTypes: tagTypes ?? [] });
};
