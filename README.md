# TDD MCP 服务器

一个完整的模型上下文协议（MCP）服务器，为AI编程助手提供完整的测试驱动开发（TDD）工作流支持。

**支持的AI工具：** Claude Desktop、Claude Code、Cursor、Codeium 以及任何兼容MCP的AI助手

## ✨ 功能特性

### 🔧 TDD 工作流工具（15个工具）
**核心TDD工具：**
- `generate_test_cases` - 根据需求生成全面的测试用例
- `implement_from_tests` - 根据测试生成最小化实现代码  
- `run_tests` - 执行测试并返回详细结果
- `analyze_coverage` - 分析代码覆盖率并生成报告
- `refactor_code` - 提供代码重构建议
- `validate_tdd_cycle` - 验证TDD红绿重构循环遵循情况

**功能管理工具：**
- `createFeature` - 创建带验收标准的新功能
- `updateFeatureStatus` - 更新功能状态和进度  
- `linkFeatureFiles` - 关联文件到功能
- `findSimilarFeatures` - 根据描述查找相似功能

**TDD会话管理：**
- `createTDDSession` - 启动新的TDD开发会话
- `updateTDDStage` - 更新TDD循环阶段（红/绿/重构）

**测试跟踪工具：**
- `registerTestMethod` - 注册测试方法进行跟踪
- `updateTestExecutionResult` - 更新测试执行结果
- `updateTestMethodStatus` - 更新测试方法状态

### 🗄️ 数据持久化
- **基于JSONL的存储** 用于项目数据持久化
- **项目级别分离** (`~/.tdd-flow/projects/{project-id}/`)
- **完整的功能生命周期跟踪**
- **TDD会话历史记录和分析**

### 🌐 语言和框架支持

| 编程语言 | 测试框架 | 状态 |
|----------|---------|------|
| **TypeScript/JavaScript** | Jest, Mocha, Vitest, Jasmine | ✅ 完全支持 |
| **Python** | pytest, unittest, nose2 | ✅ 完全支持 |  
| **Java** | JUnit 5, TestNG, Spock | ✅ 完全支持 |
| **C#** | xUnit, NUnit, MSTest | ✅ 完全支持 |
| **Go** | 内置测试, Testify, Ginkgo | ✅ 完全支持 |
| **Rust** | Cargo test, proptest | ✅ 完全支持 |

## 🚀 快速开始

### 前置要求
- Node.js 18.0.0+
- npm 或 yarn

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/your-username/tdd-mcp-server.git
cd tdd-mcp-server

# 安装依赖
npm install

# 构建项目
npm run build

# 测试安装
npm test
```

## 🔧 AI工具配置指南

### Claude Code（强烈推荐）

Claude Code是最佳的TDD开发体验，支持完整的MCP工具集成。

#### 快速配置命令
使用以下Claude Code MCP命令一键配置：

```bash
claude mcp add tdd-server node "/绝对路径/到/tdd-mcp-server/stdio-server.js" -e PROJECT_PATH="/你的项目路径" -e DEFAULT_LANGUAGE="typescript" -e DEFAULT_TEST_FRAMEWORK="jest"
```

**示例配置：**
```bash
# 全局配置（推荐用于开发此服务器）
claude mcp add tdd-server node "/Users/username/tdd-mcp-server/stdio-server.js" -e PROJECT_PATH="/Users/username/tdd-mcp-server" -e DEFAULT_LANGUAGE="typescript" -e DEFAULT_TEST_FRAMEWORK="jest"

