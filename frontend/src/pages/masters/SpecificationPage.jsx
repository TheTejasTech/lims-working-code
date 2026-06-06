import { useEffect, useState } from 'react';
import {
  Table, Button, Space, Typography, Input, Modal, Form, Tag, message, Popconfirm, Row, Col,
} from 'antd';
import { PlusOutlined, ReloadOutlined, CopyOutlined } from '@ant-design/icons';
import api from '../../utils/api';

const { Title } = Typography;
const ORGS = ['ASTM', 'EN', 'IS', 'BIS', 'API', 'Other'];

const SpecificationPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/specifications', { params: { search } });
      setData(res.data || []);
    } catch (e) {
      message.error('Failed to load specifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openModal = (record = null) => {
    setEditing(record);
    form.resetFields();
    if (record) form.setFieldsValue(record);
    setOpen(true);
  };

  const save = async (values) => {
    try {
      if (editing) {
        await api.put(`/specifications/${editing._id}`, values);
        message.success('Updated');
      } else {
        await api.post('/specifications', values);
        message.success('Created');
      }
      setOpen(false);
      load();
    } catch (e) {
      message.error(e.response?.data?.message || 'Save failed');
    }
  };

  const saveAsNew = async (record) => {
    const specCode = prompt('New Spec Code:', `${record.specCode}-COPY`);
    const specCaption = prompt('New Spec Caption:', record.specCaption);
    if (!specCode || !specCaption) return;
    try {
      await api.post(`/specifications/${record._id}/save-as-new`, { specCode, specCaption });
      message.success('Duplicated');
      load();
    } catch (e) {
      message.error(e.response?.data?.message || 'Duplicate failed');
    }
  };

  const columns = [
    { title: 'Spec Code', dataIndex: 'specCode', key: 'specCode' },
    { title: 'Caption', dataIndex: 'specCaption', key: 'specCaption' },
    { title: 'Org', dataIndex: 'organisation', width: 80 },
    { title: 'Grade/Type', dataIndex: 'classificationValue', width: 120 },
    {
      title: 'Tests',
      key: 'tests',
      width: 70,
      render: (_, r) => (r.testList || []).length,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, r) => (
        <Space>
          {r.isFrozen && <Tag color="blue">Frozen</Tag>}
          {r.isDisabled && <Tag color="red">Disabled</Tag>}
          {!r.isFrozen && !r.isDisabled && <Tag color="green">Active</Tag>}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => openModal(r)} disabled={r.isFrozen}>
            Edit
          </Button>
          <Button size="small" icon={<CopyOutlined />} onClick={() => saveAsNew(r)}>
            Save As New
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>Specification Master</Title>
        <Space>
          <Input.Search placeholder="Search..." onSearch={load} value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 220 }} />
          <Button icon={<ReloadOutlined />} onClick={load} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Add Specification</Button>
        </Space>
      </Space>
      <Table rowKey="_id" columns={columns} dataSource={data} loading={loading} pagination={{ pageSize: 15 }} />

      <Modal title={editing ? 'Edit Specification' : 'New Specification'} open={open} onCancel={() => setOpen(false)} footer={null} width={720}>
        <Form form={form} layout="vertical" onFinish={save} initialValues={{ organisation: 'IS' }}>
          <Row gutter={12}>
            <Col span={8}><Form.Item name="specCode" label="Spec Code" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={16}><Form.Item name="specCaption" label="Caption (on report)" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="organisation" label="Organisation"><Input list="orgs" /></Form.Item></Col>
            <Col span={8}><Form.Item name="classificationValue" label="Grade/Class"><Input placeholder="TP316H" /></Form.Item></Col>
            <Col span={8}><Form.Item name="year" label="Year"><Input type="number" /></Form.Item></Col>
            <Col span={24}><Form.Item name="description" label="Description"><Input.TextArea rows={2} /></Form.Item></Col>
            <Col span={12}><Form.Item name="base" label="Base"><Input /></Form.Item></Col>
          </Row>
          <datalist id="orgs">{ORGS.map((o) => <option key={o} value={o} />)}</datalist>
          <Button type="primary" htmlType="submit" block>Save</Button>
        </Form>
      </Modal>
    </div>
  );
};

export default SpecificationPage;
