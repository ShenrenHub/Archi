import { useState } from "react";
import { Button, Card, Form, Input, Space, Typography } from "antd";
import { Navigate, useNavigate } from "react-router-dom";
import { login, fetchCurrentUser } from "@/api/auth";
import { fetchMyFarms } from "@/api/farm";
import { useUserStore } from "@/store/user";

interface LoginFormValues {
  username: string;
  password: string;
}

const demoAccounts = [
  { username: "farmadmin", password: "admin123", label: "农场管理员" },
  { username: "expert", password: "expert123", label: "专家" },
  { username: "sysadmin", password: "sysadmin123", label: "系统管理员" }
];

export default function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const setSession = useUserStore((state) => state.setSession);
  const setProfile = useUserStore((state) => state.setProfile);
  const setFarms = useUserStore((state) => state.setFarms);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<LoginFormValues>();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const auth = await login(values);
      setSession(auth);
      const [profile, farms] = await Promise.all([fetchCurrentUser(), fetchMyFarms().catch(() => [])]);
      setProfile(profile);
      setFarms(farms);
      navigate("/", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(18,183,106,0.18),_transparent_32%),linear-gradient(180deg,#f8fffb_0%,#eef7f1_100%)] p-4 dark:bg-[linear-gradient(180deg,#07130d_0%,#0f172a_100%)]">
      <Card className="w-full max-w-[520px] rounded-[28px] shadow-panel">
        <Typography.Text className="!text-emerald-600">Argri Frontend API</Typography.Text>
        <Typography.Title level={2} className="!mb-2 !mt-3">登录到智慧温室前端</Typography.Title>
        <Typography.Paragraph type="secondary">
          登录后会自动注入 JWT，并按当前账号的农场与角色加载可访问接口。
        </Typography.Paragraph>

        <Form form={form} layout="vertical" onFinish={(values) => void handleLogin(values)} initialValues={demoAccounts[0]}>
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: "请输入用户名" }]}>
            <Input placeholder="farmadmin" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: "请输入密码" }]}>
            <Input.Password placeholder="admin123" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            登录并加载上下文
          </Button>
        </Form>

        <Space wrap className="mt-4">
          {demoAccounts.map((account) => (
            <Button
              key={account.username}
              onClick={() => form.setFieldsValue(account)}
            >
              {account.label}
            </Button>
          ))}
        </Space>
      </Card>
    </div>
  );
}
