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

/**
 * Сохранить проект для одной вкладки: соседняя останется на своём. Так в двух
 * вкладках открываются два разных проекта.
 *
 * Напрямую нужна редко — оба хранилища сразу пишет `setProjectId` из
 * `projectId.util`, он же проверяет формат значения.
 *
 * @param projectId Идентификатор проекта; число приводится к строке.
 */
export const setProjectIdSS = (projectId: number | string) => {
  write(PROJECT_ID_KEY, projectId.toString());
};

/**
 * Проект этой вкладки.
 *
 * @returns Идентификатор; `null` — вкладка своего проекта не выбирала, и тогда
 * действует общий из localStorage. Читать лучше через `getStoredProjectId` — он
 * смотрит в оба хранилища по порядку.
 */
export const getProjectIdSS = () => {
  return read(PROJECT_ID_KEY);
};

/** Забыть проект этой вкладки. Обе стороны сразу стирает `removeProjectId`. */
export const removeProjectIdSS = () => {
  remove(PROJECT_ID_KEY);
};
