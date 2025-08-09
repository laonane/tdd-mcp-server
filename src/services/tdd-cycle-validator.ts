import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import {
  TDDCycleValidation,
  TDDCycleState,
} from '../types/tdd.js';

const execAsync = promisify(exec);

interface TDDCycleValidationParams {
  projectPath: string;
  gitHistory?: string[];
  timeWindow?: string;
}

export class TDDCycleValidatorService {
  async validateCycle(params: TDDCycleValidationParams): Promise<TDDCycleValidation> {
    const { projectPath, gitHistory, timeWindow = '1 hour' } = params;

    try {
      // Get git history if not provided
      const commits = gitHistory || await this.getRecentCommits(projectPath, timeWindow);
      
      // Analyze the current state
      const currentState = await this.determineCurrentState(projectPath);
      
      // Analyze TDD adherence
      const analysis = await this.analyzeTDDAdherence(projectPath, commits);
      
      // Generate validation result
      return {
        isValid: analysis.violations.length === 0,
        currentState,
        violations: analysis.violations,
        suggestions: analysis.suggestions,
        score: analysis.score,
      };
    } catch (error: any) {
      throw new Error(`TDD cycle validation failed: ${error.message}`);
    }
  }

  private async getRecentCommits(projectPath: string, timeWindow: string): Promise<string[]> {
    try {
      const gitCommand = `git log --since="${timeWindow}" --oneline --pretty=format:"%h|%s|%an|%ad" --date=iso`;
      const { stdout } = await execAsync(gitCommand, { cwd: projectPath });
      
      return stdout.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
      // If git is not available or not a git repository, return empty array
      return [];
    }
  }

  private async determineCurrentState(projectPath: string): Promise<TDDCycleState> {
    try {
      // Check if there are any test files
      const hasTests = await this.hasTestFiles(projectPath);
      if (!hasTests) {
        return TDDCycleState.RED; // Should start with tests
      }

      // Try to run tests to determine state
      const testResults = await this.runQuickTests(projectPath);
      
      if (testResults.failed > 0) {
        return TDDCycleState.RED; // Tests are failing
      } else if (testResults.passed > 0) {
        // Tests are passing - check if we need refactoring
        const needsRefactoring = await this.needsRefactoring(projectPath);
        return needsRefactoring ? TDDCycleState.REFACTOR : TDDCycleState.GREEN;
      }
      
      return TDDCycleState.RED; // Default to red if unclear
    } catch (error) {
      // If we can't determine state, assume red
      return TDDCycleState.RED;
    }
  }

  private async hasTestFiles(projectPath: string): Promise<boolean> {
    const testPatterns = [
      '**/*.test.{js,ts,py,java,cs,go,rs,php}',
      '**/*.spec.{js,ts,py,java,cs,go,rs,php}',
      '**/test_*.py',
      '**/*_test.{go,rs}',
      '**/Test*.{java,cs,php}',
      'tests/**/*',
      '__tests__/**/*',
    ];

    for (const pattern of testPatterns) {
      try {
        const { glob } = await import('glob');
        const files = await glob(pattern, {
          cwd: projectPath,
          ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
        });
        
        if (files.length > 0) {
          return true;
        }
      } catch (error) {
        // Continue with next pattern
      }
    }

    return false;
  }

  private async runQuickTests(projectPath: string): Promise<{ passed: number; failed: number }> {
    try {
      // Try common test commands
      const testCommands = [
        'npm test -- --passWithNoTests',
        'jest --passWithNoTests',
        'pytest --tb=no -q',
        'go test ./... -v',
        'cargo test',
        'dotnet test --no-build --verbosity=quiet',
        'php vendor/bin/phpunit',
      ];

      for (const command of testCommands) {
        try {
          const { stdout, stderr } = await execAsync(command, {
            cwd: projectPath,
            timeout: 30000, // 30 seconds timeout for quick tests
          });

          return this.parseTestOutput(stdout + stderr, command);
        } catch (error: any) {
          // If command fails, try next one
          continue;
        }
      }

      return { passed: 0, failed: 0 };
    } catch (error) {
      return { passed: 0, failed: 0 };
    }
  }

