import {
  GeneratedTests,
  GeneratedTest,
  SupportedLanguage,
  TestType,
} from '../types/tdd.js';
import { SUPPORTED_FRAMEWORKS } from '../types/test-frameworks.js';

interface TestGenerationParams {
  requirements: string;
  language: SupportedLanguage;
  framework: string;
  testType: TestType;
  existingCode?: string;
}

export class TestGeneratorService {
  async generateTests(params: TestGenerationParams): Promise<GeneratedTests> {
    const { requirements, language, framework, testType, existingCode } = params;

    // Validate framework support
    if (!this.isFrameworkSupported(language, framework)) {
      throw new Error(`Framework ${framework} is not supported for language ${language}`);
    }

    // Generate tests based on requirements and language/framework
    const tests = await this.generateTestCases(params);

    return {
      language,
      framework,
      testType,
      tests,
      metadata: {
        generatedAt: new Date(),
        requirements,
        estimatedCoverage: this.estimateCoverage(tests),
      },
    };
  }

  private async generateTestCases(params: TestGenerationParams): Promise<GeneratedTest[]> {
    const tests: GeneratedTest[] = [];

    // Parse requirements to identify testable behaviors
    const behaviors = this.parseRequirements(params.requirements);

    for (const behavior of behaviors) {
      // Generate happy path test
      const happyPathTest = await this.generateHappyPathTest(behavior, params);
      tests.push(happyPathTest);

      // Generate edge case tests
      const edgeCaseTests = await this.generateEdgeCaseTests(behavior, params);
      tests.push(...edgeCaseTests);

      // Generate error case tests
      const errorCaseTests = await this.generateErrorCaseTests(behavior, params);
      tests.push(...errorCaseTests);
    }

    return tests;
  }

