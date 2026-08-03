---
name: component-pattern
description: >
  The structure every React component in papi must follow — one component per file, props
  destructured at the top, props interface extending the base antd component's props with the
  rest spread onward, and a fixed order of hooks, handlers, effects and JSX. Use whenever you
  create a new component, edit an existing one, or review component code. Triggers: adding a .tsx
  file under lib/components or src/pages, writing a provider or layout, moving JSX out of one
  component into another, any request like "напиши компонент", "add a component", "вынеси в
  компонент".
---

# component-pattern — как писать компоненты в papi

Порядок фиксированный. Он не про вкус: чтение сверху вниз должно показывать сначала связи
компонента с системой, потом его внутреннюю кухню, потом разметку.

## Один файл — один компонент

Никаких второстепенных компонентов в том же файле. Понадобился подкомпонент — заводится
отдельный файл рядом. Исключений нет: «маленький хелпер-компонент внизу файла» всегда
разрастается и утаскивает за собой импорты.

## Пропсы

Первый параметр называется `props`, деструктуризация — первой строкой тела.

```tsx
export interface SidebarMenuProps extends SiderProps {
  items: NavItem[];
  onSelect?: (key: string) => void;
}

export const SidebarMenu = (props: SidebarMenuProps) => {
  const { items, onSelect, ...rest } = props;
  // …
};
```

Интерфейс пропсов экспортируется — панели должны иметь возможность его расширять и
типизировать свои обёртки. Имя — `<ComponentName>Props`.

### Пропсы наследуются от базового компонента

Компонент построен вокруг чего-то из antd — его интерфейс расширяет пропсы этого чего-то. Свои
пропсы объявляются только те, которых у базы нет.

```tsx
export interface LocaleSelectProps extends SelectProps {
  /** `aria-label`: у списка нет видимой подписи. */
  label?: string;
}
```

Свой `width`, `disabled`, `size` не заводится: всё это уже есть в `SelectProps`. Каждый
прокинутый насквозь проп — ещё одно место, где обёртка расходится с базой: у antd их десятки,
обёртка знает пять, и панель упирается в потолок на первом же нестандартном случае.

Всё неразобранное собирается в `...rest` и уходит в базовый компонент **последним пропом**:

```tsx
export const LocaleSelect = (props: LocaleSelectProps) => {
  const { label = DEFAULT_LABEL, style, ...rest } = props;

  // …

  return (
    <Select
      variant="filled"
      aria-label={label}
      options={locales.map(toOption)}
      style={{ width: DEFAULT_WIDTH, background: token.colorBgLayout, ...style }}
      value={locale}
      onChange={handleChange}
      {...rest}
    />
  );
};
```

Последним, а не первым: то, что записано в JSX выше, — дефолты самого компонента, и переданное
снаружи должно их перекрывать. Стоял бы `{...rest}` первым — панель не смогла бы поменять ни
`variant`, ни `value`, и обёртка была бы глухой к вызывающему. Обратная сторона у этого честная:
переданный `onChange` заменяет внутренний, а не дополняет его.

Объекты так не сливаются — spread заменяет `style` целиком. Поэтому `style` (и всё остальное
объектное: `classNames`, `styles`, `dropdownStyle`) вынимается из `rest` по имени и подмешивается
руками: свои значения, следом `...style`.

Туда же уходят «настроечные» значения вроде ширины: не свой проп `width`, а дефолт внутри
`style`, который панель перекроет своим `style`.

### Баз несколько — пропсы становятся объединением

Компонент рендерит по варианту разные базы (`ThemeSwitcher`: `Button` или `Switch`) — плоским
`extends ButtonProps, SwitchProps` его не описать: одноимённые пропсы у баз объявлены по-разному
(`size`, `loading`, `value`, `onChange`, `onClick`), и tsc валит это как TS2320. Тип собирается
объединением, где вариант — дискриминант:

```tsx
interface ThemeSwitcherOwnProps {
  label?: string;
}

export type ThemeSwitcherProps =
  | (ThemeSwitcherOwnProps & Omit<ButtonProps, 'variant'> & { variant?: 'button' })
  | (ThemeSwitcherOwnProps & SwitchProps & { variant: 'switch' });
```

Плоский тип тут не просто не компилируется — он ещё и врал бы: в тумблер прошёл бы `href`, а в
кнопку `checkedChildren`. С объединением каждая ветка принимает ровно пропсы своей базы.
Проверка строгая, пока вариант в JSX задан литералом; передаётся переменная — TS смягчается и
пропускает пропсы обеих баз.

Имя своего пропа занято базой (`variant` есть и у `Button`) — оно вырезается из базы через
`Omit`, а не переименовывается: имя описывает наш компонент, и то, что antd занял его под своё,
дело antd.

Деструктуризация при этом переезжает с первой строки тела внутрь веток — иначе `...rest` собрать
негде: до сужения по варианту он общий, и в `Switch` полетели бы пропсы кнопки. Проп, который
вынимается только чтобы не попасть в `rest`, пишется с подчёркиванием (`variant: _variant`) —
иначе eslint посчитает его неиспользуемым.

### Интерфейс живёт в файле компонента

Объявляется **в том же файле, сверху** — над компонентом, сразу после импортов. Отдельный файл
типов под пропсы не заводится: ни `<component>.interface.ts` рядом, ни запись в
`src/types/interfaces/`.

