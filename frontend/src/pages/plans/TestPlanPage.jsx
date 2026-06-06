import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Button, Space, Typography, Modal, Form, Select, message, Tag, Input,
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../../utils/api';

const { Title } = Typography;

const TestPlanPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [samples, setSamples] = useState([]);
  const [specs, setSpecs] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const [p, s, sp, g] = await Promise.all([
        api.get('/plans'),
        api.get('/samples', { params: { status: 'inward', limit: 100 } }),
        api.get('/specifications'),
        api.get('/tests/groups/list'),
      ]);
      setPlans(p.data.data || []);
      setSamples(s.data.data || []);
      setSpecs(sp.data.data || []);
      setGroups(g.data.data || []);
    } catch {
      message.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onSpecChange = async (specId) => {
    if (!specId) return;
    const { data } = await api.get(`/specifications/${specId}`);
    message.info(`${(data.data.testList || []).length} tests in specification`);
  };

  const save = async (values) => {
    try {
      const sample = samples.find((s) => s._id === values.sinId);
      const labNo = values.labNo || sample?.samples?.[0]?.labNo;
      await api.post('/plans', { ...values, labNo, planStatus: values.planStatus || 'planned' });
      message.success('Test plan saved');
      setOpen(false);
      load();
    } catch (e) {
      message.error(e.response?.data?.message || 'Save failed');
    }
  };

  const columns = [
    { title: 'SIN', key: 'sin', render: (_, r) => r.sinId?.sinNo || '—' },
    { title: 'Lab No', dataIndex: 'labNo' },
    {
      title: 'Specification',
      key: 'spec',
      render: (_, r) => r.testSpecification?.specCode || '—',
    },
    {
      title: 'Status',
      dataIndex: 'planStatus',
      render: (s) => <Tag color={s === 'planned' ? 'green' : 'default'}>{s}</Tag>,
    },
    {
      title: 'Tests',
      key: 't',
      render: (_, r) => (r.generalTests || []).length + (r.chemicalTests || []).length,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>Test Plan</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setOpen(true); }}>
            Create Plan
          </Button>
        </Space>
      </Space>
      <Table rowKey="_id" columns={columns} dataSource={plans} loading={loading} pagination={{ pageSize: 15 }} />

      <Modal title="Create Test Plan" open={open} onCancel={() => setOpen(false)} footer={null} width={560}>
        <Form form={form} layout="vertical" onFinish={save} initialValues={{ planStatus: 'planned' }}>
          <Form.Item name="sinId" label="Sample (SIN)" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={samples.map((s) => ({
                value: s._id,
                label: `${s.sinNo} — ${s.customerId?.customerName || ''}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="labNo" label="Lab No (optional — uses first line)">
            <Input placeholder="LAB/2026/00001" />
          </Form.Item>
          <Form.Item name="testSpecification" label="Specification (auto-populates tests)">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              onChange={onSpecChange}
              options={specs.map((s) => ({ value: s._id, label: `${s.specCode} — ${s.specCaption}` }))}
            />
          </Form.Item>
          <Form.Item name="testGroup" label="Or Test Group">
            <Select
              allowClear
              options={groups.map((g) => ({ value: g._id, label: g.groupName }))}
            />
          </Form.Item>
          <Form.Item name="officeInstruction" label="Office Instruction">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="planStatus" label="Status">
            <Select options={[{ value: 'draft', label: 'Draft' }, { value: 'planned', label: 'Planned (finalize)' }]} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>Save Plan</Button>
        </Form>
      </Modal>
    </div>
  );
};

export default TestPlanPage;
