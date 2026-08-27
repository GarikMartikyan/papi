import type { PapiPermission } from '../types/permission.type';

/**
 * Текущий пользователь — ответ `GET /me`.
 *
 * TODO: заглушка формы ответа — заменить на реальную, когда будет известен
 * контракт бэкенда. Поля выбраны под `UserMenuProps` (`name`, `fullName`,
 * `description`, `avatar.src`), потому что единственный потребитель в ядре —
 * карточка в шапке. Обязателен только `id`: всё остальное `UserMenu` умеет не
 * показывать.
 */
export interface Me {
  /** Идентификатор пользователя. Единственное обязательное поле ответа. */
  id: string;
  /** Короткое имя для кнопки в шапке — там место делится с языком и темой. */
  name?: string;
  /** Полное имя для карточки меню. */
  fullName?: string;
  /** Вторая строка карточки: роль, почта, компания. */
  description?: string;
  /** Ссылка на аватар. Нет — `UserMenu` покажет инициалы или силуэт. */
  avatarUrl?: string;
  /**
   * Права вошедшего — те же значения, что панель ставит в `PapiRoute`.
   *
   * `PapiPermission` — это enum панели, если она его объявила, и `string`, если
   * нет: набор прав ядру неизвестен, оно только сверяет их с правом раздела.
   *
   * Поля нет в ответе — панель правами не управляет, и открыто всё; пустой
   * список означает обратное: не открыто ничего. См. `usePermissions`.
   */
  permissions?: PapiPermission[];
}

/**
 * Ответ бэкенда как есть — не то же самое, что `Me`.
 *
 * papi-authority отдаёт поля учётной записи, а `UserMenu` рисует карточку:
 * подпись на кнопке, имя и вторую строку под ним. Совмещать эти два взгляда в
 * одном интерфейсе значит либо тащить в ядро чужую форму ответа, либо чинить
 * `UserMenu` под каждый бэкенд. Поэтому ответ разбирается в `transformResponse`
 * у `getMe`, а наружу по-прежнему едет `Me`.
 *
 * Прав здесь нет: у papi-authority они лежат в claims токена доступа, а не в
 * этой ручке.
 */
export interface MeResponse {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  language: string;
  timezone: string | null;
  mustChangePassword: boolean;
  roleId: string | null;
  roleName: string | null;
}
