import { DownOutlined, UserOutlined } from '@ant-design/icons';
import {
  Avatar,
  type AvatarProps,
  Button,
  Divider,
  Dropdown,
  type DropdownProps,
  type MenuProps,
  Typography,
} from 'antd';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { usePapiTranslation } from '../../hooks/usePapiTranslation';
import { useToken } from '../../hooks/useToken';

/**
 * Аватар в карточке меню. Дефолтные 32 у antd: рядом с ним две строки текста —
 * имя и описание, — и кружок мельче них уже не держит строку.
 */
const CARD_AVATAR_SIZE = 32;

/**
 * Аватар на кнопке в шапке. 24, а не 32, как в карточке: кнопка стоит вровень с
 * переключателем темы и списком языков, а те ростом с `controlHeight` (32), и
 * кружок в 32 не оставил бы места под её собственные отступы.
 */
const TRIGGER_AVATAR_SIZE = 24;

/** Больше двух букв в кружке не читаются — они начинают наезжать друг на друга. */
const MAX_INITIALS = 2;

/**
 * Ширина карточки в выпадающем меню.
 *
 * Нужна обеим строкам сразу: имя и описание обрезаются многоточием, а обрезать
 * нечему, пока блок тянется за самой длинной из них — почта вроде
 * `very.long.name@example.com` растянула бы всё меню.
 */
const CARD_MAX_WIDTH = 220;

/**
 * Своя тень меню внутри карточки не нужна: она уже есть у обёртки, которую
 * рисует `popupRender`, и вторая читалась бы полосой на границе с карточкой.
 */
const MENU_STYLE = { boxShadow: 'none' };

/**
 * По клику, а не по наведению, как у antd по умолчанию: меню уводит со
 * страницы — там выход и переходы, — и открываться от проезда мышью мимо угла
 * шапки оно не должно.
 */
const TRIGGER: DropdownProps['trigger'] = ['click'];

type MenuItem = NonNullable<MenuProps['items']>[number];

/**
 * `Гарик Мартикян` → `ГМ`. Запасной вариант аватарки: инициалы лучше безликого
 * силуэта, когда имя всё равно известно.
 *
 * По первой букве слова, а не две буквы подряд: `ГА` от `Гарик` читается
 * обрывком слова, а `ГМ` — инициалами, как их и пишут.
 *
 * Считаются из полного имени: в нём есть фамилия, а в коротком её обычно нет —
 * оттуда вышла бы одна буква.
 */
const getInitials = (name: string): string | undefined => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return undefined;

  return parts
    .slice(0, MAX_INITIALS)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
};

/**
 * Пункт меню пользователя.
 *
 * Подпись приходит готовым узлом, а не ключом сообщения: собственного каталога
 * строк у ядра нет — языки целиком задаёт панель (см. `I18nConfig`). Панель
 * пишет `label: t('sign out')`.
 */
export interface UserMenuAction {
  key: string;
  /** Подпись — уже переведённая. */
  label: ReactNode;
  icon?: ReactNode;
  /**
   * Маршрут панели. Задан — пункт становится настоящей ссылкой, а не строкой с
   * обработчиком: только у ссылки работают средний клик, «открыть в новой
   * вкладке» и адрес в строке состояния. Ровно по той же причине, что и в
   * правой колонке каркаса.
   */
  to?: string;
  /**
   * Что сделать по клику. Совместим с `to`: сначала обработчик, потом переход —
   * так пункт «Профиль» может заодно что-нибудь закрыть или отправить.
   */
  onClick?: () => void;
  /** Красный пункт: выход, удаление аккаунта. */
  danger?: boolean;
  disabled?: boolean;
}

/**
 * Разделитель между группами пунктов.
 *
 * Отдельным элементом списка, а не полем пункта вроде `dividerBefore`: так
 * группы видны прямо в массиве, и разделитель не привязан к тому, кто оказался
 * под ним.
 */
export interface UserMenuDivider {
  type: 'divider';
}

export type UserMenuItem = UserMenuAction | UserMenuDivider;

