# TDD MCP 服务器 v2.0

一个完整的模型上下文协议（MCP）服务器，为AI编程助手提供**简化且强大**的测试驱动开发（TDD）工作流支持。

**支持的AI工具：** Claude Desktop、Claude Code、Cursor、Codeium 以及任何兼容MCP的AI助手

## ✨ v2.0 新特性

### 🚀 简化的工具架构
- **之前**: 15个独立工具，使用复杂
- **现在**: **3个主工具 + 子命令**，简洁高效
- **向后兼容**: 支持旧版15工具系统

### 🌐 完整国际化支持
- **中文优先**: 默认中文界面，符合国内用户习惯
- **双语支持**: 中英文动态切换
- **本地化**: 所有工具描述、参数说明、错误信息都本地化

### 🔄 Session自动管理
- **智能化**: 无需手动创建TDD会话
- **自动跟踪**: RED→GREEN→REFACTOR循环自动管理
- **状态感知**: 智能识别TDD开发阶段

## 🛠️ 核心工具（3个主工具）

### 1. `tdd` - TDD核心工作流工具
测试驱动开发的一站式解决方案：
- **默认行为**: 执行完整TDD流程（推荐）
- **子命令**:
  - `generate` - 生成测试用例
  - `implement` - 根据测试生成实现代码
  - `test` - 运行测试
  - `coverage` - 分析代码覆盖率
  - `refactor` - 提供重构建议
  - `validate` - 验证TDD循环

### 2. `feature` - 功能管理工具
项目功能和需求管理：
- **默认行为**: 创建新功能
- **子命令**:
  - `create` - 创建新功能（默认）
  - `update` - 更新功能状态
  - `link` - 关联文件到功能
  - `find` - 查找相似功能

### 3. `tracking` - 测试跟踪工具
测试方法执行跟踪：
- **默认行为**: 注册测试方法
- **子命令**:
  - `register` - 注册测试方法（默认）
  - `result` - 更新测试执行结果
  - `status` - 更新测试方法状态

## 🌍 语言和框架支持

| 编程语言 | 测试框架 | 状态 |
|----------|---------|------|
| **TypeScript/JavaScript** | Jest, Mocha, Vitest | ✅ 完全支持 |
| **Python** | pytest, unittest | ✅ 完全支持 |  
| **Java** | JUnit 5 | ✅ 完全支持 |
| **C#** | xUnit, NUnit | ✅ 完全支持 |
| **Go** | Go Test | ✅ 完全支持 |
| **Rust** | Cargo test | ✅ 完全支持 |
| **PHP** | PHPUnit | ✅ 完全支持 |

## 🚀 快速开始

### 前置要求
- Node.js 18.0.0+
- npm 或 yarn

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/laonayan/tdd-mcp-server.git
cd tdd-mcp-server

# 安装依赖
npm install

# 构建项目
npm run build

# 测试安装
npm test
```

## 🔧 配置指南

### Claude Code（推荐）

#### 快速配置 - v2.0新工具系统（推荐）
```bash
claude mcp add tdd-server-v2 node "/绝对路径/tdd-mcp-server/dist/server.js" \
  -e USE_NEW_TOOLS=true \
  -e DEFAULT_LOCALE=zh \
  -e PROJECT_PATH="."
```

#### 传统工具系统配置
```bash
claude mcp add tdd-server-legacy node "/绝对路径/tdd-mcp-server/dist/server.js" \
  -e USE_NEW_TOOLS=false \
  -e DEFAULT_LOCALE=zh \
  -e PROJECT_PATH="."
```

#### 配置示例

**中文界面配置（推荐）**:
```bash
claude mcp add tdd-server-v2 node "/Users/username/tdd-mcp-server/dist/server.js" \
  -e USE_NEW_TOOLS=true \
  -e DEFAULT_LOCALE=zh \
  -e PROJECT_PATH="/Users/username/my-project"
```

**英文界面配置**:
```bash
claude mcp add tdd-server-v2 node "/Users/username/tdd-mcp-server/dist/server.js" \
  -e USE_NEW_TOOLS=true \
  -e DEFAULT_LOCALE=en \
  -e PROJECT_PATH="/Users/username/my-project"