  private parseRequirements(requirements: string): string[] {
    // Simple requirement parsing - in a real implementation, this would be more sophisticated
    const behaviors: string[] = [];
    
    // Look for patterns like "should", "must", "when", "given"
    const sentences = requirements.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.toLowerCase().includes('should') || 
          trimmed.toLowerCase().includes('must') ||
          trimmed.toLowerCase().includes('when') ||
          trimmed.toLowerCase().includes('given')) {
        behaviors.push(trimmed);
      }
    }

    // If no specific behaviors found, treat the whole requirement as one behavior
    if (behaviors.length === 0) {
      behaviors.push(requirements);
    }

    return behaviors;
  }

  private async generateHappyPathTest(
    behavior: string,
    params: TestGenerationParams
  ): Promise<GeneratedTest> {
    const testName = this.generateTestName(behavior, 'happy_path');
    const testCode = this.generateTestCode(testName, behavior, 'happy_path', params);

    return {
      name: testName,
      description: `Test the happy path for: ${behavior}`,
      code: testCode,
      imports: this.getRequiredImports(params.language, params.framework),
    };
  }

  private async generateEdgeCaseTests(
    behavior: string,
    params: TestGenerationParams
  ): Promise<GeneratedTest[]> {
    const edgeCases = this.identifyEdgeCases(behavior);
    const tests: GeneratedTest[] = [];

    for (const edgeCase of edgeCases) {
      const testName = this.generateTestName(behavior, 'edge_case', edgeCase);
      const testCode = this.generateTestCode(testName, behavior, 'edge_case', params, edgeCase);

      tests.push({
        name: testName,
        description: `Test edge case: ${edgeCase}`,
        code: testCode,
        imports: this.getRequiredImports(params.language, params.framework),
      });
    }

    return tests;
  }

  private async generateErrorCaseTests(
    behavior: string,
    params: TestGenerationParams
  ): Promise<GeneratedTest[]> {
    const errorCases = this.identifyErrorCases(behavior);
    const tests: GeneratedTest[] = [];

    for (const errorCase of errorCases) {
      const testName = this.generateTestName(behavior, 'error_case', errorCase);
      const testCode = this.generateTestCode(testName, behavior, 'error_case', params, errorCase);

      tests.push({
        name: testName,
        description: `Test error case: ${errorCase}`,
        code: testCode,
        imports: this.getRequiredImports(params.language, params.framework),
      });
    }

    return tests;
  }

  private generateTestName(
    behavior: string,
    testType: string,
    specificCase?: string
  ): string {
    // Convert behavior to test method name
    let name = behavior
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/^(should_|must_|when_|given_)/, '');

    if (specificCase) {
      name += `_${specificCase.toLowerCase().replace(/\s+/g, '_')}`;
    }

    return `test_${name}`;
  }

  private generateTestCode(
    testName: string,
    behavior: string,
    testType: string,
    params: TestGenerationParams,
    specificCase?: string
  ): string {
    switch (params.language) {
      case SupportedLanguage.TYPESCRIPT:
      case SupportedLanguage.JAVASCRIPT:
        return this.generateJavaScriptTestCode(testName, behavior, testType, params, specificCase);
      case SupportedLanguage.PYTHON:
        return this.generatePythonTestCode(testName, behavior, testType, params, specificCase);
      case SupportedLanguage.JAVA:
        return this.generateJavaTestCode(testName, behavior, testType, params, specificCase);
      case SupportedLanguage.CSHARP:
        return this.generateCSharpTestCode(testName, behavior, testType, params, specificCase);
      default:
        throw new Error(`Code generation not implemented for language: ${params.language}`);
    }
  }

  private generateJavaScriptTestCode(
    testName: string,
    behavior: string,
    testType: string,
    params: TestGenerationParams,
    specificCase?: string
  ): string {
    const className = this.extractClassName(behavior);
    const methodName = this.extractMethodName(behavior);

    if (params.framework === 'jest') {
      return `describe('${className}', () => {
  it('${behavior}', () => {
    // Arrange
    const ${className.toLowerCase()} = new ${className}();
    ${this.generateArrangeSection(testType, params, specificCase)}
    
    // Act
    ${this.generateActSection(testType, className, methodName, params, specificCase)}
    
    // Assert
    ${this.generateAssertSection(testType, params, specificCase)}
  });
});`;
    }

    return `// Test code for ${testName}`;
  }

  private generatePythonTestCode(
    testName: string,
    behavior: string,
    testType: string,
    params: TestGenerationParams,
    specificCase?: string
  ): string {
    const className = this.extractClassName(behavior);
    const methodName = this.extractMethodName(behavior);

    if (params.framework === 'pytest') {
      return `def ${testName}():
    """${behavior}"""
    # Arrange
    ${className.toLowerCase()} = ${className}()
    ${this.generateArrangeSection(testType, params, specificCase)}
    
    # Act
    ${this.generateActSection(testType, className, methodName, params, specificCase)}
    
    # Assert
    ${this.generateAssertSection(testType, params, specificCase)}`;
    }

    return `# Test code for ${testName}`;
  }

  private generateJavaTestCode(
    testName: string,
    behavior: string,
    testType: string,
    params: TestGenerationParams,
    specificCase?: string
  ): string {
    const className = this.extractClassName(behavior);
    const methodName = this.extractMethodName(behavior);

    return `@Test
public void ${testName}() {
    // ${behavior}
    
    // Arrange
    ${className} ${className.toLowerCase()} = new ${className}();
    ${this.generateArrangeSection(testType, params, specificCase)}
    
    // Act
    ${this.generateActSection(testType, className, methodName, params, specificCase)}
    
    // Assert
    ${this.generateAssertSection(testType, params, specificCase)}
}`;
  }

  private generateCSharpTestCode(
    testName: string,
    behavior: string,
    testType: string,
    params: TestGenerationParams,
    specificCase?: string
  ): string {
    const className = this.extractClassName(behavior);
    const methodName = this.extractMethodName(behavior);

    return `[Test]
public void ${testName}()
{
    // ${behavior}
    
    // Arrange
    var ${className.toLowerCase()} = new ${className}();
    ${this.generateArrangeSection(testType, params, specificCase)}
    
    // Act
    ${this.generateActSection(testType, className, methodName, params, specificCase)}
    
    // Assert
    ${this.generateAssertSection(testType, params, specificCase)}
}`;
  }

  private generateArrangeSection(
    testType: string,
    params: TestGenerationParams,
    specificCase?: string
  ): string {
    // Generate appropriate test data based on test type and case
    switch (testType) {
      case 'happy_path':
        return '// Set up valid test data';
      case 'edge_case':
        return `// Set up edge case data for: ${specificCase}`;
      case 'error_case':
        return `// Set up invalid data to trigger: ${specificCase}`;
      default:
        return '// Set up test data';
    }
  }

  private generateActSection(
    testType: string,
    className: string,
    methodName: string,
    params: TestGenerationParams,
    specificCase?: string
  ): string {
    const objectName = className.toLowerCase();
    
    if (testType === 'error_case') {
      switch (params.language) {
        case SupportedLanguage.TYPESCRIPT:
        case SupportedLanguage.JAVASCRIPT:
          return `expect(() => ${objectName}.${methodName}(testData)).toThrow();`;
        case SupportedLanguage.PYTHON:
          return `with pytest.raises(Exception):
        ${objectName}.${methodName}(test_data)`;
        case SupportedLanguage.JAVA:
          return `assertThrows(Exception.class, () -> ${objectName}.${methodName}(testData));`;
        case SupportedLanguage.CSHARP:
          return `Assert.Throws<Exception>(() => ${objectName}.${methodName}(testData));`;
      }
    }

    return `const result = ${objectName}.${methodName}(testData);`;
  }

  private generateAssertSection(
    testType: string,
    params: TestGenerationParams,
    specificCase?: string
  ): string {
    if (testType === 'error_case') {
      return '// Error case assertion handled in Act section';
    }

    switch (params.language) {
      case SupportedLanguage.TYPESCRIPT:
      case SupportedLanguage.JAVASCRIPT:
        return 'expect(result).toBeDefined();\n    // Add specific assertions based on expected behavior';
      case SupportedLanguage.PYTHON:
        return 'assert result is not None\n    # Add specific assertions based on expected behavior';
      case SupportedLanguage.JAVA:
        return 'assertNotNull(result);\n    // Add specific assertions based on expected behavior';
      case SupportedLanguage.CSHARP:
        return 'Assert.NotNull(result);\n    // Add specific assertions based on expected behavior';
      default:
        return '// Add assertions based on expected behavior';
    }
  }

  private extractClassName(behavior: string): string {
    // Simple heuristic to extract class name from behavior
    const words = behavior.split(' ');
    const relevantWords = words.filter(word => 
      word.length > 2 && 
      !['the', 'and', 'or', 'but', 'should', 'must', 'when', 'given'].includes(word.toLowerCase())
    );
    
    if (relevantWords.length > 0) {
      return relevantWords[0].charAt(0).toUpperCase() + relevantWords[0].slice(1).toLowerCase();
    }
    
    return 'TestSubject';
  }

  private extractMethodName(behavior: string): string {
    // Simple heuristic to extract method name from behavior
    const words = behavior.toLowerCase().split(' ');
    const verbs = ['create', 'update', 'delete', 'get', 'set', 'calculate', 'process', 'validate'];
    
    for (const verb of verbs) {
      if (words.includes(verb)) {
        return verb;
      }
    }
    
    return 'execute';
  }

  private identifyEdgeCases(behavior: string): string[] {
    const edgeCases: string[] = [];
    
    // Common edge cases based on behavior analysis
    if (behavior.toLowerCase().includes('number') || behavior.toLowerCase().includes('count')) {
      edgeCases.push('zero value', 'negative value', 'maximum value');
    }
    
    if (behavior.toLowerCase().includes('string') || behavior.toLowerCase().includes('text')) {
      edgeCases.push('empty string', 'very long string', 'special characters');
    }
    
    if (behavior.toLowerCase().includes('array') || behavior.toLowerCase().includes('list')) {
      edgeCases.push('empty array', 'single element', 'very large array');
    }
    
    // If no specific edge cases identified, add generic ones
    if (edgeCases.length === 0) {
      edgeCases.push('boundary condition', 'extreme value');
    }
    
    return edgeCases;
  }

  private identifyErrorCases(behavior: string): string[] {
    const errorCases: string[] = [];
    
    // Common error cases
    errorCases.push('null input', 'invalid input', 'unauthorized access');
    
    if (behavior.toLowerCase().includes('database') || behavior.toLowerCase().includes('storage')) {
      errorCases.push('connection failure', 'timeout');
    }
    
    if (behavior.toLowerCase().includes('network') || behavior.toLowerCase().includes('api')) {
      errorCases.push('network error', 'server error');
    }
    
    return errorCases;
  }

  private getRequiredImports(language: SupportedLanguage, framework: string): string[] {
    const imports: string[] = [];
    
    switch (language) {
      case SupportedLanguage.TYPESCRIPT:
      case SupportedLanguage.JAVASCRIPT:
        if (framework === 'jest') {
          imports.push("import { describe, it, expect } from '@jest/globals';");
        }
        break;
      case SupportedLanguage.PYTHON:
        if (framework === 'pytest') {
          imports.push('import pytest');
        }
        break;
      case SupportedLanguage.JAVA:
        imports.push('import org.junit.jupiter.api.Test;', 'import static org.junit.jupiter.api.Assertions.*;');
        break;
      case SupportedLanguage.CSHARP:
        imports.push('using NUnit.Framework;');
        break;
    }
    
    return imports;
  }

  private isFrameworkSupported(language: SupportedLanguage, framework: string): boolean {
    // Check if the framework is supported for the given language
    const supportedFrameworks = Object.values(SUPPORTED_FRAMEWORKS);
    return supportedFrameworks.some(f => 
      f.language === language && f.name.toLowerCase() === framework.toLowerCase()
    );
  }

  private estimateCoverage(tests: GeneratedTest[]): number {
    // Simple heuristic to estimate coverage based on number of tests
    const baselineScore = Math.min(tests.length * 15, 80);
    
    // Bonus for different test types
    const hasHappyPath = tests.some(t => t.description.includes('happy path'));
    const hasEdgeCases = tests.some(t => t.description.includes('edge case'));
    const hasErrorCases = tests.some(t => t.description.includes('error case'));
    
    let bonus = 0;
    if (hasHappyPath) bonus += 5;
    if (hasEdgeCases) bonus += 10;
    if (hasErrorCases) bonus += 5;
    
    return Math.min(baselineScore + bonus, 95);
  }
}