import { api } from '../api';

/**
 * Путь входа. Договорённость ядра, а не панели: экран входа тоже приходит из
 * ядра, и без общего пути он не знал бы, куда стучаться.
 *
 * Бэкенду с другим адресом или другим форматом ответа панель отдаёт свою
 * страницу входа через `loginElement` у `PapiRouter` — этот эндпоинт тогда
 * просто не используется.
 */
const LOGIN_PATH = '/auth/login';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  /** Токен доступа. Уходит в `Authorization: Bearer …` на каждом запросе. */
  token: string;
}

/**
 * Вход. Единственный эндпоинт, который ядро заводит само.
 *
 * `hideErrorMessage` — потому что ошибку показывает сама форма: тост поверх неё
 * накрыл бы поле, в которое пользователю и нужно вернуться.
 */
export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, LoginPayload>({
      query: (body) => ({ url: LOGIN_PATH, method: 'POST', body }),
      extraOptions: { hideErrorMessage: true },
    }),
  }),
});

export const { useLoginMutation } = authApi;
