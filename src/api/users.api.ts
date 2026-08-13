import { api } from '@papi/api';

import { rtkTags } from '../constants/tags.constants';
import type { User } from '../types/interfaces/user.interfaces';
import type { CreateUserPayload } from '../types/types/user.types';

export const usersApi = api.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<User[], void>({
      query: () => '/users',
      providesTags: [rtkTags.user],
    }),
    createUser: build.mutation<User, CreateUserPayload>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: [rtkTags.user],
    }),
    deleteUser: build.mutation<void, string>({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: [rtkTags.user],
      extraOptions: { showSuccessMessage: { id: 'user deleted' } },
    }),
    failRequest: build.mutation<void, void>({
      query: () => ({ url: '/users', params: { fail: 500 } }),
    }),
  }),
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useDeleteUserMutation,
  useFailRequestMutation,
} = usersApi;
