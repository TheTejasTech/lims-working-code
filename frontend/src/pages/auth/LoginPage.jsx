import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Alert, Typography, Tabs } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  ExperimentOutlined,
  MailOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import { getDefaultRoute } from '../../utils/permissions';

const { Title, Text } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register, isAuthenticated, loading, error, clearError, user } = useAuth();
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('login');

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getDefaultRoute(user), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const onLogin = async (values) => {
    clearError();
    const result = await login(values);
    if (result.meta.requestStatus === 'fulfilled') {
      navigate(getDefaultRoute(result.payload.user), { replace: true });
    }
  };

  const onRegister = async (values) => {
    clearError();
    if (values.password !== values.confirmPassword) {
      registerForm.setFields([{ name: 'confirmPassword', errors: ['Passwords do not match'] }]);
      return;
    }
    const { confirmPassword, ...payload } = values;
    const result = await register(payload);
    if (result.meta.requestStatus === 'fulfilled') {
      navigate(getDefaultRoute(result.payload.user), { replace: true });
    }
  };

  return (
    <div className="login-page">
      <Card className="login-card">
        <div className="login-logo">
          <ExperimentOutlined style={{ fontSize: 48, color: '#1677ff' }} />
          <Title level={3} style={{ marginBottom: 0 }}>
            Unite Soft LIMS
          </Title>
          <Text type="secondary">Material Testing Laboratory</Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            closable
            onClose={clearError}
          />
        )}

        <Tabs
          activeKey={activeTab}
          onChange={(k) => {
            setActiveTab(k);
            clearError();
          }}
          centered
          items={[
            {
              key: 'login',
              label: 'Sign In',
              children: (
                <Form form={loginForm} layout="vertical" onFinish={onLogin} size="large">
                  <Form.Item
                    name="userId"
                    label="User ID"
                    rules={[{ required: true, message: 'Enter your user ID' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="e.g. admin" autoComplete="username" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="Password"
                    rules={[{ required: true, message: 'Enter your password' }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="Password"
                      autoComplete="current-password"
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                      Sign In
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'register',
              label: 'Register',
              children: (
                <Form form={registerForm} layout="vertical" onFinish={onRegister} size="large">
                  <Form.Item
                    name="userId"
                    label="User ID"
                    rules={[
                      { required: true },
                      { pattern: /^[a-zA-Z0-9_]+$/, message: 'Letters, numbers, underscore only' },
                    ]}
                  >
                    <Input prefix={<IdcardOutlined />} placeholder="Choose a user ID" />
                  </Form.Item>
                  <Form.Item name="userName" label="Full Name" rules={[{ required: true }]}>
                    <Input prefix={<UserOutlined />} placeholder="Your full name" />
                  </Form.Item>
                  <Form.Item name="emailId" label="Email">
                    <Input prefix={<MailOutlined />} type="email" placeholder="email@company.com" />
                  </Form.Item>
                  <Form.Item name="department" label="Department">
                    <Input placeholder="e.g. Mechanical Testing" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="Password"
                    rules={[
                      { required: true },
                      { min: 6, message: 'Minimum 6 characters' },
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                  </Form.Item>
                  <Form.Item
                    name="confirmPassword"
                    label="Confirm Password"
                    rules={[{ required: true }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Confirm password" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                      Create Account
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default LoginPage;
