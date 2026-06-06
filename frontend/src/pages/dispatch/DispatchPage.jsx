import { useEffect, useState } from 'react';
import {
  Table, Button, Space, Typography, Modal, Form, Input, Select, Tag, message, Alert,
} from 'antd';
import { PlusOutlined, ReloadOutlined, SendOutlined } from '@ant-design/icons';
import api from '../../utils/api';

const { Title } = Typography;

const DispatchPage = () => {
  const [data, setData] = useState([]);
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [alert, setAlert] = useState(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const [d, s] = await Promise.all([
        api.get('/dispatch'),
        api.get('/samples', { params: { status: 'invoiced', limit: 100 } }),
      ]);
      setData(d.data.data || []);
      setSamples(s.data.data || []);
    } catch {
      message.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async (values) => {
    try {
      const { data: res } = await api.post('/dispatch', values);
      if (res.returnableAlert) setAlert(res.returnableAlert);
      message.success('Dispatch recorded');
      setOpen(false);
      load();
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed');
    }
  };

  const columns = [
    { title: 'SIN', key: 'sin', render: (_, r) => r.sinId?.sinNo },
    { title: 'Mode', dataIndex: 'dispatchMode' },
    { title: 'Date', dataIndex: 'dispatchDate', render: (d) => new Date(d).toLocaleDateString() },
    { title: 'Courier/Employee', key: 'c', render: (_, r) => r.courierName || r.employeeName },
    { title: 'Docket', dataIndex: 'docketNo' },
    {
      title: 'Return',
      dataIndex: 'returnSample',
      render: (v) => (v ? <Tag color="purple">Returnable</Tag> : '—'),
    },
    {
      title: '',
      render: (_, r) => (
        <Button size="small" icon={<SendOutlined />} onClick={() => api.post(`/dispatch/${r._id}/send-notification`).then(() => message.success('Notification sent'))}>
          Notify
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>Dispatch</Title>
      {alert && <Alert message={alert} type="warning" showIcon closable style={{ marginBottom: 16 }} onClose={() => setAlert(null)} />}

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setOpen(true); }}>
          New Dispatch
        </Button>
        <Button icon={<ReloadOutlined />} onClick={load}>Refresh</Button>
      </Space>

      <Table rowKey="_id" columns={columns} dataSource={data} loading={loading} pagination={{ pageSize: 15 }} />

      <Modal title="Record Dispatch" open={open} onCancel={() => setOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={save} initialValues={{ dispatchMode: 'byHand' }}>
          <Form.Item name="sinId" label="Sample (SIN)" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={samples.map((s) => ({
                value: s._id,
                label: `${s.sinNo} — ${s.customerId?.customerName || ''}${s.isReturnable ? ' (RETURNABLE)' : ''}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="dispatchMode" label="Dispatch Mode">
            <Select options={[
              { value: 'byHand', label: 'By Hand' },
              { value: 'byCourier', label: 'By Courier' },
              { value: 'byEmail', label: 'By Email' },
            ]} />
          </Form.Item>
          <Form.Item name="courierName" label="Courier Name"><Input /></Form.Item>
          <Form.Item name="employeeName" label="Employee"><Input /></Form.Item>
          <Form.Item name="docketNo" label="Docket No"><Input /></Form.Item>
          <Form.Item name="contactNo" label="Contact"><Input /></Form.Item>
          <Form.Item name="remarks" label="Remarks"><Input.TextArea /></Form.Item>
          <Form.Item name="sendMail" valuePropName="checked"><Select options={[{ value: true, label: 'Send email notification' }]} /></Form.Item>
          <Button type="primary" htmlType="submit" block>Dispatch</Button>
        </Form>
      </Modal>
    </div>
  );
};

export default DispatchPage;