/**
 * `UserMenuItem` → элемент меню antd.
 *
 * `to` уходит в подпись настоящей `<Link>`: клик по строке попадает в неё же —
 * antd растягивает подпись на всю ширину пункта.
 */
const toMenuItem = (item: UserMenuItem): MenuItem => {
  if ('type' in item) return { type: 'divider' };

  return {
    key: item.key,
    icon: item.icon,
    danger: item.danger,
    disabled: item.disabled,
    label: item.to === undefined ? item.label : <Link to={item.to}>{item.label}</Link>,
    onClick: item.onClick,
  };
};

/**
 * `menu` вырезан: список собирается из `items`, и оставленный проп был бы вторым
 * способом задать то же самое — переданный, он молча отменял бы `items`.
 *
 * Остальные пропсы `Dropdown` остаются на месте и уходят в него через `...rest`:
 * `placement`, `trigger`, `arrow`, `open` с `onOpenChange`, `popupRender`. Через
 * них панель меняет поведение поповера, ничего не пересобирая.
 */
export interface UserMenuProps extends Omit<DropdownProps, 'menu'> {
  items: readonly UserMenuItem[];
  /**
   * Имя на кнопке в шапке — короткое: место там делится с языком и темой, и
   * длинная строка растянула бы кнопку через полшапки. Обычно это одно имя,
   * без фамилии.
   *
   * Не задано — на кнопку встанет `fullName`.
   */
  name?: ReactNode;
  /**
   * Полное имя в карточке меню. Там своя строка, и обрезать её приходится
   * только совсем длинной.
   *
   * Не задано — в карточке окажется `name`.
   */
  fullName?: ReactNode;
  /** Вторая строка карточки: роль, почта, компания — что угодно. */
  description?: ReactNode;
  /**
   * Пропсы antd `Avatar` целиком: `src`, `icon`, `shape`, `size`, `style`. Не
   * задан — в кружке инициалы из полного имени, а если имени нет — силуэт.
   */
  avatar?: AvatarProps;
}

/**
 * Пользователь в шапке: аватар с именем, по клику — выпадающее меню.
 *
 * ```
 * ┌──────────────────────────────────────────┐
 * │ [логотип]      ☀   [RU ▾]   (ГМ) Гарик ▾ │
 * └──────────────────────────────────────────┘
 *               ┌──────────────────────┐
 *               │ (ГМ) Гарик Мартикян  │
 *               │      Администратор   │
 *               ├──────────────────────┤
 *               │ 👤 Профиль           │
 *               │ ⏻  Выход             │
 *               └──────────────────────┘
 * ```
 *
 * Имён два, и это не дублирование: на кнопке короткое (`name`), в карточке
 * полное (`fullName`). Место в шапке делится с языком и темой, и фамилия
 * растянула бы кнопку через полшапки, а карточка ради того и открывается, чтобы
 * показать, под кем сидишь. Передано одно из двух — оно встанет в обоих местах.
 *
 * Кружок стоит в обоих местах: на кнопке он отличает пользователя от соседних
 * контролов шапки, в карточке — держит имя с описанием. Ростом они разные, и
 * размер приходит параметром, а не константой.
 *
 * Сам компонент ничего не запрашивает: и данные, и пункты приходят пропсами.
 * Под `PapiRouter` данные подставляет гард — из ответа `GET /me`, который он и
 * так делает, проверяя сессию. Отдельного слайса под пользователя у ядра нет
 * намеренно: ответ лежит в кеше RTK Query, и второе место, где то же самое
 * пришлось бы поддерживать в актуальном виде, ему не нужно.
 *
 * `MainLayout` ставит компонент в шапку сам, когда ему передан проп `user`,
 * поэтому отдельно он нужен там, где панель собирает свою шапку.
 *
 * Пункт с `to` рендерится ссылкой, поэтому компонент с такими пунктами обязан
 * стоять внутри роутера панели — как и весь каркас.
 *
 * Кнопку целиком можно заменить своей: `children` из `DropdownProps` остаётся на
 * месте, и переданный узел встаёт триггером вместо аватара с именем.
 */
