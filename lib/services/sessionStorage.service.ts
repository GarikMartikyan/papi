import { PROJECT_ID_KEY } from '../constants/storageKeys.constants';

/** Те же гарантии, что и в localStorage.service: доступ не бросает. */
const read = (key: string): string | null => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string): void => {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Квота или отключённое хранилище — значение просто не сохранится.
  }
};

const remove = (key: string): void => {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // См. write.
  }
};

export const setProjectIdSS = (projectId: number | string) => {
  write(PROJECT_ID_KEY, projectId.toString());
};

export const getProjectIdSS = () => {
  return read(PROJECT_ID_KEY);
};

export const removeProjectIdSS = () => {
  remove(PROJECT_ID_KEY);
};
