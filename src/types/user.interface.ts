/*
 * Сущности панели: её интерфейсы, полезные нагрузки и ответы её эндпоинтов.
 * Общие типы приходят из `@papi/types`.
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export type CreateUserPayload = Omit<User, 'id'>;

/** Что вернул мок на `/session` — нужен, чтобы показать заголовок с токеном. */
export interface Session {
  authorization: string | null;
  receivedAt: string;
}
