/**
 * Components — shared UI built on antd: layout, navigation, feedback, guards.
 *
 * Каркас панель собирает одним `MainLayout` и передаёт всё пропсами.
 * `MainLayoutHeader` и `MainLayoutNav` — его части, а не самостоятельные
 * компоненты, поэтому здесь их нет.
 *
 * `LocaleSelect`, `ThemeSwitcher` и `UserMenu` выходят наружу отдельно: в шапку
 * их ставит сам `MainLayout`, но панель может показать их ещё раз — например
 * переключатель на странице настроек или аватар в своей шапке.
 */

export * from './Icon/Icon';
export * from './LocaleSelect/LocaleSelect';
export * from './MainLayout/MainLayout';
export * from './ThemeSwitcher/ThemeSwitcher';
export * from './UserMenu/UserMenu';
