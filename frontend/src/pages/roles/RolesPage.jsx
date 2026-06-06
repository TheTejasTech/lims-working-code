import { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Typography, message } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../../utils/api';

const { Title } = Typography;

const RolesPage = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/roles');
      setRoles(data.data || []);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const columns = [
    { title: 'Role Name', dataIndex: 'roleName', key: 'roleName' },
    { title: 'Description', dataIndex: 'roleDescription', key: 'roleDescription' },
    { title: 'Default Dashboard', dataIndex: 'dashboard', key: 'dashboard' },
    {
      title: 'Pages Configured',
      key: 'pages',
      render: (_, r) => {
        const viewable = (r.pages || []).filter((p) => p.canView).length;
        return <Tag>{viewable} / {(r.pages || []).length}</Tag>;
      },
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>
          Role Management
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchRoles}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} disabled>
            Add Role
          </Button>
        </Space>
      </Space>
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={roles}
        loading={loading}
        pagination={{ pageSize: 15 }}
      />
    </div>
  );
};

export default RolesPage;
