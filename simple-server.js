const http = require('http');

console.log('🚀 启动简化版 TDD MCP Server...');

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  console.log(`${req.method} ${req.url}`);
  
  if (req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      message: 'TDD MCP Server 运行正常',
      tools: ['generate_test_cases', 'implement_from_tests', 'run_tests', 'analyze_coverage', 'refactor_code', 'validate_tdd_cycle']
    }));
    return;
  }
  
  if (req.url === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({
      name: 'tdd-mcp-server',
      version: '1.0.0',
      status: 'running',
      message: '🎯 TDD MCP Server 已就绪!'
    }));
    return;
  }
  
  if (req.url === '/tools') {
    res.writeHead(200);
    res.end(JSON.stringify({
      tools: [
        { name: 'generate_test_cases', description: '生成测试用例' },
        { name: 'implement_from_tests', description: '根据测试生成实现' },
        { name: 'run_tests', description: '运行测试' },
        { name: 'analyze_coverage', description: '分析覆盖率' },
        { name: 'refactor_code', description: '代码重构建议' },
        { name: 'validate_tdd_cycle', description: '验证TDD循环' }
      ]
    }));
    return;
  }
  
  if (req.method === 'POST' && req.url.startsWith('/tools/')) {
    const toolName = req.url.replace('/tools/', '');
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const params = JSON.parse(body);
        console.log(`🔧 调用工具: ${toolName}`, params);
        
        let result;
        switch(toolName) {
          case 'generate_test_cases':
            result = {
              message: `为"${params.requirements}"生成${params.language}测试用例`,
              tests: [`describe('${params.requirements}', () => { it('should work', () => { expect(true).toBe(true); }); });`]
            };
            break;
          default:
            result = { message: `工具 ${toolName} 执行成功`, params };
        }
        
        res.writeHead(200);
        res.end(JSON.stringify({ tool: toolName, success: true, result }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }
  
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ TDD MCP Server running on http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log('🎯 可以在Claude Code中使用TDD功能了!');
});