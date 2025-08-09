import {
  CallToolRequest,
  CallToolResult,
  ListToolsRequest,
  ListToolsResult,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { TestGeneratorService } from '../services/test-generator.js';
import { CodeGeneratorService } from '../services/code-generator.js';
import { TestRunnerService } from '../services/test-runner.js';
import { CoverageAnalyzerService } from '../services/coverage-analyzer.js';
import { RefactoringService } from '../services/refactoring.js';
import { TDDCycleValidatorService } from '../services/tdd-cycle-validator.js';
import { FeatureManagementService } from '../services/feature-management.service.js';
import { StorageService } from '../services/storage.service.js';
import { TDDStage } from '../types/storage.js';

// Tool definitions
const TOOLS: Tool[] = [
  {
    name: 'generate_test_cases',
    description: 'Generate comprehensive test cases from requirements using TDD best practices',
    inputSchema: {
      type: 'object',
      properties: {
        requirements: {
          type: 'string',
          description: 'Detailed requirements for the feature to be tested',
        },
        language: {
          type: 'string',
          enum: ['typescript', 'javascript', 'python', 'java', 'csharp', 'go', 'rust', 'php'],
          description: 'Programming language for the tests',
        },
        framework: {
          type: 'string',
          description: 'Testing framework to use (e.g., jest, pytest, junit5)',
        },
        testType: {
          type: 'string',
          enum: ['unit', 'integration', 'e2e', 'performance'],
          description: 'Type of tests to generate',
        },
        existingCode: {
          type: 'string',
          description: 'Existing code to base tests on (optional)',
        },
      },
      required: ['requirements', 'language', 'framework', 'testType'],
    },
  },
  {
    name: 'implement_from_tests',
    description: 'Generate implementation code that passes the given tests',
    inputSchema: {
      type: 'object',
      properties: {
        testCode: {
          type: 'string',
          description: 'Test code that the implementation should satisfy',
        },
        language: {
          type: 'string',
          enum: ['typescript', 'javascript', 'python', 'java', 'csharp', 'go', 'rust', 'php'],
          description: 'Programming language for the implementation',
        },
        implementationStyle: {
          type: 'string',
          enum: ['minimal', 'comprehensive', 'production-ready'],
          description: 'Style of implementation to generate',
          default: 'minimal',
        },
        architecturalConstraints: {
          type: 'string',
          description: 'Architectural constraints or patterns to follow (optional)',
        },
      },
      required: ['testCode', 'language'],
    },
  },
  {
    name: 'run_tests',
    description: 'Execute tests and return detailed results',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project containing tests',
        },
        testFiles: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific test files to run (optional, runs all if not specified)',
        },
        testFramework: {
          type: 'string',
          description: 'Testing framework being used',
        },
        options: {
          type: 'object',
          properties: {
            verbose: { type: 'boolean', default: false },
            coverage: { type: 'boolean', default: false },
            watch: { type: 'boolean', default: false },
            parallel: { type: 'boolean', default: true },
          },
        },
      },
      required: ['projectPath', 'testFramework'],
    },
  },
  {
    name: 'analyze_coverage',
    description: 'Analyze code coverage and generate detailed reports',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project to analyze',
        },
        testCommand: {
          type: 'string',
          description: 'Command to run tests with coverage',
        },
        thresholds: {
          type: 'object',
          properties: {
            lines: { type: 'number', minimum: 0, maximum: 100 },
            functions: { type: 'number', minimum: 0, maximum: 100 },
            branches: { type: 'number', minimum: 0, maximum: 100 },
            statements: { type: 'number', minimum: 0, maximum: 100 },
          },
        },
        outputFormat: {
          type: 'string',
          enum: ['json', 'html', 'lcov', 'text'],
          default: 'json',
        },
      },
      required: ['projectPath', 'testCommand'],
    },
  },
  {
    name: 'refactor_code',
    description: 'Provide code refactoring suggestions and implementations',
    inputSchema: {
      type: 'object',
      properties: {
        sourceCode: {
          type: 'string',
          description: 'Source code to refactor',
        },
        refactorType: {
          type: 'string',
          enum: [
            'extract_method',
            'remove_duplication',
            'improve_naming',
            'simplify_conditional',
            'extract_class',
            'move_method',
          ],
          description: 'Type of refactoring to perform',
        },
        preserveTests: {
          type: 'boolean',
          default: true,
          description: 'Ensure refactoring preserves test compatibility',
        },
        refactoringGoals: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific refactoring goals or objectives',
        },
      },
      required: ['sourceCode', 'refactorType'],
    },
  },
  {
    name: 'validate_tdd_cycle',
    description: 'Validate adherence to TDD red-green-refactor cycle',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project to validate',
        },
        gitHistory: {
          type: 'array',
          items: { type: 'string' },
          description: 'Git commit history to analyze (optional)',
        },
        timeWindow: {
          type: 'string',
          description: 'Time window to analyze (e.g., "1 hour", "1 day")',
          default: '1 hour',
        },
      },
      required: ['projectPath'],
    },
  },
  // 新增的功能特性管理工具
  {
    name: 'createFeature',
    description: 'Create a new feature with TDD requirements and acceptance criteria',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the feature',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the feature',
        },
        acceptanceCriteria: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of acceptance criteria for the feature',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Priority level of the feature',
          default: 'medium',
        },
        projectId: {
          type: 'string',
          description: 'Project ID (optional, uses current project if not specified)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorizing the feature',
        },
        estimatedHours: {
          type: 'number',
          description: 'Estimated development hours',
        },
        assignee: {
          type: 'string',
          description: 'Developer assigned to this feature',
        },
      },
      required: ['name', 'description', 'acceptanceCriteria'],
    },
  },
  {
    name: 'updateFeatureStatus',
    description: 'Update the status and progress of a feature',
    inputSchema: {
      type: 'object',
      properties: {
        featureId: {
          type: 'string',
          description: 'Unique identifier of the feature',
        },
        status: {
          type: 'string',
          enum: ['planning', 'in_progress', 'completed', 'on_hold', 'cancelled'],
          description: 'New status of the feature',
        },
        progress: {
          type: 'object',
          properties: {
            testsWritten: { type: 'number' },
            testsPass: { type: 'number' },
            implementationFiles: { type: 'array', items: { type: 'string' } },
            coveragePercentage: { type: 'number', minimum: 0, maximum: 100 },
          },
          description: 'Progress information for the feature',
        },
        notes: {
          type: 'string',
          description: 'Additional notes about the status update',
        },
      },
      required: ['featureId', 'status'],
    },
  },
  {
    name: 'linkFeatureFiles',
    description: 'Associate files with a feature for tracking purposes',
    inputSchema: {
      type: 'object',
      properties: {
        featureId: {
          type: 'string',
          description: 'Unique identifier of the feature',
        },
        filePaths: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of file paths to associate with the feature',
        },
        fileType: {
          type: 'string',
          enum: ['test', 'implementation', 'config', 'documentation'],
          description: 'Type of files being associated',
        },
      },
      required: ['featureId', 'filePaths', 'fileType'],
    },
  },
  {
    name: 'findSimilarFeatures',
    description: 'Find features similar to a given description or query',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query or description to find similar features',
        },
        projectId: {
          type: 'string',
          description: 'Project ID to search within (optional)',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 10,
        },
        minSimilarity: {
          type: 'number',
          description: 'Minimum similarity threshold (0-1)',
          default: 0.3,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'createTDDSession',
    description: 'Start a new TDD development session for a feature',
    inputSchema: {
      type: 'object',
      properties: {
        featureId: {
          type: 'string',
          description: 'Feature ID this TDD session is for',
        },
        developer: {
          type: 'string',
          description: 'Name or identifier of the developer',
        },
        projectId: {
          type: 'string',
          description: 'Project ID (optional)',
        },
        initialNotes: {
          type: 'string',
          description: 'Initial notes for the session',
        },
      },
      required: ['featureId', 'developer'],
    },
  },
  {
    name: 'updateTDDStage',
    description: 'Update the current stage of a TDD session (RED/GREEN/REFACTOR)',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'TDD session identifier',
        },
        stage: {
          type: 'string',
          enum: ['red', 'green', 'refactor'],
          description: 'Current TDD cycle stage',
        },
        notes: {
          type: 'string',
          description: 'Notes about the stage transition',
        },
        testFiles: {
          type: 'array',
          items: { type: 'string' },
          description: 'Test files involved in this stage',
        },
        implementationFiles: {
          type: 'array',
          items: { type: 'string' },
          description: 'Implementation files involved in this stage',
        },
      },
      required: ['sessionId', 'stage'],
    },
  },
  {
    name: 'registerTestMethod',
    description: 'Register a test method with the system for tracking',
    inputSchema: {
      type: 'object',
      properties: {
        featureId: {
          type: 'string',
          description: 'Feature ID this test belongs to',
        },
        name: {
          type: 'string',
          description: 'Name of the test method',
        },
        filePath: {
          type: 'string',
          description: 'Path to the test file',
        },
        framework: {
          type: 'string',
          description: 'Testing framework being used',
        },
        testType: {
          type: 'string',
          enum: ['unit', 'integration', 'e2e', 'performance'],
          description: 'Type of test',
          default: 'unit',
        },
        projectId: {
          type: 'string',
          description: 'Project ID (optional)',
        },
      },
      required: ['featureId', 'name', 'filePath', 'framework'],
    },
  },
  {
    name: 'updateTestExecutionResult',
    description: 'Update the execution result of a test method',
    inputSchema: {
      type: 'object',
      properties: {
        methodId: {
          type: 'string',
          description: 'Test method identifier',
        },
        result: {
          type: 'object',
          properties: {
            duration: { type: 'number', description: 'Test execution duration in milliseconds' },
            passed: { type: 'boolean', description: 'Whether the test passed' },
            output: { type: 'string', description: 'Test output' },
            error: { type: 'string', description: 'Error message if test failed' },
            coverage: { type: 'number', description: 'Code coverage percentage' },
          },
          required: ['duration', 'passed'],
          description: 'Test execution result details',
        },
      },
      required: ['methodId', 'result'],
    },
  },
  {
    name: 'updateTestMethodStatus',
    description: 'Update the status of a test method',
    inputSchema: {
      type: 'object',
      properties: {
        methodId: {
          type: 'string',
          description: 'Test method identifier',
        },
        status: {
          type: 'string',
          enum: ['passed', 'failed', 'skipped', 'pending'],
          description: 'New status of the test method',
        },
      },
      required: ['methodId', 'status'],
    },
  },
];

