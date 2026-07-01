# 🎨 LayerBoard

> 一个面向团队的无限缩放在线协作画板 —— 多层堆叠记录 · 3D 立体浏览 · 实时协作同步。

让团队成员可以快速将想法可视化记录，并实时同步给所有成员。

---

## ✨ 核心特性

| 特性 | 说明 |
|------|------|
| 🌌 **无限画布** | 自由缩放（鼠标滚轮，以指针为中心）、拖拽平移，无边界限制 |
| 🗂️ **区域卡片** | 在画布上创建多个区域，可拖拽定位、自命名、归属小组 |
| 📌 **便签** | 彩色便签，可编辑文本、拖拽定位 |
| 📊 **表格** | 画布上直接渲染的可编辑表格，支持增删行列 |
| 🎨 **浮动绘图板** | 独立可拖拽的迷你画板，支持自由绘制 + 调色板 |
| 📁 **多层机制** | 区域内可叠加多层，文件夹 Tab 标签样式，最新层在最上方 |
| 🧊 **3D 立体查看** | Three.js CSS3D 渲染，层叠卡片立体浏览，OrbitControls 旋转 |
| 🛩️ **第一视角导航** | 点击周围区域名称，GSAP 动画平滑飞行过渡 |
| 🔍 **智能搜索** | 顶部搜索栏，下拉筛选（小组/成员/区域名）+ 关键词搜索 |
| 🕐 **时间戳** | 每次添加内容自动在右下角记录半透明时间水印 |
| 🔄 **实时协作** | Yjs CRDT 解决多人冲突 + Socket.IO 光标感知与在线状态 |
| 📴 **离线支持** | y-indexeddb 本地持久化，断网可继续编辑 |

---

## 🏗️ 技术栈

**前端：** React 18 + TypeScript · react-konva · Three.js · Zustand · Ant Design 5 · GSAP · Framer Motion

**后端：** Node.js + Express · MongoDB + Mongoose · Redis · Socket.IO · Yjs WebSocket

**工具链：** Vite · Turborepo · pnpm Workspaces · Docker

---

## 📁 项目结构

