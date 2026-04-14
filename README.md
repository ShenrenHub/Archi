# 农业温室大棚“环境 + 视觉”双模态智能管控平台

基于 `React + Vite + TypeScript` 构建的智慧农业中后台前端项目，面向农户、农业专家和管理员，融合环境监测、设备控制、AI 视觉识别与 RAG 农事问答能力。

## 技术栈

- React 19
- Vite 7
- TypeScript 5
- Ant Design 5
- Tailwind CSS 3
- Zustand
- React Router 7
- Axios
- Axios Mock Adapter
- ECharts
- React Markdown

## 项目特性

- 满屏沉浸式后台布局，侧边栏固定，占满视口高度
- 明暗主题切换
- 基于角色的 RBAC 页面访问控制
- Axios 统一请求封装与错误提示
- Mock API 驱动页面独立渲染
- ECharts 环境趋势图与农业监控驾驶舱
- 设备 MQTT 控制交互模拟
- AI 视觉上传分析与异常告警处理
- RAG 风格农事问答界面

## 目录结构

```text
src
├─ api                # 按业务模块划分的接口定义
├─ assets             # 静态资源
├─ components         # 全局复用组件
├─ hooks              # 逻辑复用 Hook
├─ layout             # 系统布局
├─ mock               # Mock 数据与接口行为
├─ router             # 路由与 RBAC
├─ store              # Zustand 状态管理
├─ types              # 通用类型定义
├─ utils              # 工具函数
└─ views              # 业务页面
```

## 页面说明

- `Dashboard`：展示温湿度、光照、设备在线率与 7 天趋势
- `设备控制中心`：补光灯、通风电机、目标温度控制，模拟 MQTT 指令回执
- `联动策略管理`：规则表单、任务列表、执行日志
- `视觉监测告警`：视频流占位、异常告警与专家复核流转入口
- `图片健康检测`：叶片图片上传分析、病害识别结果与处置建议
- `农事问答智能体`：Markdown 渲染的对话式问答窗口
- `系统设备管理`：设备绑定解绑与系统告警日志

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

## Mock 说明

- 所有核心页面默认走本地 Mock 数据
- Mock 入口位于 `src/mock/index.ts`
- 应用启动时会在 `src/main.tsx` 中自动注册
- 后续接入真实后端时，可保留类型定义，仅替换 API 地址与实现

## 关键文件

- `src/api/request.ts`：Axios 实例、请求拦截、响应拦截、统一报错
- `src/layout/AppLayout.tsx`：满屏布局、固定侧边栏、顶部导航、角色切换
- `src/views/device-control/index.tsx`：设备控制中心完整实现
- `src/views/vision/index.tsx`：视觉监测告警页实现
- `src/views/vision-analysis/index.tsx`：图片健康检测页实现
- `src/mock/index.ts`：Mock 业务数据与接口行为

## 后续建议

- 接入真实 MQTT WebSocket 通道与设备回执
- 将视觉上传切换为真实文件上传和推理任务轮询
- 引入权限码粒度控制按钮级权限
- 补充单元测试与端到端测试
- 将 Dashboard 大屏拆分为可配置卡片布局
