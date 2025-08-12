export type SupportedLocale = 'zh' | 'en';

export interface LocalizedError {
  code: number;
  message: string;
  data?: unknown;
}

export interface ToolDescription {
  title: string;
  description: string;
}

export interface CommandHints {
  [command: string]: string;
}

export interface MessageDictionary {
  [key: string]: string;
}

export interface I18nMessages {
  [locale: string]: MessageDictionary;
}

// 消息字典
const messages: I18nMessages = {
  zh: {
    // TDD工具相关
    'tdd.title': 'TDD开发工具',
    'tdd.description': '测试驱动开发的核心工作流工具',
    'tdd.command.generate.hint': '根据需求描述生成全面的测试用例，支持多种测试框架',
    'tdd.command.implement.hint': '基于测试代码生成最小化实现，遵循TDD原则',
    'tdd.command.test.hint': '执行项目测试并返回详细结果和错误信息',
    'tdd.command.coverage.hint': '分析测试覆盖率，识别未测试的代码区域',
    'tdd.command.refactor.hint': '提供代码重构建议，保持测试通过的前提下改进代码',
    'tdd.command.validate.hint': '检查是否正确遵循红绿重构的TDD循环',
    
    // Feature工具相关
    'feature.title': '功能管理',
    'feature.description': '项目功能的全生命周期管理',
    
    // Tracking工具相关
    'tracking.title': '测试跟踪',
    'tracking.description': '测试方法级别的执行跟踪管理',
    
    // 错误消息
    'error.validation_failed': '字段验证失败: {{field}}',
    'error.invalid_params': '输入参数验证失败',
    'error.tool_execution_failed': '工具执行失败',
  },
  en: {
    // TDD工具相关
    'tdd.title': 'TDD Development Tool',
    'tdd.description': 'Core workflow tool for Test-Driven Development',
    'tdd.command.generate.hint': 'Generate comprehensive test cases from requirements, supporting multiple testing frameworks',
    'tdd.command.implement.hint': 'Generate minimal implementation from test code, following TDD principles',
    'tdd.command.test.hint': 'Execute project tests and return detailed results and error information',
    'tdd.command.coverage.hint': 'Analyze test coverage and identify untested code areas',
    'tdd.command.refactor.hint': 'Provide code refactoring suggestions while keeping tests passing',
    'tdd.command.validate.hint': 'Check if the red-green-refactor TDD cycle is being followed correctly',
    
    // Feature工具相关
    'feature.title': 'Feature Management',
    'feature.description': 'Full lifecycle management of project features',
    
    // Tracking工具相关
    'tracking.title': 'Test Tracking',
    'tracking.description': 'Execution tracking management at test method level',
    
    // 错误消息
    'error.validation_failed': 'Validation failed for field: {{field}}',
    'error.invalid_params': 'Input parameter validation failed',
    'error.tool_execution_failed': 'Tool execution failed',
  }
};

// 错误代码映射
const errorCodes = {
  'INVALID_PARAMS': -31002,
  'TOOL_EXECUTION_ERROR': -31001,
  'RESOURCE_NOT_FOUND': -31003,
} as const;

export class I18nService {
  private currentLocale: SupportedLocale = 'en';
  private readonly supportedLocales: SupportedLocale[] = ['zh', 'en'];
  private readonly defaultLocale: SupportedLocale = 'en';

  getCurrentLocale(): SupportedLocale {
    return this.currentLocale;
  }

  setLocale(locale: SupportedLocale): void {
    if (!this.supportedLocales.includes(locale)) {
      throw new Error(`Unsupported locale: ${locale}`);
    }
    this.currentLocale = locale;
  }

  t(key: string, params?: Record<string, string>): string {
    const message = this.getMessage(key, this.currentLocale);
    return this.interpolateMessage(message, params);
  }

  private getMessage(key: string, locale: SupportedLocale): string {
    return messages[locale]?.[key] || 
           messages[this.defaultLocale]?.[key] || 
           key;
  }

  private interpolateMessage(message: string, params?: Record<string, string>): string {
    if (!params) {
      return message;
    }

    return Object.entries(params).reduce((msg, [key, value]) => {
      return msg.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }, message);
  }

  getToolDescription(toolName: string, locale?: SupportedLocale): ToolDescription {
    const targetLocale = locale || this.currentLocale;
    return {
      title: this.getMessage(`${toolName}.title`, targetLocale),
      description: this.getMessage(`${toolName}.description`, targetLocale),
    };
  }

  getCommandHints(toolName: string, locale?: SupportedLocale): CommandHints {
    const targetLocale = locale || this.currentLocale;
    const hints: CommandHints = {};
    
    // 获取所有命令提示
    const commands = ['generate', 'implement', 'test', 'coverage', 'refactor', 'validate'];
    commands.forEach(command => {
      const key = `${toolName}.command.${command}.hint`;
      const hint = this.getMessage(key, targetLocale);
      if (hint !== key) { // 只有找到翻译才添加
        hints[command] = hint;
      }
    });
    
    return hints;
  }

  createLocalizedError(
    errorType: keyof typeof errorCodes,
    locale?: SupportedLocale,
    data?: unknown
  ): LocalizedError {
    const targetLocale = locale || this.currentLocale;
    
    // 获取错误消息
    const messageKey = `error.${errorType.toLowerCase()}`;
    const message = this.getMessage(messageKey, targetLocale);

    return {
      code: errorCodes[errorType],
      message,
      data
    };
  }

  // 静态方法用于创建单例
  private static instance?: I18nService;
  
  static getInstance(): I18nService {
    if (!this.instance) {
      this.instance = new I18nService();
    }
    return this.instance;
  }
}