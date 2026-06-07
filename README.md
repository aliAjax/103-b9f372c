# DreamScope - 梦境记录与分析应用

一款专注于梦境记录、标签管理和数据可视化的个人梦境日记应用。

## 项目简介

DreamScope 帮助用户记录、分析和探索自己的梦境世界。通过直观的界面和强大的数据分析功能，用户可以：

- 记录梦境内容、情绪、清晰度等信息
- 为梦境添加人物、地点、关键词标签
- 通过时间线、日历、关系网络等多种可视化方式探索梦境
- 管理和重命名标签
- 搜索和筛选梦境记录
- 备份和恢复数据
- 导入/导出梦境数据

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite 6
- **路由**: React Router v7
- **状态管理**: Zustand
- **样式**: TailwindCSS
- **数据可视化**: D3.js + ECharts
- **测试**: Vitest + jsdom
- **代码规范**: ESLint + TypeScript ESLint
- **持久化**: LocalStorage

## 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 查看应用。

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

### 预览生产构建

```bash
npm run preview
```

## 质量检查

项目提供了完整的本地质量门禁流程：

### 类型检查

```bash
npm run typecheck
```

### 代码规范检查

```bash
npm run lint
```

### 运行测试

```bash
npm test
```

监听模式：

```bash
npm run test:watch
```

### 完整质量门禁

一键运行所有检查（类型检查 + 代码规范 + 单元测试 + 构建）：

```bash
npm run quality
```

## 项目结构

```
src/
├── components/     # 可复用组件
├── pages/          # 页面组件
├── store/          # Zustand 状态管理
├── test/           # 测试配置
├── types/          # TypeScript 类型定义
├── utils/          # 工具函数
├── App.tsx         # 应用入口组件
├── main.tsx        # 应用挂载入口
└── index.css       # 全局样式
```

## 路径别名

项目配置了 `@` 别名指向 `src` 目录，可直接使用：

```typescript
import { useDreamStore } from '@/store/dreamStore'
import type { Dream } from '@/types/dream'
```

## 数据持久化

应用数据自动保存到浏览器 LocalStorage 中，包括：

- 梦境记录 (`dreamscope_dreams`)
- 备份数据 (`dreamscope_backups`)
- 搜索视图 (`dreamscope_search_views`)

## 开发说明

### 测试环境

测试使用 jsdom 模拟浏览器环境，已预置：

- LocalStorage Mock
- crypto.randomUUID Mock
- 每个测试用例自动重置状态

### 可视化组件

- 关系网络图：使用 D3.js 力导向图
- 统计图表：使用 ECharts
- 时间线/日历：自定义 React 组件