```

#### 手动配置文件方式

在项目根目录创建 `.claude.json`：

```json
{
  "mcpServers": {
    "tdd-server-v2": {
      "command": "node",
      "args": ["/绝对路径/tdd-mcp-server/dist/server.js"],
      "env": {
        "USE_NEW_TOOLS": "true",
        "DEFAULT_LOCALE": "zh",
        "PROJECT_PATH": "."
      }
    }
  }
}
```

### 其他AI工具配置

#### Claude Desktop
编辑配置文件：
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "tdd-server-v2": {
      "command": "node",
      "args": ["/绝对路径/tdd-mcp-server/dist/server.js"],
      "env": {
        "USE_NEW_TOOLS": "true",
        "DEFAULT_LOCALE": "zh",
        "PROJECT_PATH": "/你的项目路径"
      }
    }
  }
}
```

#### Cursor IDE
在项目根目录创建 `.cursor/mcp.json`：

```json
{
  "servers": {
    "tdd-server-v2": {
      "command": "node",
      "args": ["/绝对路径/tdd-mcp-server/dist/server.js"],
      "env": {
        "USE_NEW_TOOLS": "true",
        "DEFAULT_LOCALE": "zh",
        "PROJECT_PATH": "."
      }
    }
  }
}
```

## 🎯 使用教程

### 基础用法 - v2.0简化命令

#### 1. 一键完整TDD流程（最推荐）
```javascript
// 中文环境 - 自动执行完整TDD流程
tdd({
  requirements: "实现用户登录功能，包括邮箱验证、密码加密、JWT令牌生成"
})
```

**执行结果**：
```
完整TDD流程执行完成:
✅ 生成测试用例
✅ 生成最小实现
✅ 运行测试
✅ 分析覆盖率
✅ 提供重构建议
```

#### 2. 分步TDD流程

**RED阶段 - 生成测试用例**：
```javascript
tdd({
  command: "generate",
  requirements: "用户登录功能",
  language: "typescript",
  framework: "jest",
  testType: "unit"
})
```

**GREEN阶段 - 生成实现代码**：
```javascript
tdd({
  command: "implement",
  testCode: `
    describe('UserLogin', () => {
      test('should authenticate user with valid credentials', () => {
        const loginService = new LoginService();
        const result = loginService.authenticate('user@example.com', 'password123');
        expect(result.success).toBe(true);
        expect(result.token).toBeDefined();
      });
    });
  `,
  language: "typescript"
})
```

**REFACTOR阶段 - 代码重构**：
```javascript
tdd({
  command: "refactor",
  sourceCode: "..."
})
```

#### 3. 功能管理

**创建新功能**：
```javascript
feature({
  name: "密码重置功能",
  description: "允许用户通过邮件重置密码",
  acceptanceCriteria: [
    "用户可以请求密码重置",
    "系统发送重置链接到邮箱", 
    "重置链接1小时后过期",
    "用户可以设置新密码"
  ],
  priority: "high",
  estimatedHours: 8
})
```

**查找相似功能**：
```javascript
feature({
  command: "find",
  query: "用户认证 登录 密码"
})
```

#### 4. 测试跟踪

**注册测试方法**：
```javascript
tracking({
  featureId: "user-auth-feature",
  name: "test_user_login_success",
  filePath: "./src/__tests__/auth.test.ts",
  framework: "jest",
  testType: "unit"
})
```

### 完整使用场景示例

#### 场景1：新功能完整TDD开发

```
用户: 我想用TDD方式实现一个用户认证系统，包括注册、登录和JWT令牌生成

AI助手: 我来帮你用TDD方式实现用户认证系统。使用v2.0的简化工具：

1. 首先创建功能：
feature({
  name: "用户认证系统",
  description: "实现用户注册、登录和JWT令牌管理",
  acceptanceCriteria: [
    "用户可以使用邮箱和密码注册",
    "用户可以使用有效凭据登录", 
    "成功登录后返回JWT令牌",
    "无效凭据时返回错误信息"
  ]
})

2. 执行完整TDD流程：
tdd({
  requirements: "用户认证系统：用户注册、登录验证、JWT令牌生成和验证"
})

这将自动完成：
✅ 生成全面的测试用例
✅ 生成最小化实现代码
✅ 运行测试并验证
✅ 分析代码覆盖率
✅ 提供重构建议
```

