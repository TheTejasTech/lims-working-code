import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Descriptions,
  message,
  Modal,
  Select,
} from 'antd';
import {
  CrownOutlined,
  EditOutlined,
  MergeCellsOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import api from '../../utils/api';

const { Title, Text } = Typography;

const CustomerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [allCustomers, setAllCustomers] = useState([]);
  const [duplicateIds, setDuplicateIds] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/customers/${id}/dashboard`);
      setDashboard(data.data);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const openMerge = async () => {
    const { data } = await api.get('/customers', { params: { limit: 200 } });
    setAllCustomers((data.data || []).filter((c) => c._id !== id));
    setMergeOpen(true);
  };

  const handleMerge = async () => {
    if (!duplicateIds.length) return message.warning('Select duplicate customers');
    try {
      await api.post('/customers/merge', { primaryId: id, duplicateIds });
      message.success('Customers merged');
      setMergeOpen(false);
      load();
    } catch (err) {
      message.error(err.response?.data?.message || 'Merge failed');
    }
  };

  const c = dashboard?.customer;

  const jobColumns = [
    { title: 'SIN No', dataIndex: 'sinNo', key: 'sinNo' },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s, r) => (
        <Space>
          <Tag color="blue">{s}</Tag>
          {r.isExpress && <Tag color="red">URGENT</Tag>}
        </Space>
      ),
    },
    {
      title: 'Inward Date',
      dataIndex: 'inwardDate',
      render: (d) => (d ? new Date(d).toLocaleDateString() : '—'),
    },
    {
      title: 'Expected',
      dataIndex: 'reportExpectedDate',
      render: (d) => (d ? new Date(d).toLocaleDateString() : '—'),
    },
    {
      title: 'Balance',
      dataIndex: 'balanceAmount',
      render: (v) => `₹${(v || 0).toLocaleString()}`,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/customers')}>
          Back
        </Button>
        <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/customers/${id}/edit`)}>
          Edit
        </Button>
        <Button icon={<MergeCellsOutlined />} onClick={openMerge}>
          Merge Duplicates
        </Button>
      </Space>

      <Card loading={loading}>
        {c && (
          <>
            <Space align="center" style={{ marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0 }}>
                {c.customerName}
              </Title>
              {(c.isPremium || c.premiumCustomer) && (
                <Tag icon={<CrownOutlined />} color="gold">
                  Premium
                </Tag>
              )}
              {c.isBlocked && <Tag color="red">Blocked</Tag>}
              {dashboard.creditExceeded && <Tag color="orange">Credit Exceeded</Tag>}
            </Space>

            <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
              <Descriptions.Item label="Alias">{c.alias || '—'}</Descriptions.Item>
              <Descriptions.Item label="City">{c.city}</Descriptions.Item>
              <Descriptions.Item label="State">{c.state}</Descriptions.Item>
              <Descriptions.Item label="Contact">{c.contactPerson} — {c.contactNo}</Descriptions.Item>
              <Descriptions.Item label="Email">{c.emailId || '—'}</Descriptions.Item>
              <Descriptions.Item label="GST">{c.gstNo || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Industry">{c.industry || '—'}</Descriptions.Item>
              <Descriptions.Item label="Credit Limit">₹{c.creditLimit?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Credit Days">{c.creditDays} days</Descriptions.Item>
            </Descriptions>

            <Row gutter={16} style={{ marginTop: 24 }}>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic title="Open Jobs" value={dashboard.openJobsCount} />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="Payment Due"
                    value={dashboard.paymentDue}
                    prefix="₹"
                    valueStyle={{ color: dashboard.paymentDue > 0 ? '#cf1322' : '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic title="Pending Invoices" value={dashboard.pendingInvoices?.length || 0} />
                </Card>
              </Col>
            </Row>

            <Title level={5} style={{ marginTop: 24 }}>
              Open Jobs
            </Title>
            <Table
              rowKey="_id"
              size="small"
              columns={jobColumns}
              dataSource={dashboard.openJobs}
              pagination={false}
              onRow={(r) => ({
                onClick: () => navigate(`/samples/${r._id}`),
                style: { cursor: 'pointer' },
              })}
            />
          </>
        )}
      </Card>

      <Modal
        title="Merge Duplicate Customers"
        open={mergeOpen}
        onOk={handleMerge}
        onCancel={() => setMergeOpen(false)}
        okText="Merge into this customer"
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Select duplicate/wrong-spelling records to merge into <strong>{c?.customerName}</strong>.
          Their samples will be reassigned.
        </Text>
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="Select duplicates"
          value={duplicateIds}
          onChange={setDuplicateIds}
          options={allCustomers.map((x) => ({
            value: x._id,
            label: `${x.customerName}${x.alias ? ` (${x.alias})` : ''}`,
          }))}
        />
      </Modal>
    </div>
  );
};

export default CustomerDetailPage;
