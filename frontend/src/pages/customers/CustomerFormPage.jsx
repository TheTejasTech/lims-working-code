import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  Row,
  Col,
  Switch,
  InputNumber,
  Typography,
  message,
  Divider,
  Space,
} from 'antd';
import api from '../../utils/api';

const { Title } = Typography;

const CustomerFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      api
        .get(`/customers/${id}`)
        .then(({ data }) => form.setFieldsValue(data.data))
        .catch(() => message.error('Failed to load customer'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, form]);

  const onFinish = async (values) => {
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/customers/${id}`, values);
        message.success('Customer updated');
        navigate(`/customers/${id}`);
      } else {
        const { data } = await api.post('/customers', values);
        message.success('Customer created');
        navigate(`/customers/${data.data._id}`);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card loading={loading}>
      <Title level={4}>{isEdit ? 'Edit Customer' : 'New Customer'}</Title>
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ country: 'India' }}>
        <Divider orientation="left">Basic Information</Divider>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="customerName" label="Customer Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="alias" label="Alias">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="legalName" label="Legal Name">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="address" label="Address">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="city" label="City">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="state" label="State">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="country" label="Country">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="pinCode" label="PIN Code">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="area" label="Area">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="industry" label="Industry">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Contact</Divider>
        <Row gutter={16}>
          <Col xs={24} md={6}>
            <Form.Item name="salutation" label="Salutation">
              <Input placeholder="Mr./Ms." />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="contactPerson" label="Contact Person">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="contactNo" label="Contact No">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="emailId" label="Email">
              <Input type="email" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="alternateAddress" label="Alternate Address">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="alternateEmail" label="Alternate Email">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="alternateMobile" label="Alternate Mobile">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">GST & Billing</Divider>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="gstNo" label="GST No">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={4}>
            <Form.Item name="gstNotApplicable" label="GST N/A" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} md={4}>
            <Form.Item name="sezApplicable" label="SEZ" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} md={4}>
            <Form.Item name="creditLimit" label="Credit Limit">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Col>
          <Col xs={24} md={4}>
            <Form.Item name="creditDays" label="Credit Days">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="vendorCode" label="Vendor Code">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="tallyLedgerName" label="Tally Ledger">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="salesPerson" label="Sales Person">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="paymentTerms" label="Payment Terms">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="openingBalance" label="Opening Balance">
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="advanceDue" label="Advance Due">
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={4}>
            <Form.Item name="isPremium" label="Premium" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} md={4}>
            <Form.Item name="premiumCustomer" label="Never Hold Reports" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} md={4}>
            <Form.Item name="isDisabled" label="Disabled" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Customer Portal Login (optional)</Divider>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="userLoginId" label="Portal Login ID">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="userLoginPassword" label="Portal Password">
              <Input.Password placeholder={isEdit ? 'Leave blank to keep' : ''} />
            </Form.Item>
          </Col>
        </Row>

        <Space>
          <Button type="primary" htmlType="submit" loading={saving}>
            {isEdit ? 'Update' : 'Create'} Customer
          </Button>
          <Button onClick={() => navigate(-1)}>Cancel</Button>
        </Space>
      </Form>
    </Card>
  );
};

export default CustomerFormPage;
