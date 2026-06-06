import { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Input, Modal, Form, Tag, message, DatePicker, Switch } from 'antd';
import { PlusOutlined, ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../utils/api';

const { Title } = Typography;

const EquipmentPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const load = async (overdueOnly = false) => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/equipment', {
        params: overdueOnly ? { calibrationDue: 'true' } : {},
      });
      setData(res.data || []);
    } catch {
      message.error('Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async (values) => {
    const payload = {
      ...values,
      calibrationDueDate: values.calibrationDueDate?.toISOString?.(),
      lastCalibrationDate: values.lastCalibrationDate?.toISOString?.(),
    };
    try {
      if (editing) await api.put(`/equipment/${editing._id}`, payload);
      else await api.post('/equipment', payload);
      message.success('Saved');
      setOpen(false);
      load();
    } catch (e) {
      message.error(e.response?.data?.message || 'Save failed');
    }
  };

  const columns = [
    { title: 'Equipment', dataIndex: 'equipmentName' },
    { title: 'Serial No', dataIndex: 'serialNo' },
    { title: 'Model', dataIndex: 'modelNo' },
    { title: 'Department', dataIndex: 'department' },
    {
      title: 'Calibration Due',
      dataIndex: 'calibrationDueDate',
      render: (d, r) =>
        d ? (
          <Space>
            {new Date(d).toLocaleDateString()}
            {r.calibrationOverdue && <Tag icon={<WarningOutlined />} color="red">OVERDUE</Tag>}
          </Space>
        ) : '—',
    },
    {
      title: '',
      render: (_, r) => (
        <Button size="small" onClick={() => {
          setEditing(r);
          form.setFieldsValue({
            ...r,
            calibrationDueDate: r.calibrationDueDate ? dayjs(r.calibrationDueDate) : null,
            lastCalibrationDate: r.lastCalibrationDate ? dayjs(r.lastCalibrationDate) : null,
          });
          setOpen(true);
        }}>Edit</Button>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>Equipment Master</Title>
        <Space>
          <Button onClick={() => load(true)}>Calibration Due</Button>
          <Button icon={<ReloadOutlined />} onClick={() => load()} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>
            Add Equipment
          </Button>
        </Space>
      </Space>
      <Table rowKey="_id" columns={columns} dataSource={data} loading={loading} pagination={{ pageSize: 15 }} />

      <Modal title={editing ? 'Edit Equipment' : 'New Equipment'} open={open} onCancel={() => setOpen(false)} footer={null} width={560}>
        <Form form={form} layout="vertical" onFinish={save} initialValues={{ isActive: true }}>
          <Form.Item name="equipmentName" label="Equipment Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="serialNo" label="Serial No" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="modelNo" label="Model No"><Input /></Form.Item>
          <Form.Item name="department" label="Department"><Input /></Form.Item>
          <Form.Item name="location" label="Location"><Input /></Form.Item>
          <Form.Item name="calibrationDueDate" label="Calibration Due"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="lastCalibrationDate" label="Last Calibration"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="calibrationCertNo" label="Cert No"><Input /></Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
          <Button type="primary" htmlType="submit" block>Save</Button>
        </Form>
      </Modal>
    </div>
  );
};

export default EquipmentPage;
