# OpenCode 源码学习路线图

## 项目概述

**OpenCode** 是一个开源的 AI 驱动编程助手，类似于 Claude Code，但具有以下特点：
- 100% 开源 (MIT 许可证)
- 提供商无关（支持 Claude、OpenAI、Google、本地模型等）
- 内置 LSP (Language Server Protocol) 支持
- 终端用户界面 (TUI) 为主
- 客户端/服务器架构
- 原生桌面应用支持

**技术栈:**
- 运行时: Bun 1.3+ / Node.js 22+
- 语言: TypeScript 5.8+
- 前端: SolidJS + TailwindCSS
- 桌面: Tauri 2.x
- 服务器: Hono
- 构建系统: Turborepo
- 包管理: Bun Workspaces

---

## 学习路线图 (6 个阶段)

### 🎯 阶段 1: 快速上手与基础理解 (1-2 天)

**目标:** 理解项目是什么，能运行起来，了解整体架构

**学习步骤:**

1. **阅读文档**
   - `README.md` - 项目介绍和安装指南
   - `CONTRIBUTING.md` - 贡献指南
   - `AGENTS.md` - 代码风格指南
   - 官方文档: https://opencode.ai/docs

2. **运行项目**
   ```bash
   # 安装依赖
   bun install

   # 在当前目录运行
   bun dev .

   # 或在指定目录运行
   bun dev <directory>
   ```

3. **了解项目结构**
   - 理解 monorepo 布局 (17+ 个 packages)
   - 识别核心包 vs UI 包 vs 基础设施包
   - 查看主要目录: `packages/`, `infra/`, `script/`

4. **尝试基本功能**
   - 使用 TUI 界面与 AI 对话
   - 尝试读取、编辑文件
   - 执行 bash 命令
   - 查看 `/help` 命令

**关键文件:**
- `packages/opencode/src/index.ts` - CLI 入口
- `packages/opencode/package.json` - 核心依赖
- `README.md` - 项目概述

---

### 🏗️ 阶段 2: 核心架构理解 (3-5 天)

**目标:** 理解核心模块如何协同工作

**学习重点:**

#### 2.1 CLI 命令系统
**路径:** `packages/opencode/src/cli/cmd/`

**核心命令:**
- `run` - 运行 OpenCode (默认 TUI 模式)
- `serve` - 启动无头 API 服务器 (端口 4096)
- `web` - 启动 Web 界面
- `attach` - 连接到运行中的服务器

**学习内容:**
- 命令路由机制 (yargs)
- 如何添加新命令
- TUI 实现方式 (SolidJS + OpenTUI)

#### 2.2 服务器架构
**路径:** `packages/opencode/src/server/`

**核心组件:**
- HTTP/WebSocket 服务器 (Hono)
- API 路由设计
- SSE 流式响应
- OpenAPI 规范

**学习内容:**
- 客户端/服务器通信模式
- API 端点设计 (tui, project, session, file, tool 等)
- 如何支持多种客户端类型

**关键文件:**
- `packages/opencode/src/server/index.ts` - 服务器入口
- `packages/opencode/src/server/router.ts` - 路由定义

#### 2.3 会话管理
**路径:** `packages/opencode/src/session/`

**核心功能:**
- 会话创建和持久化
- 消息处理流程
- LLM 交互和流式响应
- 上下文管理

**学习内容:**
- 如何管理对话历史
- 如何处理流式 AI 响应
- 会话状态如何维护

**关键文件:**
- `packages/opencode/src/session/session.ts`
- `packages/opencode/src/session/message.ts`

#### 2.4 Agent 系统
**路径:** `packages/opencode/src/agent/`

**Agent 类型:**
- `build` agent - 完整访问权限的代理 (默认)
- `plan` agent - 只读分析代理
- `general` agent - 复杂搜索和多步任务
- 自定义 agent

**学习内容:**
- Agent 如何决策和执行任务
- 不同 agent 的权限模型
- 如何创建自定义 agent

**关键文件:**
- `packages/opencode/src/agent/agent.ts`
- `packages/opencode/src/agent/permissions.ts`

---

### 🛠️ 阶段 3: 工具系统深度学习 (3-4 天)

**目标:** 理解工具系统如何工作以及如何扩展

**学习路径:**

#### 3.1 内置工具
**路径:** `packages/opencode/src/tool/`

**核心工具 (20+):**
- `read` - 读取文件内容
- `write` - 写入/创建文件
- `edit` - 编辑文件 (查找/替换)
- `bash` - 执行 shell 命令
- `glob` - 按模式查找文件
- `grep` - 搜索文件内容
- `lsp` - LSP 操作
- `apply_patch` - 应用补丁
- `task` - 多步任务管理
- `question` - 向用户提问

**学习内容:**
- 工具定义和注册机制
- 工具参数验证 (Zod schema)
- 工具执行流程
- 权限控制

