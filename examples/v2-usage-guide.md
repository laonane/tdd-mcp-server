# TDD MCP Server v2.0 使用示例

本文档展示TDD MCP Server v2.0的新功能和使用方法。

## 新功能特性

### 1. 简化的工具架构
- **之前**: 15个独立工具
- **现在**: 3个主工具 + 子命令支持

### 2. 完整国际化支持
- 支持中英文动态切换
- 所有工具描述、参数说明、错误信息都本地化

### 3. Session自动管理
- 无需手动创建TDD会话
- 自动跟踪RED→GREEN→REFACTOR循环

## 快速开始

### 配置Claude Code
```bash
claude mcp add tdd-server-v2 node "/path/to/tdd-mcp-server/dist/server.js" \
  -e USE_NEW_TOOLS=true \
  -e DEFAULT_LOCALE=zh \
  -e PROJECT_PATH="."
```

### 基本使用

#### 1. 完整TDD流程（推荐）
```javascript
// 中文模式 - 一键完成完整TDD流程
tdd({
  requirements: "实现用户登录功能，包括邮箱验证、密码加密、JWT令牌生成"
})
```

**输出示例**：
```
完整TDD流程执行完成:
✅ 生成测试用例
✅ 生成最小实现
✅ 运行测试
✅ 分析覆盖率
✅ 提供重构建议
```

#### 2. 分步TDD流程

**第一步：RED阶段 - 生成测试用例**
```javascript
tdd({
  command: "generate",
  requirements: "用户登录功能",
  language: "typescript",
  framework: "jest",
  testType: "unit"
})
```

**第二步：GREEN阶段 - 生成实现代码**
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

**第三步：REFACTOR阶段 - 重构代码**
```javascript
tdd({
  command: "refactor",
  sourceCode: "..."
})
```

#### 3. 功能管理

**创建新功能**
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

**查找相似功能**
```javascript
feature({
  command: "find",
  query: "用户认证 登录 密码"
})
```

#### 4. 测试跟踪

**注册测试方法**
```javascript
tracking({
  featureId: "user-auth-feature",
  name: "test_user_login_success",
  filePath: "./src/__tests__/auth.test.ts",
  framework: "jest",
  testType: "unit"
})
```

## 多语言对比

### 中文模式
```javascript
// 工具列表 - 中文描述
{
  "name": "tdd",
  "description": "测试驱动开发的核心工作流工具",
  "properties": {
    "command": {
      "description": "子命令（可选，默认执行完整流程）"
    },
    "requirements": {
      "description": "功能需求描述"
    }
  }
}
```

### 英文模式  
```javascript
// 工具列表 - 英文描述
{
  "name": "tdd", 
  "description": "Core workflow tool for Test-Driven Development",
  "properties": {
    "command": {
      "description": "Subcommand (optional, default full workflow)"
    },
    "requirements": {
      "description": "Feature requirements description"
    }
  }
}
```

## 高级用法

### 1. 自定义TDD工作流
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
```

### 2. 功能生命周期管理
```javascript
// 创建功能
const feature = feature({
  name: "商品推荐系统",
  description: "基于用户行为的个性化商品推荐"
})

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

// 关联文件
feature({
  command: "link", 
  featureId: "feature-123",
  filePaths: [
    "./src/recommendation.service.ts",
    "./src/__tests__/recommendation.test.ts"
  ],
  fileType: "implementation"
})
```

### 3. 测试方法跟踪
```javascript
// 注册测试方法
const testMethod = tracking({
  featureId: "recommendation-feature",
  name: "test_recommendation_algorithm",
  filePath: "./src/__tests__/recommendation.test.ts",
  framework: "jest"
})

// 更新执行结果
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

## 旧版本兼容性

如果需要使用旧的15个工具系统：

```bash
# 启动旧工具系统
USE_NEW_TOOLS=false node dist/server.js
```

旧工具名称保持不变：
- `generate_test_cases`
- `implement_from_tests` 
- `createFeature`
- `createTDDSession`
- 等等...

## 性能优化

### 1. Session自动管理
- 新系统自动创建和管理TDD会话
- 无需手动调用`createTDDSession`
- 自动跟踪RED→GREEN→REFACTOR阶段

### 2. 简化的API
- 3个主工具替代15个工具
- 减少AI工具的工具切换开销
- 更直观的子命令结构

### 3. 智能默认值
- 大多数参数都有合理的默认值
- 自动检测项目语言和框架
- 减少必需参数数量

## 错误处理

所有错误信息支持本地化：

```javascript
// 中文错误
{
  "isError": true,
  "content": [{
    "type": "text", 
    "text": "输入参数验证失败"
  }]
}

// 英文错误  
{
  "isError": true,
  "content": [{
    "type": "text",
    "text": "Input parameter validation failed"
  }]
}
```

## 最佳实践

1. **推荐使用新工具系统**：更简洁、功能更强大
2. **合理使用locale参数**：根据团队语言偏好设置
3. **善用默认行为**：不指定command时自动执行完整TDD流程
4. **结合功能管理**：使用feature工具管理项目功能
5. **定期验证TDD循环**：使用validate子命令检查TDD实践

## 技术支持

如果遇到问题：
1. 运行集成测试：`./integration-test.sh`
2. 检查环境变量配置
3. 查看详细错误日志
4. 参考 README.md文档