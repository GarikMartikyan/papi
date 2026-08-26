import { papiRtkTags } from '../../constants/tags.constants';
import type { Me } from '../../types/interfaces/me.interface';
import { api } from '../api';

/**
 * Путь текущего пользователя. Договорённость ядра, как и `LOGIN_PATH`: карточку
 * рисует `UserMenu` из ядра, и без общего адреса он не знал бы, куда стучаться.
 *
 * Бэкенду с другим адресом панель этот эндпоинт просто не использует и передаёт
 * в `MainLayout` своего пользователя пропсами — так это работает и сейчас.
 */
const ME_PATH = '/me';

/**
 * Вошедший пользователь — парный к `login` эндпоинт ядра.
 *
 * На нём стоит вход в панель: `PapiRouter` спрашивает его перед тем, как
 * показать каркас, и токен, на который бэкенд отвечает 401, дальше гарда не
 * проходит. Поэтому запрос уходит на каждой загрузке страницы, а не только
 * после входа.
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
      providesTags: [papiRtkTags.me],
      extraOptions: { hideErrorMessage: true },
    }),
  }),
});

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
export const useGetMeQuery = meApi.useGetMeQuery;