  private parseTestOutput(output: string, command: string): { passed: number; failed: number } {
    let passed = 0;
    let failed = 0;

    if (command.includes('jest') || command.includes('npm test')) {
      const passMatch = output.match(/(\d+) passed/);
      const failMatch = output.match(/(\d+) failed/);
      passed = passMatch ? parseInt(passMatch[1]) : 0;
      failed = failMatch ? parseInt(failMatch[1]) : 0;
    } else if (command.includes('pytest')) {
      const resultMatch = output.match(/(\d+) passed(?:, (\d+) failed)?/);
      if (resultMatch) {
        passed = parseInt(resultMatch[1]);
        failed = resultMatch[2] ? parseInt(resultMatch[2]) : 0;
      }
    } else if (command.includes('go test')) {
      const passMatch = output.match(/ok\s+\S+/g);
      const failMatch = output.match(/FAIL\s+\S+/g);
      passed = passMatch ? passMatch.length : 0;
      failed = failMatch ? failMatch.length : 0;
    } else {
      // Generic parsing
      const passedLines = output.split('\n').filter(line => 
        line.includes('passed') || line.includes('OK') || line.includes('✓')
      ).length;
      const failedLines = output.split('\n').filter(line => 
        line.includes('failed') || line.includes('FAIL') || line.includes('✗') || line.includes('ERROR')
      ).length;
      
      passed = passedLines;
      failed = failedLines;
    }

    return { passed, failed };
  }

  private async needsRefactoring(projectPath: string): Promise<boolean> {
    try {
      // Simple heuristics to determine if refactoring is needed
      const codeQualityIssues = await this.analyzeCodeQuality(projectPath);
      
      return codeQualityIssues.duplicationCount > 0 || 
             codeQualityIssues.complexityIssues > 0 || 
             codeQualityIssues.longMethods > 0;
    } catch (error) {
      return false;
    }
  }

  private async analyzeCodeQuality(projectPath: string): Promise<CodeQualityAnalysis> {
    const analysis: CodeQualityAnalysis = {
      duplicationCount: 0,
      complexityIssues: 0,
      longMethods: 0,
    };

    try {
      // Find source files
      const { glob } = await import('glob');
      const sourceFiles = await glob('**/*.{js,ts,py,java,cs,go,rs,php}', {
        cwd: projectPath,
        ignore: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/target/**',
          '**/*.test.*',
          '**/*.spec.*',
          '**/test_*',
          '**/*_test.*',
        ],
      });

      // Analyze each file
      for (const file of sourceFiles.slice(0, 10)) { // Limit to first 10 files for quick analysis
        const filePath = path.join(projectPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        
        analysis.duplicationCount += this.detectSimpleDuplication(content);
        analysis.complexityIssues += this.detectComplexityIssues(content);
        analysis.longMethods += this.detectLongMethods(content);
      }
    } catch (error) {
      // Analysis failed, assume no issues
    }

    return analysis;
  }

  private detectSimpleDuplication(content: string): number {
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('//') && !line.startsWith('*'));

    const lineMap = new Map<string, number>();
    
    for (const line of lines) {
      if (line.length > 20) { // Only consider substantial lines
        lineMap.set(line, (lineMap.get(line) || 0) + 1);
      }
    }

    let duplicateLines = 0;
    for (const [line, count] of lineMap.entries()) {
      if (count > 1) {
        duplicateLines += count - 1;
      }
    }

