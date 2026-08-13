import type { User } from '../interfaces/user.interfaces';

export type CreateUserPayload = Omit<User, 'id'>;
