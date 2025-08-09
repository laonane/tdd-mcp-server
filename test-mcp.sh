#!/bin/bash

echo "🔍 测试TDD MCP服务器连接..."

# 1. 检查服务器文件
if [ -f "stdio-server.js" ]; then
    echo "✅ MCP服务器文件存在"
else 
    echo "❌ MCP服务器文件不存在"
    exit 1
fi

# 2. 测试初始化
echo "📡 测试初始化..."
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | timeout 3s node stdio-server.js

# 3. 测试工具列表  
echo "🔧 测试工具列表..."
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | timeout 3s node stdio-server.js

echo "✅ MCP服务器测试完成"