import { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Input, Modal, Form, Tag, message, Tabs, Select, InputNumber } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../../utils/api';

const { Title } = Typography;
const TEST_TYPES = ['mechanical', 'chemical', 'visual', 'calibration'];

const TestMasterPage = () => {
  const [tests, setTests] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [testForm] = Form.useForm();
  const [groupForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const [t, g] = await Promise.all([api.get('/tests'), api.get('/tests/groups/list')]);
      setTests(t.data.data || []);
      setGroups(g.data.data || []);
    } catch {
      message.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const saveTest = async (values) => {
    try {
      if (editing) await api.put(`/tests/${editing._id}`, values);
      else await api.post('/tests', values);
      message.success('Saved');
      setTestOpen(false);
      load();
    } catch (e) {
      message.error(e.response?.data?.message || 'Save failed');
    }
  };

  const saveGroup = async (values) => {
    try {
      await api.post('/tests/groups', values);
      message.success('Group created');
      setGroupOpen(false);
      load();
    } catch (e) {
      message.error(e.response?.data?.message || 'Save failed');
    }
  };

  const testColumns = [
    { title: 'Code', dataIndex: 'testCode', width: 100 },
    { title: 'Test Name', dataIndex: 'testName' },
    { title: 'Caption', dataIndex: 'testCaption', ellipsis: true },
    { title: 'Type', dataIndex: 'testType', width: 100, render: (t) => <Tag>{t}</Tag> },
    { title: 'Dept', dataIndex: 'department', width: 100 },
    {
      title: 'Params',
      key: 'p',
      width: 70,
      render: (_, r) => (r.parameters || []).length,
    },
    {
      title: '',
      key: 'a',
      render: (_, r) => (
        <Button size="small" onClick={() => { setEditing(r); testForm.setFieldsValue(r); setTestOpen(true); }}>
          Edit
        </Button>
      ),
    },
  ];

  const groupColumns = [
    { title: 'Group Name', dataIndex: 'groupName' },
    { title: 'Tests', key: 't', render: (_, r) => (r.tests || []).length },
  ];

  return (
    <div>
      <Title level={4}>Test Master</Title>
      <Tabs
        items={[
          {
            key: 'tests',
            label: 'Tests',
            children: (
              <>
                <Space style={{ marginBottom: 12 }}>
                  <Button icon={<ReloadOutlined />} onClick={load} />
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); testForm.resetFields(); setTestOpen(true); }}>
                    Add Test
                  </Button>
                </Space>
                <Table rowKey="_id" columns={testColumns} dataSource={tests} loading={loading} pagination={{ pageSize: 15 }} />
              </>
            ),
          },
          {
            key: 'groups',
            label: 'Test Groups',
            children: (
              <>
                <Space style={{ marginBottom: 12 }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => { groupForm.resetFields(); setGroupOpen(true); }}>
                    Add Group
                  </Button>
                </Space>
                <Table rowKey="_id" columns={groupColumns} dataSource={groups} loading={loading} />
              </>
            ),
          },
        ]}
      />

      <Modal title={editing ? 'Edit Test' : 'New Test'} open={testOpen} onCancel={() => setTestOpen(false)} footer={null} width={640}>
        <Form form={testForm} layout="vertical" onFinish={saveTest} initialValues={{ testType: 'mechanical', isActive: true, accreditationScope: true }}>
          <Form.Item name="testCode" label="Test Code (sysCode)" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="testName" label="Test Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="testCaption" label="Caption"><Input /></Form.Item>
          <Form.Item name="testType" label="Type"><Select options={TEST_TYPES.map((t) => ({ value: t, label: t }))} /></Form.Item>
          <Form.Item name="department" label="Department"><Input /></Form.Item>
          <Form.Item name="defaultMethod" label="Default Method"><Input /></Form.Item>
          <Button type="primary" htmlType="submit" block>Save</Button>
        </Form>
      </Modal>

      <Modal title="New Test Group" open={groupOpen} onCancel={() => setGroupOpen(false)} footer={null}>
        <Form form={groupForm} layout="vertical" onFinish={saveGroup}>
          <Form.Item name="groupName" label="Group Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="tests" label="Tests">
            <Select
              mode="multiple"
              optionFilterProp="label"
              options={tests.map((t) => ({ value: t._id, label: `${t.testCode} — ${t.testName}` }))}
              onChange={(ids) => groupForm.setFieldValue('tests', ids.map((id) => ({ test: id })))}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>Create Group</Button>
        </Form>
      </Modal>
    </div>
  );
};

export default TestMasterPage;
