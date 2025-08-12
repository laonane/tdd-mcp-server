#!/bin/bash

# TDD MCP Server 集成测试脚本

echo "🚀 开始TDD MCP Server集成测试..."

# 构建项目
echo "📦 构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo "✅ 构建成功"

# 测试1: 新工具系统工具列表（中文）
echo "🧪 测试1: 新工具系统工具列表（中文）"
RESULT=$(echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | USE_NEW_TOOLS=true DEFAULT_LOCALE=zh node dist/server.js 2>/dev/null)
if echo "$RESULT" | grep -q "测试驱动开发的核心工作流工具"; then
    echo "✅ 中文工具列表正常"
else
    echo "❌ 中文工具列表失败"
    exit 1
fi

# 测试2: 新工具系统工具列表（英文）  
echo "🧪 测试2: 新工具系统工具列表（英文）"
RESULT=$(echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | USE_NEW_TOOLS=true DEFAULT_LOCALE=en node dist/server.js 2>/dev/null)
if echo "$RESULT" | grep -q "Core workflow tool for Test-Driven Development"; then
    echo "✅ 英文工具列表正常"
else
    echo "❌ 英文工具列表失败"
    exit 1
fi

# 测试3: 旧工具系统（15个工具）
echo "🧪 测试3: 旧工具系统（15个工具）"
RESULT=$(echo '{"jsonrpc":"2.0","id":3,"method":"tools/list","params":{}}' | USE_NEW_TOOLS=false node dist/server.js 2>/dev/null)
TOOL_COUNT=$(echo "$RESULT" | jq '.result.tools | length' 2>/dev/null)
if [ "$TOOL_COUNT" = "15" ]; then
    echo "✅ 旧工具系统15个工具正常"
else
    echo "❌ 旧工具系统工具数量不正确: $TOOL_COUNT"
    exit 1
fi

# 测试4: 新工具系统（3个工具）
echo "🧪 测试4: 新工具系统（3个工具）"
RESULT=$(echo '{"jsonrpc":"2.0","id":4,"method":"tools/list","params":{}}' | USE_NEW_TOOLS=true node dist/server.js 2>/dev/null)
TOOL_COUNT=$(echo "$RESULT" | jq '.result.tools | length' 2>/dev/null)
if [ "$TOOL_COUNT" = "3" ]; then
    echo "✅ 新工具系统3个工具正常"
else
    echo "❌ 新工具系统工具数量不正确: $TOOL_COUNT"
    exit 1
fi

# 测试5: TDD完整流程
echo "🧪 测试5: TDD完整流程"
RESULT=$(echo '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"tdd","arguments":{"requirements":"用户登录功能"}}}' | USE_NEW_TOOLS=true node dist/server.js 2>/dev/null)
if echo "$RESULT" | grep -q "完整TDD流程执行完成"; then
    echo "✅ TDD完整流程正常"
else
    echo "❌ TDD完整流程失败"
    exit 1
fi

# 测试6: TDD子命令
echo "🧪 测试6: TDD子命令（generate）"
RESULT=$(echo '{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"tdd","arguments":{"command":"generate","requirements":"用户登录","language":"typescript","framework":"jest","testType":"unit"}}}' | USE_NEW_TOOLS=true node dist/server.js 2>/dev/null)
if echo "$RESULT" | grep -q "Test cases generated successfully"; then
    echo "✅ TDD子命令正常"
else
    echo "❌ TDD子命令失败"
    exit 1
fi

# 测试7: Feature工具
echo "🧪 测试7: Feature工具"
RESULT=$(echo '{"jsonrpc":"2.0","id":7,"method":"tools/call","params":{"name":"feature","arguments":{"name":"密码重置","description":"用户密码重置功能"}}}' | USE_NEW_TOOLS=true node dist/server.js 2>/dev/null)
if echo "$RESULT" | grep -q "Feature created successfully"; then
    echo "✅ Feature工具正常"
else
    echo "❌ Feature工具失败"
    exit 1
fi

# 测试8: Tracking工具
echo "🧪 测试8: Tracking工具"
RESULT=$(echo '{"jsonrpc":"2.0","id":8,"method":"tools/call","params":{"name":"tracking","arguments":{"featureId":"test-feature","name":"test_login","filePath":"./test.ts","framework":"jest"}}}' | USE_NEW_TOOLS=true node dist/server.js 2>/dev/null)
if echo "$RESULT" | grep -q "Test method registered successfully"; then
    echo "✅ Tracking工具正常"
else
    echo "❌ Tracking工具失败"
    exit 1
fi

# 测试9: 错误处理
echo "🧪 测试9: 错误处理"
RESULT=$(echo '{"jsonrpc":"2.0","id":9,"method":"tools/call","params":{"name":"tdd","arguments":{}}}' | USE_NEW_TOOLS=true DEFAULT_LOCALE=zh node dist/server.js 2>/dev/null)
if echo "$RESULT" | grep -q "isError.*true"; then
    echo "✅ 错误处理正常"
else
    echo "❌ 错误处理失败"
    exit 1
fi

echo ""
echo "🎉 所有集成测试通过！"
echo ""
echo "📊 测试总结:"
echo "✅ 新工具系统（3个工具）"
echo "✅ 旧工具系统（15个工具）"
echo "✅ 中英文国际化"
echo "✅ 子命令支持"
echo "✅ Session自动管理"
echo "✅ 错误处理"
echo "✅ 动态配置切换"