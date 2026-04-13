import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#effef5",
          100: "#d8fbe6",
          500: "#12b76a",
          600: "#0e9f5b",
          700: "#0b7f49"
        },
        accent: {
          500: "#1fb6ff",
          600: "#0d8bd8"
        },
        harvest: {
          500: "#f59e0b",
          600: "#d97706"
        },
        soil: {
          900: "#1b2a23"
        }
      },
      boxShadow: {
        glow: "0 20px 60px rgba(18, 183, 106, 0.16)",
        panel: "0 20px 40px rgba(15, 23, 42, 0.08)"
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)"
      },
      fontFamily: {
        sans: ["Segoe UI", "PingFang SC", "Microsoft YaHei", "sans-serif"]
      }
    }
  },
  plugins: []
} satisfies Config;