**关键文件:**
- `packages/opencode/src/tool/bash.ts` - 最复杂的工具示例
- `packages/opencode/src/tool/read.ts` - 文件操作示例
- `packages/opencode/src/tool/ls.ts` - LSP 集成示例
- `packages/opencode/src/tool/tool.ts` - 工具基类

#### 3.2 自定义工具
**路径:** `.opencode/tools/`, `~/.config/opencode/tools/`

**学习内容:**
- 如何创建自定义工具
- 工具 API 设计
- 如何访问项目上下文 (directory, sessionID 等)
- 工具依赖管理 (`.opencode/package.json`)

**示例:**
```typescript
// .opencode/tools/my-tool.ts
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "My custom tool",
  args: {
    query: tool.schema.string().describe("Search query"),
  },
  async execute(args) {
    // 实现
    return results
  },
})
```

**关键文件:**
- `packages/plugin/src/tool.ts` - 工具定义
- `packages/opencode/src/tool/registry.ts` - 工具注册

---

### 🔌 阶段 4: 插件与扩展系统 (2-3 天)

**目标:** 理解插件架构和扩展机制

**学习路径:**

#### 4.1 插件系统
**路径:** `packages/plugin/`

**插件能力:**
- 添加自定义工具
- 拦截和修改工具执行
- 转换聊天消息
- 添加自定义认证提供者
- 修改系统提示
- 处理自定义命令

**Hook 类型:**
- `event` - 事件处理
- `tool.execute.before/after` - 工具执行前后
- `chat.message` - 聊天消息处理
- `chat.params` - 聊天参数修改
- `permission.ask` - 权限询问

**学习内容:**
- 插件加载机制
- Hook 执行流程
- 如何创建插件

**关键文件:**
- `packages/plugin/src/plugin.ts` - 插件定义
- `packages/opencode/src/config/load.ts` - 插件加载

#### 4.2 MCP (Model Context Protocol)
**路径:** `packages/opencode/src/mcp/`

**学习内容:**
- MCP 协议实现
- 如何集成 MCP 服务器
- MCP 工具暴露机制

**关键文件:**
- `packages/opencode/src/mcp/client.ts`
- `packages/opencode/src/mcp/server.ts`

#### 4.3 LSP 集成
**路径:** `packages/opencode/src/lsp/`

**学习内容:**
- LSP 客户端实现
- 支持 40+ 语言服务器
- 代码智能功能 (跳转定义、查找引用等)

**关键文件:**
- `packages/opencode/src/lsp/client.ts`
- `packages/opencode/src/lsp/index.ts`

---

### 🎨 阶段 5: UI 界面实现 (3-4 天)

**目标:** 理解多界面实现方式

**学习路径:**

#### 5.1 TUI (终端界面)
**路径:** `packages/opencode/src/cli/cmd/tui/`

**技术栈:**
- SolidJS - 响应式框架
- OpenTUI - 终端 UI 框架
- Kobalte - 无头 UI 组件

**学习内容:**
- 如何在终端构建响应式 UI
- 组件化设计
- 状态管理
- WebSocket 与服务器通信

**关键文件:**
- `packages/opencode/src/cli/cmd/tui/app.tsx` - 主应用
- `packages/opencode/src/cli/cmd/tui/components/` - 组件库

#### 5.2 Web UI
**路径:** `packages/app/`

**学习内容:**
- SolidJS 组件开发
- 与 API 服务器通信
- 响应式设计
- 主题系统

**关键文件:**
- `packages/app/src/app.tsx` - 应用入口
- `packages/app/src/components/` - 组件库

#### 5.3 桌面应用
**路径:** `packages/desktop/`

**技术栈:**
- Tauri 2.x - Rust 桌面框架
- Webview - 嵌入 Web UI

**学习内容:**
- Tauri 配置和构建
- 原生功能集成 (文件对话框、通知等)
- Rust 和 JavaScript 互操作

**关键文件:**
- `packages/desktop/src-tauri/` - Rust 代码
- `packages/desktop/src/` - JavaScript 前端

---

### ⚙️ 阶段 6: 高级主题与实战 (4-6 天)

**目标:** 深入理解高级特性和实际开发

**学习路径:**

#### 6.1 配置系统
**路径:** `packages/opencode/src/config/`

**配置层级 (优先级):**
1. 远程配置 (`.well-known/opencode`)
2. 全局配置 (`~/.config/opencode/opencode.json`)
3. 自定义配置 (`OPENCODE_CONFIG` 环境变量)
4. 项目配置 (`opencode.json`)
5. `.opencode` 目录
6. 内联配置 (`OPENCODE_CONFIG_CONTENT`)

**学习内容:**
- 配置加载机制
- 如何定义新配置项
- 配置验证和默认值

**关键文件:**
- `packages/opencode/src/config/schema.ts` - 配置 schema (50K+ 行)
- `packages/opencode/src/config/load.ts` - 加载逻辑

#### 6.2 权限系统
**路径:** `packages/opencode/src/permission/`

