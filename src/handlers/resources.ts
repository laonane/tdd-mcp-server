import {
  ListResourcesRequest,
  ListResourcesResult,
  ReadResourceRequest,
  ReadResourceResult,
  Resource,
} from '@modelcontextprotocol/sdk/types.js';
import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

// Resource definitions
const RESOURCE_TYPES = {
  TEST_FILES: 'tdd://test-files',
  IMPLEMENTATION_FILES: 'tdd://implementation',
  TEST_REPORTS: 'tdd://reports/test',
  COVERAGE_REPORTS: 'tdd://reports/coverage',
  BEST_PRACTICES: 'tdd://best-practices',
} as const;

export const resourcesHandler = {
  async listResources(_request: ListResourcesRequest): Promise<ListResourcesResult> {
    try {
      const resources: Resource[] = [];
      const projectPath = process.env.PROJECT_PATH || process.cwd();

      // Add test files
      const testFiles = await findTestFiles(projectPath);
      for (const testFile of testFiles) {
        resources.push({
          uri: `${RESOURCE_TYPES.TEST_FILES}/${path.relative(projectPath, testFile)}`,
          name: `Test: ${path.basename(testFile)}`,
          description: `Test file containing unit/integration tests`,
          mimeType: getMimeTypeForFile(testFile),
        });
      }

      // Add implementation files
      const implFiles = await findImplementationFiles(projectPath);
      for (const implFile of implFiles) {
        resources.push({
          uri: `${RESOURCE_TYPES.IMPLEMENTATION_FILES}/${path.relative(projectPath, implFile)}`,
          name: `Implementation: ${path.basename(implFile)}`,
          description: `Implementation file containing production code`,
          mimeType: getMimeTypeForFile(implFile),
        });
      }

      // Add test reports (if they exist)
      const testReports = await findTestReports(projectPath);
      for (const report of testReports) {
        resources.push({
          uri: `${RESOURCE_TYPES.TEST_REPORTS}/${path.basename(report)}`,
          name: `Test Report: ${path.basename(report)}`,
          description: 'Test execution results and metrics',
          mimeType: 'application/json',
        });
      }

      // Add coverage reports (if they exist)
      const coverageReports = await findCoverageReports(projectPath);
      for (const report of coverageReports) {
        resources.push({
          uri: `${RESOURCE_TYPES.COVERAGE_REPORTS}/${path.basename(report)}`,
          name: `Coverage Report: ${path.basename(report)}`,
          description: 'Code coverage analysis results',
          mimeType: 'application/json',
        });
      }

      // Add best practices documents
      const bestPracticesPath = path.join(__dirname, '../../best-practices');
      try {
        const practiceFiles = await fs.readdir(bestPracticesPath);
        for (const file of practiceFiles.filter(f => f.endsWith('.md'))) {
          resources.push({
            uri: `${RESOURCE_TYPES.BEST_PRACTICES}/${file}`,
            name: `Best Practice: ${file.replace('.md', '').replace(/-/g, ' ')}`,
            description: 'TDD best practices and guidelines',
            mimeType: 'text/markdown',
          });
        }
      } catch {
        // Best practices directory doesn't exist or is inaccessible
      }

      return { resources };
    } catch (error) {
      throw new Error(`Failed to list resources: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  async readResource(request: ReadResourceRequest): Promise<ReadResourceResult> {
    const { uri } = request.params;

    try {
      if (uri.startsWith(RESOURCE_TYPES.TEST_FILES)) {
        return await readTestFile(uri);
      } else if (uri.startsWith(RESOURCE_TYPES.IMPLEMENTATION_FILES)) {
        return await readImplementationFile(uri);
      } else if (uri.startsWith(RESOURCE_TYPES.TEST_REPORTS)) {
        return await readTestReport(uri);
      } else if (uri.startsWith(RESOURCE_TYPES.COVERAGE_REPORTS)) {
        return await readCoverageReport(uri);
      } else if (uri.startsWith(RESOURCE_TYPES.BEST_PRACTICES)) {
        return await readBestPractice(uri);
      } else {
        throw new Error(`Unknown resource URI: ${uri}`);
      }
    } catch (error) {
      throw new Error(`Failed to read resource ${uri}: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
};

// Helper functions
async function findTestFiles(projectPath: string): Promise<string[]> {
  const patterns = [
    '**/*.test.{js,ts,py,java,cs,go,rs,php}',
    '**/*.spec.{js,ts,py,java,cs,go,rs,php}',
    '**/test_*.{py}',
    '**/*_test.{go,rs}',
    '**/Test*.{java,cs,php}',
    '**/*Test.{java,cs}',
    '**/*Tests.{java,cs}',
    'tests/**/*.{js,ts,py,java,cs,go,rs,php}',
    '__tests__/**/*.{js,ts}',
  ];

  const files: string[] = [];
  for (const pattern of patterns) {
    try {
      const matches = await glob(pattern, {
        cwd: projectPath,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/target/**'],
      });
      files.push(...matches);
    } catch {
      // Ignore errors from individual patterns
    }
  }

  return [...new Set(files)]; // Remove duplicates
}

async function findImplementationFiles(projectPath: string): Promise<string[]> {
  const patterns = [
    'src/**/*.{js,ts,py,java,cs,go,rs,php}',
    'lib/**/*.{js,ts,py,java,cs,go,rs,php}',
    '**/*.{js,ts,py,java,cs,go,rs,php}',
  ];

  const files: string[] = [];
  for (const pattern of patterns) {
    try {
      const matches = await glob(pattern, {
        cwd: projectPath,
        absolute: true,
        ignore: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/target/**',
          '**/*.test.*',
          '**/*.spec.*',
          '**/test_*',
          '**/*_test.*',
          '**/Test*',
          '**/tests/**',
          '**/__tests__/**',
        ],
      });
      files.push(...matches);
    } catch {
      // Ignore errors from individual patterns
    }
  }

  return [...new Set(files)]; // Remove duplicates
}

async function findTestReports(projectPath: string): Promise<string[]> {
  const patterns = [
    'test-results/**/*.json',
    'junit.xml',
    'test-report.json',
    'coverage/test-report.json',
  ];

  const files: string[] = [];
  for (const pattern of patterns) {
    try {
      const matches = await glob(pattern, {
        cwd: projectPath,
        absolute: true,
      });
      files.push(...matches);
    } catch {
      // Ignore errors
    }
  }

  return files;
}

async function findCoverageReports(projectPath: string): Promise<string[]> {
  const patterns = [
    'coverage/**/*.json',
    'coverage/lcov-report/**/*.json',
    'coverage.json',
    'coverage-summary.json',
  ];

  const files: string[] = [];
  for (const pattern of patterns) {
    try {
      const matches = await glob(pattern, {
        cwd: projectPath,
        absolute: true,
      });
      files.push(...matches);
    } catch {
      // Ignore errors
    }
  }

  return files;
}

function getMimeTypeForFile(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.js': 'application/javascript',
    '.ts': 'application/typescript',
    '.py': 'text/x-python',
    '.java': 'text/x-java-source',
    '.cs': 'text/x-csharp',
    '.go': 'text/x-go',
    '.rs': 'text/x-rust',
    '.php': 'text/x-php',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.md': 'text/markdown',
    '.txt': 'text/plain',
  };

  return mimeTypes[ext] || 'text/plain';
}

// Resource readers
async function readTestFile(uri: string): Promise<ReadResourceResult> {
  const relativePath = uri.replace(`${RESOURCE_TYPES.TEST_FILES}/`, '');
  const fullPath = path.join(process.env.PROJECT_PATH || process.cwd(), relativePath);
  
  const content = await fs.readFile(fullPath, 'utf8');
  const stats = await fs.stat(fullPath);
  
  return {
    contents: [
      {
        uri: uri,
        mimeType: getMimeTypeForFile(fullPath),
        text: content,
      },
    ],
  };
}

async function readImplementationFile(uri: string): Promise<ReadResourceResult> {
  const relativePath = uri.replace(`${RESOURCE_TYPES.IMPLEMENTATION_FILES}/`, '');
  const fullPath = path.join(process.env.PROJECT_PATH || process.cwd(), relativePath);
  
  const content = await fs.readFile(fullPath, 'utf8');
  
  return {
    contents: [
      {
        uri: uri,
        mimeType: getMimeTypeForFile(fullPath),
        text: content,
      },
    ],
  };
}

async function readTestReport(uri: string): Promise<ReadResourceResult> {
  const fileName = uri.replace(`${RESOURCE_TYPES.TEST_REPORTS}/`, '');
  const reportPath = path.join(process.env.PROJECT_PATH || process.cwd(), fileName);
  
  const content = await fs.readFile(reportPath, 'utf8');
  
  return {
    contents: [
      {
        uri: uri,
        mimeType: 'application/json',
        text: content,
      },
    ],
  };
}

async function readCoverageReport(uri: string): Promise<ReadResourceResult> {
  const fileName = uri.replace(`${RESOURCE_TYPES.COVERAGE_REPORTS}/`, '');
  const reportPath = path.join(process.env.PROJECT_PATH || process.cwd(), fileName);
  
  const content = await fs.readFile(reportPath, 'utf8');
  
  return {
    contents: [
      {
        uri: uri,
        mimeType: 'text/html',
        text: content,
      },
    ],
  };
}

async function readBestPractice(uri: string): Promise<ReadResourceResult> {
  const fileName = uri.replace(`${RESOURCE_TYPES.BEST_PRACTICES}/`, '');
  const practicePath = path.join(__dirname, '../../best-practices', fileName);
  
  const content = await fs.readFile(practicePath, 'utf8');
  
  return {
    contents: [
      {
        uri: uri,
        mimeType: 'text/markdown',
        text: content,
      },
    ],
  };
}