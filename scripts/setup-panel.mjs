/**
 * Настройка панели на свежем клоне papi: ремоуты, имя пакета, `.env`,
 * зависимости и первый коммит.
 *
 * Ровно те шаги, что описаны в README разделом «Создать панель». Скриптом, а не
 * списком команд, потому что список выполняется руками по одному разу на панель
 * — и ровно поэтому в нём забывают шаг: без переименованного `name` не работает
 * запрет на правку ядра, без `.env` вкладка показывает `%VITE_APP_NAME%`.
 *
 * На голых модулях node и без единого импорта из проекта: скрипт зовут до
 * `npm install` — зависимости ставит он сам, — и в этот момент в клоне нет ни
 * одного пакета. По той же причине он не читает `lib/`: там TypeScript, а
 * собирать его нечем.
 */

import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

/** Имя пакета у самого papi: пока оно здесь, клон панелью ещё не стал. */
const CORE_PACKAGE_NAME = 'papi';

/**
 * Сколько букв влезает в знак логотипа. Столько же берётся из имени, когда
 * аббревиатуру не задали.
 *
 * Правило повторяет `getAppAbbr` из `lib/services/env.service.ts`, а не зовёт
 * его: там TypeScript, который на этом шаге ещё нечем собрать. Расхождение
 * безвредно — здесь это лишь подсказка в скобках, которую человек видит и
 * правит.
 */
const MAX_ABBR_LENGTH = 4;

/** Тот же дефолт, что в `.env.example`: мок и бэкенд на одном origin с панелью. */
const DEFAULT_API_BASE_URL = '/api/v1';

/** npm под Windows — `npm.cmd`, и без расширения `execFileSync` его не найдёт. */
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';

/*
 * Пути от самого файла, а не от `process.cwd()`: скрипт зовут и через
 * `npm run setup` из корня, и напрямую из любой папки, а корень репозитория
 * у него всегда на уровень выше.
 */
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PACKAGE_JSON = new URL('../package.json', import.meta.url);
const ENV_EXAMPLE = new URL('../.env.example', import.meta.url);
const ENV = new URL('../.env', import.meta.url);

/** Git с выводом в переменную: ответы нужны самому скрипту, а не человеку. */
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();

/**
 * Тот же git, но для вопросов, у которых «команда не прошла» — это ответ «нет».
 *
 * Здесь же гасится stderr: `git remote get-url upstream` на клоне, где ремоута
 * ещё нет, пишет «No such remote», — а это не поломка, а ожидаемый ответ, и
 * человек прочитал бы её как ошибку скрипта.
 */
