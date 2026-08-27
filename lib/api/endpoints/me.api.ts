import { papiRtkTags } from '../../constants/tags.constants';
import type { Me, MeResponse } from '../../types/interfaces/me.interface';
import { api } from '../api';

/**
 * Путь текущего пользователя. Договорённость ядра, как и пути сессии: карточку
 * рисует `UserMenu` из ядра, и без общего адреса он не знал бы, куда стучаться.
 *
 * Бэкенду с другим адресом панель этот эндпоинт просто не использует и передаёт
 * в `MainLayout` своего пользователя пропсами — так это работает и сейчас.
 */
const ME_PATH = '/users/me';

/** Имя и фамилия через пробел; нет ни того, ни другого — логин. */
const toFullName = (response: MeResponse): string => {
  const parts = [response.firstName, response.lastName].filter((part) => part !== null);

  return parts.length > 0 ? parts.join(' ') : response.username;
};

/*
 * TODO: заглушка — прав в ответе нет, поэтому `Me.permissions` остаётся пустым,
 * и `hasPermission` пускает всех вошедших во все разделы. Заменить на разбор
 * claims токена доступа (`projects[текущий].pages` с запасным `platform.pages`),
 * когда права будут подключены отдельным проходом.
 */
const toMe = (response: MeResponse): Me => ({
  id: response.id,
  name: response.firstName ?? response.username,
  fullName: toFullName(response),
  description: response.roleName ?? response.email,
});

/**
 * Вошедший пользователь — парный к сессии эндпоинт ядра.
 *
 * На нём стоит вход в панель: `PapiRouter` спрашивает его перед тем, как
 * показать каркас, и токен, на который бэкенд отвечает 401, дальше гарда не
 * проходит. Поэтому запрос уходит на каждой загрузке страницы, а не только
 * после входа.
 *
 * 401 здесь рутинный: токен доступа живёт минуты и к возвращению во вкладку
 * истекает почти всегда. Гард его не увидит — `baseQuery` продлит сессию и
 * повторит запрос, а на вход уведёт только если продлить не вышло.
 *
 * Только чтение: правка профиля — дело панели, у каждой она своя, и общего
 * контракта на неё нет.
 *
 * `hideErrorMessage` — потому что ошибку показывает сам гард: он рисует её
 * экраном с кнопкой «Повторить», и тост поверх пустого экрана сказал бы то же
 * самое второй раз.
 *
 * Тег объявлен не здесь, а в `constants/tags.constants`, и в набор попадает
 * сразу при `createApi` — этому файлу остаётся им пользоваться. Нужен он ради
 * панели: `invalidatesTags: [rtkTags.me]` в её мутации перезапросит карточку.
 */
export const meApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<Me, void>({
      query: () => ME_PATH,
      transformResponse: toMe,
      providesTags: [papiRtkTags.me],
      extraOptions: { hideErrorMessage: true },
    }),
  }),
});

/* Хуки — одной деструктуризацией, описание каждого внутри паттерна. В подсказку
   редактора оно оттуда не попадает: JSDoc у элемента деструктуризации tsserver
   не берёт — описание читается здесь. */
export const {
  /**
   * Вошедший пользователь: имя, аватар, права.
   *
   * Ответ лежит в кеше — его наполняет гард ещё до того, как панель отрисуется,
   * поэтому лишнего запроса вызов не делает. Прав хватает `usePermissions`, он
   * читает тот же кеш.
   *
   * @example
   * ```tsx
   * const { data: me, isLoading } = useGetMeQuery();
   *
   * return <UserMenu user={me} loading={isLoading} />;
   * ```
   */
  useGetMeQuery,
} = meApi;
