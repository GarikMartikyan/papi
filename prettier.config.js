/**
 * Правила форматирования проекта — общие для ядра и панели.
 *
 * Файл, а не `.prettierrc.json`, ради комментариев: у JSON-конфига их некуда
 * положить, а объяснять отдельные пункты приходится.
 *
 * @type {import('prettier').Config}
 */
export default {
  semi: true,
  singleQuote: true,
  jsxSingleQuote: false,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  arrowParens: 'always',
  bracketSpacing: true,
  endOfLine: 'lf',
};
