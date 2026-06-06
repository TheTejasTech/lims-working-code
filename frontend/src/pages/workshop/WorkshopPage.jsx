import { useEffect, useState } from 'react';
import {
  Card, Col, Row, Button, Input, Typography, Tag, Space, message, Modal, Form,
} from 'antd';
import {
  LoginOutlined,
  LogoutOutlined,
  ReloadOutlined,
  ScanOutlined,
} from '@ant-design/icons';
import api from '../../utils/api';

const { Title, Text } = Typography;

const WorkshopPage = () => {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [labNo, setLabNo] = useState('');
  const [transferOpen, setTransferOpen] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/workshop');
      setBoard(data.data || []);
    } catch {
      message.error('Failed to load workshop board');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const scanIn = async () => {
    if (!labNo.trim()) return message.warning('Enter or scan Lab No');
    try {
      await api.post(`/workshop/${labNo.trim()}/scan-in`);
      message.success(`Sample IN: ${labNo}`);
      setLabNo('');
      load();
    } catch (e) {
      message.error(e.response?.data?.message || 'Scan failed');
    }
  };

  const scanOut = async () => {
    if (!labNo.trim()) return message.warning('Enter or scan Lab No');
    try {
      await api.post(`/workshop/${labNo.trim()}/scan-out`);
      message.success(`Sample OUT: ${labNo}`);
      setLabNo('');
      load();
    } catch (e) {
      message.error(e.response?.data?.message || 'Scan failed');
    }
  };

  const stampTransfer = async (values) => {
    try {
      await api.post('/workshop/stamp-transfer', { labNo: values.labNo, ...values });
      message.success('Stamp transfer logged');
      setTransferOpen(false);
      load();
    } catch (e) {
      message.error(e.response?.data?.message || 'Transfer failed');
    }
  };

  return (
    <div>
      <Title level={4}>Workshop Floor</Title>

      <Card style={{ marginBottom: 24, background: '#fafafa' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={10}>
            <Input
              size="large"
              prefix={<ScanOutlined />}
              placeholder="Scan or enter Lab No"
              value={labNo}
              onChange={(e) => setLabNo(e.target.value)}
              onPressEnter={scanIn}
              style={{ fontSize: 18 }}
            />
          </Col>
          <Col xs={12} md={4}>
            <Button
              type="primary"
              danger
              size="large"
              block
              icon={<LoginOutlined />}
              onClick={scanIn}
              style={{ height: 48, fontSize: 16 }}
            >
              Sample IN
            </Button>
          </Col>
          <Col xs={12} md={4}>
            <Button
              size="large"
              block
              icon={<LogoutOutlined />}
              onClick={scanOut}
              style={{ height: 48, fontSize: 16, background: '#52c41a', color: '#fff', borderColor: '#52c41a' }}
            >
              Sample OUT
            </Button>
          </Col>
          <Col xs={24} md={6}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
                Refresh
              </Button>
              <Button onClick={() => setTransferOpen(true)}>Stamp Transfer</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {board.map((item) => (
          <Col xs={24} sm={12} lg={8} key={item._id}>
            <Card
              size="small"
              style={{
                borderLeft: `4px solid ${
                  item.status === 'inWorkshop' ? '#ff4d4f' : item.status === 'outForTesting' ? '#52c41a' : '#faad14'
                }`,
                background: item.sample?.isExpress ? '#fff1f0' : undefined,
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <Text strong style={{ fontSize: 16 }}>{item.labNo}</Text>
                  {item.sample?.isExpress && <Tag color="red">URGENT</Tag>}
                </Space>
                <Text type="secondary">{item.sample?.sinNo} — {item.sample?.customerId?.customerName}</Text>
                <Tag color={item.status === 'inWorkshop' ? 'red' : item.status === 'outForTesting' ? 'green' : 'orange'}>
                  {item.status}
                </Tag>
                {item.isReturnable && <Tag color="purple">Returnable</Tag>}
              </Space>
            </Card>
          </Col>
        ))}
        {!loading && board.length === 0 && (
          <Col span={24}><Text type="secondary">No samples on workshop board</Text></Col>
        )}
      </Row>

      <Modal title="Stamp Transfer" open={transferOpen} onCancel={() => setTransferOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={stampTransfer}>
          <Form.Item name="labNo" label="Lab No" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="fromDept" label="From Department" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="toDept" label="To Department" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="workshopRemarks" label="Remarks"><Input.TextArea /></Form.Item>
          <Button type="primary" htmlType="submit" block>Transfer</Button>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkshopPage;
