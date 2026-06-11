import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Select,
  DatePicker,
  Table,
  Checkbox,
  Tabs,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../utils/api";

const { Title } = Typography;

const SampleFormPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [samples, setSamples] = useState([
    { sample: "", quantity: 1, batchNo: "", partNo: "", additionalDetails: "" },
  ]);
  const [additionalDetails, setAdditionalDetails] = useState([]);
  const [deviationChecklist, setDeviationChecklist] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get("/customers", { params: { limit: 500 } }),
      api
        .get("/users", { params: { limit: 100 } })
        .catch(() => ({ data: { data: [] } })),
    ]).then(([custRes, userRes]) => {
      setCustomers(custRes.data.data || []);
      setUsers(userRes.data.data || []);
    });
  }, []);

  const addSampleLine = () =>
    setSamples([
      ...samples,
      {
        sample: "",
        quantity: 1,
        batchNo: "",
        partNo: "",
        additionalDetails: "",
      },
    ]);
  const removeSampleLine = (i) =>
    setSamples(samples.filter((_, idx) => idx !== i));
  const updateSampleLine = (i, field, value) => {
    const next = [...samples];
    next[i] = { ...next[i], [field]: value };
    setSamples(next);
  };

  const onFinish = async (values) => {
    if (!samples.length || !samples[0].sample) {
      return message.warning("Add at least one sample line");
    }
    setSaving(true);
    try {
      const payload = {
        ...values,
        inwardDate: values.inwardDate?.toISOString?.() || new Date(),
        challanDate: values.challanDate?.toISOString?.() || new Date(),
        referenceDate: values.referenceDate?.toISOString?.() || undefined,
        poDate: values.poDate?.toISOString?.() || undefined,
        reportExpectedDate:
          values.reportExpectedDate?.toISOString?.() || undefined,
        samples: samples.filter((s) => s.sample),
        sampleAdditionalDetails: additionalDetails.filter((d) => d.description),
        deviationChecklist: deviationChecklist.filter((d) => d.description),
        deviation: values.deviation || {},
      };
      const { data } = await api.post("/samples", payload);
      message.success(`Sample registered: ${data.data.sinNo}`);
      navigate(`/samples/${data.data._id}`);
    } catch (err) {
      message.error(err.response?.data?.message || "Registration failed");
    } finally {
      setSaving(false);
    }
  };

  const sampleColumns = [
    {
      title: "Sample Description",
      key: "sample",
      render: (_, __, i) => (
        <Input
          placeholder='Plate, Pipe, Rod...'
          value={samples[i].sample}
          onChange={(e) => updateSampleLine(i, "sample", e.target.value)}
        />
      ),
    },
    {
      title: "Material Type",
      key: "materialType",
      render: (_, __, i) => (
        <Input
          value={samples[i].materialType}
          onChange={(e) => updateSampleLine(i, "materialType", e.target.value)}
        />
      ),
    },
    {
      title: "Identification",
      key: "id",
      render: (_, __, i) => (
        <Input
          value={samples[i].sampleIdentification}
          onChange={(e) =>
            updateSampleLine(i, "sampleIdentification", e.target.value)
          }
        />
      ),
    },
    {
      title: "Batch No",
      key: "batchNo",
      render: (_, __, i) => (
        <Input
          placeholder='Batch No'
          value={samples[i].batchNo}
          onChange={(e) => updateSampleLine(i, "batchNo", e.target.value)}
        />
      ),
    },
    {
      title: "Part No",
      key: "partNo",
      render: (_, __, i) => (
        <Input
          placeholder='Part No'
          value={samples[i].partNo}
          onChange={(e) => updateSampleLine(i, "partNo", e.target.value)}
        />
      ),
    },
    {
      title: "Qty",
      key: "qty",
      width: 80,
      render: (_, __, i) => (
        <InputNumber
          min={1}
          value={samples[i].quantity}
          onChange={(v) => updateSampleLine(i, "quantity", v)}
        />
      ),
    },
    {
      title: "Additional Details",
      key: "additionalDetails",
      render: (_, __, i) => (
        <Input.TextArea
          placeholder='Additional sample details'
          rows={1}
          value={samples[i].additionalDetails}
          onChange={(e) =>
            updateSampleLine(i, "additionalDetails", e.target.value)
          }
        />
      ),
    },
    {
      title: "",
      key: "del",
      width: 50,
      render: (_, __, i) =>
        samples.length > 1 ? (
          <Button
            type='text'
            danger
            icon={<DeleteOutlined />}
            onClick={() => removeSampleLine(i)}
          />
        ) : null,
    },
  ];

  return (
    <Card>
      <Title level={4}>Sample Inward / Registration</Title>
      <Form
        form={form}
        layout='vertical'
        onFinish={onFinish}
        initialValues={{
          inwardDate: dayjs(),
          receiptMode: "byHand",
          forTesting: true,
          inAccreditationScope: true,
          gstPercent: 18,
          deviation: {},
        }}
      >
        <Tabs
          items={[
            {
              key: "basic",
              label: "Basic Info",
              children: (
                <>
                  <Title level={5}>Challan & PO Details</Title>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name='sinNo'
                        label='SIN No (TBD)'
                        tooltip='Sample Inward Note number, to be generated by system'
                      >
                        <Input placeholder='Auto-generated' disabled />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item
                        name='challanNumber'
                        label='Challan Number'
                        rules={[
                          {
                            required: true,
                            message: "Please enter Challan Number",
                          },
                        ]}
                      >
                        <Input placeholder='Enter challan number' />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item
                        name='challanDate'
                        label='Challan Date'
                        rules={[
                          {
                            required: true,
                            message: "Please select Challan Date",
                          },
                        ]}
                      >
                        <DatePicker style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item
                        name='poNumber'
                        label='PO Number'
                        rules={[
                          { required: true, message: "Please enter PO Number" },
                        ]}
                      >
                        <Input placeholder='Enter PO number' />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item name='poDate' label='PO Date (TBD)'>
                        <DatePicker
                          style={{ width: "100%" }}
                          placeholder='Optional'
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Divider />
                  <Title level={5}>Basic Information</Title>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name='customerId'
                        label='Customer'
                        rules={[{ required: true }]}
                      >
                        <Select
                          showSearch
                          optionFilterProp='label'
                          placeholder='Select customer'
                          options={customers.map((c) => ({
                            value: c._id,
                            label: `${c.customerName}${c.isBlocked ? " (BLOCKED)" : ""}`,
                            disabled:
                              c.isBlocked && !c.isPremium && !c.premiumCustomer,
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item name='inwardDate' label='Inward Date'>
                        <DatePicker style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item name='inwardTime' label='Inward Time'>
                        <Input placeholder='HH:MM' />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item
                        name='isExpress'
                        label='Urgent / Express'
                        valuePropName='checked'
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item
                        name='noBill'
                        label='No Bill'
                        valuePropName='checked'
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item name='receiptMode' label='Receipt Mode'>
                        <Select
                          options={[
                            { value: "byHand", label: "By Hand" },
                            { value: "byCourier", label: "By Courier" },
                            { value: "byCustomer", label: "By Customer" },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item name='allottedTo' label='Allotted To'>
                        <Select
                          allowClear
                          options={users.map((u) => ({
                            value: u._id,
                            label: u.userName,
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={5}>
                      <Form.Item
                        name='referenceNo'
                        label='Challan / Reference No'
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={5}>
                      <Form.Item name='referenceDate' label='Reference Date'>
                        <DatePicker style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={5}>
                      <Form.Item name='poNo' label='PO No'>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={7}>
                      <Form.Item name='reportIssuedTo' label='Report Issued To person'>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={5}>
                      <Form.Item name='whatsappNumber' label='WhatsApp Number'>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={5}>
                      <Form.Item name='gstNumber' label='GST Number'>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={5}>
                      <Form.Item name='vendorCode' label='Vendor Code'>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={7}>
                      <Form.Item name='emailId' label='Witness Email ID'>
                        <Input />
                      </Form.Item>
                    </Col>
                    <br />
                    <Col xs={10} md={4}>
                      <Form.Item
                        name='contactNo'
                        label='Contact Number'
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={10}>
                      <Form.Item
                        name='contactPerson'
                        label='Contact Person name'
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name='customerRemarks'
                        label='Customer Remarks'
                      >
                        <Input.TextArea rows={2} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              ),
            },
            {
              key: "samples",
              label: "Sample Info",
              children: (
                <>
                  <Table
                    dataSource={samples.map((s, i) => ({ ...s, key: i }))}
                    columns={sampleColumns}
                    pagination={false}
                    size='small'
                    style={{ marginBottom: 12 }}
                  />
                  <Button
                    type='dashed'
                    icon={<PlusOutlined />}
                    onClick={addSampleLine}
                    block
                  >
                    Add Sample Line
                  </Button>
                </>
              ),
            },
            {
              key: "details",
              label: "Other Details",
              children: (
                <>
                  <Title level={5}>Other Details</Title>
                  {additionalDetails.map((d, i) => (
                    <Row gutter={8} key={i} style={{ marginBottom: 8 }}>
                      <Col span={10}>
                        <Input
                          placeholder='Description'
                          value={d.description}
                          onChange={(e) => {
                            const n = [...additionalDetails];
                            n[i].description = e.target.value;
                            setAdditionalDetails(n);
                          }}
                        />
                      </Col>
                      <Col span={10}>
                        <Input
                          placeholder='Value'
                          value={d.value}
                          onChange={(e) => {
                            const n = [...additionalDetails];
                            n[i].value = e.target.value;
                            setAdditionalDetails(n);
                          }}
                        />
                      </Col>
                      <Col span={4}>
                        <Button
                          danger
                          onClick={() =>
                            setAdditionalDetails(
                              additionalDetails.filter((_, j) => j !== i),
                            )
                          }
                        >
                          Remove
                        </Button>
                      </Col>
                    </Row>
                  ))}
                  <Button
                    type='dashed'
                    onClick={() =>
                      setAdditionalDetails([
                        ...additionalDetails,
                        { description: "", value: "" },
                      ])
                    }
                  >
                    Add Detail Row
                  </Button>
                  <Divider />
                  <Title level={5}>Deviation (Simple Checklist)</Title>
                  <Form.Item
                    name={["deviation", "damage"]}
                    valuePropName='checked'
                  >
                    <Checkbox>Damage</Checkbox>
                  </Form.Item>
                  <Form.Item
                    name={["deviation", "sizeNotMentioned"]}
                    valuePropName='checked'
                  >
                    <Checkbox>Size Not Mentioned</Checkbox>
                  </Form.Item>
                  <Form.Item
                    name={["deviation", "quantityInsufficient"]}
                    valuePropName='checked'
                  >
                    <Checkbox>Quantity Insufficient</Checkbox>
                  </Form.Item>
                  <Form.Item
                    name={["deviation", "improperStamp"]}
                    valuePropName='checked'
                  >
                    <Checkbox>Improper Stamp</Checkbox>
                  </Form.Item>
                  <Form.Item
                    name={["deviation", "testDetailNotProvided"]}
                    valuePropName='checked'
                  >
                    <Checkbox>Test Detail Not Provided</Checkbox>
                  </Form.Item>
                </>
              ),
            },
            {
              key: "deviationChecklist",
              label: "Deviation Checklist",
              children: (
                <>
                  <Table
                    dataSource={deviationChecklist.map((d, i) => ({
                      ...d,
                      key: i,
                    }))}
                    columns={[
                      {
                        title: "Deviation Item / Description",
                        key: "description",
                        render: (_, __, i) => (
                          <Input
                            placeholder='Enter deviation item'
                            value={deviationChecklist[i].description}
                            onChange={(e) => {
                              const next = [...deviationChecklist];
                              next[i].description = e.target.value;
                              setDeviationChecklist(next);
                            }}
                          />
                        ),
                      },
                      {
                        title: "Status",
                        key: "status",
                        width: 120,
                        render: (_, __, i) => (
                          <Select
                            value={deviationChecklist[i].status || "OK"}
                            onChange={(value) => {
                              const next = [...deviationChecklist];
                              next[i].status = value;
                              setDeviationChecklist(next);
                            }}
                            options={[
                              { value: "OK", label: "OK" },
                              { value: "Deviation", label: "Deviation" },
                              { value: "N/A", label: "N/A" },
                            ]}
                          />
                        ),
                      },
                      {
                        title: "Remarks",
                        key: "remarks",
                        render: (_, __, i) => (
                          <Input
                            placeholder='Remarks'
                            value={deviationChecklist[i].remarks}
                            onChange={(e) => {
                              const next = [...deviationChecklist];
                              next[i].remarks = e.target.value;
                              setDeviationChecklist(next);
                            }}
                          />
                        ),
                      },
                      {
                        title: "",
                        key: "del",
                        width: 50,
                        render: (_, __, i) =>
                          deviationChecklist.length > 0 ? (
                            <Button
                              type='text'
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() =>
                                setDeviationChecklist(
                                  deviationChecklist.filter((_, j) => j !== i),
                                )
                              }
                            />
                          ) : null,
                      },
                    ]}
                    pagination={false}
                    size='small'
                    style={{ marginBottom: 12 }}
                  />
                  <Button
                    type='dashed'
                    icon={<PlusOutlined />}
                    onClick={() =>
                      setDeviationChecklist([
                        ...deviationChecklist,
                        { description: "", status: "OK", remarks: "" },
                      ])
                    }
                    block
                  >
                    Add Row
                  </Button>
                </>
              ),
            },
            {
              key: "payment",
              label: "Payment",
              children: (
                <Row gutter={16}>
                  <Col xs={24} md={6}>
                    <Form.Item name='totalAmount' label='Total Amount'>
                      <InputNumber style={{ width: "100%" }} min={0} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item name='discountPercent' label='Discount %'>
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        max={100}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item name='gstPercent' label='GST %'>
                      <InputNumber style={{ width: "100%" }} min={0} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item name='amountPaid' label='Amount Paid'>
                      <InputNumber style={{ width: "100%" }} min={0} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name='paymentMode' label='Payment Mode'>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name='isReturnable'
                      label='Returnable'
                      valuePropName='checked'
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name='isWitnessRequired'
                      label='Witness Required'
                      valuePropName='checked'
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
              ),
            },
          ]}
        />

        <Divider />
        <Space>
          <Button
            type='primary'
            htmlType='submit'
            loading={saving}
            size='large'
          >
            Save Sample Inward
          </Button>
          <Button onClick={() => navigate("/samples")}>Cancel</Button>
        </Space>
      </Form>
    </Card>
  );
};

export default SampleFormPage;
