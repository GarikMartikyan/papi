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

/**
 * Сохранённый проект. Чистое чтение: сначала вкладка, потом общее хранилище.
 * Ничего не пишет — адресную строку, в отличие от `getProjectId`, не трогает.
 *
 * @returns Идентификатор проекта; `null` — его не сохраняли.
 */
export const getStoredProjectId = (): string | null => {
  return getProjectIdSS() ?? getProjectIdLS();
};

/**
 * Проект из адресной строки — параметр `?projectId=…`, которым панель
 * открывают снаружи.
 *
 * Параметр из адреса при этом убирается (`history.replaceState`): он одноразовый
 * и в закладке или пересланной ссылке остался бы навсегда. Убирается и тогда,
 * когда значение не прошло проверку формата, — иначе оно висело бы в адресе,
 * ничего не делая.
 *
 * @returns Идентификатор; `null` — параметра нет, он не прошёл проверку формата
 * или кода нет окна (сборка вне браузера).
 */
export const getProjectIdFromPath = (): string | null => {
  if (typeof window === 'undefined') return null;

  const url = new URL(window.location.href);
  const projectId = url.searchParams.get('projectId');

  if (projectId === null) return null;

  url.searchParams.delete('projectId');
  window.history.replaceState({}, '', url.toString());

  return isValidProjectId(projectId) ? projectId : null;
};

/**
 * Выбрать проект: значение уходит и во вкладку, и в общее хранилище.
 * Единственное место, где хранилища синхронизируются между собой.
 *
 * Значение не того формата не сохраняется вовсе — в консоль уходит
 * предупреждение, а прежний проект остаётся на месте.
 *
 * @param projectId Идентификатор проекта; число приводится к строке.
 * @example
 * ```tsx
 * <Select onChange={setProjectId} options={projects} />
 * ```
 */
export const setProjectId = (projectId: string | number): void => {
  const value = projectId.toString();

  if (!isValidProjectId(value)) return;

  setProjectIdSS(value);
  setProjectIdLS(value);
};

/** Забыть проект в обоих хранилищах — во вкладке и во всём браузере. */
export const removeProjectId = (): void => {
  removeProjectIdSS();
  removeProjectIdLS();
};

/**
 * Текущий проект — с оглядкой на адресную строку.
 *
 * Пришёл `?projectId=…` — он и становится текущим: значение сохраняется в оба
 * хранилища, а параметр из адреса убирается. Не пришёл — берётся сохранённый.
 *
 * Тем и отличается от `getStoredProjectId`, что может писать. Панели, которой
 * нужно только прочитать, нужен тот.
 *
 * @returns Идентификатор проекта; `null` — его нет ни в адресе, ни в хранилищах.
 */
export const getProjectId = (): string | null => {
  const projectIdFromPath = getProjectIdFromPath();

  if (projectIdFromPath !== null) {
    setProjectId(projectIdFromPath);
    return projectIdFromPath;
  }

  return getStoredProjectId();
};
