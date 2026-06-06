import { Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

const PlaceholderPage = ({ title, description }) => (
  <Card>
    <Title level={4}>{title}</Title>
    <Paragraph type="secondary">
      {description || 'This module will be implemented in the next development phase.'}
    </Paragraph>
  </Card>
);

export default PlaceholderPage;
