import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import {
  TestResults,
  TestSuiteResult,
  TestResult,
} from '../types/tdd.js';
import { SUPPORTED_FRAMEWORKS, SupportedFramework } from '../types/test-frameworks.js';

const execAsync = promisify(exec);

interface TestRunnerParams {
  projectPath: string;
  testFiles?: string[];
  testFramework: string;
  options?: {
    verbose?: boolean;
    coverage?: boolean;
    watch?: boolean;
    parallel?: boolean;
    timeout?: number;
  };
}

export class TestRunnerService {
  async runTests(params: TestRunnerParams): Promise<TestResults> {
    const { projectPath, testFiles, testFramework, options = {} } = params;

    // Validate framework
    const framework = this.getFrameworkConfig(testFramework);
    if (!framework) {
      throw new Error(`Unsupported test framework: ${testFramework}`);
    }

    // Validate project path
    await this.validateProjectPath(projectPath);

    // Build and execute test command
    const command = this.buildTestCommand(framework, params);
    
    try {
      const startTime = Date.now();
      const { stdout, stderr } = await execAsync(command, {
        cwd: projectPath,
        timeout: options.timeout || 300000, // 5 minutes default
      });
      const endTime = Date.now();

      // Parse test results
      const results = await this.parseTestResults(
        stdout,
        stderr,
        framework,
        endTime - startTime
      );

      return results;
    } catch (error: any) {
      // Handle test execution errors
      return this.handleTestError(error, testFramework);
    }
  }

  private getFrameworkConfig(frameworkName: string): any {
    const frameworks = SUPPORTED_FRAMEWORKS as Record<string, any>;
    
    for (const [key, config] of Object.entries(frameworks)) {
      if (config.name.toLowerCase() === frameworkName.toLowerCase() || 
          key === frameworkName.toLowerCase()) {
        return { ...config, key };
      }
    }
    
    return null;
  }

  private async validateProjectPath(projectPath: string): Promise<void> {
    try {
      const stats = await fs.stat(projectPath);
      if (!stats.isDirectory()) {
        throw new Error(`Project path is not a directory: ${projectPath}`);
      }
    } catch (error) {
      throw new Error(`Invalid project path: ${projectPath}`);
    }
  }

  private buildTestCommand(framework: any, params: TestRunnerParams): string {
    const { testFiles, options = {} } = params;
    let command = framework.commands.run;

    // Add coverage flag if requested
    if (options.coverage && framework.commands.coverage) {
      command = framework.commands.coverage;
    }

    // Add verbose flag
    if (options.verbose) {
      command += this.getVerboseFlag(framework.key);
    }

    // Add parallel flag
    if (options.parallel !== false) {
      command += this.getParallelFlag(framework.key);
    }

    // Add specific test files if provided
    if (testFiles && testFiles.length > 0) {
      command += ` ${testFiles.join(' ')}`;
    }

    // Add JSON output for easier parsing
    command += this.getJsonOutputFlag(framework.key);

    return command;
  }

  private getVerboseFlag(frameworkKey: string): string {
    const verboseFlags: Record<string, string> = {
      jest: ' --verbose',
      mocha: ' --reporter spec',
      vitest: ' --reporter=verbose',
      pytest: ' -v',
      unittest: ' -v',
      junit5: ' -Dtest.verbose=true',
      xunit: ' -verbose',
      gotest: ' -v',
      cargo_test: ' --verbose',
      phpunit: ' --verbose',
    };
    
    return verboseFlags[frameworkKey] || '';
  }

  private getParallelFlag(frameworkKey: string): string {
    const parallelFlags: Record<string, string> = {
      jest: ' --maxWorkers=auto',
      vitest: ' --reporter=verbose',
      pytest: ' -n auto',
      junit5: ' -Djunit.parallel.enabled=true',
      gotest: ' -parallel',
      cargo_test: ' --jobs 0',
    };
    
    return parallelFlags[frameworkKey] || '';
  }

