import { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Tag, Modal, Form, Input, message, Checkbox } from 'antd';
import { ReloadOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import api from '../../utils/api';

const { Title, Text } = Typography;

const ApprovalsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [preview, setPreview] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/approvals');
      setData(res.data || []);
    } catch {
      message.error('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (id) => {
    const { data: res } = await api.get(`/approvals/${id}`);
    setDetail(res);
    const prev = await api.get(`/approvals/${id}/preview`);
    setPreview(prev.data.preview);
  };

  const approve = async (id, sendMail = false) => {
    try {
      await api.post(`/approvals/${id}/approve`, {
        approveAndSendMail: sendMail,
        resultRemarks: form.getFieldValue('resultRemarks'),
      });
      message.success('Approved — results locked, ULR generated');
      setDetail(null);
      load();
    } catch (e) {
      message.error(e.response?.data?.message || 'Approval failed');
    }
  };

  const reject = async (values) => {
    try {
      await api.post(`/approvals/${selected}/reject`, values);
      message.success('Rejected — sent back to testing');
      setRejectOpen(false);
      load();
    } catch (e) {
      message.error(e.response?.data?.message || 'Reject failed');
    }
  };

  const createFromSample = async () => {
    const sinId = prompt('Enter Sample ID (from sample detail URL):');
    if (!sinId) return;
    try {
      await api.post('/approvals', { sinId });
      message.success('Approval queue created');
      load();
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed');
    }
  };

  const columns = [
    {
      title: 'SIN',
      key: 'sin',
      render: (_, r) => r.sinId?.sinNo || '—',
    },
    {
      title: 'Status',
      dataIndex: 'approvalStatus',
      render: (s) => (
        <Tag color={s === 'approved' ? 'green' : s === 'rejected' ? 'red' : 'gold'}>{s}</Tag>
      ),
    },
    { title: 'ULR No', dataIndex: 'inAccreditationULRNo', ellipsis: true },
    {
      title: 'Report Date',
      dataIndex: 'reportDate',
      render: (d) => (d ? new Date(d).toLocaleDateString() : '—'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => openDetail(r._id)}>Review</Button>
          {r.approvalStatus === 'pending' && (
            <>
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => approve(r._id)}>
                Approve
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => { setSelected(r._id); setRejectOpen(true); }}
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>Approvals & ULR</Title>
        <Space>
          <Button onClick={createFromSample}>Queue Sample</Button>
          <Button icon={<ReloadOutlined />} onClick={load}>Refresh</Button>
        </Space>
      </Space>

      <Table rowKey="_id" columns={columns} dataSource={data} loading={loading} />

      <Modal
        title="Approval Review"
        open={!!detail}
        onCancel={() => setDetail(null)}
        width={800}
        footer={
          detail?.data?.approvalStatus === 'pending' ? (
            <Space>
              <Button onClick={() => approve(detail.data._id, true)}>Approve & Send Mail</Button>
              <Button type="primary" onClick={() => approve(detail.data._id)}>Approve</Button>
            </Space>
          ) : null
        }
      >
        {preview && (
          <>
            <Text strong>ULR: </Text>
            <Tag color="blue">{preview.ulrNo || 'Generated on approve'}</Tag>
            <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
              <Form.Item name="resultRemarks" label="Result Remarks">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Form>
            <Title level={5}>Test Results ({preview.results?.length || 0})</Title>
            <Table
              size="small"
              rowKey="_id"
              dataSource={preview.results || []}
              pagination={false}
              columns={[
                { title: 'Test', dataIndex: 'testName' },
                { title: 'Lab No', dataIndex: 'labNo' },
                {
                  title: 'Result',
                  render: (_, r) => r.resultDetails?.map((d) => d.result).join(', '),
                },
                {
                  title: 'P/F',
                  dataIndex: 'overallPassFail',
                  render: (v) => <Tag color={v === 'pass' ? 'green' : 'red'}>{v}</Tag>,
                },
              ]}
            />
          </>
        )}
      </Modal>

      <Modal title="Reject Approval" open={rejectOpen} onCancel={() => setRejectOpen(false)} footer={null}>
        <Form layout="vertical" onFinish={reject}>
          <Form.Item name="rejectReason" label="Reason" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" danger htmlType="submit" block>Reject</Button>
        </Form>
      </Modal>
    </div>
  );
};

export default ApprovalsPage;
