/**
 * Право панели — то, что ядро сверяет, но не знает.
 *
 * Обычный `string`, пока панель не объявила свой набор в `Papi.Permissions`
 * (см. `src/types/permissions.d.ts`); объявила — union её enum'а, и опечатка в
 * праве перестаёт доживать до рантайма.
 *
 * Тем же приёмом, что и ключ сообщения (`MessageId`), и по той же причине:
 * значения принадлежат панели, а тип нужен ядру, — импортировать `src/` ядро не
 * может, поэтому связь получается объявлением, которое панель дописывает сама.
 *
 * Сам `Papi.Permissions` объявлен в `lib/types/permissions.d.ts` — там же
 * написано, почему в файле объявлений, а не здесь.
 *
 * @example Панель объявляет свой набор один раз, в `src/types/permissions.d.ts`:
 * ```ts
 * declare global {
 *   namespace Papi {
 *     interface Permissions {
 *       values: Permission;
 *     }
 *   }
 * }
 * ```
 */
export type PapiPermission = Papi.Permissions extends { values: infer Values } ? Values : string;