# 项目配置（推荐用于使用此服务器的项目）
claude mcp add tdd-server node "/Users/username/tdd-mcp-server/stdio-server.js" -e PROJECT_PATH="." -e DEFAULT_LANGUAGE="typescript" -e DEFAULT_TEST_FRAMEWORK="jest"
```

#### 传统配置方式

如果你更喜欢手动配置，可以编辑配置文件：

##### 1. 全局配置
创建或编辑 `~/.claude.json`：

```json
{
  "mcpServers": {
    "tdd-server": {
      "command": "node",
      "args": ["/绝对路径/到/tdd-mcp-server/stdio-server.js"],
      "env": {
        "PROJECT_PATH": "/你的项目路径",
        "DEFAULT_LANGUAGE": "typescript",
        "DEFAULT_TEST_FRAMEWORK": "jest",
        "COVERAGE_THRESHOLD": "80"
      }
    }
  }
}
```

##### 2. 项目级配置（推荐）
在项目根目录创建 `.claude.json`：

```json
{
  "mcpServers": {
    "tdd-server": {
      "command": "node",
      "args": ["/绝对路径/到/tdd-mcp-server/stdio-server.js"],
      "env": {
        "PROJECT_PATH": ".",
        "DEFAULT_LANGUAGE": "typescript",
        "DEFAULT_TEST_FRAMEWORK": "jest",
        "COVERAGE_THRESHOLD": "85"
      }
    }
  }
}
```

#### 验证配置
在Claude Code中运行：
```bash
/mcp list
```
你应该看到 `tdd-server` 列在可用服务器中。

#### 测试连接
运行以下命令测试工具是否可用：
```bash
/mcp tools tdd-server
```
应该显示所有15个TDD工具。

#### 5. Claude Code 使用演示

以下是几个完整的Claude Code + TDD MCP使用演示：

**演示1：完整的用户认证TDD流程**
```
用户: 我想用TDD方式实现一个用户认证系统，包括注册、登录和JWT令牌生成

Claude Code: 我来帮你用TDD方式实现用户认证系统。首先创建一个功能：

🔧 [调用 createFeature 工具]
- 功能名称：用户认证系统
- 描述：实现用户注册、登录和JWT令牌管理
- 验收标准：
  * 用户可以使用邮箱和密码注册
  * 用户可以使用有效凭据登录
  * 成功登录后返回JWT令牌
  * 无效凭据时返回错误信息

现在让我生成测试用例：

🔧 [调用 generate_test_cases 工具]
- 需求：用户认证系统功能
- 语言：typescript
- 框架：jest
- 测试类型：unit

接下来根据测试用例生成最小实现：

🔧 [调用 implement_from_tests 工具]
- 测试代码：[生成的测试代码]
- 语言：typescript
- 实现风格：minimal

让我们运行测试看看当前状态：

🔧 [调用 run_tests 工具]
- 项目路径：.
- 测试框架：jest

现在分析代码覆盖率：

🔧 [调用 analyze_coverage 工具]
- 项目路径：.
- 阈值：85

基于测试结果，我来提供重构建议：

🔧 [调用 refactor_code 工具]
- 代码：[当前实现代码]
- 语言：typescript
- 重构重点：["可读性", "安全性", "性能"]

最后验证我们是否遵循了TDD最佳实践：

🔧 [调用 validate_tdd_cycle 工具]
- 项目路径：.
- 检查提交历史：true
```

**演示2：功能管理和相似度查找**
```
用户: 我想添加一个密码重置功能，看看项目中是否有类似的功能

Claude Code: 让我帮你搜索相似功能并创建新功能：

🔧 [调用 findSimilarFeatures 工具]
- 查询：密码重置 忘记密码 邮件
- 项目ID：current-project
- 最大结果：5
- 最小相似度：0.3

找到了2个相似功能：
1. 用户认证系统 (相似度: 73%)
2. 邮件通知服务 (相似度: 45%)

现在创建密码重置功能：

🔧 [调用 createFeature 工具]
- 功能名称：密码重置功能
- 描述：允许用户通过邮件重置密码
- 验收标准：
  * 用户可以请求密码重置
  * 系统发送重置链接到用户邮箱
  * 重置链接1小时后过期
  * 用户可以通过有效链接设置新密码

接下来关联相关文件：

🔧 [调用 linkFeatureFiles 工具]
- 功能ID：[新创建的功能ID]
- 文件路径：["src/auth/password-reset.service.ts", "src/__tests__/password-reset.test.ts"]
- 文件类型：implementation
```

**演示3：TDD会话跟踪**
```
用户: 开始一个新的TDD开发会话来实现支付处理功能

Claude Code: 我来创建一个TDD会话来跟踪开发过程：

🔧 [调用 createTDDSession 工具]
- 功能ID：payment-processing
- 开发者：john.doe
- 目标：实现支付处理和验证逻辑

会话已创建！现在进入RED阶段：

🔧 [调用 updateTDDStage 工具]
- 会话ID：[会话ID]
- 阶段：RED
- 注释：编写支付处理失败测试

注册测试方法：

