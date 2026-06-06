import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Badge, Breadcrumb, Button, theme } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  ExperimentOutlined,
  ToolOutlined,
  FileSearchOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  SendOutlined,
  BookOutlined,
  UnorderedListOutlined,
  DesktopOutlined,
  BarChartOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { hasPagePermission } from '../../utils/permissions';
import { markAllRead } from '../../app/slices/notificationSlice';

const { Header, Sider, Content } = Layout;

const NAV_ITEMS = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard', page: 'dashboard' },
  { key: '/customers', icon: <TeamOutlined />, label: 'Customers', page: 'customers' },
  { key: '/samples', icon: <ExperimentOutlined />, label: 'Sample Inward', page: 'samples' },
  { key: '/plans', icon: <FileTextOutlined />, label: 'Test Plan', page: 'plans' },
  { key: '/workshop', icon: <ToolOutlined />, label: 'Workshop', page: 'workshop' },
  { key: '/results', icon: <FileSearchOutlined />, label: 'Test Results', page: 'results' },
  { key: '/approvals', icon: <CheckCircleOutlined />, label: 'Approvals', page: 'approvals' },
  { key: '/invoices', icon: <FileTextOutlined />, label: 'Invoices', page: 'invoices' },
  { key: '/dispatch', icon: <SendOutlined />, label: 'Dispatch', page: 'dispatch' },
  { key: '/specifications', icon: <BookOutlined />, label: 'Specifications', page: 'specifications' },
  { key: '/tests', icon: <UnorderedListOutlined />, label: 'Test Master', page: 'tests' },
  { key: '/equipment', icon: <DesktopOutlined />, label: 'Equipment', page: 'equipment' },
  { key: '/reports/delay', icon: <BarChartOutlined />, label: 'MIS Reports', page: 'reports' },
  { key: '/users', icon: <UserOutlined />, label: 'Users', page: 'users' },
  { key: '/roles', icon: <SafetyCertificateOutlined />, label: 'Roles', page: 'roles' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Settings', page: 'settings' },
];

const ROUTE_LABELS = {
  dashboard: 'Dashboard',
  customers: 'Customers',
  samples: 'Sample Inward',
  plans: 'Test Plan',
  workshop: 'Workshop',
  results: 'Test Results',
  approvals: 'Approvals',
  invoices: 'Invoices',
  dispatch: 'Dispatch',
  specifications: 'Specifications',
  tests: 'Test Master',
  equipment: 'Equipment',
  reports: 'MIS Reports',
  users: 'Users',
  roles: 'Roles',
  settings: 'Settings',
};

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const dispatch = useDispatch();
  const { unreadCount, items } = useSelector((s) => s.notifications);
  const { token } = theme.useToken();

  useSocket(true);

  let menuItems = NAV_ITEMS.filter((item) => hasPagePermission(user, item.page)).map(
    ({ key, icon, label }) => ({ key, icon, label })
  );

  if (user?.isSamplePrep) {
    menuItems = menuItems.filter((m) => m.key === '/workshop');
  }

  const pathSnippets = location.pathname.split('/').filter(Boolean);
  const breadcrumbItems = [
    { title: 'Home' },
    ...pathSnippets.map((seg, i) => ({
      title: ROUTE_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1),
    })),
  ];

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Logout',
        onClick: () => {
          logout();
          navigate('/login');
        },
      },
    ],
  };

  const notificationMenu = {
    items:
      items.length === 0
        ? [{ key: 'empty', label: 'No notifications', disabled: true }]
        : items.slice(0, 10).map((n) => ({
            key: n.id,
            label: (
              <div>
                <strong>{n.title}</strong>
                <br />
                <small>{n.message}</small>
              </div>
            ),
          })),
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={220}
        style={{ background: '#001529' }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: collapsed ? 14 : 16,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {collapsed ? 'LIMS' : 'Unite Soft LIMS'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: token.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <span style={{ fontWeight: 600, fontSize: 16, color: '#1a3a5c' }}>
            Material Testing Laboratory
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Dropdown
              menu={notificationMenu}
              trigger={['click']}
              onOpenChange={(open) => open && dispatch(markAllRead())}
            >
              <Badge count={unreadCount} size="small">
                <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
              </Badge>
            </Dropdown>
            <Dropdown menu={userMenu} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar style={{ backgroundColor: '#1677ff' }}>
                  {user?.userInitial || user?.userName?.charAt(0) || 'U'}
                </Avatar>
                <span>{user?.userName}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: 24 }}>
          <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 16 }} />
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
