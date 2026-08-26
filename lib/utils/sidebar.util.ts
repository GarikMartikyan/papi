import { DEFAULT_SIDEBAR_COLLAPSED } from '../constants/defaults.constants';
import { getSidebarCollapsedLS } from '../services/localStorage.service';

import { warn } from './logger.util';

/**
 * Положение навигации при старте: localStorage → DEFAULT_SIDEBAR_COLLAPSED.
 *
 * В хранилище лежит строка, поэтому принимаются только `'true'` и `'false'` —
 * всё остальное считается отсутствующим значением.
 *
 * @returns Свёрнут ли сайдбар на старте. Про мусор в хранилище предупреждает в
 * консоль и берёт значение по умолчанию.
 */
export const resolveInitialSidebarCollapsed = (): boolean => {
  const stored = getSidebarCollapsedLS();

  if (stored === 'true') return true;
  if (stored === 'false') return false;

  if (stored !== null) {
    warn(`Invalid sidebar state "${stored}" in localStorage — using the default.`);
  }

  return DEFAULT_SIDEBAR_COLLAPSED;
};
