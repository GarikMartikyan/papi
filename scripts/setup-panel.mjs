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
 * собирать его нечем. Отсюда же и опрос на своём readline вместо готового
 * `prompts` или `@clack/prompts`: зависимость ставить некуда.
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
 * безвредно — здесь это лишь подсказка, которую человек видит и правит.
 */
const MAX_ABBR_LENGTH = 4;

/** Тот же дефолт, что в `.env.example`: мок и бэкенд на одном origin с панелью. */
const DEFAULT_API_BASE_URL = '/api/v1';

/** Варианты по Tab: относительный префикс и бэкенд на своём порту. */
const API_BASE_URL_SUGGESTIONS = [DEFAULT_API_BASE_URL, '/api', 'http://localhost:4000/api/v1'];

/** npm под Windows — `npm.cmd`, и без расширения `execFileSync` его не найдёт. */
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';

/** Ctrl+C: общепринятый код выхода — 128 + номер сигнала. */
const SIGINT_EXIT_CODE = 130;

/** Отказ от предложенного ответа: одиночный дефис, как у git и curl. */
const SKIP_ANSWER = '-';

/*
 * Пути от самого файла, а не от `process.cwd()`: скрипт зовут и через
 * `npm run setup` из корня, и напрямую из любой папки, а корень репозитория
 * у него всегда на уровень выше.
 */
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PACKAGE_JSON = new URL('../package.json', import.meta.url);
const ENV_EXAMPLE = new URL('../.env.example', import.meta.url);
const ENV = new URL('../.env', import.meta.url);

/**
 * Цвет — только живому терминалу.
 *
 * `NO_COLOR` — общее соглашение утилит командной строки, а проверка на TTY
 * убирает escape-последовательности из логов CI и из вывода, перенаправленного
 * в файл, где они читаются как мусор.
 */
const isColorful = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

/**
 * Плейсхолдер — серый текст прямо в строке ввода, поверх которого печатают.
 *
 * Требует и живого ввода, и цвета: без TTY его некуда рисовать, а без цвета он
 * неотличим от уже набранного ответа — и человек стёр бы его руками, приняв за
 * свой ввод. Там, где его нет, подсказка пишется словами в скобках.
 */
const hasPlaceholders = isColorful && Boolean(process.stdin.isTTY);

const paint = (code, text) => (isColorful ? `\u001B[${code}m${text}\u001B[0m` : text);
const bold = (text) => paint('1', text);
const dim = (text) => paint('2', text);
const red = (text) => paint('31', text);
const green = (text) => paint('32', text);
const cyan = (text) => paint('36', text);

/** Шаг выполнен — строка с галочкой, как у любого установщика. */
const step = (message) => console.log(`${green('✔')} ${message}`);

const fail = (message) => {
  console.error(`\n${red('✖')} ${message}\n`);
  process.exit(1);
};

/**
 * Отказ — не ошибка, поэтому спокойным серым, а не красным.
 *
 * Код выхода нулевой: «передумал» — штатный исход, и обёртка вроде
 * `npm run setup && npm run dev` не должна считать его поломкой. У Ctrl+C код
 * свой, 130, — так принято, и по нему отказ отличим в логах.
 */
const cancel = (exitCode = 0) => {
  console.log(`\n${dim('Отменено. Ничего не изменено.')}\n`);
  process.exit(exitCode);
};

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

/**
 * Опрос: вопрос, подсказка, Tab-варианты и проверка ответа.
 *
 * Варианты живут в изменяемом `suggestions`, потому что `completer` задаётся
 * один раз на весь `readline`, а меняется от вопроса к вопросу. Замыкание на
 * общее состояние — единственный способ отдать readline актуальный список, не
 * пересоздавая интерфейс на каждый вопрос (а пересозданный терял бы историю
 * ввода и перехват Ctrl+C).
 */