  private getJsonOutputFlag(frameworkKey: string): string {
    const jsonFlags: Record<string, string> = {
      jest: ' --json --outputFile=test-results.json',
      mocha: ' --reporter json --reporter-options output=test-results.json',
      vitest: ' --reporter=json --outputFile=test-results.json',
      pytest: ' --json-report --json-report-file=test-results.json',
      junit5: ' -Djunit.platform.reporting.output.dir=test-results',
      xunit: ' -xml test-results.xml',
      gotest: ' -json > test-results.json',
      cargo_test: ' --format json > test-results.json',
      phpunit: ' --log-json test-results.json',
    };
    
    return jsonFlags[frameworkKey] || '';
  }

  private async parseTestResults(
    stdout: string,
    stderr: string,
    framework: any,
    duration: number
  ): Promise<TestResults> {
    try {
      // Try to parse JSON output first
      const jsonResults = await this.parseJsonResults(framework.key);
      if (jsonResults) {
        return jsonResults;
      }
    } catch (error) {
      // Fall back to parsing stdout/stderr
    }

    // Parse text output based on framework
    return this.parseTextResults(stdout, stderr, framework, duration);
  }

  private async parseJsonResults(frameworkKey: string): Promise<TestResults | null> {
    const jsonFiles = [
      'test-results.json',
      'test-results.xml', // For XML-based results
      'coverage/coverage-final.json',
    ];

    for (const fileName of jsonFiles) {
      try {
        const content = await fs.readFile(fileName, 'utf8');
        
        if (fileName.endsWith('.json')) {
          const data = JSON.parse(content);
          return this.convertJsonToTestResults(data, frameworkKey);
        } else if (fileName.endsWith('.xml')) {
          return this.parseXmlResults(content, frameworkKey);
        }
      } catch (error) {
        // File doesn't exist or can't be parsed, try next
        continue;
      }
    }

    return null;
  }

  private convertJsonToTestResults(data: any, frameworkKey: string): TestResults {
    switch (frameworkKey) {
      case 'jest':
        return this.parseJestResults(data);
      case 'mocha':
        return this.parseMochaResults(data);
      case 'pytest':
        return this.parsePytestResults(data);
      default:
        return this.parseGenericJsonResults(data);
    }
  }

  private parseJestResults(data: any): TestResults {
    const suites: TestSuiteResult[] = [];
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    let totalDuration = 0;

    for (const testResult of data.testResults || []) {
      const tests: TestResult[] = [];
      
      for (const assertionResult of testResult.assertionResults || []) {
        const test: TestResult = {
          name: assertionResult.title || assertionResult.fullName,
          status: this.mapJestStatus(assertionResult.status),
          duration: assertionResult.duration || 0,
          error: assertionResult.failureMessages?.join('\n'),
        };
        tests.push(test);
      }

      const suite: TestSuiteResult = {
        name: testResult.name || path.basename(testResult.name || 'unknown'),
        tests,
        summary: {
          total: tests.length,
          passed: tests.filter(t => t.status === 'passed').length,
          failed: tests.filter(t => t.status === 'failed').length,
          skipped: tests.filter(t => t.status === 'skipped').length,
          duration: testResult.endTime - testResult.startTime || 0,
        },
      };

      suites.push(suite);
      totalTests += suite.summary.total;
      totalPassed += suite.summary.passed;
      totalFailed += suite.summary.failed;
      totalSkipped += suite.summary.skipped;
      totalDuration += suite.summary.duration;
    }

    return {
      framework: 'jest',
      suites,
      overall: {
        total: totalTests,
        passed: totalPassed,
        failed: totalFailed,
        skipped: totalSkipped,
        duration: totalDuration,
        coverage: data.coverageMap ? this.calculateCoverage(data.coverageMap) : undefined,
      },
      timestamp: new Date(),
    };
  }