Причина простая: пропсы — это и есть подпись компонента. Разнесённые по двум файлам, они
расходятся — интерфейс правят, забыв про компонент, и наоборот, — а чтение перестаёт быть
линейным: чтобы понять, что компонент принимает, приходится прыгать в другой файл.

Туда же, наверх, идут и типы, которые существуют только ради этих пропсов: форма элемента
списка, вариант режима, объект настроек. Отдельного дома они не заслуживают — за пределами
пропсов их никто не использует.

```tsx
export interface NavItem {
  key: string;
  label: ReactNode;
}

export interface SidebarMenuProps extends SiderProps {
  items: readonly NavItem[];
  onSelect?: (key: string) => void;
}

export const SidebarMenu = (props: SidebarMenuProps) => {
  const { items, onSelect, ...rest } = props;
  // …
};
```

В `src/types/` остаётся то, что живёт **отдельно от любого компонента**: состояние слайсов,
конфиги панели, доменные сущности, enum'ы. Признак простой — если тип нужен коду без JSX, его
место там; если только компоненту и его потребителям, он объявляется рядом с компонентом.

Подкомпоненту нужен тип из публичного компонента — импортирует его оттуда через `import type`.
Такой импорт стирается на сборке, поэтому встречный импорт самого подкомпонента цикла не
создаёт.

## Порядок внутри компонента

1. **Деструктуризация `props`**
2. **Контекст и роутер** — `useIntl`, `useNavigate`, `useLocation`, `useParams`,
   `App.useApp()`, `theme.useToken()`
3. **Redux** — `useAppDispatch`, затем `useAppSelector`
4. **RTK Query** — сначала запросы, потом мутации
5. **Локальный стейт** — `useState`, `useReducer`
6. **Рефы** — `useRef`
7. **Производные значения** — вычисления, `useMemo` (см. ниже)
8. **Хендлеры** — `handleX`
9. **Эффекты** — `useEffect`, `useLayoutEffect`
10. **Ранние возвраты** — loading / error / empty
11. **JSX**

Почему именно так:

- Хуки идут от внешнего к внутреннему: контекст → глобальный стейт → серверный стейт →
  локальный. Зависимости компонента от системы видны раньше его внутренностей.
- Эффекты **после** хендлеров, потому что эффект почти всегда ссылается на хендлер или
  производное значение. Обратный порядок заставляет прыгать по файлу.
- Ранние возвраты — строго после всех хуков. Иначе нарушается правило хуков и компонент падает
  при смене ветки.

## useMemo и useCallback — только по необходимости

По умолчанию **не оборачивать**. Обёртка оправдана, когда есть конкретная причина:

- значение или колбэк уходит в мемоизированный (`React.memo`) дочерний компонент;
- значение попадает в массив зависимостей другого хука;
- вычисление действительно тяжёлое (сортировка/фильтрация большого списка, разбор дерева).

Во всех остальных случаях обёртка — это шум плюс собственная стоимость сравнения зависимостей.

## Константы — вне компонента

```tsx
const SIDER_WIDTH = 240;
```

Объект или массив, объявленный внутри тела, пересоздаётся на каждый рендер и ломает мемоизацию
у детей. Всё, что не зависит от пропсов и стейта, выносится на уровень модуля.

## Именование

| что | как |
|---|---|
| хендлер внутри компонента | `handleSelect`, `handleSubmit` |
| колбэк в пропсах | `onSelect`, `onSubmit` |
| булево | `isOpen`, `hasAccess`, `collapsed` |
| интерфейс пропсов | `<ComponentName>Props` |

## Импорты

Порядок проверяется автоматически (`simple-import-sort`), руками не сортировать:
`react` → внешние пакеты → `../` → `./` → стили. Починка — `npm run lint:fix` (он же прогоняет
prettier следом, потому что autofix eslint портит форматирование).

## Когда декомпозировать

Сигналы, что пора вынести подкомпонент или кастомный хук:

- больше ~10 хуков в компоненте;
- JSX глубже 4 уровней вложенности;
- в одном компоненте живут два несвязанных куска состояния.

Логика, завязанная на стор или сервисы, выносится в хук (`useX.ts`), а не в утилиту.

## Пример целиком

```tsx
import { useEffect, useState } from 'react';

import { Layout, theme, type SiderProps } from 'antd';
import { useIntl } from 'react-intl';
import { useLocation, useNavigate } from 'react-router';

import { useAppDispatch, useAppSelector } from '../../hooks';
import { selectSidebarCollapsed } from '../../store';

const SIDER_WIDTH = 240;

export interface SidebarMenuProps extends SiderProps {
  items: NavItem[];
  onSelect?: (key: string) => void;
}

export const SidebarMenu = (props: SidebarMenuProps) => {
  const { items, onSelect, ...rest } = props;

  const intl = useIntl();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { token } = theme.useToken();

  const dispatch = useAppDispatch();
  const collapsed = useAppSelector(selectSidebarCollapsed);

  const { data, isLoading } = useGetMenuQuery();

  const [openKeys, setOpenKeys] = useState<string[]>([]);

  const activeKey = findActiveKey(items, pathname);

  const handleSelect = (key: string) => {
    onSelect?.(key);
    navigate(key);
  };

  useEffect(() => {
    setOpenKeys([activeKey]);
  }, [activeKey]);

  if (isLoading) return <Skeleton />;

  return (
    <Layout.Sider width={SIDER_WIDTH} collapsed={collapsed} {...rest}>
      {/* … */}
    </Layout.Sider>
  );
};
```
