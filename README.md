<div align="center">
  <img src="src-tauri/icons/128x128@2x.png" alt="SmartDo Logo" width="128" height="128" />
  
  # ✨ SmartDo
  
  ### 🧠 AI-Powered Smart Task Manager
  
  *一款使用 Gemini AI 驱动的智能待办事项应用，帮助你将复杂目标拆解为可执行的任务。*

  [![Built with Tauri](https://img.shields.io/badge/Built%20with-Tauri-FFC131?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app)
  [![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
  [![Gemini AI](https://img.shields.io/badge/Gemini-AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)

  <br/>
  
  [🚀 快速开始](#-快速开始) • [✨ 核心功能](#-核心功能) • [🎨 界面预览](#-界面预览) • [🛠️ 技术栈](#️-技术栈)

</div>

---

## 🎯 项目简介

**SmartDo** 是一款现代化的智能任务管理应用，融合了 AI 的强大能力与优雅的用户体验。只需输入你的目标，AI 会自动将其拆解为具体可执行的子任务，让任务管理变得前所未有的简单和高效。

<div align="center">

```
🎯 输入目标 → 🤖 AI 智能拆解 → ✅ 逐个完成 → 🎉 达成目标
```

</div>

---

## ✨ 核心功能

<table>
<tr>
<td width="50%">

### 🤖 AI 智能任务拆解

使用 **Gemini AI** 自动将复杂目标拆解为可执行的子任务。

```
📝 "Plan a birthday party"
        ⬇️ AI Magic ✨
☑️ Create guest list
☑️ Send invitations  
☑️ Order birthday cake
☑️ Prepare decorations
☑️ Plan party games
```

</td>
<td width="50%">

### 📅 智能时间分组

按 **日/周/月/年** 灵活查看任务，自动滚动到今天。

| 分组模式 | 显示效果 |
|:-------:|:-------:|
| **Day** | Today, Tomorrow, Jan 5... |
| **Week** | Week of Jan 1 - Jan 7 |
| **Month** | January 2026 |
| **Year** | 2026 |

</td>
</tr>
<tr>
<td width="50%">

### 🔄 拖拽排序与跨组移动

- 🖱️ **拖拽排序**：自由调整任务顺序
- 📦 **跨组移动**：拖拽到日期标题可快速更改截止日期
- 💾 **自动保存**：所有更改实时同步到本地数据库

</td>
<td width="50%">

### 📊 AI 任务总结

点击日期组旁的 **✨ Summarize** 按钮，AI 会自动分析该时间段的任务，生成智能总结。

> *"今天有 5 项任务待完成，重点关注 Q4 报告和团队会议。建议优先处理紧急任务。"*

</td>
</tr>
</table>

---

## 🎨 界面预览

### 🌟 主界面设计

<div align="center">

| 功能区域 | 说明 |
|:------:|:-----|
| 🏷️ **顶部导航** | 品牌标识 + 用户头像 |
| 🔍 **筛选标签** | All / Active / Completed |
| 📆 **分组选择** | Day / Week / Month / Year |
| 📋 **任务列表** | 按日期分组的任务卡片 |
| ✏️ **输入框** | 支持 AI 智能拆解的任务输入 |

</div>

### 🎭 设计亮点

- 🌈 **渐变主题**：Indigo → Purple → Pink 渐变色系
- 🔲 **圆角卡片**：现代化的任务卡片设计
- ✨ **微动效**：淡入、滑动等流畅动画
- 🎯 **焦点高亮**：重要任务醒目标识
- 🌙 **优雅阴影**：层次分明的视觉效果

---

## 🛠️ 技术栈

<div align="center">

| 技术 | 用途 | 版本 |
|:---:|:---:|:---:|
| ![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?logo=tauri&logoColor=white) | 跨平台桌面框架 | 2.x |
| ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black) | UI 框架 | 18.x |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white) | 类型安全 | 5.x |
| ![TailwindCSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white) | 样式框架 | 3.x |
| ![Gemini](https://img.shields.io/badge/Gemini-AI-8E75B2?logo=google&logoColor=white) | AI 能力 | Latest |
| ![IndexedDB](https://img.shields.io/badge/IndexedDB-Storage-FF6F00?logo=databricks&logoColor=white) | 本地存储 | - |

</div>

---

## 🚀 快速开始

### 📋 前置要求

- **Node.js** 18+ 
- **Gemini API Key** ([获取地址](https://ai.google.dev))

### 📦 安装步骤

```bash
# 1️⃣ 克隆项目
git clone https://github.com/yourusername/smartdo-smart-task-manager.git
cd smartdo-smart-task-manager

# 2️⃣ 安装依赖
npm install

# 3️⃣ 配置 API Key
# 编辑 .env.local 文件，设置你的 Gemini API Key
GEMINI_API_KEY=your_api_key_here

# 4️⃣ 启动开发服务器
npm run dev
```

### 🖥️ 构建桌面应用

```bash
# 安装 Tauri CLI（如果未安装）
npm install -g @tauri-apps/cli

# 构建 macOS/Windows/Linux 应用
npm run tauri build
```

---

## 📁 项目结构

```
smartdo-smart-task-manager/
├── 📂 components/          # React 组件
│   ├── InputBar.tsx       # 任务输入组件
│   ├── TaskItem.tsx       # 任务项组件
│   ├── FilterTabs.tsx     # 筛选标签
│   ├── GroupingTabs.tsx   # 分组标签
│   └── SettingsModal.tsx  # 设置弹窗
├── 📂 services/            # 服务层
│   ├── database.ts        # IndexedDB 封装
│   └── geminiService.ts   # Gemini AI 服务
├── 📂 src-tauri/           # Tauri 原生层
│   ├── src/               # Rust 源码
│   └── icons/             # 应用图标
├── App.tsx                # 主应用组件
├── types.ts               # TypeScript 类型定义
└── index.html             # 入口 HTML
```

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. 🍴 Fork 本项目
2. 🌿 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 💾 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 📤 推送到分支 (`git push origin feature/AmazingFeature`)
5. 🎉 创建 Pull Request

---

## 📄 开源协议

本项目基于 **MIT License** 开源。详情请参阅 [LICENSE](LICENSE) 文件。

---

<div align="center">

**Made with ❤️ and ☕**

如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！

</div>
