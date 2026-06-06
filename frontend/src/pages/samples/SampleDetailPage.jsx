import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Typography,
  Table,
  message,
  Row,
  Col,
  Upload,
} from "antd";
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useReactToPrint } from "react-to-print";
import api from "../../utils/api";
import BarcodeLabel from "../../components/BarcodeLabel";

const { Title } = Typography;

const SampleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sample, setSample] = useState(null);
  const [loading, setLoading] = useState(true);
  const [labels, setLabels] = useState([]);
  const printRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/samples/${id}`);
      setSample(data.data);
      const labelRes = await api.get(`/samples/${id}/label-print`);
      setLabels(labelRes.data.data || []);
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to load sample");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: sample?.sinNo || "labels",
  });

  const uploadAttachment = async ({ file }) => {
    const formData = new FormData();
    formData.append("files", file);
    try {
      await api.post(`/samples/${id}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success("Attachment uploaded");
      load();
    } catch (err) {
      message.error(err.response?.data?.message || "Upload failed");
    }
  };

  const sampleColumns = [
    { title: "Lab No", dataIndex: "labNo", key: "labNo" },
    { title: "Sample", dataIndex: "sample", key: "sample" },
    { title: "Material", dataIndex: "materialType", key: "materialType" },
    {
      title: "Identification",
      dataIndex: "sampleIdentification",
      key: "sampleIdentification",
    },
    { title: "Batch No", dataIndex: "batchNo", key: "batchNo" },
    { title: "Part No", dataIndex: "partNo", key: "partNo" },
    { title: "Qty", dataIndex: "quantity", key: "quantity" },
    {
      title: "Additional Details",
      dataIndex: "additionalDetails",
      key: "additionalDetails",
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/samples")}
        >
          Back
        </Button>
        <Button
          icon={<PrinterOutlined />}
          onClick={handlePrint}
          disabled={!labels.length}
        >
          Print Labels
        </Button>
        <Upload customRequest={uploadAttachment} showUploadList={false}>
          <Button icon={<UploadOutlined />}>Upload Attachment</Button>
        </Upload>
      </Space>

      <Card loading={loading}>
        {sample && (
          <>
            <Space style={{ marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0 }}>
                {sample.sinNo}
              </Title>
              {sample.isExpress && <Tag color='red'>URGENT</Tag>}
              <Tag color='blue'>{sample.status}</Tag>
              {sample.noBill && <Tag>No Bill</Tag>}
            </Space>

            <Descriptions
              bordered
              size='small'
              column={{ xs: 1, sm: 2, md: 3 }}
            >
              <Descriptions.Item label='Customer'>
                {sample.customerId?.customerName}
              </Descriptions.Item>
              <Descriptions.Item label='Inward Date'>
                {sample.inwardDate
                  ? new Date(sample.inwardDate).toLocaleString()
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label='Challan Number'>
                {sample.challanNumber || "—"}
              </Descriptions.Item>
              <Descriptions.Item label='Challan Date'>
                {sample.challanDate
                  ? new Date(sample.challanDate).toLocaleDateString()
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label='PO Number'>
                {sample.poNumber || "—"}
              </Descriptions.Item>
              <Descriptions.Item label='PO Date'>
                {sample.poDate
                  ? new Date(sample.poDate).toLocaleDateString()
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label='Report Issued To'>
                {sample.reportIssuedTo || "—"}
              </Descriptions.Item>
              <Descriptions.Item label='Total Qty'>
                {sample.totalQuantity}
              </Descriptions.Item>
              <Descriptions.Item label='Receipt'>
                {sample.receiptMode}
              </Descriptions.Item>
              <Descriptions.Item label='Amount'>
                ₹{sample.totalAmount?.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label='Balance'>
                ₹{sample.balanceAmount?.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label='Expected Report'>
                {sample.reportExpectedDate
                  ? new Date(sample.reportExpectedDate).toLocaleDateString()
                  : "—"}
              </Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginTop: 24 }}>
              Sample Info
            </Title>
            <Table
              rowKey='labNo'
              size='small'
              columns={sampleColumns}
              dataSource={sample.samples || []}
              pagination={false}
            />

            {sample.sampleAdditionalDetails?.length > 0 && (
              <>
                <Title level={5} style={{ marginTop: 16 }}>
                  Additional Details
                </Title>
                <Descriptions bordered size='small' column={1}>
                  {sample.sampleAdditionalDetails.map((d, i) => (
                    <Descriptions.Item key={i} label={d.description}>
                      {d.value}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </>
            )}

            {sample.deviationChecklist?.length > 0 && (
              <>
                <Title level={5} style={{ marginTop: 16 }}>
                  Deviation Checklist
                </Title>
                <Table
                  rowKey={(_, i) => i}
                  size='small'
                  columns={[
                    {
                      title: "Deviation Item / Description",
                      dataIndex: "description",
                      key: "description",
                    },
                    { title: "Status", dataIndex: "status", key: "status" },
                    { title: "Remarks", dataIndex: "remarks", key: "remarks" },
                  ]}
                  dataSource={sample.deviationChecklist || []}
                  pagination={false}
                />
              </>
            )}

            <Title level={5} style={{ marginTop: 24 }}>
              Barcode Labels
            </Title>
            <div ref={printRef} style={{ display: "flex", flexWrap: "wrap" }}>
              <Row gutter={[8, 8]}>
                {labels.map((l) => (
                  <Col key={l.labNo}>
                    <BarcodeLabel
                      labNo={l.labNo}
                      sample={l.sample}
                      customerName={l.customerName}
                      isExpress={l.isExpress}
                    />
                  </Col>
                ))}
              </Row>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default SampleDetailPage;
