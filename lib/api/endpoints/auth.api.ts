import { getPanelKey } from '../../services/env.service';
import type {
  AuthTokens,
  LoginPayload,
  RefreshTokenPayload,
} from '../../types/interfaces/auth.interface';
import { api } from '../api';

/**
 * Пути сессии. Договорённость ядра, а не панели: экран входа тоже приходит из
 * ядра, и без общих путей он не знал бы, куда стучаться.
 *
 * Бэкенду с другим адресом или другим форматом ответа панель отдаёт свою
 * страницу входа через `loginElement` у `PapiRouter` — эти эндпоинты тогда
 * просто не используются.
 */
const AUTH_PATH = '/auth';

/**
 * Сессия: как она начинается, продлевается и заканчивается.
 *
 * `hideErrorMessage` стоит на всех трёх. На входе — потому что ошибку показывает
 * сама форма: тост поверх неё накрыл бы поле, в которое пользователю и нужно
 * вернуться. На ротации и выходе — потому что человек их не запускал: ротация
 * случается сама, а неудача выхода ничего для него не меняет, он всё равно
 * вышел.
 *
 * Сами объекты нужны редко — панель зовёт хуки. Они пригодятся там, где вход
 * нужен вне React: `dispatch(authApi.endpoints.login.initiate(…))`.
 */
export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<AuthTokens, Omit<LoginPayload, 'panelKey'>>({
      query: (body) => ({
        url: `${AUTH_PATH}/login`,
        method: 'POST',
        body: { ...body, panelKey: getPanelKey() } satisfies LoginPayload,
      }),
      extraOptions: { hideErrorMessage: true },
    }),
    logout: build.mutation<void, RefreshTokenPayload>({
      query: (body) => ({ url: `${AUTH_PATH}/logout`, method: 'POST', body }),
      extraOptions: { hideErrorMessage: true },
    }),
  }),
});

/* Хуки — одной деструктуризацией, описание каждого внутри паттерна. В подсказку
   редактора оно оттуда не попадает: JSDoc у элемента деструктуризации tsserver
   не берёт — описание читается здесь. */
export const {
  /**
   * Вход: отправляет логин с паролем и возвращает пару токенов.
   *
   * Панель к паре не прикасается — её кладёт в сессию `login` из `useAuth`. Ядро
   * своим экраном входа так и делает; панели этот хук нужен, только если она
   * рисует форму сама.
   *
   * Ротации среди хуков нет намеренно: она случается сама, внутри `baseQuery`, и
   * дёргать её из интерфейса нечем и незачем.
   *
   * @example
   * ```tsx
   * const [login, { isLoading, isError }] = useLoginMutation();
   * const { login: startSession } = useAuth();
   *
   * const handleFinish = async (values: { username: string; password: string }) => {
   *   startSession(await login(values).unwrap());
   * };
   * ```
   */
  useLoginMutation,
  /**
   * Выход на стороне бэкенда: отзывает всю семью токенов этой сессии, так что
   * украденный refresh перестаёт работать вместе с настоящим.
   *
   * Панели он нужен редко — `logout` из `useAuth` зовёт его сам и не ждёт ответа:
   * локальный выход обязан случиться и при лежащей сети.
   */
  useLogoutMutation,
} = authApi;
