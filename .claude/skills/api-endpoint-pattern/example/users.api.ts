import { api } from '@papi/api';
import { papiRtkTags } from '@papi/constants';

import type { User } from '../../../../src/types/interfaces/user.interfaces';

/*
 * `User` приходит импортом: `interface` в `*.api.ts` не объявляется никогда.
 * Путь такой длинный только потому, что пример лежит в каталоге скилла, — у
 * самой панели на его месте стоит `../types/interfaces/user.interfaces`.
 *
 * Строки тостов — тоже её, из `src/i18n/*.json`. `papiMessage` их не примет: он
 * сверяет ключ с каталогом ядра, а там лежит только то, что ядро умеет сказать
 * само, — «Готово» и ошибки под статусы ответа.
 *
 * У ядра пример занимает один тег: своих у скелета нет вовсе (`injectTags({})`),
 * а привязка к ним роняла бы `npm run typecheck` каждый раз, когда панель их
 * переименует или удалит. В настоящей панели тег объявляется одним вызовом на
 * всю панель в `src/constants/tags.constants.ts` и читается оттуда —
 * `injectTags({ user: 'User' })` возвращает и его, и теги ядра, так что ниже
 * вместо `papiRtkTags.me` стояло бы `rtkTags.user`:
 *
 *     import { rtkTags } from '../constants/tags.constants';
 */

/** Префикс ресурса — один на файл, чтобы адрес не переписывался в каждой ручке. */
const USERS_PATH = '/users';

/**
 * Ручки пользователей — дописаны в единственный api ядра.
 *
 * Свой `createApi` панель не заводит: редьюсер и middleware регистрируются при
 * создании стора, и второй api к уже созданному стору не подключить.
 *
 * Мутации здесь кеш не инвалидируют, а правят ответом — см. `onQueryStarted`
 * ниже. Инвалидация осталась ровно там, где собрать новое состояние из ответа
 * нечем (`importUsers`).
 */
