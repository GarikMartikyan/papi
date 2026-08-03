import type { CreateUserPayload, Session, User } from '../types/user.interface';

import { api } from './api';

/**
 * Эндпоинты панели дописываются в api ядра.
 *
 * `api`, а не `baseApi` из papi: теги `User`/`Session` объявлены в
 * `configureApi`, и только у его результата они есть в типах.
 */
export const usersApi = api.injectEndpoints({
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