```
layerboard/
├── packages/
│   ├── client/                # React 前端 (Vite)
│   │   └── src/
│   │       ├── api/           # API 请求封装
│   │       ├── components/    # 通用组件 (SearchBar 等)
│   │       ├── features/      # 功能模块
│   │       │   ├── auth/      # 登录/注册
│   │       │   ├── dashboard/ # 仪表板
│   │       │   ├── board/     # 画板核心 (无限画布/区域/导航)
│   │       │   ├── area/      # 区域内容 (便签/表格/绘图板)
│   │       │   └── viewer3d/  # 3D 立体查看器
│   │       ├── hooks/         # 自定义 Hooks (画布/相机/Yjs/协作)
│   │       ├── store/         # Zustand 状态管理
│   │       ├── types/         # TypeScript 类型
│   │       └── utils/         # 工具函数与常量
│   └── server/                # Node.js 后端 (Express)
│       └── src/
│           ├── config/        # 数据库/Redis/环境配置
│           ├── models/        # Mongoose 模型 (User/Board)
│           ├── routes/        # REST API 路由
│           ├── controllers/   # 控制器
│           ├── services/      # 业务逻辑层
│           ├── middleware/    # JWT 认证 + 数据校验
│           └── websocket/     # Socket.IO + Yjs WS 服务
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 🚀 快速开始

### 环境要求

- **Node.js** ≥ 20
- **pnpm** ≥ 9（`npm i -g pnpm`）
- **MongoDB** ≥ 7（本地或 Atlas）
- **Redis** ≥ 7（可选，用于在线状态缓存）

### 方式一：本地开发

1. **安装依赖**
   ```bash
   cd layerboard
   pnpm install
   ```

2. **配置环境变量**

   编辑 `packages/server/.env`：
   ```env
   PORT=4000
   MONGODB_URI=mongodb://localhost:27017/layerboard
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-secret-key
   CORS_ORIGIN=http://localhost:3000
   ```

3. **启动 MongoDB 和 Redis**（任选其一）
   ```bash
   # 使用 Docker
   docker run -d -p 27017:27017 --name mongo mongo:7
   docker run -d -p 6379:6379 --name redis redis:7-alpine
   ```

4. **同时启动前后端**（Turborepo 并行）
   ```bash
   pnpm dev
   ```
   或分开启动：
   ```bash
   pnpm dev:server   # 后端 http://localhost:4000
   pnpm dev:client   # 前端 http://localhost:3000
   ```

5. 打开 http://localhost:3000 即可使用 🎉

### 方式二：Docker Compose 一键部署

```bash
# 在项目根目录
docker-compose up -d
```
这将启动 MongoDB、Redis、后端（4000）、前端（3000）四个服务。

---

## 📡 API 概览

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 注册 | ❌ |
| POST | `/api/auth/login` | 登录 | ❌ |
| GET | `/api/health` | 健康检查 | ❌ |
| GET | `/api/boards` | 获取我的画板列表 | ✅ |
| POST | `/api/boards` | 创建画板 | ✅ |
| GET | `/api/boards/:boardId` | 获取画板详情 | ✅ |
| DELETE | `/api/boards/:boardId` | 删除画板 | ✅ |
| POST | `/api/boards/:boardId/groups` | 创建小组 | ✅ |
| POST | `/api/boards/:boardId/areas` | 创建区域 | ✅ |
| PUT | `/api/boards/:boardId/areas/:areaId` | 更新区域 | ✅ |
| POST | `/api/boards/:boardId/areas/:areaId/layers` | 新建层 | ✅ |
| PUT | `/api/boards/:boardId/areas/:areaId/layers/:layerId` | 更新层内容 | ✅ |

WebSocket 端点：
- `ws://host/socket.io` — Socket.IO（光标、在线状态、区域更新广播）
- `ws://host/yjs` — Yjs CRDT 同步

---

## 🎯 使用流程

1. **注册/登录** 账号
2. 在 **Dashboard** 点击「新建画板」
3. 进入画板后，先 **新建小组**（设置标识色）
4. 再 **新建区域**，归属到小组
5. 选中区域后：
   - 点击 **「便签」** 添加便签
   - 点击 **「＋」** 在当前层之上新建层
   - 切换 Tab 查看不同层内容
6. 点击区域周围的 **方向标签** 飞行到其他区域
7. 顶部 **搜索栏** 可按小组/成员/区域名快速定位
8. 点击右上角 **3D** 切换到立体视图浏览所有层

---

## 🧱 数据模型

```
User ─┐
      ├─< Board >──┬─< Group (小组)
      │            │     └─ members[]
      │            └─< Area (区域)
      │                  ├─ position / size
      │                  └─< Layer (层)
      │                        ├─ label (文件夹标签)
      │                        └─ content
      │                              ├─ stickyNotes[]
      │                              ├─ tables[]
      │                              ├─ drawings[]
      │                              └─ timestamps[]
```

---

## 📦 构建

```bash
# 构建所有包
pnpm build

# 仅构建前端（输出到 packages/client/dist）
pnpm build:client

# 仅构建后端（输出到 packages/server/dist）
pnpm build:server
```

---

## 🛠️ 开发阶段

- ✅ Phase 1 — 基础框架（认证、路由、模型）
- ✅ Phase 2 — 核心画板（无限画布、区域、便签、表格、绘图板、时间戳）
- ✅ Phase 3 — 多层 + 3D 立体查看 + 视图切换动画
- ✅ Phase 4 — 实时协作（Yjs CRDT、Socket.IO、第一视角导航、搜索）
- ✅ Phase 5 — 部署配置（Docker）、文档

---

## 📄 License

MIT
