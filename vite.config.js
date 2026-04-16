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
            "/api": {
                target: "http://127.0.0.1:8080",
                changeOrigin: true
            },
            "/ws": {
                target: "http://127.0.0.1:8080",
                changeOrigin: true,
                ws: true
            }
        }
    }
});