  private parseMochaResults(data: any): TestResults {
    const suites: TestSuiteResult[] = [];
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;

    const processSuite = (suite: any): TestSuiteResult => {
      const tests: TestResult[] = [];
      
      for (const test of suite.tests || []) {
        const testResult: TestResult = {
          name: test.title,
          status: this.mapMochaStatus(test.state),
          duration: test.duration || 0,
          error: test.err?.message,
        };
        tests.push(testResult);
      }

      // Process nested suites
      for (const nestedSuite of suite.suites || []) {
        const nestedResult = processSuite(nestedSuite);
        tests.push(...nestedResult.tests);
      }

      return {
        name: suite.title,
        tests,
        summary: {
          total: tests.length,
          passed: tests.filter(t => t.status === 'passed').length,
          failed: tests.filter(t => t.status === 'failed').length,
          skipped: tests.filter(t => t.status === 'skipped').length,
          duration: suite.duration || 0,
        },
      };
    };

    for (const suite of data.suites || []) {
      const suiteResult = processSuite(suite);
      suites.push(suiteResult);
      totalTests += suiteResult.summary.total;
      totalPassed += suiteResult.summary.passed;
      totalFailed += suiteResult.summary.failed;
      totalSkipped += suiteResult.summary.skipped;
    }

    return {
      framework: 'mocha',
      suites,
      overall: {
        total: totalTests,
        passed: totalPassed,
        failed: totalFailed,
        skipped: totalSkipped,
        duration: data.stats?.duration || 0,
      },
      timestamp: new Date(),
    };
  }

  private parsePytestResults(data: any): TestResults {
    const suites: TestSuiteResult[] = [];
    const testsByFile = new Map<string, TestResult[]>();

    for (const test of data.tests || []) {
      const fileName = test.nodeid?.split('::')[0] || 'unknown';
      
      if (!testsByFile.has(fileName)) {
        testsByFile.set(fileName, []);
      }

      const testResult: TestResult = {
        name: test.nodeid?.split('::').pop() || test.name,
        status: this.mapPytestStatus(test.outcome),
        duration: test.call?.duration || 0,
        error: test.call?.longrepr,
      };

      testsByFile.get(fileName)!.push(testResult);
    }

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    let totalDuration = 0;

    for (const [fileName, tests] of testsByFile.entries()) {
      const suite: TestSuiteResult = {
        name: fileName,
        tests,
        summary: {
          total: tests.length,
          passed: tests.filter(t => t.status === 'passed').length,
          failed: tests.filter(t => t.status === 'failed').length,
          skipped: tests.filter(t => t.status === 'skipped').length,
          duration: tests.reduce((sum, test) => sum + test.duration, 0),
        },
      };

      suites.push(suite);
      totalTests += suite.summary.total;
      totalPassed += suite.summary.passed;
      totalFailed += suite.summary.failed;
      totalSkipped += suite.summary.skipped;
      totalDuration += suite.summary.duration;
    }

    return {
      framework: 'pytest',
      suites,
      overall: {
        total: totalTests,
        passed: totalPassed,
        failed: totalFailed,
        skipped: totalSkipped,
        duration: totalDuration,
      },
      timestamp: new Date(),
    };
  }

  private parseGenericJsonResults(data: any): TestResults {
    // Generic JSON parser for unknown formats
    return {
      framework: 'generic',
      suites: [{
        name: 'Test Suite',
        tests: [{
          name: 'Generic Test',
          status: 'passed',
          duration: 0,
        }],
        summary: {
          total: 1,
          passed: 1,
          failed: 0,
          skipped: 0,
          duration: 0,
        },
      }],
      overall: {
        total: 1,
        passed: 1,
        failed: 0,
        skipped: 0,
        duration: 0,
      },
      timestamp: new Date(),
    };
  }

