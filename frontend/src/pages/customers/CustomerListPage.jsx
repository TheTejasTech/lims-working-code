import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Select,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  CrownOutlined,
  StopOutlined,
} from '@ant-design/icons';
import api from '../../utils/api';

const { Title } = Typography;

const CustomerListPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    state: '',
    city: '',
    industry: '',
    isPremium: undefined,
    isBlocked: undefined,
  });

  const fetchCustomers = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.limit, ...filters };
      Object.keys(params).forEach((k) => {
        if (params[k] === '' || params[k] === undefined) delete params[k];
      });
      const { data } = await api.get('/customers', { params });
      setCustomers(data.data || []);
      setPagination((p) => ({ ...p, page, total: data.pagination?.total || 0 }));
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, []);

  const handleBlock = async (id, isBlocked) => {
    try {
      await api.patch(`/customers/${id}/block`, {
        isBlocked,
        blockReason: isBlocked ? 'Blocked from list' : '',
      });
      message.success(isBlocked ? 'Customer blocked' : 'Customer unblocked');
      fetchCustomers(pagination.page);
    } catch (err) {
      message.error(err.response?.data?.message || 'Action failed');
    }
  };

  const columns = [
    {
      title: 'Customer',
      key: 'name',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Space>
            <a onClick={() => navigate(`/customers/${r._id}`)}>{r.customerName}</a>
            {(r.isPremium || r.premiumCustomer) && (
              <Tag icon={<CrownOutlined />} color="gold">
                Premium
              </Tag>
            )}
            {r.isBlocked && <Tag color="red">Blocked</Tag>}
          </Space>
          {r.alias && <small style={{ color: '#888' }}>{r.alias}</small>}
        </Space>
      ),
    },
    { title: 'City', dataIndex: 'city', key: 'city', width: 100 },
    { title: 'State', dataIndex: 'state', key: 'state', width: 100 },
    { title: 'Industry', dataIndex: 'industry', key: 'industry', width: 120 },
    { title: 'Contact', dataIndex: 'contactNo', key: 'contactNo', width: 120 },
    { title: 'Email', dataIndex: 'emailId', key: 'emailId', ellipsis: true },
    {
      title: 'Credit',
      key: 'credit',
      width: 100,
      render: (_, r) => `₹${r.creditLimit?.toLocaleString() || 0}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => navigate(`/customers/${r._id}/edit`)}>
            Edit
          </Button>
          {r.isBlocked ? (
            <Button size="small" onClick={() => handleBlock(r._id, false)}>
              Unblock
            </Button>
          ) : (
            <Popconfirm title="Block this customer?" onConfirm={() => handleBlock(r._id, true)}>
              <Button size="small" danger icon={<StopOutlined />}>
                Block
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>
          Customer Management
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => fetchCustomers(pagination.page)}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/customers/new')}>
            New Customer
          </Button>
        </Space>
      </Space>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Input
            placeholder="Search name, alias, email, vendor code..."
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            onPressEnter={() => fetchCustomers(1)}
            allowClear
          />
        </Col>
        <Col xs={12} md={4}>
          <Input
            placeholder="State"
            value={filters.state}
            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
          />
        </Col>
        <Col xs={12} md={4}>
          <Input
            placeholder="City"
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          />
        </Col>
        <Col xs={12} md={4}>
          <Input
            placeholder="Industry"
            value={filters.industry}
            onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
          />
        </Col>
        <Col xs={12} md={4}>
          <Select
            placeholder="Premium"
            allowClear
            style={{ width: '100%' }}
            value={filters.isPremium}
            onChange={(v) => setFilters({ ...filters, isPremium: v })}
            options={[
              { value: 'true', label: 'Premium only' },
              { value: 'false', label: 'Non-premium' },
            ]}
          />
        </Col>
        <Col>
          <Button type="primary" onClick={() => fetchCustomers(1)}>
            Filter
          </Button>
        </Col>
      </Row>

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={customers}
        loading={loading}
        rowClassName={(r) => (r.isBlocked ? 'ant-table-row-disabled' : '')}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          onChange: fetchCustomers,
        }}
      />
    </div>
  );
};

export default CustomerListPage;