🔧 [调用 registerTestMethod 工具]
- 会话ID：[会话ID]
- 测试名称：should_process_valid_payment
- 测试文件：src/__tests__/payment.test.ts
- 预期结果：FAIL

运行测试并更新结果：

🔧 [调用 updateTestExecutionResult 工具]
- 测试方法ID：[方法ID]
- 状态：FAILED
- 执行时间：150
- 错误消息：PaymentProcessor is not defined

现在进入GREEN阶段：

🔧 [调用 updateTDDStage 工具]
- 会话ID：[会话ID]
- 阶段：GREEN
- 注释：实现最小化的支付处理逻辑

更新测试状态：

🔧 [调用 updateTestMethodStatus 工具]
- 测试方法ID：[方法ID]
- 状态：PASSING
- 注释：基本实现已完成，测试通过
```

### Claude Desktop

编辑Claude Desktop配置文件：

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "tdd-server": {
      "command": "node",
      "args": ["/绝对路径/到/tdd-mcp-server/stdio-server.js"],
      "env": {
        "PROJECT_PATH": "/你的项目路径",
        "DEFAULT_LANGUAGE": "typescript", 
        "DEFAULT_TEST_FRAMEWORK": "jest",
        "COVERAGE_THRESHOLD": "80"
      }
    }
  }
}
```

### Cursor IDE

#### 1. 安装MCP扩展
- 打开Cursor
- 进入扩展市场 (Ctrl+Shift+X)
- 搜索 "MCP" 或 "Model Context Protocol"
- 安装MCP扩展

#### 2. 配置MCP服务器
在项目根目录创建 `.cursor/mcp.json`：

```json
{
  "servers": {
    "tdd-server": {
      "command": "node",
      "args": ["/绝对路径/到/tdd-mcp-server/stdio-server.js"],
      "env": {
        "PROJECT_PATH": ".",
        "DEFAULT_LANGUAGE": "typescript",
        "DEFAULT_TEST_FRAMEWORK": "jest",
        "COVERAGE_THRESHOLD": "85"
      }
    }
  }
}
```

### Codeium

#### 1. 全局配置
创建 `~/.codeium/mcp_servers.json`：

```json
{
  "tdd-server": {
    "command": "node",
    "args": ["/绝对路径/到/tdd-mcp-server/stdio-server.js"],
    "env": {
      "PROJECT_PATH": "/你的项目路径",
      "DEFAULT_LANGUAGE": "typescript",
      "DEFAULT_TEST_FRAMEWORK": "jest",
      "COVERAGE_THRESHOLD": "80"
    }
  }
}
```

## 🏃‍♂️ 使用示例

### 示例1：完整的TDD工作流

```
用户：我想用TDD方式实现一个用户认证系统。需求如下：
1. 用户可以用邮箱和密码登录
2. 成功时返回JWT令牌
3. 处理无效凭据
4. 登录尝试频率限制

请指导我完成使用TypeScript和Jest的完整TDD流程。
```

### 示例2：功能管理

```
用户：创建一个名为"密码重置"的新功能，验收标准如下：
- 用户可以通过邮件请求密码重置
- 重置链接1小时后过期
- 用户可以使用有效重置链接设置新密码  
- 密码更改后，之前的重置链接失效

优先级：高，预计8小时，分配给：john.doe
```

### 示例3：测试分析

```
用户：运行我项目中的所有测试并分析覆盖率。请提供提高测试覆盖率的建议，特别是边界情况的测试。
```

### 示例4：重构建议

```
用户：请分析这段代码并提供重构建议：

function processUserData(users) {
  const results = [];
  for (let i = 0; i < users.length; i++) {
    if (users[i].age > 18 && users[i].active && users[i].email) {
      const processed = {
        id: users[i].id,
        name: users[i].firstName + ' ' + users[i].lastName,
        contact: users[i].email,
        status: users[i].active ? 'active' : 'inactive'
      };
      results.push(processed);
    }
  }
  return results;
}
```

### 示例5：TDD会话跟踪

```
用户：开始一个支付处理功能的TDD会话，我想跟踪整个红绿重构循环过程。
```

## 🔧 环境配置

### 环境变量

