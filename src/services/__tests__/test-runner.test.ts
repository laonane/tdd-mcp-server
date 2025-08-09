import { TestRunnerService } from '../test-runner';
import { TestResults } from '../../types/tdd';
import * as fs from 'fs';
import { exec } from 'child_process';

// Mock child_process exec
jest.mock('child_process');
const mockExec = exec as jest.MockedFunction<typeof exec>;

// Mock fs
jest.mock('fs', () => ({
  promises: {
    stat: jest.fn(),
    readFile: jest.fn(),
  }
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('TestRunnerService', () => {
  let testRunner: TestRunnerService;
  let mockExecAsync: jest.Mock;

  beforeEach(() => {
    testRunner = new TestRunnerService();
    jest.clearAllMocks();
    
    // Mock promisify(exec)
    mockExecAsync = jest.fn();
    require('util').promisify = jest.fn(() => mockExecAsync);
  });

  describe('runTests', () => {
    it('should run Jest tests successfully', async () => {
      const params = {
        projectPath: '/test/project',
        testFramework: 'jest',
        options: { verbose: true, coverage: true }
      };

      // Mock project path validation
      mockFs.promises.stat = jest.fn().mockResolvedValue({ 
        isDirectory: () => true 
      } as any);

      // Mock command execution
      mockExecAsync.mockResolvedValue({ 
        stdout: 'Test results output', 
        stderr: '' 
      });

      // Mock JSON results file
      mockFs.promises.readFile = jest.fn().mockResolvedValue(JSON.stringify({
        testResults: [{
          name: 'test-file.js',
          startTime: 1000,
          endTime: 2000,
          assertionResults: [{
            title: 'should work',
            status: 'passed',
            duration: 100
          }]
        }]
      }));

      const result = await testRunner.runTests(params);

      expect(result.framework).toBe('jest');
      expect(result.overall.total).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle unsupported framework', async () => {
      const params = {
        projectPath: '/test/project',
        testFramework: 'unsupported-framework'
      };

      await expect(testRunner.runTests(params))
        .rejects.toThrow('Unsupported test framework: unsupported-framework');
    });

    it('should handle invalid project path', async () => {
      const params = {
        projectPath: '/invalid/path',
        testFramework: 'jest'
      };

      mockFs.promises.stat = jest.fn().mockRejectedValue(new Error('Path not found'));

      await expect(testRunner.runTests(params))
        .rejects.toThrow('Invalid project path: /invalid/path');
    });

    it('should handle test execution failure', async () => {
      const params = {
        projectPath: '/test/project',
        testFramework: 'jest'
      };

      mockFs.promises.stat = jest.fn().mockResolvedValue({ 
        isDirectory: () => true 
      } as any);

      // Mock exec to throw error  
      mockExecAsync.mockRejectedValue(new Error('Test execution failed'));

      const result = await testRunner.runTests(params);

      expect(result.overall.failed).toBeGreaterThan(0);
      expect(result.suites[0].name).toBe('Test Execution Error');
    });
  });

  describe('getFrameworkConfig', () => {
    it('should get Jest framework config', () => {
      const testRunnerAny = testRunner as any;
      const config = testRunnerAny.getFrameworkConfig('jest');

      expect(config).toBeDefined();
      expect(config.name).toBe('Jest');
      expect(config.key).toBe('jest');
    });

    it('should get framework config by name', () => {
      const testRunnerAny = testRunner as any;
      const config = testRunnerAny.getFrameworkConfig('JUnit 5');

      expect(config).toBeDefined();
      expect(config.name).toBe('JUnit 5');
    });

    it('should return null for unsupported framework', () => {
      const testRunnerAny = testRunner as any;
      const config = testRunnerAny.getFrameworkConfig('unknown');

      expect(config).toBeNull();
    });
  });

  describe('buildTestCommand', () => {
    it('should build Jest command with all options', () => {
      const framework = {
        key: 'jest',
        commands: {
          run: 'jest',
          coverage: 'jest --coverage'
        }
      };

      const params = {
        projectPath: '/test',
        testFramework: 'jest',
        testFiles: ['test1.js', 'test2.js'],
        options: {
          verbose: true,
          coverage: true,
          parallel: true
        }
      };

      const testRunnerAny = testRunner as any;
      const command = testRunnerAny.buildTestCommand(framework, params);

      expect(command).toContain('--coverage');
      expect(command).toContain('--verbose');
      expect(command).toContain('--maxWorkers=auto');
      expect(command).toContain('test1.js test2.js');
    });

    it('should build pytest command correctly', () => {
      const framework = {
        key: 'pytest',
        commands: {
          run: 'pytest',
          coverage: 'pytest --cov'
        }
      };

      const params = {
        projectPath: '/test',
        testFramework: 'pytest',
        options: { verbose: true, parallel: true }
      };

      const testRunnerAny = testRunner as any;
      const command = testRunnerAny.buildTestCommand(framework, params);

      expect(command).toContain('pytest');
      expect(command).toContain('-v');
      expect(command).toContain('-n auto');
    });
  });

  describe('getVerboseFlag', () => {
    it('should return correct verbose flags', () => {
      const testRunnerAny = testRunner as any;
      
      expect(testRunnerAny.getVerboseFlag('jest')).toBe(' --verbose');
      expect(testRunnerAny.getVerboseFlag('pytest')).toBe(' -v');
      expect(testRunnerAny.getVerboseFlag('mocha')).toBe(' --reporter spec');
      expect(testRunnerAny.getVerboseFlag('unknown')).toBe('');
    });
  });

  describe('parseJestResults', () => {
    it('should parse Jest JSON results correctly', () => {
      const jestData = {
        testResults: [{
          name: 'test-file.js',
          startTime: 1000,
          endTime: 2000,
          assertionResults: [
            {
              title: 'should pass',
              status: 'passed',
              duration: 100
            },
            {
              title: 'should fail',
              status: 'failed',
              duration: 50,
              failureMessages: ['Error message']
            }
          ]
        }]
      };

      const testRunnerAny = testRunner as any;
      const result = testRunnerAny.parseJestResults(jestData);

      expect(result.framework).toBe('jest');
      expect(result.suites).toHaveLength(1);
      expect(result.suites[0].tests).toHaveLength(2);
      expect(result.overall.total).toBe(2);
      expect(result.overall.passed).toBe(1);
      expect(result.overall.failed).toBe(1);
    });
  });

  describe('parseMochaResults', () => {
    it('should parse Mocha JSON results correctly', () => {
      const mochaData = {
        suites: [{
          title: 'Test Suite',
          tests: [{
            title: 'should work',
            state: 'passed',
            duration: 100
          }],
          suites: []
        }],
        stats: {
          duration: 1000
        }
      };

      const testRunnerAny = testRunner as any;
      const result = testRunnerAny.parseMochaResults(mochaData);

      expect(result.framework).toBe('mocha');
      expect(result.suites).toHaveLength(1);
      expect(result.overall.duration).toBe(1000);
    });
  });

  describe('parseTextResults', () => {
    it('should parse text output correctly', () => {
      const stdout = `
        ✓ Test 1 passed
        ✗ Test 2 failed
        SKIPPED Test 3
      `;
      const stderr = '';

      const framework = { name: 'generic' };
      const duration = 1000;

      const testRunnerAny = testRunner as any;
      const result = testRunnerAny.parseTextResults(stdout, stderr, framework, duration);

      expect(result.overall.passed).toBe(1);
      expect(result.overall.failed).toBe(1);
      expect(result.overall.skipped).toBe(1);
      expect(result.overall.duration).toBe(duration);
    });
  });

  describe('mapJestStatus', () => {
    it('should map Jest status correctly', () => {
      const testRunnerAny = testRunner as any;
      
      expect(testRunnerAny.mapJestStatus('passed')).toBe('passed');
      expect(testRunnerAny.mapJestStatus('failed')).toBe('failed');
      expect(testRunnerAny.mapJestStatus('skipped')).toBe('skipped');
      expect(testRunnerAny.mapJestStatus('pending')).toBe('pending');
      expect(testRunnerAny.mapJestStatus('unknown')).toBe('failed');
    });
  });

  describe('calculateCoverage', () => {
    it('should calculate coverage correctly', () => {
      const coverageMap = {
        'file1.js': {
          s: { '1': 1, '2': 0, '3': 1 } // 2 out of 3 covered
        },
        'file2.js': {
          s: { '1': 1, '2': 1 } // 2 out of 2 covered
        }
      };

      const testRunnerAny = testRunner as any;
      const coverage = testRunnerAny.calculateCoverage(coverageMap);

      expect(coverage).toBe(80); // 4 out of 5 statements covered
    });

    it('should handle empty coverage map', () => {
      const testRunnerAny = testRunner as any;
      
      expect(testRunnerAny.calculateCoverage({})).toBe(0);
      expect(testRunnerAny.calculateCoverage(null)).toBe(0);
      expect(testRunnerAny.calculateCoverage(undefined)).toBe(0);
    });
  });

  describe('handleTestError', () => {
    it('should create error result for failed execution', () => {
      const error = new Error('Command failed');
      const framework = 'jest';

      const testRunnerAny = testRunner as any;
      const result = testRunnerAny.handleTestError(error, framework);

      expect(result.framework).toBe('jest');
      expect(result.overall.failed).toBe(1);
      expect(result.overall.passed).toBe(0);
      expect(result.suites[0].tests[0].error).toContain('Command failed');
    });
  });
});