    return Math.floor(duplicateLines / 3); // Group into potential duplication blocks
  }

  private detectComplexityIssues(content: string): number {
    // Count nested structures and complex conditions
    let complexity = 0;
    
    // Nested if statements
    const nestedIfMatches = content.match(/if\s*\([^)]*\)\s*\{[^}]*if\s*\(/g);
    complexity += nestedIfMatches ? nestedIfMatches.length : 0;
    
    // Complex boolean expressions
    const complexBooleanMatches = content.match(/if\s*\([^)]*(\&\&|\|\|)[^)]*(\&\&|\|\|)[^)]*\)/g);
    complexity += complexBooleanMatches ? complexBooleanMatches.length : 0;
    
    // Long parameter lists
    const longParamMatches = content.match(/\([^)]*,[^)]*,[^)]*,[^)]*,[^)]*\)/g);
    complexity += longParamMatches ? longParamMatches.length : 0;

    return complexity;
  }

  private detectLongMethods(content: string): number {
    let longMethods = 0;
    
    // Simple method detection and line counting
    const methodPatterns = [
      /function\s+\w+\s*\([^)]*\)\s*\{/g,
      /def\s+\w+\s*\([^)]*\):/g,
      /(?:public|private|protected)?\s*\w+\s+\w+\s*\([^)]*\)\s*\{/g,
    ];

    for (const pattern of methodPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const methodStart = match.index;
        const methodEnd = this.findMethodEndIndex(content, methodStart);
        const methodLines = content.substring(methodStart, methodEnd).split('\n').length;
        
        if (methodLines > 20) {
          longMethods++;
        }
      }
    }

    return longMethods;
  }

  private findMethodEndIndex(content: string, startIndex: number): number {
    // Simple brace matching
    let braceCount = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = startIndex; i < content.length; i++) {
      const char = content[i];
      
      if (inString) {
        if (char === stringChar && content[i - 1] !== '\\') {
          inString = false;
        }
        continue;
      }
      
      if (char === '"' || char === "'" || char === '`') {
        inString = true;
        stringChar = char;
        continue;
      }
      
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          return i + 1;
        }
      }
    }
    
    return content.length;
  }

  private async analyzeTDDAdherence(projectPath: string, commits: string[]): Promise<TDDAnalysis> {
    const violations: Array<{
      type: 'no_failing_test' | 'premature_implementation' | 'skipped_refactor';
      description: string;
      suggestion: string;
    }> = [];
    
    const suggestions: string[] = [];
    let score = 100;

    // Analyze commit patterns
    const commitAnalysis = this.analyzeCommitPatterns(commits);
    
    // Check for TDD violations
    if (commitAnalysis.hasImplementationBeforeTests) {
      violations.push({
        type: 'premature_implementation',
        description: 'Implementation code was committed before corresponding tests',
        suggestion: 'Always write failing tests before implementing functionality',
      });
      score -= 30;
    }

    if (commitAnalysis.lacksTestCommits) {
      violations.push({
        type: 'no_failing_test',
        description: 'No test commits found in recent history',
        suggestion: 'Ensure you are writing tests as part of your development process',
      });
      score -= 25;
    }

    if (commitAnalysis.lacksRefactorCommits && commitAnalysis.hasMultipleFeatureCommits) {
      violations.push({
        type: 'skipped_refactor',
        description: 'Multiple feature implementations without refactoring commits',
        suggestion: 'Include refactoring as a regular part of your TDD cycle',
      });
      score -= 20;
    }

    // Generate suggestions based on current state
    const currentState = await this.determineCurrentState(projectPath);
    
    switch (currentState) {
      case TDDCycleState.RED:
        suggestions.push('Write minimal code to make the failing test pass');
        suggestions.push('Focus on functionality, not code quality yet');
        break;
      case TDDCycleState.GREEN:
        suggestions.push('Look for refactoring opportunities to improve code quality');
        suggestions.push('Remove duplication and improve naming');
        suggestions.push('Consider extracting methods or classes');
        break;
      case TDDCycleState.REFACTOR:
        suggestions.push('Make small, incremental improvements');
        suggestions.push('Run tests frequently to ensure behavior is preserved');
        suggestions.push('Commit refactoring changes separately');
        break;
    }

    // Additional suggestions based on analysis
    if (violations.length === 0) {
      suggestions.push('Great job following TDD! Continue with small, incremental changes');
    } else {
      suggestions.push('Review TDD principles: Red-Green-Refactor cycle');
      suggestions.push('Consider using git commits to track TDD progress');
    }

    return {
      violations,
      suggestions,
      score: Math.max(score, 0),
    };
  }

  private analyzeCommitPatterns(commits: string[]): CommitPatternAnalysis {
    const testKeywords = ['test', 'spec', 'TDD', 'failing test', 'red'];
    const implementationKeywords = ['implement', 'add', 'feature', 'fix', 'green'];
    const refactorKeywords = ['refactor', 'cleanup', 'improve', 'extract', 'rename'];

    let testCommits = 0;
    let implementationCommits = 0;
    let refactorCommits = 0;
    let hasImplementationBeforeTests = false;

    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i].toLowerCase();
      
      const isTest = testKeywords.some(keyword => commit.includes(keyword));
      const isImplementation = implementationKeywords.some(keyword => commit.includes(keyword));
      const isRefactor = refactorKeywords.some(keyword => commit.includes(keyword));

      if (isTest) testCommits++;
      if (isImplementation) implementationCommits++;
      if (isRefactor) refactorCommits++;

      // Check if implementation comes before tests (anti-pattern)
      if (isImplementation && i > 0) {
        const previousCommit = commits[i - 1].toLowerCase();
        const previousIsTest = testKeywords.some(keyword => previousCommit.includes(keyword));
        if (!previousIsTest) {
          hasImplementationBeforeTests = true;
        }
      }
    }

    return {
      testCommits,
      implementationCommits,
      refactorCommits,
      hasImplementationBeforeTests,
      lacksTestCommits: testCommits === 0 && commits.length > 0,
      lacksRefactorCommits: refactorCommits === 0,
      hasMultipleFeatureCommits: implementationCommits > 2,
    };
  }
}

interface CodeQualityAnalysis {
  duplicationCount: number;
  complexityIssues: number;
  longMethods: number;
}

interface TDDAnalysis {
  violations: Array<{
    type: 'no_failing_test' | 'premature_implementation' | 'skipped_refactor';
    description: string;
    suggestion: string;
  }>;
  suggestions: string[];
  score: number;
}

interface CommitPatternAnalysis {
  testCommits: number;
  implementationCommits: number;
  refactorCommits: number;
  hasImplementationBeforeTests: boolean;
  lacksTestCommits: boolean;
  lacksRefactorCommits: boolean;
  hasMultipleFeatureCommits: boolean;
}