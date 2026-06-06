import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Space, Tag, Typography, Tabs, message, Select } from 'antd';
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../../utils/api';

const { Title } = Typography;

const STATUS_COLORS = {
  inward: 'default',
  planned: 'processing',
  inWorkshop: 'orange',
  testing: 'cyan',
  pendingApproval: 'gold',
  approved: 'green',
  invoiced: 'blue',
  dispatched: 'purple',
  onHold: 'warning',
  cancelled: 'error',
};

const SampleListPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  const fetchSamples = async (page = 1) => {
    setLoading(true);
    try {
      let url = '/samples';
      const params = { page, limit: 20, search: search || undefined };
      if (tab === 'pending') url = '/samples/pending';
      else if (tab === 'completed') url = '/samples/completed';
      else if (statusFilter) params.status = statusFilter;

      const { data } = await api.get(url, { params });
      setSamples(data.data || []);
      setPagination((p) => ({ ...p, page, total: data.pagination?.total || 0 }));
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load samples');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples(1);
  }, [tab]);

  const columns = [
    {
      title: 'SIN No',
      dataIndex: 'sinNo',
      key: 'sinNo',
      render: (sin, r) => (
        <Space>
          <a onClick={() => navigate(`/samples/${r._id}`)}>{sin}</a>
          {r.isExpress && <Tag color="red">URGENT</Tag>}
        </Space>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, r) => r.customerId?.customerName || '—',
    },
    {
      title: 'Lab Nos',
      key: 'labs',
      render: (_, r) => (r.samples || []).map((s) => s.labNo).join(', '),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s) => <Tag color={STATUS_COLORS[s] || 'default'}>{s}</Tag>,
    },
    {
      title: 'Inward Date',
      dataIndex: 'inwardDate',
      render: (d) => (d ? new Date(d).toLocaleDateString() : '—'),
    },
    {
      title: 'Qty',
      dataIndex: 'totalQuantity',
      width: 60,
    },
    {
      title: 'Ref / Challan',
      dataIndex: 'referenceNo',
      ellipsis: true,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>
          Sample Inward
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => fetchSamples(pagination.page)}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/samples/new')}>
            New Sample Inward
          </Button>
        </Space>
      </Space>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'all', label: 'All Samples' },
          { key: 'pending', label: 'Pending' },
          { key: 'completed', label: 'Completed' },
        ]}
        style={{ marginBottom: 16 }}
      />

      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search SIN, Lab No, Challan..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={() => fetchSamples(1)}
          style={{ width: 280 }}
        />
        {tab === 'all' && (
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 160 }}
            value={statusFilter || undefined}
            onChange={setStatusFilter}
            options={[
              'inward',
              'planned',
              'inWorkshop',
              'testing',
              'pendingApproval',
              'approved',
              'onHold',
            ].map((s) => ({ value: s, label: s }))}
          />
        )}
        <Button type="primary" onClick={() => fetchSamples(1)}>
          Search
        </Button>
      </Space>

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={samples}
        loading={loading}
        rowClassName={(r) => (r.isExpress ? 'urgent-row' : '')}
        pagination={{
          current: pagination.page,
          total: pagination.total,
          onChange: fetchSamples,
        }}
      />
    </div>
  );
};

export default SampleListPage;