#### 场景2：现有项目功能扩展

```
用户: 我的项目已经有用户管理功能，现在要添加密码重置功能

AI助手: 让我帮你扩展现有功能：

1. 先查找相似功能：
feature({
  command: "find", 
  query: "密码重置 忘记密码 邮件验证"
})

2. 基于现有架构添加新功能：
feature({
  name: "密码重置功能",
  description: "扩展用户管理，支持安全的密码重置流程"
})

3. 针对新功能执行TDD：
tdd({
  requirements: "密码重置功能：邮件验证、临时令牌、密码更新",
  language: "typescript",
  framework: "jest"
})
```

#### 场景3：代码质量提升

```
用户: 我想改进现有代码的测试覆盖率和代码质量

AI助手: 我来帮你分析和改进代码质量：

1. 分析现有测试覆盖率：
tdd({
  command: "coverage",
  projectPath: "./"
})

2. 针对覆盖率低的模块生成测试：
tdd({
  command: "generate",
  requirements: "为现有PaymentService模块生成全面的单元测试",
  language: "typescript",
  testType: "unit"
})

3. 重构代码改进质量：
tdd({
  command: "refactor", 
  sourceCode: "...现有代码..."
})
```

### 高级用法

#### 自定义TDD工作流
```javascript
// 仅生成测试，不执行完整流程
tdd({
  command: "generate",
  requirements: "支付处理功能",
  language: "python",
  framework: "pytest", 
  testType: "integration"
})

// 仅运行测试和覆盖率分析
tdd({
  command: "coverage",
  projectPath: "./"
})

// 验证TDD最佳实践
tdd({
  command: "validate"
})
```

#### 功能生命周期管理
```javascript
// 更新功能状态
feature({
  command: "update",
  featureId: "feature-123",
  status: "in_progress",
  progress: {
    testsWritten: 15,
    testsPass: 12,
    coveragePercentage: 85
  }
})

// 关联文件到功能
feature({
  command: "link", 
  featureId: "feature-123",
  filePaths: [
    "./src/payment.service.ts",
    "./src/__tests__/payment.test.ts"
  ],
  fileType: "implementation"
})
```

#### 测试方法详细跟踪
```javascript
// 更新测试执行结果
tracking({
  command: "result",
  methodId: "test-456",
  result: {
    duration: 150,
    passed: true,
    coverage: 92
  }
})
```

## 🔧 环境配置

### 环境变量

| 变量名 | 描述 | 默认值 |
|-------|------|-------|
| `USE_NEW_TOOLS` | 启用v2.0新工具系统 | `false` |
| `DEFAULT_LOCALE` | 默认语言(zh/en) | `zh` |
| `PROJECT_PATH` | 项目路径 | `process.cwd()` |

### 开发命令

```bash
npm run build          # 构建项目
npm run dev           # 开发模式  
npm run start         # 生产模式
npm run test          # 运行测试
npm run test:watch    # 监视模式测试
npm run clean         # 清理构建文件
```

### 测试和验证

```bash
# 运行集成测试
./integration-test.sh

# 运行单元测试
npm test

# 检查构建
npm run build
```

## 📊 系统架构对比

### v2.0新架构（推荐）
```
3个主工具 + 子命令系统
├── tdd (测试驱动开发)
│   ├── 默认: 完整TDD流程
│   ├── generate: 生成测试
│   ├── implement: 生成实现
│   ├── test: 运行测试
│   ├── coverage: 覆盖率分析
│   ├── refactor: 重构建议
│   └── validate: 验证TDD循环
├── feature (功能管理)
│   ├── 默认: 创建功能
│   ├── update: 更新状态
│   ├── link: 关联文件
│   └── find: 查找相似功能
└── tracking (测试跟踪)
    ├── 默认: 注册测试方法
    ├── result: 更新执行结果
    └── status: 更新方法状态
```

### v1.0传统架构（向后兼容）
```
15个独立工具
├── generate_test_cases
├── implement_from_tests
├── run_tests
├── analyze_coverage
├── refactor_code
├── validate_tdd_cycle
├── createFeature
├── updateFeatureStatus
├── linkFeatureFiles
├── findSimilarFeatures
├── createTDDSession
├── updateTDDStage
├── registerTestMethod
├── updateTestExecutionResult
└── updateTestMethodStatus
```

