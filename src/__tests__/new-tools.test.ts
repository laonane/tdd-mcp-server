import { NewToolsHandler } from '../handlers/new-tools.js';
import { I18nService } from '../i18n.js';

describe('NewToolsHandler', () => {
  let toolsHandler: NewToolsHandler;
  let i18nService: I18nService;

  beforeEach(() => {
    i18nService = new I18nService();
    toolsHandler = new NewToolsHandler(i18nService);
  });

  describe('工具列表测试', () => {
    test('应该返回3个主要工具', async () => {
      const result = await toolsHandler.listTools({ method: 'tools/list', params: {} });
      
      expect(result.tools).toHaveLength(3);
      expect(result.tools.map(t => t.name)).toEqual(['tdd', 'feature', 'tracking']);
    });

    test('应该支持中文工具描述', async () => {
      i18nService.setLocale('zh');
      const result = await toolsHandler.listTools({ method: 'tools/list', params: {} });
      
      const tddTool = result.tools.find(t => t.name === 'tdd');
      expect(tddTool?.description).toContain('测试驱动开发');
    });

    test('应该支持英文工具描述', async () => {
      i18nService.setLocale('en');
      const result = await toolsHandler.listTools({ method: 'tools/list', params: {} });
      
      const tddTool = result.tools.find(t => t.name === 'tdd');
      expect(tddTool?.description).toContain('Test-Driven Development');
    });
  });

  describe('TDD工具调用测试', () => {
    test('应该支持默认完整TDD流程', async () => {
      const result = await toolsHandler.callTool({
        method: 'tools/call',
        params: {
          name: 'tdd',
          arguments: {
            requirements: '用户登录功能'
          }
        }
      });

      expect(result.content).toBeDefined();
      expect(result.isError).toBeFalsy();
    });

    test('应该支持generate子命令', async () => {
      const result = await toolsHandler.callTool({
        method: 'tools/call',
        params: {
          name: 'tdd',
          arguments: {
            command: 'generate',
            requirements: '用户登录功能',
            language: 'typescript',
            framework: 'jest',
            testType: 'unit'
          }
        }
      });

      expect(result.content).toBeDefined();
      expect(result.isError).toBeFalsy();
    });

    test('应该支持implement子命令', async () => {
      const testCode = `
        describe('UserLogin', () => {
          test('should login with valid credentials', () => {
            // test implementation
          });
        });
      `;

      const result = await toolsHandler.callTool({
        method: 'tools/call',
        params: {
          name: 'tdd',
          arguments: {
            command: 'implement',
            testCode,
            language: 'typescript'
          }
        }
      });

      expect(result.content).toBeDefined();
      expect(result.isError).toBeFalsy();
    });

    test('应该处理无效的子命令', async () => {
      const result = await toolsHandler.callTool({
        method: 'tools/call',
        params: {
          name: 'tdd',
          arguments: {
            command: 'invalid',
            requirements: '测试'
          }
        }
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('invalid');
    });
  });

  describe('Feature工具调用测试', () => {
    test('应该支持默认创建功能', async () => {
      const result = await toolsHandler.callTool({
        method: 'tools/call',
        params: {
          name: 'feature',
          arguments: {
            name: '用户认证',
            description: '实现用户登录和注册功能'
          }
        }
      });

      expect(result.content).toBeDefined();
      expect(result.isError).toBeFalsy();
    });

    test('应该支持find子命令', async () => {
      const result = await toolsHandler.callTool({
        method: 'tools/call',
        params: {
          name: 'feature',
          arguments: {
            command: 'find',
            query: '用户登录'
          }
        }
      });

      expect(result.content).toBeDefined();
      expect(result.isError).toBeFalsy();
    });
  });

  describe('Tracking工具调用测试', () => {
    test('应该支持默认注册测试方法', async () => {
      const result = await toolsHandler.callTool({
        method: 'tools/call',
        params: {
          name: 'tracking',
          arguments: {
            featureId: 'feature-123',
            name: 'test_user_login',
            filePath: './src/__tests__/user.test.ts',
            framework: 'jest'
          }
        }
      });

      expect(result.content).toBeDefined();
      expect(result.isError).toBeFalsy();
    });
  });

  describe('错误处理测试', () => {
    test('应该处理未知工具', async () => {
      const result = await toolsHandler.callTool({
        method: 'tools/call',
        params: {
          name: 'unknown',
          arguments: {}
        }
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unknown tool');
    });

    test('应该处理缺少必需参数', async () => {
      const result = await toolsHandler.callTool({
        method: 'tools/call',
        params: {
          name: 'tdd',
          arguments: {
            // 缺少 requirements
          }
        }
      });

      expect(result.isError).toBe(true);
    });

    test('应该返回本地化错误消息', async () => {
      i18nService.setLocale('zh');
      const result = await toolsHandler.callTool({
        method: 'tools/call',
        params: {
          name: 'tdd',
          arguments: {
          }
        }
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('验证失败');
    });
  });
});