const createPrompt = () => {
  const state = { placeholder: '', suggestions: [] };

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    /*
     * На пустой строке Tab подставляет первый вариант целиком, дальше работает
     * обычным дополнением по началу слова.
     *
     * Первый — а не весь список: получив несколько вариантов, readline вставляет
     * их общий префикс, а у `/api/v1` и `http://localhost:4000/api/v1` его нет,
     * и Tab не делал бы ничего — только печатал список. Остальные варианты
     * никуда не деваются: `h` и Tab доберутся до localhost, как в любой
     * командной оболочке.
     */
    completer: (line) => {
      if (line === '') return [state.suggestions.slice(0, 1), line];

      return [state.suggestions.filter((value) => value.startsWith(line)), line];
    },
  });

  /*
   * Ctrl+C посреди вопроса: readline перехватывает сигнал сам, и без этого
   * обработчика скрипт просто завис бы с висящим промисом вместо выхода.
   */
  rl.on('SIGINT', () => cancel(SIGINT_EXIT_CODE));

  /*
   * Строки читаются асинхронным итератором, а не `rl.question`: тот ловит
   * только ту строку, что пришла, пока вопрос висит. Из терминала так и бывает,
   * а `node setup-panel.mjs < answers.txt` отдаёт весь файл одним куском —
   * readline выкладывает его строками сразу, и все вопросы, кроме первого,
   * не увидели бы ничего. Итератор придерживает поток и отдаёт ровно столько,
   * сколько спросили.
   */
  const lines = rl[Symbol.asyncIterator]();

  const read = async () => {
    const { done, value } = await lines.next();

    if (done) fail('Ввод кончился, а вопросы ещё нет. Настройка не начата.');

    return value;
  };

  /**
   * Вопрос печатает сам readline, а не `process.stdout.write`.
   *
   * Разница видна на Tab: показав варианты, readline перерисовывает строку
   * ввода — и берёт для неё свой `prompt`, а не то, что написали в stdout мимо
   * него. С прямой записью после первого же Tab на экране остался бы дефолтный
   * `> ` вместо вопроса.
   */
  const prompt = (text) => {
    rl.setPrompt(text);
    rl.prompt();
    drawPlaceholder();
  };

  /**
   * Серый ответ-заготовка в пустой строке ввода: Enter принимает его как есть,
   * Tab вписывает его настоящим текстом, любая буква — начинает свой ответ.
   *
   * Рисуется поверх пустой строки и тут же возвращает курсор в начало, поэтому
   * это именно подсказка, а не подставленное значение: стирать её backspace'ом
   * не нужно, она исчезнет сама при первом же нажатии.
   */
  const drawPlaceholder = () => {
    if (!hasPlaceholders || state.placeholder === '' || rl.line !== '') return;

    const width = [...state.placeholder].length;

    process.stdout.write(`${dim(state.placeholder)}\u001B[${width}D`);
  };

  /*
   * Заготовку приходится рисовать заново после каждого нажатия: readline на
   * каждой перерисовке стирает всё до конца экрана, и без этого она пропала бы
   * с первым же backspace, вернувшим строку в пустое состояние.
   *
   * Enter пропускается: строка на нём пустеет, и заготовка ушла бы уже на
   * следующую строку, под вопросом.
   */
  process.stdin.on('keypress', (_char, key) => {
    if (key?.name === 'return' || key?.name === 'enter') return;

    drawPlaceholder();
  });

  /**
   * Подсказка в скобках: чем ответит Enter и что подставит Tab.
   *
   * Пишется рядом с вопросом, а не в шапке скрипта: подсказка нужна там, где
   * курсор, — прочитанную один раз в начале к пятому вопросу уже не помнят.
   */
  const buildHint = ({ example, fallback, note, optional }) => {
    const parts = [];

    if (note !== '') parts.push(note);

    /*
     * Заготовка стоит в самой строке, поэтому дублировать её словами незачем:
     * `(Enter — RMP)` рядом с серым `RMP` в поле ввода — это одно и то же,
     * сказанное дважды. А там, где заготовки нет (не терминал, `NO_COLOR`),
     * она остаётся единственным способом узнать про дефолт.
     */
    if (!hasPlaceholders && fallback !== '') parts.push(`Enter — ${fallback}`);
    else if (optional) parts.push('Enter — пропустить');
    else if (fallback === '' && example !== '') parts.push(`например, ${example}`);

    return parts.length > 0 ? ` ${dim(`(${parts.join(', ')})`)}` : '';
  };

  /**
   * Вопрос со свободным ответом. Спрашивает заново, пока `validate` возвращает
   * текст ошибки; пустой ответ заменяется дефолтом ещё до проверки.
   */
  const ask = async (
    question,
    { example = '', fallback = '', note = '', optional = false, suggestions = [], validate } = {},
  ) => {
    /*
     * Дефолт всегда и первый вариант по Tab: его чаще правят, чем набирают
     * заново, а вписанный он редактируется как обычный текст.
     */
    state.suggestions = [...new Set([fallback, ...suggestions])].filter(Boolean);
    state.placeholder = fallback;

    const hint = buildHint({ example, fallback, note, optional });

    for (;;) {
      prompt(`${cyan('?')} ${bold(question)}${hint}: `);

      const answer = (await read()).trim() || fallback;
      const error = validate?.(answer);

      if (!error) return answer;

      console.log(`  ${red('✖')} ${error}`);
    }
  };

  /** Да/нет: `y`, `yes`, `да` или Enter — согласиться; `n`, `no`, `нет` — отказаться. */
  const confirm = async (question, { fallbackYes = true } = {}) => {
    state.suggestions = ['yes', 'no'];

    /*
     * Заготовки тут нет: у да/нет дефолт показывает заглавная буква в `(Y/n)` —
     * соглашение, которое читается без объяснений, а серое `yes` в строке ввода
     * только сбивало бы с толку.
     */
    state.placeholder = '';

    const hint = dim(fallbackYes ? '(Y/n)' : '(y/N)');

    for (;;) {
      prompt(`${cyan('?')} ${bold(question)} ${hint}: `);

      const answer = (await read()).trim().toLowerCase();

      if (answer === '') return fallbackYes;
      if (['y', 'yes', 'д', 'да'].includes(answer)) return true;
      if (['n', 'no', 'н', 'нет'].includes(answer)) return false;

      console.log(`  ${red('✖')} Ответ — y или n.`);
    }
  };

  return { ask, close: () => rl.close(), confirm };
};

