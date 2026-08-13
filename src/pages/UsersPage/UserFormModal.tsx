import { Form, Input, Modal } from 'antd';

import { useTranslation } from '../../hooks/useTranslation';
import type { CreateUserPayload } from '../../types/types/user.types';

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

  const required = [{ required: true, message: t('this field is required') }];

  const handleOk = () => {
    void form
      .validateFields()
      .then((values) => {
        onSubmit(values);
        form.resetFields();
      })
      .catch(() => undefined);
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      open={open}
      title={t('new user')}
      okText={t('create')}
      cancelText={t('cancel')}
      confirmLoading={confirmLoading}
      onOk={handleOk}
      onCancel={handleCancel}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={{ role: 'viewer' }}>
        <Form.Item name="name" label={t('name')} rules={required}>
          <Input />
        </Form.Item>
        <Form.Item name="email" label={t('email')} rules={required}>
          <Input type="email" />
        </Form.Item>
        <Form.Item name="role" label={t('role')} rules={required}>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};