## 🛠️ 故障排除

### 常见问题

#### 切换工具系统版本
```bash
# 使用v2.0新工具系统（推荐）
USE_NEW_TOOLS=true node dist/server.js

# 使用v1.0传统工具系统
USE_NEW_TOOLS=false node dist/server.js
```

#### 语言切换
```bash
# 中文界面（默认）
DEFAULT_LOCALE=zh node dist/server.js

# 英文界面
DEFAULT_LOCALE=en node dist/server.js
```

#### 验证配置
```bash
# 在Claude Code中检查工具列表
/mcp list

# 检查特定服务器工具
/mcp tools tdd-server-v2

# 测试工具连接
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  USE_NEW_TOOLS=true DEFAULT_LOCALE=zh node dist/server.js
```

#### 集成测试验证
```bash
# 运行完整集成测试
./integration-test.sh

# 手动测试新工具系统
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"tdd","arguments":{"requirements":"测试功能"}}}' | \
  USE_NEW_TOOLS=true DEFAULT_LOCALE=zh node dist/server.js
```

### 性能优化

#### v2.0系统优势
- **简化API**: 3个工具替代15个工具，减少工具切换开销
- **智能默认**: 大多数参数有合理默认值，减少配置复杂度
- **自动Session管理**: 无需手动管理TDD会话状态
- **本地化支持**: 根据配置自动切换界面语言

## 📈 最新更新

### v2.0.0 (当前版本)
- ✅ **架构简化**: 15个工具合并为3个主工具 + 子命令
- ✅ **国际化**: 完整中英文支持，默认中文界面
- ✅ **自动化**: Session自动管理，智能TDD流程
- ✅ **兼容性**: 保持对v1.0工具系统的完整向后兼容
- ✅ **测试覆盖**: 115个测试用例，包含9个集成测试场景

### 测试状态
- **单元测试**: 111个通过 ✅
- **集成测试**: 9个场景全部通过 ✅  
- **构建状态**: 无错误 ✅
- **兼容性**: 新旧工具系统都正常工作 ✅

## 🏗️ 项目结构

```
tdd-mcp-server/
├── src/
│   ├── handlers/           
│   │   ├── tools.ts           # v1.0传统15工具系统
│   │   ├── new-tools.ts       # v2.0新3工具系统
│   │   ├── resources.ts       # 文件和报告访问
│   │   └── prompts.ts         # TDD工作流提示
│   ├── services/              # 核心业务逻辑
│   │   ├── storage.service.ts 
│   │   ├── feature-management.service.ts
│   │   ├── test-generator.ts
│   │   ├── code-generator.ts
│   │   └── ...
│   ├── i18n.ts               # 国际化服务
│   └── types/                # TypeScript类型定义
├── examples/
│   └── v2-usage-guide.md    # v2.0详细使用指南
├── CLAUDE.md                # Claude Code指导文档
├── integration-test.sh      # 集成测试脚本
└── dist/                    # 构建输出
```

## 🤝 贡献指南

我们欢迎贡献！特别欢迎：

### 优先需求
1. **新测试框架支持** - 添加更多测试框架
2. **语言扩展** - 支持更多编程语言
3. **AI工具集成** - 支持更多AI编程助手
4. **本地化** - 支持更多语言界面

### 开发环境设置

```bash
git clone https://github.com/laonayan/tdd-mcp-server.git
cd tdd-mcp-server
npm install
npm run dev
npm run test:watch
```

## 📄 开源协议

MIT License - 详见 [LICENSE](LICENSE) 文件。

## 🆘 获取支持

- 🐛 **Bug报告**: [GitHub Issues](https://github.com/laonayan/tdd-mcp-server/issues)
- 💬 **功能建议**: [GitHub Discussions](https://github.com/laonayan/tdd-mcp-server/discussions)
- 📖 **使用文档**: [examples/v2-usage-guide.md](examples/v2-usage-guide.md)

---

**🎯 立即开始v2.0简化TDD开发！**

通过智能化的测试驱动开发支持，在所有主要AI编程助手中转变你的开发工作流。v2.0带来更简洁、更智能、更本土化的TDD体验。