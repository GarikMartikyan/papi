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
