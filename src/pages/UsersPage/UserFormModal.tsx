import { Form, Input, Modal } from 'antd';

import { useTranslation } from '../../hooks';
import type { CreateUserPayload } from '../../types/user.interface';

export interface UserFormModalProps {
  open: boolean;
  confirmLoading: boolean;
  onSubmit: (payload: CreateUserPayload) => void;
  onCancel: () => void;
}

export const UserFormModal = (props: UserFormModalProps) => {
  const { open, confirmLoading, onSubmit, onCancel } = props;

  const t = useTranslation();
  const [form] = Form.useForm<CreateUserPayload>();

  const required = [{ required: true, message: t('users.form.required') }];

  const handleOk = () => {
    void form
      .validateFields()
      .then((values) => {
        onSubmit(values);
        form.resetFields();
      })
      .catch(() => {
        // Невалидная форма — antd уже подсветил поля. Без catch это был бы
        // unhandled rejection на каждой неудачной валидации.
      });
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      open={open}
      title={t('users.form.title')}
      okText={t('users.form.submit')}
      cancelText={t('users.form.cancel')}
      confirmLoading={confirmLoading}
      onOk={handleOk}
      onCancel={handleCancel}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={{ role: 'viewer' }}>
        <Form.Item name="name" label={t('users.form.name')} rules={required}>
          {/* Без autoFocus: правило jsx-a11y его запрещает, а фокус в диалог
              antd заводит сам. */}
          <Input />
        </Form.Item>
        <Form.Item name="email" label={t('users.form.email')} rules={required}>
          <Input type="email" />
        </Form.Item>
        <Form.Item name="role" label={t('users.form.role')} rules={required}>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};
