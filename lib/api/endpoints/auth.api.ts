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

/** Что форма входа отправляет на `POST /auth/login`. */
export interface LoginPayload {
  /** Почта пользователя — она же логин. */
  email: string;
  /** Пароль как есть: шифрует его канал, а не панель. */
  password: string;
}

/** Что бэкенд отвечает на удачный вход. */
export interface LoginResponse {
  /** Токен доступа. Уходит в `Authorization: Bearer …` на каждом запросе. */
  token: string;
}

/**
 * Вход. Единственный эндпоинт, который ядро заводит само.
 *
 * `hideErrorMessage` — потому что ошибку показывает сама форма: тост поверх неё
 * накрыл бы поле, в которое пользователю и нужно вернуться.
 *
 * Сам объект нужен редко — панель зовёт хук `useLoginMutation`. Он пригодится
 * там, где вход нужен вне React: `dispatch(authApi.endpoints.login.initiate(…))`.
 */
export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, LoginPayload>({
      query: (body) => ({ url: LOGIN_PATH, method: 'POST', body }),
      extraOptions: { hideErrorMessage: true },
    }),
  }),
});

/**
 * Вход: отправляет почту с паролем и возвращает токен.
 *
 * Токен нужно положить в сессию самому — `login` из `useAuth`. Ядро своим экраном
 * входа так и делает; панели этот хук нужен, только если она рисует форму сама.
 *
 * @example
 * ```tsx
 * const [login, { isLoading, isError }] = useLoginMutation();
 * const { login: startSession } = useAuth();
 *
 * const handleFinish = async (values: LoginPayload) => {
 *   const { token } = await login(values).unwrap();
 *
 *   startSession(token);
 * };
 * ```
 */
export const useLoginMutation = authApi.useLoginMutation;