export const usersApi = api.injectEndpoints({
  endpoints: (build) => ({
    /* Запросы идут первыми, мутации следом: сначала то, что читает, потом то,
       что меняет прочитанное. */
    getUsers: build.query<User[], void>({
      query: () => USERS_PATH,
      providesTags: [papiRtkTags.me],
    }),

    getUser: build.query<User, string>({
      query: (id) => `${USERS_PATH}/${id}`,
      providesTags: [papiRtkTags.me],
    }),

    /* Пейлоад выведен из `User`, а не описан заново: `Omit` ничего не заводит —
       он сужает уже названную сущность, и поле, добавленное в `User`, доезжает
       сюда само. Понадобится это же имя форме или хуку — тип переедет в
       `src/types/types/user.types.ts` и придёт оттуда импортом. */
    createUser: build.mutation<User, Omit<User, 'id'>>({
      query: (body) => ({ url: USERS_PATH, method: 'POST', body }),
      /*
       * Тост называет, что именно случилось. «Готово» — а это всё, что даёт
       * `showSuccessMessage: true` без строки от бэкенда, — человек читает краем
       * глаза и не отличает удачное создание от удачного сохранения соседней
       * формы.
       *
       * Дескриптор литералом, а не через `papiMessage`: ключ живёт в каталоге
       * панели. Непроверенным он при этом не остаётся — `src/types/formatjs.d.ts`
       * подставляет её каталог в `FormatjsIntl`, и ключа, которого нет в
       * `src/i18n/*.json`, не пропустит tsc (TS2820).
       */
      extraOptions: { showSuccessMessage: { id: 'user created' } },
      /*
       * Патч идёт через `usersApi`, а не через `api` из `@papi/api`, и это не
       * вкусовщина: у api ядра `endpoints: () => ({})`, его тип про `getUsers`
       * ничего не знает, и имя запроса там не проходит — `'getUsers' is not
       * assignable to parameter of type 'never'`. Знает о нём только то, что
       * вернул `injectEndpoints`.
       *
       * Ссылка на `usersApi` изнутри его же объявления работает: `onQueryStarted`
       * вызывается по мутации, задолго после того, как модуль загрузился.
       *
       * Пейлоад создания в патче не участвует — в кеш кладётся то, что вернул
       * бэкенд: с `id`, датами и всем, что он проставил сам.
       */
      onQueryStarted: async (_payload, { dispatch, queryFulfilled }) => {
        try {
          const { data: created } = await queryFulfilled;

          /*
           * Патч, а не `invalidatesTags`: созданная запись уже пришла в ответе,
           * и перезапрос списка сходил бы за ней второй раз — с задержкой сети
           * и мельканием `isFetching` на таблице, которую человек в этот момент
           * читает.
           *
           * Второй аргумент — аргумент самого запроса, и он же ключ кеша.
           * У `getUsers` аргумента нет, поэтому `undefined`; у запроса с
           * фильтром пришлось бы передать те же фильтры, иначе патч уйдёт в
           * чужую запись кеша.
           *
           * Кеша нет вовсе — вызов ничего не делает и не падает: RTK Query видит
           * незаполненную запись и выходит. Отдельной проверки не нужно.
           */
          dispatch(
            usersApi.util.updateQueryData('getUsers', undefined, (users) => {
              users.push(created);
            }),
          );

          /*
           * Карточка — `upsertQueryData`, а не `updateQueryData`: карточку этого
           * пользователя ещё никто не открывал, записи в кеше нет, и патчить
           * нечего. Upsert её заводит, и переход на карточку после создания
           * обходится без запроса.
           *
           * `void` — потому что upsert возвращает промис (внутри он идёт тем же
           * путём, что обычный запрос), а ждать его здесь нечего.
           */
          void dispatch(usersApi.util.upsertQueryData('getUser', created.id, created));
        } catch {
          /* Ответ не пришёл — в кеше по-прежнему правда, и трогать его нечем.
             Тост об ошибке уже показал `papiBaseQuery`. */
        }
      },
    }),

    /* `id` обязателен — по нему адрес, — остальное необязательно: это PATCH. */
    updateUser: build.mutation<User, Pick<User, 'id'> & Partial<Omit<User, 'id'>>>({
      query: (payload) => {
        const { id, ...body } = payload;

        return { url: `${USERS_PATH}/${id}`, method: 'PATCH', body };
      },
      onQueryStarted: async (_payload, { dispatch, queryFulfilled }) => {
        try {
          const { data: updated } = await queryFulfilled;

          /* Замена по `id`, а не слияние с пейлоадом: в ответе лежит вся
             запись целиком, включая поля, которые бэкенд посчитал сам. */
          dispatch(
            usersApi.util.updateQueryData('getUsers', undefined, (users) => {
              const index = users.findIndex((user) => user.id === updated.id);

              if (index !== -1) users[index] = updated;
            }),
          );

          void dispatch(usersApi.util.upsertQueryData('getUser', updated.id, updated));
        } catch {
          /* См. `createUser`. */
        }
      },
    }),

    deleteUser: build.mutation<void, string>({
      query: (id) => ({ url: `${USERS_PATH}/${id}`, method: 'DELETE' }),
      /* Своя строка и здесь: удаление и создание — разные события, и тост,
         одинаковый на оба, не сообщает ничего. См. `createUser`. */
      extraOptions: { showSuccessMessage: { id: 'user deleted' } },
      /*
       * Ответа у удаления нет, и он не нужен: что убрать из списка, сказано в
       * аргументе. Ждать `queryFulfilled` всё равно приходится — пока бэкенд не
       * подтвердил, запись жива.
       */
      onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;

          dispatch(
            usersApi.util.updateQueryData('getUsers', undefined, (users) => {
              const index = users.findIndex((user) => user.id === id);

              if (index !== -1) users.splice(index, 1);
            }),
          );
        } catch {
          /* См. `createUser`. */
        }
      },
    }),

    importUsers: build.mutation<void, FormData>({
      query: (body) => ({ url: `${USERS_PATH}/import`, method: 'POST', body }),
      /*
       * Здесь инвалидация честнее патча — и это тот случай, ради которого теги
       * остаются на месте у каждого запроса. Импорт заводит неизвестно сколько
       * записей, ответ их не возвращает, и собрать из него новый список нечем.
       */
      invalidatesTags: [papiRtkTags.me],
    }),
  }),
});

/* Хуки — одной деструктуризацией: список того, что файл отдаёт наружу. Так же
   их отдаёт и ядро, только там над каждым именем стоит ещё и описание — его
   хуки публичны для всех панелей. */
export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useImportUsersMutation,
} = usersApi;
