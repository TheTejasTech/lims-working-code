import { useState } from "react";
import { Form, Input, Select, Button, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

const { Title } = Typography;
const TEST_TYPES = ["mechanical", "chemical", "visual", "calibration"];

const TestFormPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const saveTest = async (values) => {
    setLoading(true);
    try {
      await api.post("/tests", values);
      message.success("Saved");
      navigate("/tests");
    } catch (e) {
      message.error(e.response?.data?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={4}>Create Test</Title>
      <Form
        form={form}
        layout='vertical'
        onFinish={saveTest}
        initialValues={{
          testType: "mechanical",
          isActive: true,
          accreditationScope: true,
        }}
      >
        <Form.Item
          name='testCode'
          label='Test Code (sysCode)'
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name='testName'
          label='Test Name'
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name='testCaption' label='Caption'>
          <Input />
        </Form.Item>
        <Form.Item name='testType' label='Type'>
          <Select options={TEST_TYPES.map((t) => ({ value: t, label: t }))} />
        </Form.Item>
        <Form.Item name='department' label='Department'>
          <Input />
        </Form.Item>
        <Form.Item name='defaultMethod' label='Default Method'>
          <Input />
        </Form.Item>
        <Button type='primary' htmlType='submit' block loading={loading}>
          Save
        </Button>
      </Form>
    </div>
  );
};

export default TestFormPage;
