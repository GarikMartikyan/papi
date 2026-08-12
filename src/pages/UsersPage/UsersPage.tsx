import { type ChangeEvent, useState } from 'react';

import { DeleteOutlined, PlusOutlined, WarningOutlined } from '@ant-design/icons';
import { App as AntdApp, Button, Input, Result, Space, Table, Tag, Typography } from 'antd';

import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useFailRequestMutation,
  useGetUsersQuery,
} from '../../api/users.api';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useTranslation } from '../../hooks/useTranslation';
import { setSearch, setSelectedUserId } from '../../store/slices/users.slice';
import { selectSearch, selectSelectedUserId } from '../../store/store';
import type { CreateUserPayload, User } from '../../types/user.interface';

import { UserFormModal } from './UserFormModal';

export const UsersPage = () => {
  const t = useTranslation();
  const { message } = AntdApp.useApp();

  const dispatch = useAppDispatch();
  const search = useAppSelector(selectSearch);
  const selectedUserId = useAppSelector(selectSelectedUserId);

  const { data, isLoading, isError, refetch } = useGetUsersQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  // TODO: временная проверка тоста ядра — удалить вместе с ручкой `failRequest`.
  const [failRequest, { isLoading: isFailing }] = useFailRequestMutation();

  const [isFormOpen, setIsFormOpen] = useState(false);

  const users = data ?? [];
  const query = search.trim().toLowerCase();
  const visible =
    query === ''
      ? users
      : users.filter(
          (user) =>
            user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query),
        );
  const selected = users.find((user) => user.id === selectedUserId);

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearch(event.target.value));
  };

  // `.unwrap()` отклоняется на ошибке запроса, поэтому `catch` обязателен:
  // без него неудачная мутация всплывает как unhandled rejection.
  const handleCreate = (payload: CreateUserPayload) => {
    void createUser(payload)
      .unwrap()
      .then(() => {
        setIsFormOpen(false);
        // Список обновится сам: мутация инвалидирует тег `User`.
        message.success(t('user created'));
      })
      .catch(() => {
        message.error(t('request failed'));
      });
  };

  // Своего `message.success` здесь нет: тост на удаление показывает ядро —
  // эндпоинт объявил его через `showSuccessMessage`.
  const handleDelete = (id: string) => {
    void deleteUser(id)
      .unwrap()
      .then(() => {
        if (id === selectedUserId) dispatch(setSelectedUserId(null));
      })
      .catch(() => {
        message.error(t('request failed'));
      });
  };

  /*
   * TODO: временная проверка тоста ядра — удалить вместе с ручкой `failRequest`.
   *
   * Своего `message.error` здесь нет намеренно: тост на ошибку показывает ядро
   * из `baseQuery`, и проверяется именно он. `catch` нужен только чтобы
   * отклонённый `unwrap` не всплыл как unhandled rejection.
   */
  const handleFailRequest = () => {
    void failRequest()
      .unwrap()
      .catch(() => undefined);
  };

  const columns = [
    {
      title: t('name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('email'),
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: t('role'),
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag>{role}</Tag>,
    },
    {
      title: t('actions'),
      key: 'actions',
      render: (_: unknown, user: User) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          aria-label={t('delete')}
          onClick={() => {
            handleDelete(user.id);
          }}
        />
      ),
    },
  ];

  if (isError) {
    return (
      <Result
        status="error"
        title={t('request failed')}
        extra={
          <Button
            onClick={() => {
              void refetch();
            }}
          >
            {t('try again')}
          </Button>
        }
      />
    );
  }

  return (
    <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
      <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
        <Space wrap>
          <Input.Search
            allowClear
            value={search}
            placeholder={t('search by name or email')}
            onChange={handleSearch}
            style={{ width: 280 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setIsFormOpen(true);
            }}
          >
            {t('add user')}
          </Button>
          {/* TODO: временная кнопка — удалить вместе с ручкой `failRequest`. */}
          <Button danger icon={<WarningOutlined />} loading={isFailing} onClick={handleFailRequest}>
            {t('fail a request')}
          </Button>
        </Space>

        <Typography.Text type="secondary">
          {t('{count} users', { count: visible.length })}
          {selected !== undefined && (
            <>
              {' · '}
              {t('selected: {name}', { name: selected.name })}
            </>
          )}
        </Typography.Text>

        <Table<User>
          rowKey="id"
          loading={isLoading}
          dataSource={visible}
          columns={columns}
          pagination={false}
          locale={{ emptyText: t('no users match your search') }}
          rowSelection={{
            type: 'radio',
            selectedRowKeys: selectedUserId === null ? [] : [selectedUserId],
            onChange: (keys) => {
              dispatch(setSelectedUserId(keys[0] === undefined ? null : String(keys[0])));
            },
          }}
        />
      </Space>

      <UserFormModal
        open={isFormOpen}
        confirmLoading={isCreating}
        onSubmit={handleCreate}
        onCancel={() => {
          setIsFormOpen(false);
        }}
      />
    </Space>
  );
};