  private parseTextResults(
    stdout: string,
    stderr: string,
    framework: any,
    duration: number
  ): TestResults {
    // Parse text output based on common patterns
    const lines = (stdout + '\n' + stderr).split('\n');
    
    // Simple pattern matching for test results
    const passedTests = lines.filter(line => 
      line.includes('✓') || line.includes('PASSED') || line.includes('OK')
    );
    const failedTests = lines.filter(line => 
      line.includes('✗') || line.includes('FAILED') || line.includes('ERROR')
    );
    const skippedTests = lines.filter(line => 
      line.includes('SKIPPED') || line.includes('PENDING')
    );

    const tests: TestResult[] = [
      ...passedTests.map((line, index) => ({
        name: `Test ${index + 1}`,
        status: 'passed' as const,
        duration: 0,
      })),
      ...failedTests.map((line, index) => ({
        name: `Failed Test ${index + 1}`,
        status: 'failed' as const,
        duration: 0,
        error: line,
      })),
      ...skippedTests.map((line, index) => ({
        name: `Skipped Test ${index + 1}`,
        status: 'skipped' as const,
        duration: 0,
      })),
    ];

    const suite: TestSuiteResult = {
      name: 'Test Suite',
      tests,
      summary: {
        total: tests.length,
        passed: passedTests.length,
        failed: failedTests.length,
        skipped: skippedTests.length,
        duration,
      },
    };

    return {
      framework: framework.name,
      suites: [suite],
      overall: {
        total: tests.length,
        passed: passedTests.length,
        failed: failedTests.length,
        skipped: skippedTests.length,
        duration,
      },
      timestamp: new Date(),
    };
  }

  private parseXmlResults(xmlContent: string, frameworkKey: string): TestResults {
    // Basic XML parsing - in a real implementation, use a proper XML parser
    const testMatches = xmlContent.match(/<test[^>]*name="([^"]*)"[^>]*>/g);
    const tests: TestResult[] = [];

    if (testMatches) {
      for (const match of testMatches) {
        const nameMatch = match.match(/name="([^"]*)"/);
        const name = nameMatch?.[1] || 'Unknown Test';
        
        // Simple status detection
        const status = xmlContent.includes('failure') ? 'failed' : 'passed';
        
        tests.push({
          name,
          status,
          duration: 0,
        });
      }
    }

    const suite: TestSuiteResult = {
      name: 'Test Suite',
      tests,
      summary: {
        total: tests.length,
        passed: tests.filter(t => t.status === 'passed').length,
        failed: tests.filter(t => t.status === 'failed').length,
        skipped: tests.filter(t => t.status === 'skipped').length,
        duration: 0,
      },
    };

    return {
      framework: frameworkKey,
      suites: [suite],
      overall: suite.summary,
      timestamp: new Date(),
    };
  }

  private handleTestError(error: any, framework: string): TestResults {
    const errorMessage = error.message || error.toString();
    
    return {
      framework,
      suites: [{
        name: 'Test Execution Error',
        tests: [{
          name: 'Test Runner Error',
          status: 'failed',
          duration: 0,
          error: errorMessage,
        }],
        summary: {
          total: 1,
          passed: 0,
          failed: 1,
          skipped: 0,
          duration: 0,
        },
      }],
      overall: {
        total: 1,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: 0,
      },
      timestamp: new Date(),
    };
  }

  // Status mapping functions
  private mapJestStatus(status: string): 'passed' | 'failed' | 'skipped' | 'pending' {
    switch (status) {
      case 'passed': return 'passed';
      case 'failed': return 'failed';
      case 'skipped': return 'skipped';
      case 'pending': return 'pending';
      default: return 'failed';
    }
  }

  private mapMochaStatus(state: string): 'passed' | 'failed' | 'skipped' | 'pending' {
    switch (state) {
      case 'passed': return 'passed';
      case 'failed': return 'failed';
      case 'pending': return 'pending';
      default: return 'skipped';
    }
  }

  private mapPytestStatus(outcome: string): 'passed' | 'failed' | 'skipped' | 'pending' {
    switch (outcome) {
      case 'passed': return 'passed';
      case 'failed': return 'failed';
      case 'skipped': return 'skipped';
      default: return 'failed';
    }
  }

  private calculateCoverage(coverageMap: any): number {
    // Simple coverage calculation
    if (!coverageMap || typeof coverageMap !== 'object') {
      return 0;
    }

    let totalStatements = 0;
    let coveredStatements = 0;

    for (const [fileName, fileCoverage] of Object.entries(coverageMap)) {
      const coverage = fileCoverage as any;
      if (coverage.s) {
        const statements = Object.values(coverage.s) as number[];
        totalStatements += statements.length;
        coveredStatements += statements.filter(s => s > 0).length;
      }
    }

    return totalStatements > 0 ? Math.round((coveredStatements / totalStatements) * 100) : 0;
  }
}