/** Первые буквы слов имени — `Risk Management Panel` даёт `RMP`. */
const abbrFromName = (name) =>
  name
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join('')
    .slice(0, MAX_ABBR_LENGTH)
    .toUpperCase();

/**
 * Адрес своего репозитория, собранный из адреса ядра: у панели тот же хостинг и
 * тот же владелец, меняется только имя. Уходит в Tab-подсказку — набирать
 * `git@github.com:owner/…` руками незачем.
 *
 * Ремоут спрашивается сначала как `upstream`, потом как `origin`: до
 * переименования ядро висит на `origin`, после — на `upstream`, а подсказка
 * нужна в обоих случаях.
 */
const originSuggestion = (packageName) => {
  const coreUrl =
    gitOrNull('remote', 'get-url', 'upstream') ?? gitOrNull('remote', 'get-url', 'origin');

  if (coreUrl === null) return [];

  /*
   * Меняется только последний сегмент, `.git` на конце сохраняется: адрес
   * панели отличается от адреса ядра одним именем, каким бы ни был протокол —
   * ssh, https или локальный путь.
   */
  return [coreUrl.replace(/[^:/]+?(\.git)?$/, `${packageName}$1`)];
};

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

const askSettings = async (ask) => {
  const appName = await ask('Имя панели', {
    example: 'Risk Management Panel',
    validate: (value) => (value === '' ? 'Без имени панели не обойтись.' : undefined),
  });

  const abbr = await ask('Аббревиатура для логотипа и вкладки', {
    fallback: abbrFromName(appName),
    validate: (value) =>
      /^[A-Za-z]{2,4}$/.test(value) ? undefined : 'Две-четыре латинские буквы, как RMP.',
  });

  const packageName = await ask('Имя пакета в package.json', {
    fallback: abbr.toLowerCase(),
    validate: (value) =>
      /^[a-z0-9][a-z0-9._-]*$/.test(value)
        ? undefined
        : 'Строчные латинские буквы, цифры и дефис — это слаг пакета.',
  });

  const apiBaseUrl = await ask('Префикс эндпоинтов', {
    fallback: DEFAULT_API_BASE_URL,
    suggestions: API_BASE_URL_SUGGESTIONS,
  });

  /*
   * Адрес свой репозиторий получает заготовкой, а не пустой строкой: панели он
   * почти всегда нужен, и собранный из адреса ядра он верен чаще, чем набранный
   * руками. Поэтому и отказ здесь явный — `-`, а не Enter: пустым Enter'ом
   * пропускают то, чего не предлагали.
   */
  const [originFallback = ''] = originSuggestion(packageName);

  const originAnswer = await ask('Адрес репозитория панели', {
    fallback: originFallback,
    note: originFallback === '' ? '' : `${SKIP_ANSWER} — пропустить`,
    optional: originFallback === '',
  });

  return {
    abbr: abbr.toUpperCase(),
    apiBaseUrl,
    appName,
    originUrl: originAnswer === SKIP_ANSWER ? '' : originAnswer,
    packageName,
  };
};

