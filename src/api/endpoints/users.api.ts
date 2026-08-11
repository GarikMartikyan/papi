import { api } from '@papi/api';

import type { CreateUserPayload, Session, User } from '../../types/user.interface';
import { APP_API_TAGS } from '../tags.constants';

/**
 * Эндпоинты панели дописываются в api ядра.
 *
 * Теги объявляются здесь же: `createApi` внутри ядра фиксирует их набор при
 * создании, и расширить его можно только `enhanceEndpoints`. Эндпоинты идут
 * к его результату, а не к `api` напрямую, — в рантайме это тот же объект, но
 * через `api` TS не пропустит `User` и `Session` в `providesTags`.
 *
 * Понадобится инвалидировать тег из другого файла — его нужно перечислить и в
 * `addTagTypes` здесь.
 */
export const usersApi = api
  .enhanceEndpoints({ addTagTypes: [APP_API_TAGS.user, APP_API_TAGS.session] })
  .injectEndpoints({
    endpoints: (build) => ({
      getUsers: build.query<User[], void>({
        query: () => '/users',
        providesTags: [APP_API_TAGS.user],
      }),
      createUser: build.mutation<User, CreateUserPayload>({
        query: (body) => ({ url: '/users', method: 'POST', body }),
        // Список перезапросится сам — руками ничего инвалидировать не нужно.
        invalidatesTags: [APP_API_TAGS.user],
      }),
      deleteUser: build.mutation<void, string>({
        query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
        invalidatesTags: [APP_API_TAGS.user],
        /*
         * Тост об успехе показывает ядро, а не страница: удаление подтверждается
         * одинаково, откуда бы его ни запустили, и держать эту строку в
         * обработчике значит писать её заново в каждом новом месте.
         *
         * Дескриптор, а не `true`: `true` показал бы текст мока или «Готово»
         * ядра, а сказать нужно, что удалён именно пользователь. И не готовая
         * строка: ключ здесь сам выглядит текстом, и объект — единственное, чем
         * одно отличается от другого.
         */
        extraOptions: { showSuccessMessage: { id: 'user deleted' } },
      }),
      getSession: build.query<Session, void>({
        query: () => '/session',
        providesTags: [APP_API_TAGS.session],
      }),
      /*
       * TODO: заглушка для проверки тоста ошибки — удалить вместе с кнопкой в
       * `UsersPage` и строкой `fail a request`, когда появится настоящий
       * бэкенд.
       *
       * `?fail=500` понимает любая ручка мока из `tmp/`: она отвечает 500 с
       * текстом в `message`, и этот текст показывает тост ядра.
       *
       * Мутация, а не запрос: у мутации нет кеша, поэтому кнопка стреляет на
       * каждое нажатие. Метод не указан — уходит GET: промахнись флаг мимо мока,
       * ответом будет список пользователей, а не созданный по ошибке пользователь.
       */
      failRequest: build.mutation<void, void>({
        query: () => ({ url: '/users', params: { fail: 500 } }),
      }),
    }),
  });

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useDeleteUserMutation,
  useGetSessionQuery,
  useFailRequestMutation,
} = usersApi;
