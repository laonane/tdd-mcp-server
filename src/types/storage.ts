import { z } from 'zod';

// 功能特性状态
export enum FeatureStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled'
}

// 功能特性优先级
export enum FeaturePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// TDD 阶段
export enum TDDStage {
  RED = 'red',        // 编写失败测试
  GREEN = 'green',    // 编写最小实现
  REFACTOR = 'refactor' // 重构代码
}

// 功能特性进度信息
export const ProgressInfoSchema = z.object({
  testsWritten: z.number().min(0),
  testsPass: z.number().min(0),
  implementationFiles: z.array(z.string()),
  coveragePercentage: z.number().min(0).max(100).optional(),
});

// 功能特性
export const FeatureSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string().min(1),
  description: z.string(),
  status: z.nativeEnum(FeatureStatus),
  priority: z.nativeEnum(FeaturePriority),
  acceptanceCriteria: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
  progress: ProgressInfoSchema.optional(),
  tags: z.array(z.string()).optional(),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().positive().optional(),
  assignee: z.string().optional(),
});

// TDD 会话
export const TDDSessionSchema = z.object({
  id: z.string(),
  featureId: z.string(),
  projectId: z.string(),
  developer: z.string(),
  stage: z.nativeEnum(TDDStage),
  startedAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
  notes: z.string().optional(),
  cycleCount: z.number().min(0),
  testFiles: z.array(z.string()).optional(),
  implementationFiles: z.array(z.string()).optional(),
});

// 测试执行结果
export const TestExecutionResultSchema = z.object({
  duration: z.number().min(0),
  passed: z.boolean(),
  output: z.string().optional(),
  error: z.string().optional(),
  coverage: z.number().min(0).max(100).optional(),
});

// 测试方法
export const TestMethodSchema = z.object({
  id: z.string(),
  featureId: z.string(),
  projectId: z.string(),
  name: z.string().min(1),
  filePath: z.string(),
  status: z.enum(['passed', 'failed', 'skipped', 'pending']),
  framework: z.string(),
  createdAt: z.date(),
  lastExecutedAt: z.date().optional(),
  executionResults: TestExecutionResultSchema.optional(),
  testType: z.enum(['unit', 'integration', 'e2e', 'performance']).optional(),
  dependencies: z.array(z.string()).optional(),
});

// 文件关联
export const FileAssociationSchema = z.object({
  id: z.string(),
  featureId: z.string(),
  projectId: z.string(),
  filePath: z.string(),
  fileType: z.enum(['test', 'implementation', 'config', 'documentation']),
  createdAt: z.date(),
  lastModified: z.date(),
  size: z.number().min(0),
  lineCount: z.number().min(0).optional(),
});

// 项目配置
export const ProjectConfigSchema = z.object({
  projectId: z.string(),
  localPath: z.string(),
  defaultPriority: z.nativeEnum(FeaturePriority),
  defaultDeveloper: z.string(),
  testFramework: z.string(),
  testTimeout: z.number().positive(),
  autoRegisterTests: z.boolean(),
  coverageThreshold: z.number().min(0).max(100),
  excludePatterns: z.array(z.string()).optional(),
  includePatterns: z.array(z.string()).optional(),
});

// 存储服务接口
export interface IStorageService {
  // 功能特性管理
  saveFeature(feature: Feature): Promise<void>;
  loadFeature(id: string): Promise<Feature | null>;
  listFeatures(projectId: string): Promise<Feature[]>;
  deleteFeature(id: string): Promise<boolean>;
  updateFeatureStatus(id: string, status: FeatureStatus): Promise<boolean>;

  // TDD 会话管理
  saveTDDSession(session: TDDSession): Promise<void>;
  loadTDDSession(id: string): Promise<TDDSession | null>;
  listTDDSessions(projectId: string): Promise<TDDSession[]>;
  updateTDDSessionStage(id: string, stage: TDDStage): Promise<boolean>;

  // 测试方法管理
  registerTestMethod(method: TestMethod): Promise<void>;
  loadTestMethod(id: string): Promise<TestMethod | null>;
  listTestMethods(featureId: string): Promise<TestMethod[]>;
  updateTestExecutionResult(methodId: string, result: TestExecutionResult): Promise<boolean>;
  updateTestMethodStatus(methodId: string, status: string): Promise<boolean>;

  // 文件关联管理
  saveFileAssociation(association: FileAssociation): Promise<void>;
  listFileAssociations(featureId: string): Promise<FileAssociation[]>;
  deleteFileAssociation(id: string): Promise<boolean>;
}

// 类型推断
export type ProgressInfo = z.infer<typeof ProgressInfoSchema>;
export type Feature = z.infer<typeof FeatureSchema>;
export type TDDSession = z.infer<typeof TDDSessionSchema>;
export type TestExecutionResult = z.infer<typeof TestExecutionResultSchema>;
export type TestMethod = z.infer<typeof TestMethodSchema>;
export type FileAssociation = z.infer<typeof FileAssociationSchema>;
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

// 工具参数类型
export interface CreateFeatureParams {
  name: string;
  description: string;
  projectId?: string;
  priority?: FeaturePriority;
  acceptanceCriteria: string[];
  tags?: string[];
  estimatedHours?: number;
  assignee?: string;
}

export interface UpdateFeatureStatusParams {
  featureId: string;
  status: FeatureStatus;
  progress?: Partial<ProgressInfo>;
  notes?: string;
}

export interface CreateTDDSessionParams {
  featureId: string;
  developer: string;
  projectId?: string;
  initialNotes?: string;
}

export interface UpdateTDDStageParams {
  sessionId: string;
  stage: TDDStage;
  notes?: string;
  testFiles?: string[];
  implementationFiles?: string[];
}

export interface LinkFeatureFilesParams {
  featureId: string;
  filePaths: string[];
  fileType: 'test' | 'implementation' | 'config' | 'documentation';
}

export interface RegisterTestMethodParams {
  featureId: string;
  name: string;
  filePath: string;
  framework: string;
  testType?: 'unit' | 'integration' | 'e2e' | 'performance';
  projectId?: string;
}