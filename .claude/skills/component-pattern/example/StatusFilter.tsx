import { type MouseEvent, useEffect, useLayoutEffect, useRef } from 'react';

import { Button, Skeleton, Space, type SpaceProps } from 'antd';

import { type StatusKind, StatusTag } from './StatusTag';

/**
 * TODO: заглушка — подпись сброса захардкожена. В настоящем компоненте она
 * приходит из `usePapiTranslation`; здесь пример держится без импортов из ядра,
 * чтобы его можно было прочитать одним файлом.
 */
const DEFAULT_CLEAR_LABEL = 'Сбросить';

/**
 * `onChange` вырезан из базы через `Omit`: у `Space` он свой, унаследованный от
 * div'а, и с нашим — «выбранные статусы поменялись» — не совпадает ни по типу,
 * ни по смыслу. Имя при этом остаётся нашим: переименовать его в `onStatusChange`
 * значило бы подстроить подпись компонента под то, что база заняла имя первой.
 */
export interface StatusFilterProps extends Omit<SpaceProps, 'onChange'> {
  /** Статусы, по которым вообще можно фильтровать. Пустой список — фильтра нет. */
  statuses: readonly StatusKind[];
  /** Выбранные статусы. Пустой массив — фильтр не применён. */
  value: readonly StatusKind[];
  /** Данные ещё едут: вместо фильтра показывается заглушка. */
  isLoading?: boolean;
  /** Подпись кнопки сброса. */
  clearLabel?: string;
  onChange: (next: StatusKind[]) => void;
}

/**
 * Фильтр списка по статусу: метки-переключатели и сброс.
 *
 * Обычный клик оставляет один статус, клик с Shift — набирает несколько.
 *
 * @example
 * ```tsx
 * <StatusFilter
 *   statuses={['active', 'pending', 'blocked']}
 *   value={filter.statuses}
 *   isLoading={isFetching}
 *   onChange={setStatuses}
 * />
 * ```
 */
export const StatusFilter = (props: StatusFilterProps) => {
  const {
    statuses,
    value,
    isLoading = false,
    clearLabel = DEFAULT_CLEAR_LABEL,
    style,
    onChange,
    ...rest
  } = props;

  // Рефы — последняя группа хуков-источников, после контекста, стора и стейта.
  const listRef = useRef<HTMLDivElement>(null);

  /*
   * Эффекты закрывают блок хуков — и весь этот блок стоит выше хендлеров и любых
   * вычислений. Сверху видно, что компонент вообще подключает, а ни один хук не
   * прячется под условием или ранним возвратом, где он сорвал бы правило хуков.
   *
   * Эффекту это ничего не стоит: сослаться из массива зависимостей на хендлер,
   * объявленный ниже, всё равно нельзя — на момент рендера он ещё в мёртвой зоне.
   *
   * Внутри блока порядок — тот же, в каком их вызовет React: `useLayoutEffect`
   * до отрисовки, `useEffect` после. Файл читается как расписание, а не как
   * список в случайном порядке.
   */

  /*
   * Список статусов сменился — прокрутка от прежнего осталась бы, и новый
   * открывался бы с середины.
   *
   * Layout-эффект, а не обычный: обычный сработал бы уже после отрисовки, и
   * кадр со старой прокруткой успел бы попасть на экран.
   */
  useLayoutEffect(() => {
    listRef.current?.scrollTo({ left: 0 });
  }, [statuses]);

  /*
   * Escape сбрасывает фильтр — подписка на документ, то есть настоящая сторона,
   * ради которой эффект и нужен.
   *
   * Возвращённая функция снимает слушателя: без неё каждый повторный запуск
   * эффекта оставлял бы предыдущий висеть на документе.
   *
   * Внутри зовётся `onChange`, а не `handleClear`, хотя тот делает ровно это:
   * хендлер объявлен ниже, и в зависимостях его не назвать. Да и назвать было бы
   * нечем — `exhaustive-deps` про React Compiler не знает и на объявленную в теле
   * функцию требует `useCallback`, которого в papi нет. Проп таких вопросов не
   * вызывает: он пришёл сверху и в зависимостях стоит честно.
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      onChange([]);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onChange]);

  /*
   * Производные значения — уже после всех хуков. Булево называется с `is`/`has`
   * и считается прямо в теле: `useMemo`, `useCallback` и `memo` в papi не пишутся,
   * пока о них не попросят прямо.
   */
  const hasSelection = value.length > 0;

  /**
   * Хендлеру мало события — нужен ещё и статус, по которому кликнули. Поэтому
   * статус идёт вторым параметром, а не зашивается в отдельный хендлер на
   * каждую метку.
   *
   * Событие тут не для галочки: `shiftKey` и есть множественный выбор.
   */
  const handleToggle = (event: MouseEvent<HTMLSpanElement>, status: StatusKind) => {
    const isSelected = value.includes(status);

    // Ранний возврат вместо `else`: ветки независимы, и вложенность не растёт.
    if (event.shiftKey) {
      onChange(isSelected ? value.filter((item) => item !== status) : [...value, status]);
      return;
    }

    onChange(isSelected ? [] : [status]);
  };

  const handleClear = () => {
    onChange([]);
  };

  /*
   * Ранние возвраты — после хендлеров и до JSX. Хуки к этому месту закончились
   * все: возврат выше хука сорвал бы правило хуков на первой же смене ветки.
   *
   * Порядок веток — от самой временной к самой постоянной: пока данные едут,
   * пустой список статусов ещё ничего не значит.
   */
  if (isLoading) return <Skeleton.Button active />;

  if (statuses.length === 0) return null;

  return (
    /*
     * Строка не переносится, а прокручивается: перенос менял бы высоту шапки на
     * каждый выбранный статус. Прокрутка — то, к чему привязан layout-эффект
     * выше, и ради неё же на `Space` висит реф.
     */
    <Space
      ref={listRef}
      wrap={false}
      style={{ maxWidth: '100%', overflowX: 'auto', ...style }}
      {...rest}
    >
      {statuses.map((status) => {
        const isSelected = value.includes(status);

        return (
          <StatusTag
            key={status}
            status={status}
            /*
             * Выбранное состояние — вариантом самой antd, а не своими стилями:
             * `solid` и `outlined` уже знают про тему и тёмную схему, а
             * покрашенное руками осталось бы одним и тем же в обеих.
             */
            variant={isSelected ? 'solid' : 'outlined'}
            /*
             * Что базой не описано — идёт в `style` прямо здесь. CSS-файла и
             * `className` у компонента нет: класс лежал бы в другом файле,
             * молча расходился с разметкой и не перекрывался бы из панели —
             * а `style` панель просто передаёт своим пропом.
             */
            style={{ cursor: 'pointer' }}
            /*
             * Стрелка в JSX — потому что хендлеру нужен ещё и статус: событие
             * React передаст сам, а `status` живёт только здесь, внутри `map`.
             *
             * Стрелка не мемоизируется руками и не выносится: за стабильность
             * ссылки отвечает React Compiler.
             */
            onClick={(event) => handleToggle(event, status)}
          />
        );
      })}

      {/* Условный рендер через `&&`: сбрасывать нечего — кнопки нет вовсе.
          Слева именно булево, а не `value.length`: ноль отрисовался бы нулём. */}
      {hasSelection && (
        /* Хендлеру хватает события — он передаётся ссылкой. Обёртка
           `onClick={(event) => handleClear(event)}` добавила бы слой, который
           ничего не говорит. */
        <Button type="link" size="small" onClick={handleClear}>
          {clearLabel}
        </Button>
      )}
    </Space>
  );
};
