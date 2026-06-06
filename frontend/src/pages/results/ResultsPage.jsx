import { useEffect, useState } from 'react';
import {
  Table, Button, Space, Typography, Tabs, Tag, Modal, Form, Input, InputNumber, message, Select,
} from 'antd';
import { PlusOutlined, ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import api from '../../utils/api';

const { Title } = Typography;

const ResultsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('pending');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [samples, setSamples] = useState([]);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const url = tab === 'pending' ? '/results/pending' : '/results';
      const { data: res } = await api.get(url, {
        params: tab === 'completed' ? { status: 'completed' } : {},
      });
      setData(res.data || []);
    } catch {
      message.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    api.get('/samples', { params: { status: 'testing', limit: 100 } }).then((r) => setSamples(r.data.data || []));
  }, [tab]);

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      resultDetails: record.resultDetails?.length
        ? record.resultDetails
        : [{ testParameter: record.testName, result: '', minimumReq: '', maximumReq: '' }],
    });
    setOpen(true);
  };

  const save = async (values) => {
    try {
      await api.put(`/results/${editing._id}`, { ...values, status: 'completed' });
      message.success('Result saved');
      setOpen(false);
      load();
    } catch (e) {
      message.error(e.response?.data?.message || 'Save failed');
    }
  };

  const generateFromPlan = async (sinId, labNo) => {
    try {
      const { data: res } = await api.post('/results/from-plan', { sinId, labNo });
      message.success(`Created ${res.count} pending result(s)`);
      load();
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed');
    }
  };

  const columns = [
    { title: 'Lab No', dataIndex: 'labNo', width: 120 },
    { title: 'Test', dataIndex: 'testName' },
    { title: 'SIN', key: 'sin', render: (_, r) => r.sinId?.sinNo },
    {
      title: 'Pass/Fail',
      dataIndex: 'overallPassFail',
      width: 100,
      render: (v) =>
        v === 'pass' ? (
          <Tag icon={<CheckCircleOutlined />} color="success">PASS</Tag>
        ) : v === 'fail' ? (
          <Tag icon={<CloseCircleOutlined />} color="error">FAIL</Tag>
        ) : (
          <Tag color="warning">PENDING</Tag>
        ),
    },
    { title: 'Status', dataIndex: 'status', width: 100 },
    {
      title: '',
      width: 100,
      render: (_, r) => (
        <Button size="small" type="primary" onClick={() => openEdit(r)} disabled={r.isLocked}>
          {r.status === 'pending' ? 'Enter' : 'View'}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>Test Results</Title>
        <Button icon={<ReloadOutlined />} onClick={load}>Refresh</Button>
      </Space>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'pending', label: 'Pending' },
          { key: 'completed', label: 'Completed' },
          { key: 'all', label: 'All' },
        ]}
        style={{ marginBottom: 16 }}
      />

      <Table rowKey="_id" columns={columns} dataSource={data} loading={loading} pagination={{ pageSize: 15 }} />

      <Modal
        title={`Result Input — ${editing?.testName}`}
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={640}
      >
        {editing && (
          <Form form={form} layout="vertical" onFinish={save}>
            <Form.List name="resultDetails">
              {(fields) => (
                <>
                  {fields.map(({ key, name, ...rest }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item {...rest} name={[name, 'testParameter']} style={{ width: 160 }}>
                        <Input disabled />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'result']} rules={[{ required: true }]}>
                        <Input placeholder="Result value" />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'minimumReq']}>
                        <InputNumber placeholder="Min" />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'maximumReq']}>
                        <InputNumber placeholder="Max" />
                      </Form.Item>
                    </Space>
                  ))}
                </>
              )}
            </Form.List>
            <Form.Item name="observation" label="Observation"><Input.TextArea rows={2} /></Form.Item>
            <Form.Item name="humidity" label="Humidity"><Input /></Form.Item>
            <Form.Item name="temperature" label="Temperature"><Input /></Form.Item>
            {editing.overallPassFail && (
              <Tag color={editing.overallPassFail === 'pass' ? 'green' : 'red'}>
                Auto: {editing.overallPassFail?.toUpperCase()}
              </Tag>
            )}
            <Button type="primary" htmlType="submit" block style={{ marginTop: 12 }} disabled={editing.isLocked}>
              Save Result
            </Button>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default ResultsPage;
