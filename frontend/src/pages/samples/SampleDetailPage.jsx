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
  Tabs,
  Select,
  Image,
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
  const [selectedSampleId, setSelectedSampleId] = useState(null);
  const [uploading, setUploading] = useState(false);
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

  useEffect(() => {
    if (sample?.samples?.length) {
      setSelectedSampleId((prev) => prev || sample.samples[0]._id);
    }
  }, [sample]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: sample?.sinNo || "labels",
  });

  const uploadSampleImages = async ({ file }) => {
    if (!selectedSampleId) {
      return message.warning("Select a sample line before uploading images");
    }

    const formData = new FormData();
    formData.append("sampleId", selectedSampleId);
    formData.append("images", file);

    try {
      setUploading(true);
      await api.post(`/samples/${id}/sample-images`, formData);
      message.success("Sample image uploaded");
      load();
    } catch (err) {
      message.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
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
      </Space>

      <Card loading={loading}>
        {sample && (
          <Tabs
            defaultActiveKey='overview'
            items={[
              {
                key: "overview",
                label: "Overview",
                children: (
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
                          ? new Date(
                              sample.reportExpectedDate,
                            ).toLocaleDateString()
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
                            {
                              title: "Status",
                              dataIndex: "status",
                              key: "status",
                            },
                            {
                              title: "Remarks",
                              dataIndex: "remarks",
                              key: "remarks",
                            },
                          ]}
                          dataSource={sample.deviationChecklist || []}
                          pagination={false}
                        />
                      </>
                    )}

                    <Title level={5} style={{ marginTop: 24 }}>
                      Barcode Labels
                    </Title>
                    <div
                      ref={printRef}
                      style={{ display: "flex", flexWrap: "wrap" }}
                    >
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
                ),
              },
              {
                key: "attachments",
                label: "Attachments",
                children: (
                  <>
                    <Space
                      style={{ marginBottom: 16, width: "100%" }}
                      direction='vertical'
                    >
                      <Row gutter={16} align='middle'>
                        <Col xs={24} md={12}>
                          <Select
                            style={{ width: "100%" }}
                            placeholder='Select sample line'
                            value={selectedSampleId}
                            options={sample.samples?.map((s) => ({
                              value: s._id,
                              label: `${s.labNo} - ${s.sample || "Unnamed sample"}`,
                            }))}
                            onChange={setSelectedSampleId}
                          />
                        </Col>
                        <Col xs={24} md={12}>
                          <Upload
                            customRequest={uploadSampleImages}
                            showUploadList={false}
                            multiple
                            accept='image/*'
                          >
                            <Button
                              icon={<UploadOutlined />}
                              loading={uploading}
                            >
                              Upload Sample Images
                            </Button>
                          </Upload>
                        </Col>
                      </Row>

                      {sample.samples?.map((sampleLine) => (
                        <Card
                          key={sampleLine._id}
                          size='small'
                          title={`${sampleLine.labNo} - ${sampleLine.sample || "Sample"}`}
                          style={{ marginBottom: 16 }}
                        >
                          {sampleLine.sampleImages?.length > 0 ? (
                            <Image.PreviewGroup>
                              <Row gutter={[8, 8]}>
                                {sampleLine.sampleImages.map((img, index) => (
                                  <Col key={index} span={6}>
                                    <Image
                                      src={img.filePath}
                                      alt={img.fileName}
                                      style={{ width: "100%", height: "auto" }}
                                    />
                                  </Col>
                                ))}
                              </Row>
                            </Image.PreviewGroup>
                          ) : (
                            <div>
                              No images uploaded for this sample line yet.
                            </div>
                          )}
                        </Card>
                      ))}
                    </Space>
                  </>
                ),
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
};

export default SampleDetailPage;
