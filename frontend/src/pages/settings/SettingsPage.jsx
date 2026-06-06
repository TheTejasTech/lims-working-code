import { useEffect, useState } from 'react';
import {
  Card, Form, Input, Button, Typography, Tabs, Table, message, DatePicker, Space,
} from 'antd';
import { SaveOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../utils/api';

const { Title } = Typography;

const SettingsPage = () => {
  const [companyForm] = Form.useForm();
  const [holidays, setHolidays] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [holidayForm] = Form.useForm();
  const [templateForm] = Form.useForm();

  const load = async () => {
    try {
      const [co, hol, tpl] = await Promise.all([
        api.get('/settings/company'),
        api.get('/settings/holidays'),
        api.get('/settings/remark-templates'),
      ]);
      companyForm.setFieldsValue(co.data.data);
      setHolidays(hol.data.data || []);
      setTemplates(tpl.data.data || []);
    } catch {
      message.error('Failed to load settings');
    }
  };

  useEffect(() => { load(); }, []);

  const saveCompany = async (values) => {
    try {
      await api.put('/settings/company', values);
      message.success('Company info saved');
    } catch (e) {
      message.error(e.response?.data?.message || 'Save failed');
    }
  };

  const addHoliday = async (values) => {
    try {
      await api.post('/settings/holidays', { ...values, date: values.date?.toISOString?.() });
      message.success('Holiday added');
      holidayForm.resetFields();
      load();
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed');
    }
  };

  const addTemplate = async (values) => {
    try {
      await api.post('/settings/remark-templates', values);
      message.success('Template added');
      templateForm.resetFields();
      load();
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed');
    }
  };

  return (
    <div>
      <Title level={4}>Settings</Title>
      <Tabs
        items={[
          {
            key: 'company',
            label: 'Company Info',
            children: (
              <Card>
                <Form form={companyForm} layout="vertical" onFinish={saveCompany}>
                  <Form.Item name="name" label="Company Name" rules={[{ required: true }]}><Input /></Form.Item>
                  <Form.Item name="address" label="Address"><Input.TextArea rows={2} /></Form.Item>
                  <Space wrap>
                    <Form.Item name="city" label="City"><Input /></Form.Item>
                    <Form.Item name="state" label="State"><Input /></Form.Item>
                    <Form.Item name="pinCode" label="PIN"><Input /></Form.Item>
                  </Space>
                  <Form.Item name="phone" label="Phone"><Input /></Form.Item>
                  <Form.Item name="email" label="Email"><Input /></Form.Item>
                  <Form.Item name="gstNo" label="GST No"><Input /></Form.Item>
                  <Form.Item name="accreditationNo" label="Accreditation No"><Input /></Form.Item>
                  <Form.Item name="sinLabel" label="SIN Label (configurable)"><Input placeholder="Sample Inward No" /></Form.Item>
                  <Title level={5}>Bank Details</Title>
                  <Form.Item name={['bankDetails', 'bankName']} label="Bank"><Input /></Form.Item>
                  <Form.Item name={['bankDetails', 'accountNo']} label="Account No"><Input /></Form.Item>
                  <Form.Item name={['bankDetails', 'ifsc']} label="IFSC"><Input /></Form.Item>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>Save Company Info</Button>
                </Form>
              </Card>
            ),
          },
          {
            key: 'holidays',
            label: 'Holidays',
            children: (
              <Card>
                <Form form={holidayForm} layout="inline" onFinish={addHoliday} style={{ marginBottom: 16 }}>
                  <Form.Item name="date" rules={[{ required: true }]}><DatePicker /></Form.Item>
                  <Form.Item name="description"><Input placeholder="Description" /></Form.Item>
                  <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>Add</Button>
                </Form>
                <Table
                  rowKey="_id"
                  dataSource={holidays}
                  pagination={false}
                  columns={[
                    { title: 'Date', dataIndex: 'date', render: (d) => new Date(d).toLocaleDateString() },
                    { title: 'Description', dataIndex: 'description' },
                    {
                      title: '',
                      render: (_, r) => (
                        <Button danger size="small" onClick={() => api.delete(`/settings/holidays/${r._id}`).then(load)}>
                          Delete
                        </Button>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'remarks',
            label: 'Remark Templates',
            children: (
              <Card>
                <Form form={templateForm} layout="inline" onFinish={addTemplate} style={{ marginBottom: 16 }}>
                  <Form.Item name="templateName" rules={[{ required: true }]}><Input placeholder="Template name" /></Form.Item>
                  <Form.Item name="remarkText" rules={[{ required: true }]}><Input placeholder="Remark text" style={{ width: 300 }} /></Form.Item>
                  <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>Add</Button>
                </Form>
                <Table
                  rowKey="_id"
                  dataSource={templates}
                  columns={[
                    { title: 'Name', dataIndex: 'templateName' },
                    { title: 'Text', dataIndex: 'remarkText', ellipsis: true },
                    {
                      title: '',
                      render: (_, r) => (
                        <Button danger size="small" onClick={() => api.delete(`/settings/remark-templates/${r._id}`).then(load)}>
                          Delete
                        </Button>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};

export default SettingsPage;
