import type { ThemeConfig } from 'antd';

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