const gitOrNull = (...args) => {
  try {
    return execFileSync('git', args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
};

/** Команда, вывод которой смотрит человек: `npm install` идёт прямо в терминал. */
const run = (command, ...args) => execFileSync(command, args, { cwd: ROOT, stdio: 'inherit' });

const fail = (message) => {
  console.error(`\n${message}\n`);
  process.exit(1);
};

/**
 * Строки ответов — по одной, из асинхронного итератора readline.
 *
 * Не `rl.question`: он ловит только ту строку, которая пришла, пока вопрос
 * висит. Из терминала так и бывает, а вот `node setup-panel.mjs < answers.txt`
 * отдаёт весь файл одним куском — readline выкладывает его строками сразу, и
 * вопросы со второго по последний не видят ничего. Итератор придерживает поток
 * и отдаёт ровно столько, сколько спросили, поэтому скрипт одинаково работает и
 * руками, и с готовыми ответами.
 */
const createReader = (rl) => {
  const lines = rl[Symbol.asyncIterator]();

  return async () => {
    const { done, value } = await lines.next();

    if (done) fail('Ввод кончился, а вопросы ещё нет. Настройка не начата.');

    return value;
  };
};

/**
 * Вопрос с подсказанным ответом: Enter — согласиться.
 *
 * Спрашивает заново, пока `validate` возвращает текст ошибки. Пустой ответ без
 * дефолта тоже проходит через проверку — так необязательный адрес репозитория
 * пропускается Enter'ом, а обязательное имя переспрашивается.
 */
const ask = async (read, question, { fallback = '', validate } = {}) => {
  for (;;) {
    const hint = fallback ? ` [${fallback}]` : '';

    process.stdout.write(`${question}${hint}: `);

    const answer = (await read()).trim() || fallback;
    const error = validate?.(answer);

    if (!error) return answer;

    console.log(`  ${error}`);
  }
};

const confirm = async (read, question) => {
  process.stdout.write(`${question} [Y/n]: `);

  const answer = (await read()).trim().toLowerCase();

  return answer === '' || answer === 'y' || answer === 'yes' || answer === 'д';
};

/** Первые буквы слов имени — `Risk Management Panel` даёт `RMP`. */
const abbrFromName = (name) =>
  name
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join('')
    .slice(0, MAX_ABBR_LENGTH)
    .toUpperCase();

const readPackageJson = () => JSON.parse(readFileSync(PACKAGE_JSON, 'utf8'));

/**
 * Скрипт рассчитан на свежий клон и один запуск.
 *
 * Проверок три, и каждая ловит свой случай: не репозиторий — клонировали архивом
 * и `git remote` работать не будет; имя уже не `papi` — панель настроена, второй
 * прогон затёр бы её `.env` и завёл второй коммит; грязное дерево — скрипт
 * коммитит, и чужие правки уехали бы в его коммит.
 */
const assertFreshClone = () => {
  if (gitOrNull('rev-parse', '--is-inside-work-tree') !== 'true') {
    fail('Это не git-репозиторий. Панель создаётся клоном papi — см. README.');
  }

  const { name } = readPackageJson();

  if (name !== CORE_PACKAGE_NAME) {
    fail(`Пакет уже называется "${name}" — клон настроен панелью, второй прогон не нужен.`);
  }

  if (git('status', '--porcelain') !== '') {
    fail('В рабочем дереве есть незакоммиченные правки. Прибери их и запусти скрипт снова.');
  }
};

const askSettings = async (read) => {
  console.log('\nНастройка панели. В скобках — что подставится по Enter.\n');

  const appName = await ask(read, 'Имя панели, например Risk Management Panel', {
    validate: (value) => (value === '' ? 'Без имени панели не обойтись.' : undefined),
  });

  const abbr = await ask(read, 'Аббревиатура для логотипа и вкладки', {
    fallback: abbrFromName(appName),
    validate: (value) =>
      /^[A-Za-z]{2,4}$/.test(value) ? undefined : 'Две-четыре латинские буквы, как RMP.',
  });

  const packageName = await ask(read, 'Имя пакета в package.json', {
    fallback: abbr.toLowerCase(),
    validate: (value) =>
      /^[a-z0-9][a-z0-9._-]*$/.test(value)
        ? undefined
        : 'Строчные латинские буквы, цифры и дефис — это слаг пакета.',
  });

  const apiBaseUrl = await ask(read, 'Префикс эндпоинтов', { fallback: DEFAULT_API_BASE_URL });

  const originUrl = await ask(read, 'Адрес репозитория панели, Enter — пропустить');

  return { abbr: abbr.toUpperCase(), apiBaseUrl, appName, originUrl, packageName };
};

/**
 * Ядро приезжает из papi, поэтому его адрес становится `upstream`, а `origin`
 * освобождается под репозиторий самой панели.
 *
 * Пропускается, если `upstream` уже есть: клон могли настроить руками до
 * скрипта, и второе переименование сломало бы то, что уже верно.
 */
const setRemotes = (originUrl) => {
  if (gitOrNull('remote', 'get-url', 'upstream') === null) {
    git('remote', 'rename', 'origin', 'upstream');
  }

  if (originUrl === '') return;

  if (gitOrNull('remote', 'get-url', 'origin') === null) {
    git('remote', 'add', 'origin', originUrl);
  } else {
    git('remote', 'set-url', 'origin', originUrl);
  }
};

/**
 * Имя пакета — первое, что панель меняет после форка.
 *
 * Не косметика: по нему `.githooks/pre-commit` отличает панель от papi в клонах,
 * где ремоута `upstream` нет, — а его нет у всех, кроме того, в котором форк
 * делали руками.
 *
 * Файл переписывается через JSON, а не заменой строки: так правится ровно поле
 * `name`, и одноимённые поля зависимостей остаются на месте.
 */
const writePackageJson = ({ appName, packageName }) => {
  const packageJson = readPackageJson();

  packageJson.name = packageName;
  packageJson.description = `${appName}: ядро papi в lib/, панель в src/.`;

  writeFileSync(PACKAGE_JSON, `${JSON.stringify(packageJson, null, 2)}\n`);
};

/**
 * `.env` — копия образца с подставленными ответами.
 *
 * Правятся только строки присваивания, поэтому комментарии образца остаются на
 * месте: панель дальше живёт с этим файлом, и объяснение, откуда берётся каждая
 * переменная, ей нужнее, чем три голые строки.
 */
const writeEnv = ({ abbr, apiBaseUrl, appName }) => {
  if (existsSync(ENV)) {
    console.log('  .env уже есть — оставляю как есть.');

    return;
  }

  copyFileSync(ENV_EXAMPLE, ENV);

  const values = {
    VITE_API_BASE_URL: apiBaseUrl,
    VITE_APP_ABBR: abbr,
    VITE_APP_NAME: appName,
  };

  const env = Object.entries(values).reduce(
    (text, [name, value]) => text.replace(new RegExp(`^${name}=.*$`, 'm'), `${name}=${value}`),
    readFileSync(ENV, 'utf8'),
  );

  writeFileSync(ENV, env);
};

/**
 * `npm install` нужен не только ради зависимостей: его `prepare` включает
 * `core.hooksPath`, то есть тот самый запрет на правку `lib/`. Без установки
 * хук лежит в репозитории, но не работает.
 */
const installDependencies = () => {
  console.log('\nСтавлю зависимости — заодно включится запрет на правку lib/.\n');

  run(NPM, 'install');
};

const commit = (packageName) => {
  git('add', 'package.json', 'package-lock.json');
  git('commit', '-m', `Take the name ${packageName}, so this clone stops being papi`);
};

const push = (branch) => {
  console.log('\nОтправляю первый коммит в origin.\n');

  run('git', 'push', '-u', 'origin', branch);
};

const printNextSteps = ({ abbr, appName }) => {
  console.log(`
Панель ${appName} настроена. Дальше:

  npm run dev                                   поднять её и посмотреть
  src/                                          заменить эталонные страницы своими
  git fetch upstream && git merge upstream/main  обновить ядро

Логотип пока собирается из имени и букв — своя иконка добавляется записью
"${abbr.toLowerCase()}" в lib/components/shared/PanelLogo.tsx, но в репозитории papi,
а не здесь: lib/ приезжает мержем и в панели не правится.
`);
};

const setupPanel = async () => {
  assertFreshClone();

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const read = createReader(rl);

  try {
    const settings = await askSettings(read);
    const branch = git('rev-parse', '--abbrev-ref', 'HEAD');

    console.log(`
Что будет сделано:

  origin                 -> upstream (ядро приезжает отсюда)
  origin                 ${settings.originUrl || '— не задан, пропускаю'}
  package.json name      ${settings.packageName}
  .env                   ${settings.appName} / ${settings.abbr} / ${settings.apiBaseUrl}
  npm install            и коммит правок в ветку ${branch}
`);

    if (!(await confirm(read, 'Продолжить?'))) fail('Отменено, ничего не изменено.');

    setRemotes(settings.originUrl);
    writePackageJson(settings);
    writeEnv(settings);
    installDependencies();
    commit(settings.packageName);

    /*
     * Push — единственный шаг, который виден не только в этой папке, поэтому
     * спрашивается отдельно и после установки: до неё непонятно, собралась ли
     * панель вообще.
     */
    if (settings.originUrl !== '' && (await confirm(read, `\nЗапушить ${branch} в origin?`))) {
      push(branch);
    }

    printNextSteps(settings);
  } finally {
    rl.close();
  }
};

await setupPanel();
