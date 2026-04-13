import { App as AntApp, ConfigProvider, theme } from "antd";
import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "@/router";
import { useThemeStore } from "@/store/theme";

export default function App() {
  const mode = useThemeStore((state) => state.mode);

  return (
    <ConfigProvider
      theme={{
        algorithm: mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          borderRadius: 18,
          colorPrimary: "#12b76a",
          colorInfo: "#1fb6ff",
          fontFamily: "Segoe UI, PingFang SC, Microsoft YaHei, sans-serif"
        }
      }}
    >
      <AntApp>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}