/**
 * Ядро приезжает из papi, поэтому его адрес становится `upstream`, а `origin`
 * освобождается под репозиторий самой панели.
 *
 * Переименование пропускается, если `upstream` уже есть: клон могли настроить
 * руками до скрипта, и второе переименование сломало бы то, что уже верно.
 */
const setRemotes = (originUrl) => {
  if (gitOrNull('remote', 'get-url', 'upstream') === null) {
    git('remote', 'rename', 'origin', 'upstream');
    step(`${bold('origin')} переименован в ${bold('upstream')} — ядро приезжает оттуда`);
  }

  if (originUrl === '') {
    step(`свой ${bold('origin')} не задан — панель пока только локальная`);

    return;
  }

  if (gitOrNull('remote', 'get-url', 'origin') === null) git('remote', 'add', 'origin', originUrl);
  else git('remote', 'set-url', 'origin', originUrl);

  step(`${bold('origin')} → ${originUrl}`);
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
  step(`${bold('package.json')} name → ${packageName}`);
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
    step(`${bold('.env')} уже есть — оставляю как есть`);

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
  step(`${bold('.env')} собран из образца`);
};

/**
 * `npm install` нужен не только ради зависимостей: его `prepare` включает
 * `core.hooksPath`, то есть тот самый запрет на правку `lib/`. Без установки
 * хук лежит в репозитории, но не работает.
 */
const installDependencies = () => {
  console.log(`\n${dim('Ставлю зависимости — заодно включится запрет на правку lib/.')}\n`);

  run(NPM, 'install');
  step('зависимости поставлены, хуки включены');
};

const commit = (packageName, branch) => {
  git('add', 'package.json', 'package-lock.json');
  git('commit', '-m', `Take the name ${packageName}, so this clone stops being papi`);
  step(`коммит в ${bold(branch)}`);
};

/**
 * Неудачный push — не повод ронять настройку.
 *
 * Адрес репозитория предлагается заготовкой, собранной из адреса ядра, поэтому
 * попасть можно и в репозиторий, который ещё не создали. Всё остальное к этому
 * моменту уже сделано и лежит в коммите — панель настроена, отправить её можно
 * когда угодно.
 */
