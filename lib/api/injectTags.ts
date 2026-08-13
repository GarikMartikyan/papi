import { papiRtkTags } from '../constants/tags.constants';
import { warn } from '../utils/logger.util';

import { api } from './api';

type CoreTags = typeof papiRtkTags;

/** Значение тега ядра: `'Me'` и всё, что к нему добавится. */
type CoreTagValue = CoreTags[keyof CoreTags];

/**
 * Теги панели вместе с тегами ядра — то, что возвращает `injectTags`.
 *
 * Занятое ядром из `Tags` вычеркнуто, и вычеркнуто дважды — по ключу и по
 * значению: ровно то и другое пропускает `injectTags` в рантайме, а тип, который
 * обещает пропущенное, хуже отсутствующего — на нём не спотыкается сборка, зато
 * спотыкается кеш. Та же поправка, что `Exclude` в `InjectedSlices`, и по той же
 * причине.
 *
 * Переименованием ключей, а не `Omit`: `Omit` вычёркивает только по ключу, а
 * вторая половина проверки смотрит на значение.
 */
export type InjectedTags<Tags extends Record<string, string>> = CoreTags & {
  [
    Key in keyof Tags as Key extends keyof CoreTags
      ? never
      : Tags[Key] extends CoreTagValue
        ? never
        : Key
  ]: Tags[Key];
};

/**
 * Объявляет теги панели: дописывает их в набор api ядра и отдаёт весь набор.
 *
 * ```ts
 * // src/constants/tags.constants.ts
 * export const rtkTags = injectTags({ user: 'User', order: 'Order' });
 * ```
 *
 * Занятое ядром не проходит — ни ключ, ни значение тега: и то, и другое связывает
 * два места кеша, и тег панели, совпавший с тегом ядра, сбрасывал бы чужие
 * запросы, выглядя при этом отдельным тегом. Пропущенное уходит предупреждением в
 * консоль и вычёркивается из типа, чтобы обращение к нему не собралось.
 *
 * Дописывает, а не передаёт в `createApi`: набор фиксируется при создании api, а
 * api создаётся в ядре — иначе его middleware было бы уже не подключить к стору.
 * Ядро при этом о сущностях панели не знает и импортировать `src/` не может,
 * поэтому набор растёт с этой стороны. Второго api от этого не появляется:
 * `enhanceEndpoints` дописывает в тот же массив `tagTypes` и возвращает тот же
 * объект, поэтому возврат здесь и не нужен, а панель зовёт `injectEndpoints`
 * прямо на `api` из `@papi/api`.
 *
 * Возвращает весь набор, а не только своё, чтобы у файла эндпоинтов панели была
 * одна точка импорта тегов: `rtkTags.me` лежит здесь же и `@papi/constants`
 * ради него не нужен.
 *
 * Типы этой функцией не расширяются — возврат `enhanceEndpoints` выброшен
 * намеренно. `TagTypes` у api берётся из `PapiTag`, а тот собирается из
 * объявления `Papi.ApiTags`, которое панель пишет сама (см. `src/types/tags.d.ts`).
 * Не написала — `PapiTag` схлопнется в `string`: сборка цела, но `providesTags`
 * перестаёт проверять теги.
 *
 * `as const` на объекте писать не нужно: `const`-параметр типа берёт литералы сам.
 */
export const injectTags = <const Tags extends Record<string, string>>(
  tags: Tags,
): InjectedTags<Tags> => {
  const injected: Record<string, string> = { ...papiRtkTags };
  const addTagTypes: string[] = [];
  const coreTags: string[] = Object.values(papiRtkTags);

  for (const [key, tag] of Object.entries(tags)) {
    /* `Object.hasOwn`, а не `in`: `in` видит и прототип, поэтому ключ `toString`
       или `constructor` объявлялся бы занятым ядром — и тег с таким ключом
       пропадал бы молча, оставляя в наборе метод `Object.prototype` под видом
       строки. Ключи объекта приходят снаружи, значит бывают любыми. */
    if (Object.hasOwn(papiRtkTags, key)) {
      warn(`Tag key "${key}" is taken by the core — tag skipped.`);
      continue;
    }

    /* Проверка и по значению: сам тег — это строка в `tagTypes`, и ключ, под
       которым она лежит, RTK Query не видит. Пройди сюда `{ profile: 'Me' }`,
       и `invalidatesTags: [rtkTags.profile]` в мутации панели сбрасывал бы кеш
       `getMe` ядра, а инвалидация ядра — кеш панели. Столкновение при этом
       выглядело бы как два независимых тега. */
    if (coreTags.includes(tag)) {
      warn(`Tag "${tag}" is taken by the core — tag skipped.`);
      continue;
    }

    injected[key] = tag;
    addTagTypes.push(tag);
  }

  api.enhanceEndpoints({ addTagTypes });

  return injected as InjectedTags<Tags>;
};
