import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import {
  ExperimentOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';

const { Title } = Typography;

const DashboardPage = () => {
  const { user } = useAuth();
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    api.get('/reports/dashboard/kpis').then(({ data }) => setKpis(data.data)).catch(() => {});
  }, []);

  const pipelineChart = kpis
    ? [
        { stage: 'Inward', count: kpis.pipeline?.inward || 0 },
        { stage: 'Planned', count: kpis.pipeline?.planned || 0 },
        { stage: 'Workshop', count: kpis.pipeline?.workshop || 0 },
        { stage: 'Testing', count: kpis.pipeline?.testing || 0 },
        { stage: 'Approval', count: kpis.pipeline?.approval || 0 },
        { stage: 'Invoice', count: kpis.pipeline?.invoice || 0 },
      ]
    : [];

  return (
    <div>
      <Title level={4}>Welcome, {user?.userName}</Title>
      <p style={{ color: '#666', marginBottom: 24 }}>
        Material Testing Laboratory — live KPIs
      </p>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Samples Today" value={kpis?.samplesToday ?? 0} prefix={<ExperimentOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="This Month" value={kpis?.samplesMonth ?? 0} prefix={<ExperimentOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Overdue" value={kpis?.overdueSamples ?? 0} prefix={<WarningOutlined />} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Revenue (Month)" value={kpis?.revenueMonth ?? 0} prefix="₹" precision={0} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Pending Invoice" value={kpis?.pendingInvoiceAmount ?? 0} prefix="₹" precision={0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Awaiting Approval" value={kpis?.pipeline?.approval ?? 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="In Testing" value={kpis?.pipeline?.testing ?? 0} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Top Customer" value={kpis?.topCustomer || '—'} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 24 }} title="Workflow Pipeline">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={pipelineChart}>
            <XAxis dataKey="stage" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#1677ff" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default DashboardPage;
