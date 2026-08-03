---
name: hook-pattern
description: >
  The structure every custom hook in papi must follow — one hook per file, a fixed order of hooks,
  handlers and effects, stable returned callbacks, and the rule for choosing a hook over a util.
  Use whenever you create or edit a useX.ts file, extract logic out of a component, or review
  hook code. Triggers: adding a file under src/hooks, requests like "напиши хук", "вынеси в хук",
  "add a hook", "extract this logic".
---

# hook-pattern — как писать хуки в papi

Порядок тот же, что в [component-pattern](../component-pattern/SKILL.md): сверху вниз читаются
сначала связи с системой, потом внутренняя кухня, в конце — то, что хук отдаёт наружу.

## Один файл — один хук

Имя файла — `useX.ts` (`useThemeMode.ts`), экспорт именованный. Вспомогательные хуки
живут в своих файлах, даже если используются только одним соседом.

`.ts`, а не `.tsx` — хук, которому нужен JSX, почти всегда должен быть компонентом или
провайдером.

## Хук или утилита

| | куда |
|---|---|
| Зависит от React (стейт, эффекты, контекст) | `hooks/useX.ts` |
| Читает стор или диспатчит | `hooks/useX.ts` |
| Обращается к сервисам/браузерным API, но без React | `utils/x.util.ts` |
| Чистая функция от аргументов | `utils/x.util.ts` |

Не заворачивать чистую логику в хук ради единообразия: `resolveInitialThemeMode` — утилита,
`useThemeMode` — хук.

## Порядок внутри хука

1. **Аргументы** — если их несколько, объект `params` с деструктуризацией первой строкой
2. **Контекст и роутер** — `useIntl`, `useNavigate`, `useLocation`
3. **Redux** — `useAppDispatch`, затем `useAppSelector`
4. **RTK Query** — сначала запросы, потом мутации
5. **Локальный стейт** — `useState`, `useReducer`
6. **Рефы** — `useRef`
7. **Производные значения**
8. **Хендлеры** — то, что уйдёт в возвращаемое значение
9. **Эффекты** — `useEffect`
10. **`return`**

## Возвращаемое значение — что угодно

Форма не ограничена: объект, функция, одно значение, кортеж — что честнее описывает хук.

```ts
// несколько связанных значений — объект
return { mode, isDark, setMode, toggleMode };

// хук про одно действие — само действие
return t;

// хук про одно значение — само значение
return isMobile;
```

Ориентир один: **сколько сущностей отдаёт хук, столько и видно на вызове**. Если сущность одна,
обёртка вокруг неё — лишний слой, который читателю приходится разворачивать (`const { t } =`
вместо `const t =`). Если их несколько — объект, потому что он переживает добавление поля без
правки всех вызовов и читается без угадывания позиций.

Кортежи (`[value, setValue]`) — только когда переименование на месте действительно нужно и полей
не больше двух.

Заранее закладываться на рост не нужно: превратить `return t` в `return { t, … }` — правка
вызовов, а не архитектуры, и делается она тогда, когда второе поле реально появилось.

## Колбэки в возвращаемом значении оборачиваются

Это **исключение** из правила «`useCallback` только по необходимости» из component-pattern.
Всё, что хук отдаёт наружу как функцию, оборачивается в `useCallback`:

```ts
const setMode = useCallback(
  (next: ThemeMode) => {
    dispatch(setThemeMode(next));
  },
  [dispatch],
);
```

Причина: потребитель не контролирует нутро хука, но вполне может положить колбэк в массив
зависимостей своего `useEffect`. Нестабильная ссылка превращается в бесконечный цикл, который
отлаживают в чужом коде. Для значений (не функций) правило обычное — мемоизировать только при
реальной причине.

## Аргументы

Один аргумент — позиционный. Два и больше — объект, чтобы вызов читался без подсказок:

```ts
// плохо
useTable(items, 20, true, 'name');

// хорошо
useTable({ items, pageSize: 20, sortable: true, sortBy: 'name' });
```

## Именование

| что | как |
|---|---|
| хук | `useThemeMode`, `useAppSelector` |
| интерфейс аргументов | `UseThemeModeParams` |
| интерфейс результата | `UseThemeModeResult` (только если экспортируется) |
| сеттеры в результате | `setX`, `toggleX`, `resetX` |
| булево в результате | `isX`, `hasX` |

## Правило хуков

Никаких вызовов хуков в условиях, циклах и после ранних возвратов. Если ветка не нужна — хук
всё равно вызывается, а ветвление уходит в его аргументы или в возвращаемое значение.

## Пример целиком

```ts
import { useCallback } from 'react';

import { selectThemeMode, setThemeMode } from '../store/slices/config.slice';
import { ThemeMode } from '../types/enums/global.enum';

import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';

export const useThemeMode = () => {
  const dispatch = useAppDispatch();
  const mode = useAppSelector(selectThemeMode);

  const isDark = mode === ThemeMode.DARK;

  const setMode = useCallback(
    (next: ThemeMode) => {
      dispatch(setThemeMode(next));
    },
    [dispatch],
  );

  const toggleMode = useCallback(() => {
    setMode(isDark ? ThemeMode.LIGHT : ThemeMode.DARK);
  }, [isDark, setMode]);

  return { mode, isDark, setMode, toggleMode };
};
```
