import { api } from '@papi/api';

import type { CreateUserPayload, Session, User } from '../types/user.interface';

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
export const usersApi = api.enhanceEndpoints({ addTagTypes: ['User', 'Session'] }).injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<User[], void>({
      query: () => '/users',
      providesTags: ['User'],
    }),
    createUser: build.mutation<User, CreateUserPayload>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      // Список перезапросится сам — руками ничего инвалидировать не нужно.
      invalidatesTags: ['User'],
    }),
    deleteUser: build.mutation<void, string>({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['User'],
    }),
    getSession: build.query<Session, void>({
      query: () => '/session',
      providesTags: ['Session'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useDeleteUserMutation,
  useGetSessionQuery,
} = usersApi;
