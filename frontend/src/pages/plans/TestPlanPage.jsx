import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Select,
  message,
  Tag,
  Input,
  Row,
  Col,
  Card,
  Divider,
  Tabs,
} from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import api from "../../utils/api";

const { Title } = Typography;

const TestPlanPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [samples, setSamples] = useState([]);
  const [specs, setSpecs] = useState([]);
  const [groups, setGroups] = useState([]);
  const [generalTests, setGeneralTests] = useState([]);
  const [chemicalTests, setChemicalTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const [p, s, sp, g] = await Promise.all([
        api.get("/plans"),
        api.get("/samples", { params: { status: "inward", limit: 100 } }),
        api.get("/specifications"),
        api.get("/tests/groups/list"),
      ]);
      setPlans(p.data.data || []);
      setSamples(s.data.data || []);
      setSpecs(sp.data.data || []);
      setGroups(g.data.data || []);
    } catch {
      message.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSpecChange = async (specId) => {
    if (!specId) {
      setGeneralTests([]);
      setChemicalTests([]);
      return;
    }

    const { data } = await api.get(`/specifications/${specId}`);
    const spec = data.data;
    const tests = spec?.testList || [];
    setGeneralTests(
      tests
        .filter((t) => t.testType !== "chemical")
        .map((t) => ({
          testPiece: t.testPiece || "",
          testName: t.testName || "",
          testCaption: t.testCaption || "",
          testMethod: t.testMethod || "",
          otherInstruction: t.otherInstruction || "",
          quantity: Number(t.quantity) || 1,
          pageBreak: false,
          isCancelled: false,
        })),
    );
    setChemicalTests(
      tests
        .filter((t) => t.testType === "chemical")
        .map((t) => ({
          testPiece: t.testPiece || "",
          chemicalGroup: t.testName || "",
          testMethodName: t.testMethod || "",
          isSpectroAnalysis: Boolean(t.isSpectroAnalysis),
          isWetAnalysis: Boolean(t.isWetAnalysis),
          pageBreak: false,
          isCancelled: false,
          elements: [
            {
              name: t.testName || "",
              minValue: Number(t.minValue) || 0,
              maxValue: Number(t.maxValue) || 0,
            },
          ],
        })),
    );
    message.info(`${tests.length} tests loaded from specification`);
  };

  const onGroupChange = async (groupId) => {
    if (!groupId) {
      setGeneralTests([]);
      return;
    }

    const { data } = await api.get(`/tests/groups/${groupId}`);
    const group = data.data;
    setGeneralTests(
      (group.tests || []).map((t) => ({
        testPiece: "",
        testName: t.test?.testName || "",
        testCaption: t.caption || t.test?.testCaption || "",
        testMethod: t.method || t.test?.defaultMethod || "",
        otherInstruction: "",
        quantity: 1,
        pageBreak: false,
        isCancelled: false,
      })),
    );
  };

  const save = async (values) => {
    try {
      const sample = samples.find((s) => s._id === values.sinId);
      const labNo = values.labNo || sample?.samples?.[0]?.labNo;
      await api.post("/plans", {
        ...values,
        labNo,
        planStatus: values.planStatus || "planned",
        generalTests,
        chemicalTests,
      });
      message.success("Test plan saved");
      setOpen(false);
      load();
    } catch (e) {
      message.error(e.response?.data?.message || "Save failed");
    }
  };

  const columns = [
    { title: "SIN", key: "sin", render: (_, r) => r.sinId?.sinNo || "—" },
    { title: "Lab No", dataIndex: "labNo" },
    {
      title: "Specification",
      key: "spec",
      render: (_, r) => r.testSpecification?.specCode || "—",
    },
    {
      title: "Status",
      dataIndex: "planStatus",
      render: (s) => (
        <Tag color={s === "planned" ? "green" : "default"}>{s}</Tag>
      ),
    },
    {
      title: "Tests",
      key: "t",
      render: (_, r) =>
        (r.generalTests || []).length + (r.chemicalTests || []).length,
    },
  ];

  return (
    <div>
      <Space
        style={{
          marginBottom: 16,
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Test Plan
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load} />
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              setGeneralTests([]);
              setChemicalTests([]);
              setOpen(true);
            }}
          >
            Create Plan
          </Button>
        </Space>
      </Space>
      <Table
        rowKey='_id'
        columns={columns}
        dataSource={plans}
        loading={loading}
        pagination={{ pageSize: 15 }}
      />

      <Modal
        title='Create Test Plan'
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={560}
      >
        <Form
          form={form}
          layout='vertical'
          onFinish={save}
          initialValues={{ planStatus: "planned" }}
        >
          <Form.Item
            name='sinId'
            label='Sample (SIN)'
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              optionFilterProp='label'
              options={samples.map((s) => ({
                value: s._id,
                label: `${s.sinNo} — ${s.customerId?.customerName || ""}`,
              }))}
            />
          </Form.Item>
          <Form.Item name='labNo' label='Lab No (optional — uses first line)'>
            <Input placeholder='LAB/2026/00001' />
          </Form.Item>
          <Form.Item
            name='testSpecification'
            label='Specification (auto-populates tests)'
          >
            <Select
              allowClear
              showSearch
              optionFilterProp='label'
              onChange={onSpecChange}
              options={specs.map((s) => ({
                value: s._id,
                label: `${s.specCode} — ${s.specCaption}`,
              }))}
            />
          </Form.Item>
          <Form.Item name='testGroup' label='Or Test Group'>
            <Select
              allowClear
              onChange={onGroupChange}
              options={groups.map((g) => ({
                value: g._id,
                label: g.groupName,
              }))}
            />
          </Form.Item>
          <Form.Item name='testSpecification2' label='Specification 2'>
            <Select
              allowClear
              showSearch
              optionFilterProp='label'
              options={specs.map((s) => ({
                value: s._id,
                label: `${s.specCode} — ${s.specCaption}`,
              }))}
            />
          </Form.Item>
          <Form.Item name='base' label='Base'>
            <Input />
          </Form.Item>
          <Form.Item name='base2' label='Base 2'>
            <Input />
          </Form.Item>
          <Form.Item name='sampleCondition' label='Sample Condition'>
            <Input />
          </Form.Item>
          <Form.Item name='sampleNature' label='Sample Nature'>
            <Input />
          </Form.Item>
          <Form.Item name='reportPrefix' label='Report Prefix'>
            <Input />
          </Form.Item>
          <Form.Item name='officeInstruction' label='Office Instruction'>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Tabs
            items={[
              {
                key: "general",
                label: "General Test",
                children: (
                  <>
                    {generalTests.map((test, i) => (
                      <Row gutter={8} key={i} style={{ marginBottom: 12 }}>
                        <Col xs={24} md={3}>
                          <Input
                            placeholder='Sr No'
                            value={test.testPiece}
                            onChange={(e) => {
                              const next = [...generalTests];
                              next[i].testPiece = e.target.value;
                              setGeneralTests(next);
                            }}
                          />
                        </Col>
                        <Col xs={24} md={4}>
                          <Input
                            placeholder='Test Name'
                            value={test.testName}
                            onChange={(e) => {
                              const next = [...generalTests];
                              next[i].testName = e.target.value;
                              setGeneralTests(next);
                            }}
                          />
                        </Col>
                        <Col xs={24} md={4}>
                          <Input
                            placeholder='Test Caption'
                            value={test.testCaption}
                            onChange={(e) => {
                              const next = [...generalTests];
                              next[i].testCaption = e.target.value;
                              setGeneralTests(next);
                            }}
                          />
                        </Col>
                        <Col xs={24} md={4}>
                          <Input
                            placeholder='Test Method'
                            value={test.testMethod}
                            onChange={(e) => {
                              const next = [...generalTests];
                              next[i].testMethod = e.target.value;
                              setGeneralTests(next);
                            }}
                          />
                        </Col>
                        <Col xs={24} md={4}>
                          <Input
                            placeholder='Other Instruction'
                            value={test.otherInstruction}
                            onChange={(e) => {
                              const next = [...generalTests];
                              next[i].otherInstruction = e.target.value;
                              setGeneralTests(next);
                            }}
                          />
                        </Col>
                        <Col xs={24} md={2}>
                          <Input
                            placeholder='Qty'
                            type='number'
                            value={test.quantity}
                            onChange={(e) => {
                              const next = [...generalTests];
                              next[i].quantity = Number(e.target.value);
                              setGeneralTests(next);
                            }}
                          />
                        </Col>
                        <Col xs={12} md={2}>
                          <Select
                            value={test.pageBreak ? "yes" : "no"}
                            onChange={(value) => {
                              const next = [...generalTests];
                              next[i].pageBreak = value === "yes";
                              setGeneralTests(next);
                            }}
                            options={[
                              { value: "no", label: "No" },
                              { value: "yes", label: "Page Break" },
                            ]}
                          />
                        </Col>
                        <Col xs={12} md={1}>
                          <Select
                            value={test.isCancelled ? "yes" : "no"}
                            onChange={(value) => {
                              const next = [...generalTests];
                              next[i].isCancelled = value === "yes";
                              setGeneralTests(next);
                            }}
                            options={[
                              { value: "no", label: "Active" },
                              { value: "yes", label: "Cancel" },
                            ]}
                          />
                        </Col>
                        <Col xs={24} md={2}>
                          <Button
                            danger
                            type='text'
                            onClick={() =>
                              setGeneralTests(
                                generalTests.filter((_, idx) => idx !== i),
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
                      icon={<PlusOutlined />}
                      block
                      onClick={() =>
                        setGeneralTests([
                          ...generalTests,
                          {
                            testPiece: "",
                            testName: "",
                            testCaption: "",
                            testMethod: "",
                            otherInstruction: "",
                            quantity: 1,
                            pageBreak: false,
                            isCancelled: false,
                          },
                        ])
                      }
                    >
                      Add General Test
                    </Button>
                  </>
                ),
              },
              {
                key: "chemical",
                label: "Chemical Test",
                children: (
                  <>
                    {chemicalTests.map((test, i) => (
                      <Card size='small' style={{ marginBottom: 12 }} key={i}>
                        <Row gutter={8} align='middle'>
                          <Col xs={24} md={4}>
                            <Input
                              placeholder='Test Piece'
                              value={test.testPiece}
                              onChange={(e) => {
                                const next = [...chemicalTests];
                                next[i].testPiece = e.target.value;
                                setChemicalTests(next);
                              }}
                            />
                          </Col>
                          <Col xs={24} md={5}>
                            <Input
                              placeholder='Chemical Group'
                              value={test.chemicalGroup}
                              onChange={(e) => {
                                const next = [...chemicalTests];
                                next[i].chemicalGroup = e.target.value;
                                setChemicalTests(next);
                              }}
                            />
                          </Col>
                          <Col xs={24} md={5}>
                            <Input
                              placeholder='Test Method Name'
                              value={test.testMethodName}
                              onChange={(e) => {
                                const next = [...chemicalTests];
                                next[i].testMethodName = e.target.value;
                                setChemicalTests(next);
                              }}
                            />
                          </Col>
                          <Col xs={12} md={3}>
                            <Select
                              value={
                                test.isSpectroAnalysis
                                  ? "spectro"
                                  : test.isWetAnalysis
                                    ? "wet"
                                    : "none"
                              }
                              onChange={(value) => {
                                const next = [...chemicalTests];
                                next[i].isSpectroAnalysis = value === "spectro";
                                next[i].isWetAnalysis = value === "wet";
                                setChemicalTests(next);
                              }}
                              options={[
                                { value: "none", label: "None" },
                                { value: "spectro", label: "Spectro" },
                                { value: "wet", label: "Wet" },
                              ]}
                            />
                          </Col>
                          <Col xs={12} md={3}>
                            <Select
                              value={test.pageBreak ? "yes" : "no"}
                              onChange={(value) => {
                                const next = [...chemicalTests];
                                next[i].pageBreak = value === "yes";
                                setChemicalTests(next);
                              }}
                              options={[
                                { value: "no", label: "No" },
                                { value: "yes", label: "Page Break" },
                              ]}
                            />
                          </Col>
                          <Col xs={24} md={2}>
                            <Select
                              value={test.isCancelled ? "yes" : "no"}
                              onChange={(value) => {
                                const next = [...chemicalTests];
                                next[i].isCancelled = value === "yes";
                                setChemicalTests(next);
                              }}
                              options={[
                                { value: "no", label: "Active" },
                                { value: "yes", label: "Cancel" },
                              ]}
                            />
                          </Col>
                          <Col xs={24} md={2}>
                            <Button
                              danger
                              type='text'
                              onClick={() =>
                                setChemicalTests(
                                  chemicalTests.filter((_, idx) => idx !== i),
                                )
                              }
                            >
                              Remove
                            </Button>
                          </Col>
                        </Row>
                        <Divider style={{ margin: "16px 0" }} />
                        <Title level={5}>Elements</Title>
                        {test.elements?.map((element, j) => (
                          <Row gutter={8} key={j} style={{ marginBottom: 8 }}>
                            <Col xs={24} md={8}>
                              <Input
                                placeholder='Chemical Element'
                                value={element.name}
                                onChange={(e) => {
                                  const next = [...chemicalTests];
                                  next[i].elements[j].name = e.target.value;
                                  setChemicalTests(next);
                                }}
                              />
                            </Col>
                            <Col xs={24} md={8}>
                              <Input
                                placeholder='Minimum Value'
                                type='number'
                                value={element.minValue}
                                onChange={(e) => {
                                  const next = [...chemicalTests];
                                  next[i].elements[j].minValue = Number(
                                    e.target.value,
                                  );
                                  setChemicalTests(next);
                                }}
                              />
                            </Col>
                            <Col xs={24} md={8}>
                              <Input
                                placeholder='Maximum Value'
                                type='number'
                                value={element.maxValue}
                                onChange={(e) => {
                                  const next = [...chemicalTests];
                                  next[i].elements[j].maxValue = Number(
                                    e.target.value,
                                  );
                                  setChemicalTests(next);
                                }}
                              />
                            </Col>
                          </Row>
                        ))}
                        <Button
                          type='dashed'
                          icon={<PlusOutlined />}
                          onClick={() => {
                            const next = [...chemicalTests];
                            next[i].elements = next[i].elements || [];
                            next[i].elements.push({
                              name: "",
                              minValue: 0,
                              maxValue: 0,
                            });
                            setChemicalTests(next);
                          }}
                        >
                          Add Element
                        </Button>
                      </Card>
                    ))}
                    <Button
                      type='dashed'
                      icon={<PlusOutlined />}
                      block
                      onClick={() =>
                        setChemicalTests([
                          ...chemicalTests,
                          {
                            testPiece: "",
                            chemicalGroup: "",
                            testMethodName: "",
                            isSpectroAnalysis: false,
                            isWetAnalysis: false,
                            pageBreak: false,
                            isCancelled: false,
                            elements: [{ name: "", minValue: 0, maxValue: 0 }],
                          },
                        ])
                      }
                    >
                      Add Chemical Test
                    </Button>
                  </>
                ),
              },
            ]}
          />
          <Form.Item name='planStatus' label='Status'>
            <Select
              options={[
                { value: "draft", label: "Draft" },
                { value: "planned", label: "Planned (finalize)" },
              ]}
            />
          </Form.Item>
          <Button type='primary' htmlType='submit' block>
            Save Plan
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default TestPlanPage;