export const UserMenu = (props: UserMenuProps) => {
  const { avatar, children, description, fullName, items, name, ...rest } = props;

  const token = useToken();
  const t = usePapiTranslation();

  /* Каждое имя подменяет другое, когда его не передали: панель, у которой имя
     одно, пишет любой из двух пропов и получает его в обоих местах. */
  const triggerName = name ?? fullName;
  const cardName = fullName ?? name;

  /* Инициалы — из полного имени: фамилия даёт вторую букву, а в коротком её
     обычно нет. */
  const initials = typeof cardName === 'string' ? getInitials(cardName) : undefined;

  /* Пустая карточка — лишняя полоса над меню, поэтому без имени и описания
     `popupRender` не подключается вовсе и меню остаётся обычным. */
  const hasCard = cardName !== undefined || description !== undefined;

  /*
   * Один и тот же кружок стоит в двух местах и разного роста: на кнопке он в
   * высоту контрола, а в карточке — рядом с двумя строками текста. Поэтому
   * размер приходит параметром, а не константой внутри.
   */
  const renderAvatar = (size: number) => (
    <Avatar
      size={size}
      /* Порядок у antd такой: `src` → `icon` → children. Поэтому силуэт
         ставится только когда инициалов нет, а любой переданный `avatar`
         перекрывает и то, и другое. */
      icon={initials === undefined ? <UserOutlined /> : undefined}
      {...avatar}
    >
      {initials}
    </Avatar>
  );

  const handlePopupRender = (menu: ReactNode) => (
    /*
     * Фон, скругление и тень — на этой обёртке, а не на меню: у antd их несёт
     * само меню, и карточка над ним оказалась бы вне плашки, отдельным куском в
     * воздухе. Меню внутри свою тень снимает (`MENU_STYLE`).
     */
    <div
      style={{
        background: token.colorBgElevated,
        borderRadius: token.borderRadiusLG,
        boxShadow: token.boxShadowSecondary,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: token.marginXS,
          maxWidth: CARD_MAX_WIDTH,
          paddingBlock: token.paddingXS,
          paddingInline: token.padding,
        }}
      >
        {renderAvatar(CARD_AVATAR_SIZE)}

        {/* `minWidth: 0` — иначе flex-элемент не даёт себя сжать ниже длины
            текста, и многоточие в строках не наступает никогда. */}
        <div style={{ display: 'grid', minWidth: 0 }}>
          {cardName !== undefined && <Typography.Text ellipsis>{cardName}</Typography.Text>}
          {description !== undefined && (
            <Typography.Text ellipsis type="secondary" style={{ fontSize: token.fontSizeSM }}>
              {description}
            </Typography.Text>
          )}
        </div>
      </div>

      <Divider style={{ margin: 0 }} />

      {menu}
    </div>
  );

  return (
    <Dropdown
      menu={{ items: items.map(toMenuItem), style: MENU_STYLE }}
      popupRender={hasCard ? handlePopupRender : undefined}
      trigger={TRIGGER}
      {...rest}
    >
      {children ?? (
        // Локальным стилем, а не токенами в теме: иначе плашкой стали бы все
        // обычные кнопки панели, а нужна она этой одной — в шапке.
        <Button
          type="text"
          /* Подпись только когда видимого имени нет: заданная поверх него, она
             подменила бы собой то, что пользователь читает на экране. */
          // Подпись — только когда имени нет: иначе она дублировала бы видимый
          // текст кнопки и скринридер прочитал бы его дважды.
          aria-label={triggerName === undefined ? t('account menu') : undefined}
          style={{
            /* Раскладка задана явно: своих отступов между произвольными детьми
               кнопка antd не держит — их получают только `icon` с текстом. */
            display: 'inline-flex',
            alignItems: 'center',
            gap: token.marginXS,
            height: token.controlHeight,
            paddingInlineEnd: token.paddingXS,
            paddingInlineStart: 4,
            background: token.colorBgLayout,
          }}
        >
          {renderAvatar(TRIGGER_AVATAR_SIZE)}

          {name}

          <DownOutlined style={{ fontSize: token.fontSizeSM, color: token.colorTextTertiary }} />
        </Button>
      )}
    </Dropdown>
  );
};
