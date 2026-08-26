import type { ThemeConfig } from 'antd';

import { BASE_THEME } from '../theme/base.theme';

type ThemeComponents = NonNullable<ThemeConfig['components']>;

/**
 * Токены компонентов сливаются внутри каждого компонента, а не целыми
 * объектами: панель, переопределив `Card.colorBgContainer`, иначе снесла бы
 * остальные ядровые токены той же карточки.
 *
 * Через `Record<string, object>`: ключи `OverrideToken` перечислены поимённо, и
 * запись по вычисленному ключу такого типа TypeScript не пропускает.
 */
const mergeComponents = (base: ThemeComponents, override: ThemeComponents): ThemeComponents => {
  const merged: Record<string, object> = { ...base };

  for (const [name, tokens] of Object.entries(override)) {
    merged[name] = { ...merged[name], ...tokens };
  }

  return merged;
};

/**
 * Тема панели поверх темы ядра: `token` и `components` сливаются, остальные
 * поля (`algorithm`, `cssVar`, `hashed`) панель задаёт целиком.
 *
 * Один уровень вложенности, глубже не нужно: у `token` значения плоские, а у
 * `components` — ровно один уровень с токенами компонента.
 *
 * @param base Нижняя тема — та, которую перекрывают.
 * @param override Верхняя тема. Не передана — `base` возвращается как есть.
 * @returns Новый объект темы; обе исходные остаются нетронутыми.
 */
export const mergeThemes = (base: ThemeConfig, override?: ThemeConfig): ThemeConfig => {
  if (override === undefined) return base;

  return {
    ...base,
    ...override,
    token: { ...base.token, ...override.token },
    components: mergeComponents(base.components ?? {}, override.components ?? {}),
  };
};

/**
 * Полная тема панели: переданное поверх `BASE_THEME`. Обычно панель меняет
 * здесь один `colorPrimary`, а всё остальное — скругления, фоны, токены
 * компонентов — достаётся от ядра. Где значения совпадают по ключу, побеждает
 * переданное.
 *
 * Для панели, которой нужен сам объект: прочитать итоговый токен, собрать
 * несколько тем и выбирать между ними. Ради одного `PapiProvider` вызывать не
 * обязательно — его `ThemeProvider` сливает с ядром сам и принимает только
 * отличия; готовую тему он тоже примет, повторное слияние ничего не меняет.
 *
 * @param theme Отличия панели от темы ядра. Не переданы — вернётся `BASE_THEME`.
 * @returns Готовую тему antd — ядро плюс отличия панели.
 * @example
 * ```ts
 * const theme = createTheme({ token: { colorPrimary: '#7c3aed' } });
 *
 * theme.token?.borderRadius; // значение из BASE_THEME — своё задавать не пришлось
 * ```
 */
export const createTheme = (theme?: ThemeConfig): ThemeConfig => mergeThemes(BASE_THEME, theme);
