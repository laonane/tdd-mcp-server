import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import {
  CoverageReport,
  CoverageFile,
} from '../types/tdd.js';

const execAsync = promisify(exec);

interface CoverageAnalysisParams {
  projectPath: string;
  testCommand: string;
  thresholds?: {
    lines?: number;
    functions?: number;
    branches?: number;
    statements?: number;
  };
  outputFormat?: 'json' | 'html' | 'lcov' | 'text';
}

export class CoverageAnalyzerService {
  async analyzeCoverage(params: CoverageAnalysisParams): Promise<CoverageReport> {
    const { projectPath, testCommand, thresholds, outputFormat = 'json' } = params;

    // Validate project path
    await this.validateProjectPath(projectPath);

    try {
      // Execute coverage command
      const coverageCommand = this.buildCoverageCommand(testCommand, outputFormat);
      await execAsync(coverageCommand, {
        cwd: projectPath,
        timeout: 300000, // 5 minutes
      });

      // Parse coverage results
      const coverageData = await this.parseCoverageResults(projectPath, outputFormat);
      
      // Generate coverage report
      const report = this.generateCoverageReport(coverageData, thresholds);
      
      return report;
    } catch (error: any) {
      throw new Error(`Coverage analysis failed: ${error.message}`);
    }
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

  private buildCoverageCommand(testCommand: string, outputFormat: string): string {
    // Detect test framework and build appropriate coverage command
    if (testCommand.includes('jest')) {
      return this.buildJestCoverageCommand(testCommand, outputFormat);
    } else if (testCommand.includes('mocha')) {
      return this.buildMochaCoverageCommand(testCommand, outputFormat);
    } else if (testCommand.includes('vitest')) {
      return this.buildVitestCoverageCommand(testCommand, outputFormat);
    } else if (testCommand.includes('pytest')) {
      return this.buildPytestCoverageCommand(testCommand, outputFormat);
    } else if (testCommand.includes('go test')) {
      return this.buildGoTestCoverageCommand(testCommand, outputFormat);
    } else if (testCommand.includes('cargo test')) {
      return this.buildCargoTestCoverageCommand(testCommand, outputFormat);
    } else if (testCommand.includes('dotnet test')) {
      return this.buildDotnetTestCoverageCommand(testCommand, outputFormat);
    } else if (testCommand.includes('phpunit')) {
      return this.buildPhpunitCoverageCommand(testCommand, outputFormat);
    } else {
      // Generic coverage command
      return `${testCommand} --coverage`;
    }
  }

  private buildJestCoverageCommand(testCommand: string, outputFormat: string): string {
    let command = testCommand.replace('jest', 'jest --coverage');
    
    switch (outputFormat) {
      case 'json':
        command += ' --coverageReporters=json-summary --coverageReporters=json';
        break;
      case 'html':
        command += ' --coverageReporters=html';
        break;
      case 'lcov':
        command += ' --coverageReporters=lcov';
        break;
      case 'text':
        command += ' --coverageReporters=text';
        break;
    }
    
    return command;
  }

  private buildMochaCoverageCommand(testCommand: string, outputFormat: string): string {
    let command = `nyc --reporter=${outputFormat} ${testCommand}`;
    
    if (outputFormat === 'json') {
      command += ' && nyc report --reporter=json-summary';
    }
    
    return command;
  }

  private buildVitestCoverageCommand(testCommand: string, outputFormat: string): string {
    return `${testCommand} --coverage --coverage.reporter=${outputFormat}`;
  }

  private buildPytestCoverageCommand(testCommand: string, outputFormat: string): string {
    let command = testCommand.replace('pytest', 'pytest --cov=.');
    
    switch (outputFormat) {
      case 'json':
        command += ' --cov-report=json';
        break;
      case 'html':
        command += ' --cov-report=html';
        break;
      case 'lcov':
        command += ' --cov-report=lcov';
        break;
      case 'text':
        command += ' --cov-report=term-missing';
        break;
    }
    
    return command;
  }

  private buildGoTestCoverageCommand(testCommand: string, outputFormat: string): string {
    let command = testCommand.replace('go test', 'go test -coverprofile=coverage.out');
    
    if (outputFormat === 'html') {
      command += ' && go tool cover -html=coverage.out -o coverage.html';
    } else if (outputFormat === 'json') {
      command += ' && go tool cover -func=coverage.out > coverage.txt';
    }
    
    return command;
  }

  private buildCargoTestCoverageCommand(testCommand: string, outputFormat: string): string {
    // Using tarpaulin for Rust coverage
    let command = 'cargo tarpaulin --out xml';
    
    switch (outputFormat) {
      case 'json':
        command = 'cargo tarpaulin --out json';
        break;
      case 'html':
        command = 'cargo tarpaulin --out html';
        break;
      case 'lcov':
        command = 'cargo tarpaulin --out lcov';
        break;
    }
    
    return command;
  }

  private buildDotnetTestCoverageCommand(testCommand: string, outputFormat: string): string {
    let command = `${testCommand} --collect:"XPlat Code Coverage"`;
    
    if (outputFormat === 'html') {
      command += ' && reportgenerator -reports:"**/*coverage.cobertura.xml" -targetdir:"coverage" -reporttypes:Html';
    }
    
    return command;
  }

  private buildPhpunitCoverageCommand(testCommand: string, outputFormat: string): string {
    switch (outputFormat) {
      case 'html':
        return `${testCommand} --coverage-html coverage`;
      case 'json':
        return `${testCommand} --coverage-clover coverage.xml`;
      case 'text':
        return `${testCommand} --coverage-text`;
      default:
        return `${testCommand} --coverage-html coverage`;
    }
  }

  private async parseCoverageResults(projectPath: string, outputFormat: string): Promise<any> {
    const coverageFiles = await this.findCoverageFiles(projectPath, outputFormat);
    
    if (coverageFiles.length === 0) {
      throw new Error('No coverage files found after test execution');
    }

    // Try to parse the main coverage file
    const mainCoverageFile = coverageFiles[0];
    const content = await fs.readFile(mainCoverageFile, 'utf8');
    
    try {
      if (mainCoverageFile.endsWith('.json')) {
        return JSON.parse(content);
      } else if (mainCoverageFile.endsWith('.xml')) {
        return this.parseXmlCoverage(content);
      } else if (mainCoverageFile.endsWith('.lcov')) {
        return this.parseLcovCoverage(content);
      } else {
        return this.parseTextCoverage(content);
      }
    } catch (error) {
      throw new Error(`Failed to parse coverage file ${mainCoverageFile}: ${error}`);
    }
  }

  private async findCoverageFiles(projectPath: string, outputFormat: string): Promise<string[]> {
    const potentialFiles: string[] = [];
    
    // Common coverage file locations
    const coveragePaths = [
      'coverage',
      'coverage/json',
      'coverage/html',
      'coverage/lcov-report',
      '.nyc_output',
      'htmlcov',
      'test-results',
    ];

    const filePatterns: Record<string, string[]> = {
      json: [
        'coverage-final.json',
        'coverage-summary.json',
        'coverage.json',
        'cobertura-coverage.xml',
      ],
      html: ['index.html', 'coverage.html'],
      lcov: ['lcov.info', 'coverage.lcov'],
      text: ['coverage.txt', 'coverage.out'],
    };

    const patterns = filePatterns[outputFormat] || filePatterns.json;

    for (const coveragePath of coveragePaths) {
      const fullCoveragePath = path.join(projectPath, coveragePath);
      
      try {
        const stats = await fs.stat(fullCoveragePath);
        if (stats.isDirectory()) {
          for (const pattern of patterns) {
            const filePath = path.join(fullCoveragePath, pattern);
            try {
              await fs.access(filePath);
              potentialFiles.push(filePath);
            } catch {
              // File doesn't exist, continue
            }
          }
        }
      } catch {
        // Directory doesn't exist, continue
      }
    }

    // Also check root directory
    for (const pattern of patterns) {
      const filePath = path.join(projectPath, pattern);
      try {
        await fs.access(filePath);
        potentialFiles.push(filePath);
      } catch {
        // File doesn't exist, continue
      }
    }

    return potentialFiles;
  }

  private parseXmlCoverage(xmlContent: string): any {
    // Basic XML parsing for Cobertura format
    const coverage: any = {
      files: {},
      overall: { lines: 0, functions: 0, branches: 0, statements: 0 },
    };

    // Extract line coverage percentage
    const lineCoverageMatch = xmlContent.match(/line-rate="([0-9.]+)"/);
    if (lineCoverageMatch) {
      coverage.overall.lines = Math.round(parseFloat(lineCoverageMatch[1]) * 100);
    }

    // Extract branch coverage percentage
    const branchCoverageMatch = xmlContent.match(/branch-rate="([0-9.]+)"/);
    if (branchCoverageMatch) {
      coverage.overall.branches = Math.round(parseFloat(branchCoverageMatch[1]) * 100);
    }

    return coverage;
  }

  private parseLcovCoverage(lcovContent: string): any {
    const coverage: any = {
      files: {},
      overall: { lines: 0, functions: 0, branches: 0, statements: 0 },
    };

    const sections = lcovContent.split('end_of_record');
    let totalLines = 0;
    let coveredLines = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    let totalBranches = 0;
    let coveredBranches = 0;

    for (const section of sections) {
      const lines = section.split('\n');
      let fileName = '';
      
      for (const line of lines) {
        if (line.startsWith('SF:')) {
          fileName = line.substring(3);
        } else if (line.startsWith('LF:')) {
          totalLines += parseInt(line.substring(3));
        } else if (line.startsWith('LH:')) {
          coveredLines += parseInt(line.substring(3));
        } else if (line.startsWith('FNF:')) {
          totalFunctions += parseInt(line.substring(4));
        } else if (line.startsWith('FNH:')) {
          coveredFunctions += parseInt(line.substring(4));
        } else if (line.startsWith('BRF:')) {
          totalBranches += parseInt(line.substring(4));
        } else if (line.startsWith('BRH:')) {
          coveredBranches += parseInt(line.substring(4));
        }
      }
    }

    coverage.overall.lines = totalLines > 0 ? Math.round((coveredLines / totalLines) * 100) : 0;
    coverage.overall.functions = totalFunctions > 0 ? Math.round((coveredFunctions / totalFunctions) * 100) : 0;
    coverage.overall.branches = totalBranches > 0 ? Math.round((coveredBranches / totalBranches) * 100) : 0;
    coverage.overall.statements = coverage.overall.lines; // Approximate

    return coverage;
  }

  private parseTextCoverage(textContent: string): any {
    const coverage: any = {
      files: {},
      overall: { lines: 0, functions: 0, branches: 0, statements: 0 },
    };

    // Try to extract percentage values from text
    const percentageRegex = /(\d+(?:\.\d+)?)%/g;
    const matches = textContent.match(percentageRegex);
    
    if (matches && matches.length > 0) {
      const percentage = parseFloat(matches[0]);
      coverage.overall.lines = percentage;
      coverage.overall.statements = percentage;
      coverage.overall.functions = percentage;
      coverage.overall.branches = percentage;
    }

    return coverage;
  }

  private generateCoverageReport(
    coverageData: any,
    thresholds?: CoverageAnalysisParams['thresholds']
  ): CoverageReport {
    const files: CoverageFile[] = [];
    
    // Process individual file coverage
    if (coverageData.files) {
      for (const [filePath, fileData] of Object.entries(coverageData.files)) {
        const file = this.processCoverageFile(filePath, fileData as any);
        files.push(file);
      }
    }

    // Calculate overall coverage
    const overall = {
      lines: coverageData.overall?.lines || 0,
      functions: coverageData.overall?.functions || 0,
      branches: coverageData.overall?.branches || 0,
      statements: coverageData.overall?.statements || coverageData.overall?.lines || 0,
    };

    return {
      files,
      overall,
      threshold: thresholds ? {
        lines: thresholds.lines,
        functions: thresholds.functions,
        branches: thresholds.branches,
        statements: thresholds.statements,
      } : undefined,
      timestamp: new Date(),
    };
  }

  private processCoverageFile(filePath: string, fileData: any): CoverageFile {
    return {
      path: filePath,
      lines: {
        total: fileData.lines?.total || 0,
        covered: fileData.lines?.covered || 0,
        percentage: this.calculatePercentage(
          fileData.lines?.covered || 0,
          fileData.lines?.total || 0
        ),
      },
      functions: {
        total: fileData.functions?.total || 0,
        covered: fileData.functions?.covered || 0,
        percentage: this.calculatePercentage(
          fileData.functions?.covered || 0,
          fileData.functions?.total || 0
        ),
      },
      branches: {
        total: fileData.branches?.total || 0,
        covered: fileData.branches?.covered || 0,
        percentage: this.calculatePercentage(
          fileData.branches?.covered || 0,
          fileData.branches?.total || 0
        ),
      },
    };
  }

  private calculatePercentage(covered: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((covered / total) * 100 * 100) / 100; // Round to 2 decimal places
  }
}