const push = (branch) => {
  console.log(`\n${dim('Отправляю первый коммит в origin.')}\n`);

  try {
    run('git', 'push', '-u', 'origin', branch);
    step(`${bold(branch)} отправлена в origin`);
  } catch {
    console.log(`\n${red('✖')} Push не прошёл — репозиторий уже создан на хостинге?`);
    console.log(`${dim(`Панель настроена, отправить можно позже: git push -u origin ${branch}`)}`);
  }
};

const printPlan = ({ abbr, apiBaseUrl, appName, originUrl, packageName }, branch) => {
  const rows = [
    ['origin → upstream', 'ядро приезжает оттуда'],
    ['origin', originUrl || dim('не задан, пропускаю')],
    ['package.json name', packageName],
    ['.env', `${appName} / ${abbr} / ${apiBaseUrl}`],
    ['npm install и коммит', `в ветку ${branch}`],
  ];

  console.log(`\n${bold('Что будет сделано')}\n`);

  for (const [title, value] of rows) console.log(`  ${dim(title.padEnd(22))} ${value}`);

  console.log('');
};

const printNextSteps = ({ abbr, appName }) => {
  console.log(`
${green('✔')} ${bold(`Панель ${appName} настроена.`)} Дальше:

  ${cyan('npm run dev')}                                   поднять её и посмотреть
  ${cyan('src/')}                                          заменить эталонные страницы своими
  ${cyan('git fetch upstream && git merge upstream/main')}  обновить ядро

${dim(`Логотип пока собирается из имени и букв — своя иконка добавляется записью
"${abbr.toLowerCase()}" в lib/components/shared/PanelLogo.tsx, но в репозитории papi,
а не здесь: lib/ приезжает мержем и в панели не правится.`)}
`);
};

/** `--help`: то же соглашение, что у любой утилиты командной строки. */
const printHelp = () => {
  console.log(`
${bold('Настройка панели на свежем клоне papi')}

  ${cyan('npm run setup')}                  спросит имя панели и настроит клон
  ${cyan('node scripts/setup-panel.mjs')}   то же самое напрямую

Ответы можно подать файлом: ${cyan('node scripts/setup-panel.mjs < answers.txt')} —
по строке на вопрос, пустая строка означает Enter.
`);
};

const setupPanel = async () => {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printHelp();

    return;
  }

  assertFreshClone();

  const { ask, close, confirm } = createPrompt();

  try {
    console.log(`\n${bold('Настройка панели papi')}`);

    /*
     * Правила ввода объясняются те, что человек видит: с заготовками речь про
     * серый текст в строке, без них — про подсказку в скобках. Рассказать про
     * серое там, где его нет, значит отправить искать несуществующее.
     */
    if (hasPlaceholders) {
      console.log(`${dim('Серое в строке — ответ по умолчанию: Enter принимает его,')}`);
      console.log(`${dim('Tab вписывает его текстом для правки, Ctrl+C выходит.')}\n`);
    } else {
      console.log(
        `${dim('В скобках — ответ по умолчанию: Enter принимает его, Ctrl+C выходит.')}\n`,
      );
    }

    const settings = await askSettings(ask);
    const branch = git('rev-parse', '--abbrev-ref', 'HEAD');

    printPlan(settings, branch);

    if (!(await confirm('Продолжить?'))) cancel();

    console.log('');

    setRemotes(settings.originUrl);
    writePackageJson(settings);
    writeEnv(settings);
    installDependencies();
    commit(settings.packageName, branch);

    /*
     * Push — единственный шаг, который виден не только в этой папке, поэтому
     * спрашивается отдельно и после установки: до неё непонятно, собралась ли
     * панель вообще.
     */
    if (settings.originUrl !== '') {
      console.log('');

      if (await confirm(`Запушить ${branch} в origin?`)) push(branch);
    }

    printNextSteps(settings);
  } finally {
    close();
  }
};

await setupPanel();
