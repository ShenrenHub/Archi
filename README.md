# 农业温室大棚“环境 + 视觉”双模态智能管控平台

基于 `React + Vite + TypeScript` 构建的智慧农业中后台前端项目，面向农户、农业专家和管理员，融合环境监测、设备控制、AI 视觉识别与农事问答能力。

## 技术栈

- React 19
- Vite 7
- TypeScript 5
- Ant Design 5
- Tailwind CSS 3
- Zustand
- React Router 7
- Axios
- ECharts
- React Markdown

## 项目特性

- 满屏沉浸式后台布局，侧边栏固定，占满视口高度
- 明暗主题切换
- 基于角色的 RBAC 页面访问控制
- Axios 统一请求封装与错误提示
- 环境监测、设备控制、AI 视觉识别、专家复核、农事问答
- 已按接口文档整理前端 API 请求层，可直接对接真实后端

## 目录结构

```text
src
├─ api                # 按业务模块划分的接口定义
├─ assets             # 静态资源
├─ components         # 全局复用组件
├─ hooks              # 逻辑复用 Hook
├─ layout             # 系统布局
├─ mock               # 历史 Mock 数据（默认不再自动启用）
├─ router             # 路由与 RBAC
├─ store              # Zustand 状态管理
├─ types              # 通用类型定义
├─ utils              # 工具函数
└─ views              # 业务页面
```

## 页面说明

- `Dashboard`：展示温湿度、光照、设备在线率与 7 天趋势
- `设备控制中心`：补光灯、通风电机、目标温度控制
- `联动策略管理`：规则表单、任务列表、执行日志
- `视觉监测告警`：实时画面、异常告警与专家复核流转入口
- `图片健康检测`：叶片图片上传分析、病害识别结果与处置建议
- `农事问答智能体`：Markdown 渲染的对话式问答窗口
- `系统设备管理`：设备绑定解绑与系统告警日志

## API 对接说明

前端默认请求：

- `VITE_API_BASE_URL || /api`
- `VITE_SMARTJAVAAI_BASE_URL || /smartjavaai`

可在本地 `.env` 中配置，例如：

```bash
VITE_API_BASE_URL=https://argri.syan.wang/
VITE_SMARTJAVAAI_BASE_URL=http://localhost:8081/smartjavaai
```

API 契约文档见：

- `API接口文档.md`

## 开发启动

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

构建生产包：

```bash
npm run build
```

预览构建结果：

```bash
npm run preview
```

## 关键文件

- `src/api/request.ts`：Axios 实例、统一鉴权头、统一响应处理
- `src/api/vision.ts`：视觉分析、告警、专家复核、视频流信息请求
- `src/layout/AppLayout.tsx`：主布局、角色切换、移动端抽屉导航
- `src/views/vision/index.tsx`：视觉监测告警页实现
- `src/views/vision-analysis/index.tsx`：图片健康检测页实现
- `src/components/vision/CameraPlayer.tsx`：读取视频流接口信息
- `src/main.tsx`：应用入口，默认不再注册本地 Mock

## 后续建议

- 后端补齐 `/api/vision/streams/:greenhouseId` 实际视频流地址返回
- 将视觉上传切换为真实文件上传和推理任务轮询
- 接入真实 MQTT WebSocket 通道与设备回执
- 补充单元测试与端到端测试
