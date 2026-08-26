/**
 * Текст для пользователя из тела ответа.
 *
 * Договорённость ядра с бэкендом одна и та же на обе стороны: текст лежит в
 * поле `message`. Поэтому функция общая — ею читается и причина ошибки, и
 * подтверждение удачной мутации.
 *
 * Голая строка в теле тоже принимается — это тот же текст, только без обёртки.
 *
 * Остальные формы (`error`, `detail`, список ошибок) намеренно не угадываются:
 * панели ходят к разным бэкендам, и угаданное поле однажды окажется не текстом
 * для пользователя, а внутренним кодом, который ему покажут.
 *
 * @param data Тело ответа как есть — объект, строка или что угодно ещё.
 * @returns Текст из `message` или само тело, если это непустая строка;
 * `undefined` — текста в теле нет.
 * @example
 * ```ts
 * readApiMessage({ message: 'Пользователь удалён' }); // 'Пользователь удалён'
 * readApiMessage({ code: 'USER_DELETED' }); // undefined
 * ```
 */
export const readApiMessage = (data: unknown): string | undefined => {
  if (typeof data === 'string' && data.trim() !== '') return data;

  if (typeof data !== 'object' || data === null) return undefined;

  const { message } = data as { message?: unknown };

  return typeof message === 'string' && message.trim() !== '' ? message : undefined;
};