// Service instances
const testGenerator = new TestGeneratorService();
const codeGenerator = new CodeGeneratorService();
const testRunner = new TestRunnerService();
const coverageAnalyzer = new CoverageAnalyzerService();
const refactoring = new RefactoringService();
const tddCycleValidator = new TDDCycleValidatorService();
const storageService = new StorageService();
const featureManagementService = new FeatureManagementService(storageService);

// Tool handlers
export const toolsHandler = {
  async listTools(_request: ListToolsRequest): Promise<ListToolsResult> {
    return {
      tools: TOOLS,
    };
  },

  async callTool(request: CallToolRequest): Promise<CallToolResult> {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'generate_test_cases':
          return await handleGenerateTestCases(args);
        case 'implement_from_tests':
          return await handleImplementFromTests(args);
        case 'run_tests':
          return await handleRunTests(args);
        case 'analyze_coverage':
          return await handleAnalyzeCoverage(args);
        case 'refactor_code':
          return await handleRefactorCode(args);
        case 'validate_tdd_cycle':
          return await handleValidateTDDCycle(args);
        // 新增的功能特性管理工具
        case 'createFeature':
          return await handleCreateFeature(args);
        case 'updateFeatureStatus':
          return await handleUpdateFeatureStatus(args);
        case 'linkFeatureFiles':
          return await handleLinkFeatureFiles(args);
        case 'findSimilarFeatures':
          return await handleFindSimilarFeatures(args);
        case 'createTDDSession':
          return await handleCreateTDDSession(args);
        case 'updateTDDStage':
          return await handleUpdateTDDStage(args);
        case 'registerTestMethod':
          return await handleRegisterTestMethod(args);
        case 'updateTestExecutionResult':
          return await handleUpdateTestExecutionResult(args);
        case 'updateTestMethodStatus':
          return await handleUpdateTestMethodStatus(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
};

// Individual tool handlers
async function handleGenerateTestCases(args: any): Promise<CallToolResult> {
  const result = await testGenerator.generateTests({
    requirements: args.requirements,
    language: args.language,
    framework: args.framework,
    testType: args.testType,
    existingCode: args.existingCode,
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

async function handleImplementFromTests(args: any): Promise<CallToolResult> {
  const result = await codeGenerator.generateImplementation({
    testCode: args.testCode,
    language: args.language,
    implementationStyle: args.implementationStyle || 'minimal',
    architecturalConstraints: args.architecturalConstraints,
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

async function handleRunTests(args: any): Promise<CallToolResult> {
  const result = await testRunner.runTests({
    projectPath: args.projectPath,
    testFiles: args.testFiles,
    testFramework: args.testFramework,
    options: args.options || {},
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

async function handleAnalyzeCoverage(args: any): Promise<CallToolResult> {
  const result = await coverageAnalyzer.analyzeCoverage({
    projectPath: args.projectPath,
    testCommand: args.testCommand,
    thresholds: args.thresholds,
    outputFormat: args.outputFormat || 'json',
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

async function handleRefactorCode(args: any): Promise<CallToolResult> {
  const result = await refactoring.refactorCode({
    sourceCode: args.sourceCode,
    refactorType: args.refactorType,
    preserveTests: args.preserveTests !== false,
    refactoringGoals: args.refactoringGoals || [],
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

async function handleValidateTDDCycle(args: any): Promise<CallToolResult> {
  const result = await tddCycleValidator.validateCycle({
    projectPath: args.projectPath,
    gitHistory: args.gitHistory,
    timeWindow: args.timeWindow || '1 hour',
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

// 新增的功能特性管理工具处理函数
async function handleCreateFeature(args: any): Promise<CallToolResult> {
  const result = await featureManagementService.createFeature({
    name: args.name,
    description: args.description,
    acceptanceCriteria: args.acceptanceCriteria,
    priority: args.priority,
    projectId: args.projectId,
    tags: args.tags,
    estimatedHours: args.estimatedHours,
    assignee: args.assignee,
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

async function handleUpdateFeatureStatus(args: any): Promise<CallToolResult> {
  const result = await featureManagementService.updateFeatureStatus({
    featureId: args.featureId,
    status: args.status,
    progress: args.progress,
    notes: args.notes,
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

async function handleLinkFeatureFiles(args: any): Promise<CallToolResult> {
  const result = await featureManagementService.linkFeatureFiles({
    featureId: args.featureId,
    filePaths: args.filePaths,
    fileType: args.fileType,
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

async function handleFindSimilarFeatures(args: any): Promise<CallToolResult> {
  const projectId = args.projectId || featureManagementService.getCurrentProject();
  if (!projectId) {
    throw new Error('Project ID is required. Please provide projectId or set current project.');
  }

  const result = await featureManagementService.findSimilarFeatures(
    args.query,
    projectId,
    args.maxResults,
    args.minSimilarity
  );

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

async function handleCreateTDDSession(args: any): Promise<CallToolResult> {
  const sessionId = `session-${Date.now()}`;
  const projectId = args.projectId || featureManagementService.getCurrentProject() || 'default-project';
  
  const session = {
    id: sessionId,
    featureId: args.featureId,
    projectId,
    developer: args.developer,
    stage: TDDStage.RED,
    startedAt: new Date(),
    updatedAt: new Date(),
    notes: args.initialNotes,
    cycleCount: 0,
  };

  await storageService.saveTDDSession(session);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(session, null, 2),
      },
    ],
  };
}

async function handleUpdateTDDStage(args: any): Promise<CallToolResult> {
  const session = await storageService.loadTDDSession(args.sessionId);
  if (!session) {
    throw new Error(`TDD session not found: ${args.sessionId}`);
  }

  const success = await storageService.updateTDDSessionStage(args.sessionId, args.stage);
  if (!success) {
    throw new Error(`Failed to update TDD session stage: ${args.sessionId}`);
  }

  // Load updated session
  const updatedSession = await storageService.loadTDDSession(args.sessionId);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(updatedSession, null, 2),
      },
    ],
  };
}

async function handleRegisterTestMethod(args: any): Promise<CallToolResult> {
  const methodId = `test-${Date.now()}`;
  const projectId = args.projectId || featureManagementService.getCurrentProject() || 'default-project';
  
  const testMethod = {
    id: methodId,
    featureId: args.featureId,
    projectId,
    name: args.name,
    filePath: args.filePath,
    status: 'pending' as const,
    framework: args.framework,
    createdAt: new Date(),
    testType: args.testType,
  };

  await storageService.registerTestMethod(testMethod);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(testMethod, null, 2),
      },
    ],
  };
}

async function handleUpdateTestExecutionResult(args: any): Promise<CallToolResult> {
  const success = await storageService.updateTestExecutionResult(args.methodId, args.result);
  if (!success) {
    throw new Error(`Failed to update test execution result: ${args.methodId}`);
  }

  // Load updated test method
  const updatedMethod = await storageService.loadTestMethod(args.methodId);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(updatedMethod, null, 2),
      },
    ],
  };
}

async function handleUpdateTestMethodStatus(args: any): Promise<CallToolResult> {
  const success = await storageService.updateTestMethodStatus(args.methodId, args.status);
  if (!success) {
    throw new Error(`Failed to update test method status: ${args.methodId}`);
  }

  // Load updated test method
  const updatedMethod = await storageService.loadTestMethod(args.methodId);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(updatedMethod, null, 2),
      },
    ],
  };
}