# CF-Server-Monitor Grafana Industrial Theme

> 专为 [CF-Server-Monitor](https://github.com/huilang-me/CF-Server-Monitor/) 打造的高精度 Grafana 工业级深色监控仪表盘主题。

![Theme Preview](./image.png)

## 🌟 特性亮点

- 🎛️ **1:1 复刻 Grafana 工业暗黑风格**：深炭黑底色（`#111217` / `#181b1f`）、微细边框、荧光科技色调（绿、蓝、黄、橙、红、紫）。
- 📊 **丰富的 Grafana 核心面板组件**：
  - **Donut 环形图**：内存、磁盘容量比例与多色动态图例。
  - **Big Stat 大字看板**：Uptime 运行时间（`6 d 13:12:27`）、时钟频率、核心电压，带发光霓虹特效。
  - **Time Series 时序折线/面积图**：支持透明渐变发光填充、多曲线叠加、正负轴对称镜像吞吐图（Bandwidth & Disk Usage）。
  - **Bar Gauge 进度条**：支持横向（CPU 频率）与纵向（分区容量水位柱）。
  - **Multi-stat 核心分布卡片**：每核负载独立监控。
- ⚡ **无缝契合官方第三方主题开发规范**：
  - 产物严格输出为标准的 `index.html` 与 `assets/` 静态目录，无冗余多余文件。
  - 严格支持 Hash 路由：首页 `/#/`、详情页 `/#/server/:id`。
  - 管理后台入口链接规范跳转至 `/admin#admin`。
  - 底部规范输出 `Powered by CF-Server-Monitor [v版本]`。
- 🔄 **完善的网络与实时推送支持**：
  - 支持多源站 `<meta name="apiBase" content="...">` 注入与并发合并。
  - 列表页与详情页分别采用精细化的 WebSocket 订阅策略（`subscribe=all` 带 ids 过滤；详情页 `subscribe=<id>`）。
  - 监听 `document.visibilitychange`：页面切到后台自动断开以节省 Cloudflare Worker 额度，切回前台自动恢复并同步数据。
  - 遵循后台 `frontend_ws_timeout_minutes` 闲置断连控制并提供继续连接交互。
  - 内置 **Demo Preview 离线预览模式**：在无后端或本地直开时自动生成高保真实时数据，方便展示与设计验证。

---

## 🛠️ 本地开发与构建

### 1. 安装依赖
```bash
npm install
```

### 2. 本地开发调试
```bash
npm run dev
```
打开 `http://localhost:5173` 即可预览仪表盘。

### 3. 生产打包
```bash
npm run build
```
打包生成 `dist/` 目录：
```text
dist/
├── index.html
└── assets/
    ├── index-xxx.css
    └── index-xxx.js
```

---

## 🚀 部署与使用指南

### 方式一：部署到 Cloudflare Worker 同域
将 `dist/` 内的 `index.html` 与 `assets/` 目录文件作为 Worker 静态资源托管，无需额外配置，前端会自动使用 `window.location.origin` 作为后端。

### 方式二：纯静态托管（GitHub Pages、Vercel 等）
在 `index.html` 的 `<head>` 中添加 `meta` 标签指定后端 Worker 地址：
```html
<meta name="apiBase" content="https://monitor.yourdomain.com">
```
> **注意**：跨域部署时，请在源站 Cloudflare Worker 的环境变量中配置 `CORS_ALLOWED_ORIGINS`，添加您的静态站点域名（如 `https://yourname.github.io`），否则浏览器会拦截 API 与 WebSocket。

---

## 📂 提交至 CFSM 主题商店
本主题产物完全符合 [huilang-me/CFSM-Theme-Store](https://github.com/huilang-me/CFSM-Theme-Store) 规范，直接将 `dist/` 中的 `index.html` 和 `assets/` 放入主题商店的对应目录发起 Pull Request 即可。

---

## 📄 License
MIT License
