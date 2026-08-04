/**
 * Теги RTK Query панели.
 *
 * Свой файл, а не запись в ядро: `User` и `Session` — сущности этой панели, в
 * соседней их может не быть вовсе. Теги ядра лежат в `rtkTags` и приезжают из
 * `@papi/constants`.
 *
 * Про `as const` и про то, зачем теги вообще собраны в одном месте, — там же, в
 * комментарии к `rtkTags`.
 */
export const APP_API_TAGS = {
  user: 'User',
  session: 'Session',
} as const;
