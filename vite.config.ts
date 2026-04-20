import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  server: {
    host: "0.0.0.0",
    port: 6001,
    allowedHosts: ["localhost", "archi.syan.wang"],
    proxy: {
      "/api/crop-diagnosis": {
        target: "http://localhost:6101",
        changeOrigin: true
      },
      "/api": {
        target: "https://argri.syan.wang",
        changeOrigin: true
      },
      "/ws": {
        target: "https://argri.syan.wang/",
        changeOrigin: true,
        ws: true
      }
    }
  }
});
