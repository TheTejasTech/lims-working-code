import { useEffect, useState } from 'react';
import {
  Table, Button, Space, Typography, Tabs, Tag, Modal, Form, Input, InputNumber, message, Select,
} from 'antd';
import { PlusOutlined, ReloadOutlined, DollarOutlined } from '@ant-design/icons';
import api from '../../utils/api';

const { Title } = Typography;

const InvoicePage = () => {
  const [invoices, setInvoices] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form] = Form.useForm();
  const [payForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const [inv, pend] = await Promise.all([api.get('/invoices'), api.get('/invoices/pending')]);
      setInvoices(inv.data.data || []);
      setPending(pend.data.data || []);
    } catch {
      message.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createFromPending = (sample) => {
    form.setFieldsValue({
      sinId: sample._id,
      customerId: sample.customerId?._id || sample.customerId,
      labRefNo: sample.sinNo,
      testLines: [{ test: 'Testing charges', quantity: 1, rate: sample.totalAmount || 0, amount: sample.totalAmount || 0 }],
    });
    setOpen(true);
  };

  const saveInvoice = async (values) => {
    try {
      await api.post('/invoices', values);
      message.success('Invoice created');
      setOpen(false);
      load();
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed');
    }
  };

  const recordPayment = async (values) => {
    try {
      await api.post(`/invoices/${selected}/record-payment`, values);
      message.success('Payment recorded');
      setPayOpen(false);
      load();
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed');
    }
  };

  const invColumns = [
    { title: 'Invoice No', dataIndex: 'invoiceNo' },
    { title: 'Date', dataIndex: 'invoiceDate', render: (d) => new Date(d).toLocaleDateString() },
    { title: 'Customer', key: 'c', render: (_, r) => r.customerId?.customerName },
    { title: 'Amount', dataIndex: 'grandTotal', render: (v) => `₹${(v || 0).toLocaleString()}` },
    {
      title: 'Payment',
      dataIndex: 'paymentStatus',
      render: (s) => (
        <Tag color={s === 'paid' ? 'green' : s === 'partiallyPaid' ? 'orange' : 'red'}>{s}</Tag>
      ),
    },
    {
      title: '',
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => api.post(`/invoices/${r._id}/approve`).then(() => message.success('Approved'))}>
            Approve
          </Button>
          <Button size="small" icon={<DollarOutlined />} onClick={() => { setSelected(r._id); setPayOpen(true); }}>
            Payment
          </Button>
        </Space>
      ),
    },
  ];

  const pendColumns = [
    { title: 'SIN', dataIndex: 'sinNo' },
    { title: 'Customer', key: 'c', render: (_, r) => r.customerId?.customerName },
    { title: 'Amount', dataIndex: 'totalAmount', render: (v) => `₹${(v || 0).toLocaleString()}` },
    {
      title: '',
      render: (_, r) => (
        <Button type="primary" size="small" onClick={() => createFromPending(r)}>
          Generate Invoice
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>Invoices</Title>
        <Button icon={<ReloadOutlined />} onClick={load}>Refresh</Button>
      </Space>

      <Tabs
        items={[
          { key: 'pending', label: `Pending (${pending.length})`, children: <Table rowKey="_id" columns={pendColumns} dataSource={pending} loading={loading} /> },
          { key: 'all', label: 'All Invoices', children: <Table rowKey="_id" columns={invColumns} dataSource={invoices} loading={loading} pagination={{ pageSize: 15 }} /> },
        ]}
      />

      <Modal title="Create Invoice" open={open} onCancel={() => setOpen(false)} footer={null} width={560}>
        <Form form={form} layout="vertical" onFinish={saveInvoice}>
          <Form.Item name="customerId" hidden><Input /></Form.Item>
          <Form.Item name="sinId" hidden><Input /></Form.Item>
          <Form.Item name="labRefNo" label="Lab Ref (SIN)"><Input disabled /></Form.Item>
          <Form.Item name="discountPercent" label="Discount %"><InputNumber style={{ width: '100%' }} min={0} max={100} /></Form.Item>
          <Form.Item name="discountApplicable" valuePropName="checked" initialValue={false}>
            <Select options={[{ value: true, label: 'Discount applicable' }]} />
          </Form.Item>
          <Form.List name="testLines">
            {(fields) => fields.map(({ key, name }) => (
              <Space key={key}>
                <Form.Item name={[name, 'test']}><Input placeholder="Test" /></Form.Item>
                <Form.Item name={[name, 'rate']}><InputNumber placeholder="Rate" /></Form.Item>
                <Form.Item name={[name, 'quantity']}><InputNumber placeholder="Qty" min={1} /></Form.Item>
              </Space>
            ))}
          </Form.List>
          <Button type="primary" htmlType="submit" block>Create Invoice</Button>
        </Form>
      </Modal>

      <Modal title="Record Payment" open={payOpen} onCancel={() => setPayOpen(false)} footer={null}>
        <Form form={payForm} layout="vertical" onFinish={recordPayment}>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="mode" label="Mode"><Input placeholder="NEFT/Cash/Cheque" /></Form.Item>
          <Form.Item name="refNo" label="Reference No"><Input /></Form.Item>
          <Button type="primary" htmlType="submit" block>Record</Button>
        </Form>
      </Modal>
    </div>
  );
};

export default InvoicePage;
