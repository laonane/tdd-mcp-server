import { I18nService } from '../i18n.js';

describe('I18nService', () => {
  let i18nService: I18nService;

  beforeEach(() => {
    i18nService = new I18nService();
  });

  describe('基础功能测试', () => {
    test('应该能够检测默认语言', () => {
      expect(i18nService.getCurrentLocale()).toBe('en');
    });

    test('应该能够设置语言', () => {
      i18nService.setLocale('zh');
      expect(i18nService.getCurrentLocale()).toBe('zh');
    });

    test('应该拒绝不支持的语言', () => {
      expect(() => i18nService.setLocale('fr' as any)).toThrow('Unsupported locale: fr');
    });
  });

  describe('消息翻译测试', () => {
    test('应该能够获取英文消息', () => {
      i18nService.setLocale('en');
      expect(i18nService.t('tdd.title')).toBe('TDD Development Tool');
      expect(i18nService.t('tdd.description')).toBe('Core workflow tool for Test-Driven Development');
    });

    test('应该能够获取中文消息', () => {
      i18nService.setLocale('zh');
      expect(i18nService.t('tdd.title')).toBe('TDD开发工具');
      expect(i18nService.t('tdd.description')).toBe('测试驱动开发的核心工作流工具');
    });

    test('应该支持消息插值', () => {
      i18nService.setLocale('en');
      expect(i18nService.t('error.validation_failed', { field: 'requirements' }))
        .toBe('Validation failed for field: requirements');
      
      i18nService.setLocale('zh');
      expect(i18nService.t('error.validation_failed', { field: 'requirements' }))
        .toBe('字段验证失败: requirements');
    });

    test('应该返回未找到消息的键名', () => {
      expect(i18nService.t('unknown.key')).toBe('unknown.key');
    });
  });

  describe('工具描述本地化测试', () => {
    test('应该能够获取本地化的工具描述', () => {
      const toolDesc = i18nService.getToolDescription('tdd', 'en');
      expect(toolDesc.title).toBe('TDD Development Tool');
      expect(toolDesc.description).toContain('Test-Driven Development');
    });

    test('应该能够获取本地化的子命令提示', () => {
      const hints = i18nService.getCommandHints('tdd', 'zh');
      expect(hints.generate).toBe('根据需求描述生成全面的测试用例，支持多种测试框架');
      expect(hints.implement).toBe('基于测试代码生成最小化实现，遵循TDD原则');
    });
  });

  describe('错误消息本地化测试', () => {
    test('应该能够创建本地化错误', () => {
      const error = i18nService.createLocalizedError(
        'INVALID_PARAMS',
        'zh',
        { field: 'requirements' }
      );
      
      expect(error.code).toBe(-31002);
      expect(error.message).toBe('输入参数验证失败');
      expect(error.data).toEqual({ field: 'requirements' });
    });

    test('应该回退到默认语言', () => {
      const error = i18nService.createLocalizedError(
        'INVALID_PARAMS',
        'fr' as any
      );
      
      expect(error.message).toBe('Input parameter validation failed');
    });
  });
});