**学习内容:**
- 细粒度工具访问控制
- 每个代理的权限规则
- Ask/allow/deny 模式
- 权限持久化

**关键文件:**
- `packages/opencode/src/permission/permission.ts`

#### 6.3 Provider 集成
**路径:** `packages/opencode/src/provider/`

**支持 40+ 提供商:**
- Anthropic (Claude)
- OpenAI
- Google/Google Vertex
- Azure OpenAI
- Groq, Mistral, Cohere
- Amazon Bedrock
- 本地模型等

**学习内容:**
- Provider 接口设计
- 如何添加新 provider
- 流式响应处理
- 错误处理和重试

**关键文件:**
- `packages/opencode/src/provider/anthropic.ts` - 示例实现
- `packages/opencode/src/provider/openai.ts`
- `packages/opencode/src/provider/provider.ts` - 基类

#### 6.4 项目管理
**路径:** `packages/opencode/src/project/`

**学习内容:**
- 实例 (Instance) 概念
- VCS (版本控制系统) 集成
- 项目状态管理
- 文件监听

**关键文件:**
- `packages/opencode/src/project/instance.ts`
- `packages/opencode/src/project/vcs.ts`

#### 6.5 实战项目: 添加一个自定义功能

**建议项目:** 添加一个 `/stats` 命令来分析代码统计

**步骤:**
1. 创建命令定义 `.opencode/command/stats.md`
2. 实现自定义工具 `.opencode/tools/code-stats.ts`
3. 测试功能
4. 优化用户体验

**收获:**
- 理解命令系统
- 掌握工具开发
- 学习测试方法
- 了解用户体验设计

---

## 关键代码路径速查

### 核心流程

**用户输入处理流程:**
```
CLI/TUI (cli/)
  → Server (server/)
    → Session (session/)
      → Agent (agent/)
        → Tools (tool/)
          → File Operations (file/, lsp/)
```

**AI 响应流程:**
```
Agent (agent/)
  → Provider (provider/)
    → LLM API
      → Stream Response
        → Session (session/)
          → Client (TUI/Web/Desktop)
```

### 重要文件索引

| 功能 | 路径 |
|------|------|
| CLI 入口 | `packages/opencode/src/index.ts` |
| 服务器 | `packages/opencode/src/server/index.ts` |
| Agent | `packages/opencode/src/agent/agent.ts` |
| 会话 | `packages/opencode/src/session/session.ts` |
| 工具基类 | `packages/opencode/src/tool/tool.ts` |
| Bash 工具 | `packages/opencode/src/tool/bash.ts` |
| LSP 客户端 | `packages/opencode/src/lsp/client.ts` |
| Provider | `packages/opencode/src/provider/` |
| 配置 | `packages/opencode/src/config/load.ts` |
| TUI 应用 | `packages/opencode/src/cli/cmd/tui/app.tsx` |
| 插件系统 | `packages/plugin/src/plugin.ts` |

---

## 学习建议

### 学习方法
1. **边读边运行** - 修改代码后立即运行测试
2. **断点调试** - 使用 `bun --inspect` 调试
3. **阅读测试** - `test/` 目录有很多使用示例
4. **查看 Git 历史** - 了解功能演进
5. **使用 /learn 命令** - 从会话中提取学习内容

### 推荐阅读顺序
1. 先看 `AGENTS.md` 理解代码风格
2. 从简单的工具开始 (如 `read.ts`)
3. 再看复杂工具 (如 `bash.ts`)
4. 然后理解 Agent 如何调用工具
5. 最后看服务器和 UI 部分

### 调试技巧
```bash
# 启用调试日志
OPENCODE_DEBUG=1 bun dev .

# 运行特定测试
bun test test/tool/tool.test.ts

# 类型检查
bun run typecheck

# 构建单文件可执行程序
./packages/opencode/script/build.ts --single
```

### 社区资源
- GitHub Issues: https://github.com/opencodeai/opencode/issues
- 文档: https://opencode.ai/docs
- Discord 社区
- 官方示例: `.opencode/` 目录

---

## 总结

OpenCode 是一个架构优秀的开源项目，学习它可以帮助你理解:

✅ **现代 TypeScript 开发模式**
✅ **CLI 应用设计**
✅ **AI Agent 架构**
✅ **工具系统设计**
✅ **插件架构**
✅ **LSP 集成**
✅ **多界面开发 (TUI/Web/Desktop)**
✅ **客户端/服务器架构**
✅ **流式 AI 响应处理**
✅ **权限系统设计**

按照这个路线图学习，你将能够深入理解 OpenCode 的内部工作原理，并具备为项目贡献代码的能力。

**预计学习时间:** 3-4 周 (每天 2-3 小时)

**之后你将能够:**
- 为 OpenCode 贡献代码
- 开发自定义工具和插件
- 理解 AI Agent 的设计原理
- 构建类似的 AI 辅助工具
