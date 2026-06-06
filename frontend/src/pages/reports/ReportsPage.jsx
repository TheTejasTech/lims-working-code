import { useEffect, useState } from 'react';
import { Card, Col, Row, Typography, Tabs, Table, DatePicker, Button, Statistic, message, Space } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../utils/api';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const COLORS = ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2'];

const ReportsPage = () => {
  const [range, setRange] = useState(null);
  const [delay, setDelay] = useState([]);
  const [pending, setPending] = useState([]);
  const [topCustomers, setTopCustomers] = useState({ byQuantity: [], byAmount: [] });
  const [financial, setFinancial] = useState(null);
  const [labRegister, setLabRegister] = useState([]);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(false);

  const params = () => {
    if (!range?.[0]) return {};
    return { from: range[0].toISOString(), to: range[1].toISOString() };
  };

  const loadReport = async (key) => {
    setLoading(true);
    const p = params();
    try {
      if (key === 'delay') {
        const { data } = await api.get('/reports/delay', { params: p });
        setDelay(data.data || []);
      } else if (key === 'pending') {
        const { data } = await api.get('/reports/pending-tests');
        setPending(data.data || []);
      } else if (key === 'top') {
        const { data } = await api.get('/reports/top-customers', { params: p });
        setTopCustomers(data.data || { byQuantity: [], byAmount: [] });
      } else if (key === 'financial') {
        const { data } = await api.get('/reports/financial', { params: p });
        setFinancial(data.data);
      } else if (key === 'register') {
        const { data } = await api.get('/reports/lab-register', { params: p });
        setLabRegister(data.data || []);
      } else if (key === 'business') {
        const { data } = await api.get('/reports/business-summary', { params: p });
        setBusiness(data.data);
      }
    } catch {
      message.error('Report load failed');
    } finally {
      setLoading(false);
    }
  };

  const chartData = topCustomers.byQuantity?.map((r) => ({
    name: r.customer?.[0]?.customerName?.substring(0, 12) || 'Unknown',
    value: r.quantity || r.count,
  })) || [];

  const pipelineData = business
    ? [
        { name: 'Samples', value: business.samples },
        { name: 'New Customers', value: business.newCustomers },
        { name: 'Tests', value: business.testsCompleted },
      ]
    : [];

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>MIS Reports</Title>
        <RangePicker onChange={setRange} />
      </Space>

      <Tabs
        onChange={loadReport}
        items={[
          {
            key: 'delay',
            label: 'Delay Report',
            children: (
              <Table
                loading={loading}
                rowKey="_id"
                dataSource={delay}
                columns={[
                  { title: 'SIN', dataIndex: 'sinNo' },
                  { title: 'Customer', key: 'c', render: (_, r) => r.customerId?.customerName },
                  { title: 'Expected', dataIndex: 'reportExpectedDate', render: (d) => new Date(d).toLocaleDateString() },
                  { title: 'Status', dataIndex: 'status' },
                ]}
              />
            ),
          },
          {
            key: 'pending',
            label: 'Pending Tests',
            children: (
              <Table
                loading={loading}
                rowKey="_id"
                dataSource={pending}
                columns={[
                  { title: 'Lab No', dataIndex: 'labNo' },
                  { title: 'Test', dataIndex: 'testName' },
                  { title: 'SIN', key: 's', render: (_, r) => r.sinId?.sinNo },
                ]}
              />
            ),
          },
          {
            key: 'top',
            label: 'Top Customers',
            children: (
              <Row gutter={16}>
                <Col span={14}>
                  <Card title="By Quantity">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#1677ff" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
                <Col span={10}>
                  <Card title="Summary Table">
                    <Table
                      size="small"
                      rowKey="_id"
                      dataSource={topCustomers.byQuantity}
                      pagination={false}
                      columns={[
                        { title: 'Customer', render: (_, r) => r.customer?.[0]?.customerName },
                        { title: 'Qty', dataIndex: 'quantity' },
                      ]}
                    />
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'financial',
            label: 'Financial',
            children: financial ? (
              <Row gutter={16}>
                <Col span={8}><Card><Statistic title="Invoiced" prefix="₹" value={financial.invoiced} /></Card></Col>
                <Col span={8}><Card><Statistic title="Collected" prefix="₹" value={financial.collected} valueStyle={{ color: '#3f8600' }} /></Card></Col>
                <Col span={8}><Card><Statistic title="Outstanding" prefix="₹" value={financial.outstanding} valueStyle={{ color: '#cf1322' }} /></Card></Col>
              </Row>
            ) : (
              <Button onClick={() => loadReport('financial')}>Load Report</Button>
            ),
          },
          {
            key: 'register',
            label: 'Lab Register',
            children: (
              <Table
                loading={loading}
                rowKey="_id"
                dataSource={labRegister}
                columns={[
                  { title: 'SIN', dataIndex: 'sinNo' },
                  { title: 'Date', dataIndex: 'inwardDate', render: (d) => new Date(d).toLocaleDateString() },
                  { title: 'Customer', key: 'c', render: (_, r) => r.customerId?.customerName },
                  { title: 'Qty', dataIndex: 'totalQuantity' },
                  { title: 'Status', dataIndex: 'status' },
                ]}
              />
            ),
          },
          {
            key: 'business',
            label: 'Business Summary',
            children: business ? (
              <Row gutter={16}>
                <Col span={8}><Card><Statistic title="Samples" value={business.samples} /></Card></Col>
                <Col span={8}><Card><Statistic title="New Customers" value={business.newCustomers} /></Card></Col>
                <Col span={8}><Card><Statistic title="Tests Done" value={business.testsCompleted} /></Card></Col>
                <Col span={12} style={{ marginTop: 16 }}>
                  <Card title="Overview">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={pipelineData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                          {pipelineData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
              </Row>
            ) : (
              <Button onClick={() => loadReport('business')}>Load Report</Button>
            ),
          },
        ]}
      />
    </div>
  );
};

export default ReportsPage;
