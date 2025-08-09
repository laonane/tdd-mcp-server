import { z } from 'zod';

// TDD周期状态
export enum TDDCycleState {
  RED = 'red',
  GREEN = 'green',
  REFACTOR = 'refactor',
}

// 测试类型
export enum TestType {
  UNIT = 'unit',
  INTEGRATION = 'integration',
  E2E = 'e2e',
  PERFORMANCE = 'performance',
}

// 编程语言
export enum SupportedLanguage {
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript',
  PYTHON = 'python',
  JAVA = 'java',
  CSHARP = 'csharp',
  GO = 'go',
  RUST = 'rust',
  PHP = 'php',
}

// 生成的测试用例
export const GeneratedTestSchema = z.object({
  name: z.string(),
  description: z.string(),
  code: z.string(),
  imports: z.array(z.string()).optional(),
  setup: z.string().optional(),
  teardown: z.string().optional(),
});

export const GeneratedTestsSchema = z.object({
  language: z.nativeEnum(SupportedLanguage),
  framework: z.string(),
  testType: z.nativeEnum(TestType),
  tests: z.array(GeneratedTestSchema),
  metadata: z.object({
    generatedAt: z.date(),
    requirements: z.string(),
    estimatedCoverage: z.number().min(0).max(100).optional(),
  }),
});

// 生成的实现代码
export const GeneratedImplementationSchema = z.object({
  language: z.nativeEnum(SupportedLanguage),
  code: z.string(),
  imports: z.array(z.string()).optional(),
  exports: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
  metadata: z.object({
    generatedAt: z.date(),
    basedOnTests: z.array(z.string()),
    implementationStyle: z.string(),
  }),
});

// 测试运行结果
export const TestResultSchema = z.object({
  name: z.string(),
  status: z.enum(['passed', 'failed', 'skipped', 'pending']),
  duration: z.number(),
  error: z.string().optional(),
  output: z.string().optional(),
});

export const TestSuiteResultSchema = z.object({
  name: z.string(),
  tests: z.array(TestResultSchema),
  summary: z.object({
    total: z.number(),
    passed: z.number(),
    failed: z.number(),
    skipped: z.number(),
    duration: z.number(),
  }),
});

export const TestResultsSchema = z.object({
  framework: z.string(),
  suites: z.array(TestSuiteResultSchema),
  overall: z.object({
    total: z.number(),
    passed: z.number(),
    failed: z.number(),
    skipped: z.number(),
    duration: z.number(),
    coverage: z.number().min(0).max(100).optional(),
  }),
  timestamp: z.date(),
});

// 覆盖率报告
export const CoverageFileSchema = z.object({
  path: z.string(),
  lines: z.object({
    total: z.number(),
    covered: z.number(),
    percentage: z.number().min(0).max(100),
  }),
  functions: z.object({
    total: z.number(),
    covered: z.number(),
    percentage: z.number().min(0).max(100),
  }),
  branches: z.object({
    total: z.number(),
    covered: z.number(),
    percentage: z.number().min(0).max(100),
  }),
});

export const CoverageReportSchema = z.object({
  files: z.array(CoverageFileSchema),
  overall: z.object({
    lines: z.number().min(0).max(100),
    functions: z.number().min(0).max(100),
    branches: z.number().min(0).max(100),
    statements: z.number().min(0).max(100),
  }),
  threshold: z.object({
    lines: z.number().min(0).max(100).optional(),
    functions: z.number().min(0).max(100).optional(),
    branches: z.number().min(0).max(100).optional(),
    statements: z.number().min(0).max(100).optional(),
  }).optional(),
  timestamp: z.date(),
});

// 重构建议
export const RefactoringSchema = z.object({
  type: z.enum([
    'extract_method',
    'remove_duplication',
    'improve_naming',
    'simplify_conditional',
    'extract_class',
    'move_method',
  ]),
  description: z.string(),
  before: z.string(),
  after: z.string(),
  rationale: z.string(),
  impact: z.enum(['low', 'medium', 'high']),
});

export const RefactoredCodeSchema = z.object({
  originalCode: z.string(),
  refactoredCode: z.string(),
  refactorings: z.array(RefactoringSchema),
  preservesTests: z.boolean(),
  metadata: z.object({
    refactoredAt: z.date(),
    refactoringGoals: z.array(z.string()),
  }),
});

// TDD循环验证
export const TDDCycleValidationSchema = z.object({
  isValid: z.boolean(),
  currentState: z.nativeEnum(TDDCycleState),
  violations: z.array(z.object({
    type: z.enum(['no_failing_test', 'premature_implementation', 'skipped_refactor']),
    description: z.string(),
    suggestion: z.string(),
  })),
  suggestions: z.array(z.string()),
  score: z.number().min(0).max(100),
});

// TDD上下文
export const TDDContextSchema = z.object({
  projectPath: z.string(),
  language: z.nativeEnum(SupportedLanguage),
  testFramework: z.string(),
  currentCycle: z.nativeEnum(TDDCycleState),
  testFiles: z.array(z.string()),
  implementationFiles: z.array(z.string()),
  lastTestRun: TestResultsSchema.optional(),
  lastCoverage: CoverageReportSchema.optional(),
});

// 导出所有类型
export type GeneratedTest = z.infer<typeof GeneratedTestSchema>;
export type GeneratedTests = z.infer<typeof GeneratedTestsSchema>;
export type GeneratedImplementation = z.infer<typeof GeneratedImplementationSchema>;
export type TestResult = z.infer<typeof TestResultSchema>;
export type TestSuiteResult = z.infer<typeof TestSuiteResultSchema>;
export type TestResults = z.infer<typeof TestResultsSchema>;
export type CoverageFile = z.infer<typeof CoverageFileSchema>;
export type CoverageReport = z.infer<typeof CoverageReportSchema>;
export type Refactoring = z.infer<typeof RefactoringSchema>;
export type RefactoredCode = z.infer<typeof RefactoredCodeSchema>;
export type TDDCycleValidation = z.infer<typeof TDDCycleValidationSchema>;
export type TDDContext = z.infer<typeof TDDContextSchema>;