| 变量名 | 描述 | 默认值 |
|-------|------|-------|
| `PROJECT_PATH` | 项目路径 | `process.cwd()` |
| `DEFAULT_LANGUAGE` | 默认编程语言 | `typescript` |
| `DEFAULT_TEST_FRAMEWORK` | 默认测试框架 | `jest` |
| `COVERAGE_THRESHOLD` | 代码覆盖率阈值 | `80` |
| `MAX_TEST_DURATION` | 测试超时时间（秒） | `300` |

### 开发命令

```bash
npm run build          # 构建项目
npm run dev           # 开发模式  
npm run start         # 生产模式
npm run test          # 运行测试
npm run test:watch    # 监视模式测试
npm run clean         # 清理构建文件
```

## 📋 TDD 工作流

### 红绿重构循环

1. **🔴 红色阶段**: 先编写失败的测试
2. **🟢 绿色阶段**: 编写最少代码让测试通过
3. **🔄 重构阶段**: 在保持测试通过的前提下改进代码

### 典型开发流程

1. **启动TDD会话** → 使用 `createTDDSession`
2. **生成测试** → 使用 `generate_test_cases` 
3. **实现代码** → 使用 `implement_from_tests`
4. **运行测试** → 使用 `run_tests`
5. **分析覆盖率** → 使用 `analyze_coverage`
6. **重构代码** → 使用 `refactor_code`
7. **验证TDD** → 使用 `validate_tdd_cycle`

## 🛠️ 故障排除

### 常见问题

#### MCP连接失败
```bash
# 检查服务器状态
npm run dev

# 手动测试服务器
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | node stdio-server.js

# 检查配置
cat ~/.claude/settings.json  # Claude Code配置
```

#### 工具不可用
1. 确保服务器已构建：`npm run build`
2. 检查配置文件路径是否为绝对路径
3. 重启你的AI工具
4. 验证MCP服务器已列出：`/mcp list`（在Claude Code中）

#### 权限错误
```bash
# 使服务器可执行
chmod +x stdio-server.js

# 检查文件权限
ls -la stdio-server.js
```

#### Claude Code 特定问题

**问题：工具调用失败**
```bash
# 检查MCP服务器连接
/mcp status tdd-server

# 重新加载MCP服务器
/mcp reload tdd-server

# 查看详细错误日志
/mcp logs tdd-server
```

**问题：配置文件未生效**
- 确保使用绝对路径：`/home/user/path/to/tdd-mcp-server/stdio-server.js`
- 检查JSON格式是否正确
- 重启Claude Code使配置生效

## 🏗️ 项目结构

```
tdd-mcp-server/
├── src/
│   ├── handlers/           # MCP协议处理器
│   │   ├── tools.ts       # 15个TDD工具实现
│   │   ├── resources.ts   # 文件和报告访问
│   │   └── prompts.ts     # TDD工作流提示
│   ├── services/          # 核心业务逻辑
│   │   ├── storage.service.ts        # 数据持久化
│   │   ├── feature-management.service.ts  # 功能管理
│   │   ├── test-generator.ts         # 测试生成
│   │   ├── code-generator.ts         # 代码生成
│   │   └── ...           # 其他服务
│   └── types/            # TypeScript类型定义
├── dist/                 # 构建后的JavaScript文件
├── templates/           # TDD工作流模板  
├── examples/           # 使用示例
└── README.md          # 本文件
```

## 🤝 贡献指南

我们欢迎贡献！请查看[CONTRIBUTING.md](CONTRIBUTING.md)了解详细指南。

### 开发环境设置

```bash
git clone https://github.com/laonayan/tdd-mcp-server.git
cd tdd-mcp-server
npm install
npm run dev
npm run test:watch
```

### 添加新功能

1. **新测试框架**: 更新 `src/types/test-frameworks.ts`
2. **新编程语言**: 添加到 `src/types/tdd.ts` 并实现相应服务
3. **新工具**: 在 `src/handlers/tools.ts` 中添加，包含适当的schema

## 📄 开源协议

MIT License - 详见 [LICENSE](LICENSE) 文件。

## 🆘 获取支持

- 🐛 **Bug报告**: [Gitee Issues](https://gitee.com/laonayan/tdd-mcp-server/issues)
- 💬 **讨论交流**: [Gitee Discussions](https://gitee.com/laonayan/tdd-mcp-server/issues)

---

**🎯 立即开始使用AI辅助的TDD开发！**

通过智能化的测试驱动开发支持，在所有主要AI编程助手中转变你的开发工作流。