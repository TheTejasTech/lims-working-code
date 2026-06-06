import { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Typography, message } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../../utils/api';

const { Title } = Typography;

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data.data || []);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const columns = [
    { title: 'User ID', dataIndex: 'userId', key: 'userId' },
    { title: 'Name', dataIndex: 'userName', key: 'userName' },
    { title: 'Department', dataIndex: 'department', key: 'department' },
    {
      title: 'Role',
      key: 'role',
      render: (_, r) => r.role?.roleName || '—',
    },
    {
      title: 'Category',
      dataIndex: 'userCategory',
      key: 'userCategory',
      render: (cat) => (
        <Tag color={cat === 'admin' ? 'blue' : 'default'}>{cat}</Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, r) =>
        r.isDisabled ? <Tag color="red">Disabled</Tag> : <Tag color="green">Active</Tag>,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>
          User Management
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchUsers}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} disabled>
            Add User
          </Button>
        </Space>
      </Space>
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={users}
        loading={loading}
        pagination={{ pageSize: 15 }}
      />
    </div>
  );
};

export default UsersPage;
