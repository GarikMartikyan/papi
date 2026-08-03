import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Один конфиг на весь проект: ядро и панель живут в одном репозитории и линтятся
 * одними правилами. Отдельно описаны только границы между ними — см. ниже.
 */
export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**', '**/*.d.ts'],
  },

  js.configs.recommended,

  // Порядок импортов: react → внешние → ядро → родительские → соседние → стили.
  {
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^react$', '^react-dom(/.*)?$'],
            ['^node:', '^@?\\w'],
            ['^@papi'],
            ['^\\.\\.'],
            ['^\\./'],
            ['^.+\\.s?css$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
    },
  },

  // Type-aware linting.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommendedTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // React rules only where JSX lives.
  {
    files: ['**/*.tsx'],
    extends: [
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
      jsxA11y.flatConfigs.recommended,
    ],
    settings: { react: { version: 'detect' } },
  },
  // А эти — везде, где есть хуки, а не только в JSX. `rules-of-hooks` и
  // `exhaustive-deps` про разметку ничего не знают, и по соглашению репозитория
  // хук живёт в `.ts`, а не в `.tsx` (см. скилл hook-pattern). Сузь список до
  // одних `.tsx` — и ни один хук проекта не будет проверен вовсе.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat['recommended-latest']],
  },

  /*
   * Панель видит у ядра только барели: `@papi/components`, `@papi/hooks` и так
   * далее. Глубокий путь привязал бы её к расположению файлов внутри ядра, и
   * перестановка внутри `lib/` стала бы ломающим изменением для всех панелей.
   *
   * `@papi/styles.css` под шаблон не попадает — в нём один сегмент после
   * `@papi/`, а шаблон требует минимум два.
   *
   * Путь мимо алиаса запрещён отдельно: без него `../../lib/components/…` вёл
   * бы ровно туда же, и правило запрещало бы не глубокий импорт, а только один
   * способ его записать.
   */
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@papi/*/**', '**/lib/**'],
              message:
                'Ядро импортируется только через барели: @papi/components, @papi/hooks и т.д.',
            },
          ],
        },
      ],
    },
  },

  /*
   * Зависимость односторонняя: ядро о панели не знает. Внутри `lib/` импорты
   * относительные — алиас там означал бы, что ядро ходит к себе же снаружи.
   */
  {
    files: ['lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@papi', '@papi/**', '**/src/**'],
              message: 'Внутри ядра импорты относительные, и ядро не зависит от панели.',
            },
          ],
        },
      ],
    },
  },

  /*
   * Конфиги вне `tsconfig.json`, поэтому type-aware правила на них отключены.
   * `vite.config.ts` сюда не входит: он в `include`, и правила на нём работают.
   */
  {
    files: ['eslint.config.js', 'prettier.config.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },

  // Must stay last: turns off everything Prettier owns.
  prettier,
);
