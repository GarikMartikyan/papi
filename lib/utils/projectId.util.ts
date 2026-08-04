import {
  getProjectIdLS,
  removeProjectIdLS,
  setProjectIdLS,
} from '../services/localStorage.service';
import {
  getProjectIdSS,
  removeProjectIdSS,
  setProjectIdSS,
} from '../services/sessionStorage.service';

import { warn } from './logger.util';

/**
 * `projectId` может прийти из адресной строки, то есть от кого угодно. Дальше
 * пропускаем только безопасный идентификатор, а не произвольную строку.
 *
 * TODO: заменить на реальный формат projectId, когда он будет известен
 * (например `/^\d+$/`). Сейчас шаблон намеренно широкий — пропускает и числа,
 * и слаги, но отсекает пути, кавычки, пробелы и слишком длинные значения.
 */
const PROJECT_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

const isValidProjectId = (value: string): boolean => {
  if (PROJECT_ID_PATTERN.test(value)) return true;

  warn(`projectId "${value}" does not match the expected format — value ignored.`);

  return false;
};

/** Чистое чтение: сначала вкладка, потом общее хранилище. Ничего не пишет. */
export const getStoredProjectId = (): string | null => {
  return getProjectIdSS() ?? getProjectIdLS();
};

export const getProjectIdFromPath = (): string | null => {
  if (typeof window === 'undefined') return null;

  const url = new URL(window.location.href);
  const projectId = url.searchParams.get('projectId');

  if (projectId === null) return null;

  url.searchParams.delete('projectId');
  window.history.replaceState({}, '', url.toString());

  return isValidProjectId(projectId) ? projectId : null;
};

/** Единственное место, где хранилища синхронизируются между собой. */
export const setProjectId = (projectId: string | number): void => {
  const value = projectId.toString();

  if (!isValidProjectId(value)) return;

  setProjectIdSS(value);
  setProjectIdLS(value);
};

export const removeProjectId = (): void => {
  removeProjectIdSS();
  removeProjectIdLS();
};

export const getProjectId = (): string | null => {
  const projectIdFromPath = getProjectIdFromPath();

  if (projectIdFromPath !== null) {
    setProjectId(projectIdFromPath);
    return projectIdFromPath;
  }

  return getStoredProjectId();
};
