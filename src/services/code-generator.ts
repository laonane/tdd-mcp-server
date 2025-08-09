import {
  GeneratedImplementation,
  SupportedLanguage,
} from '../types/tdd.js';

interface CodeGenerationParams {
  testCode: string;
  language: SupportedLanguage;
  implementationStyle: 'minimal' | 'comprehensive' | 'production-ready';
  architecturalConstraints?: string;
}

export class CodeGeneratorService {
  async generateImplementation(params: CodeGenerationParams): Promise<GeneratedImplementation> {
    const { testCode, language, implementationStyle, architecturalConstraints } = params;

    // Parse the test code to understand requirements
    const requirements = this.parseTestRequirements(testCode, language);
    
    // Generate implementation code
    const code = this.generateCode(requirements, params);
    
    // Extract imports and exports
    const imports = this.generateImports(requirements, language);
    const exports = this.generateExports(requirements, language);
    const dependencies = this.identifyDependencies(requirements, language);

    return {
      language,
      code,
      imports,
      exports,
      dependencies,
      metadata: {
        generatedAt: new Date(),
        basedOnTests: this.extractTestNames(testCode),
        implementationStyle,
      },
    };
  }

  private parseTestRequirements(testCode: string, language: SupportedLanguage): TestRequirement[] {
    const requirements: TestRequirement[] = [];

    switch (language) {
      case SupportedLanguage.TYPESCRIPT:
      case SupportedLanguage.JAVASCRIPT:
        return this.parseJavaScriptTests(testCode);
      case SupportedLanguage.PYTHON:
        return this.parsePythonTests(testCode);
      case SupportedLanguage.JAVA:
        return this.parseJavaTests(testCode);
      case SupportedLanguage.CSHARP:
        return this.parseCSharpTests(testCode);
      default:
        throw new Error(`Test parsing not implemented for language: ${language}`);
    }
  }

  private parseJavaScriptTests(testCode: string): TestRequirement[] {
    const requirements: TestRequirement[] = [];
    
    // Extract class/module name from describe blocks
    const describeMatches = testCode.match(/describe\(['"`]([^'"`]+)['"`]/g);
    const className = describeMatches?.[0]?.match(/['"`]([^'"`]+)['"`]/)?.[1] || 'TestSubject';

    // Extract test cases and their expectations
    const itMatches = testCode.match(/it\(['"`]([^'"`]+)['"`][\s\S]*?}\);?/g);
    
    if (itMatches) {
      for (const itBlock of itMatches) {
        const testName = itBlock.match(/it\(['"`]([^'"`]+)['"`]/)?.[1] || '';
        const methodCalls = this.extractMethodCalls(itBlock);
        const expectations = this.extractExpectations(itBlock);
        
        requirements.push({
          className,
          testName,
          methodCalls,
          expectations,
          shouldThrow: itBlock.includes('toThrow') || itBlock.includes('throws'),
        });
      }
    }

    return requirements;
  }

  private parsePythonTests(testCode: string): TestRequirement[] {
    const requirements: TestRequirement[] = [];
    
    // Extract class name from test code
    const classMatches = testCode.match(/([A-Z][a-zA-Z0-9]*)\(\)/g);
    const className = classMatches?.[0]?.replace('()', '') || 'TestSubject';

    // Extract test functions
    const testMatches = testCode.match(/def test_[^(]+\([^)]*\):[\s\S]*?(?=def test_|$)/g);
    
    if (testMatches) {
      for (const testFunc of testMatches) {
        const testName = testFunc.match(/def (test_[^(]+)/)?.[1] || '';
        const methodCalls = this.extractPythonMethodCalls(testFunc);
        const expectations = this.extractPythonExpectations(testFunc);
        
        requirements.push({
          className,
          testName,
          methodCalls,
          expectations,
          shouldThrow: testFunc.includes('pytest.raises') || testFunc.includes('assertRaises'),
        });
      }
    }

    return requirements;
  }

  private parseJavaTests(testCode: string): TestRequirement[] {
    const requirements: TestRequirement[] = [];
    
    // Extract class name
    const classMatches = testCode.match(/new ([A-Z][a-zA-Z0-9]*)\(\)/g);
    const className = classMatches?.[0]?.match(/new ([A-Z][a-zA-Z0-9]*)/)?.[1] || 'TestSubject';

    // Extract test methods
    const testMatches = testCode.match(/@Test[\s\S]*?public void [^}]+}/g);
    
    if (testMatches) {
      for (const testMethod of testMatches) {
        const testName = testMethod.match(/public void ([^(]+)/)?.[1] || '';
        const methodCalls = this.extractJavaMethodCalls(testMethod);
        const expectations = this.extractJavaExpectations(testMethod);
        
        requirements.push({
          className,
          testName,
          methodCalls,
          expectations,
          shouldThrow: testMethod.includes('assertThrows'),
        });
      }
    }

    return requirements;
  }

  private parseCSharpTests(testCode: string): TestRequirement[] {
    const requirements: TestRequirement[] = [];
    
    // Extract class name
    const classMatches = testCode.match(/new ([A-Z][a-zA-Z0-9]*)\(\)/g);
    const className = classMatches?.[0]?.match(/new ([A-Z][a-zA-Z0-9]*)/)?.[1] || 'TestSubject';

    // Extract test methods
    const testMatches = testCode.match(/\[Test\][\s\S]*?public void [^}]+}/g);
    
    if (testMatches) {
      for (const testMethod of testMatches) {
        const testName = testMethod.match(/public void ([^(]+)/)?.[1] || '';
        const methodCalls = this.extractCSharpMethodCalls(testMethod);
        const expectations = this.extractCSharpExpectations(testMethod);
        
        requirements.push({
          className,
          testName,
          methodCalls,
          expectations,
          shouldThrow: testMethod.includes('Assert.Throws'),
        });
      }
    }

    return requirements;
  }

  private generateCode(requirements: TestRequirement[], params: CodeGenerationParams): string {
    if (requirements.length === 0) {
      throw new Error('No requirements could be parsed from test code');
    }

    const className = requirements[0].className;
    
    switch (params.language) {
      case SupportedLanguage.TYPESCRIPT:
      case SupportedLanguage.JAVASCRIPT:
        return this.generateJavaScriptCode(className, requirements, params);
      case SupportedLanguage.PYTHON:
        return this.generatePythonCode(className, requirements, params);
      case SupportedLanguage.JAVA:
        return this.generateJavaCode(className, requirements, params);
      case SupportedLanguage.CSHARP:
        return this.generateCSharpCode(className, requirements, params);
      default:
        throw new Error(`Code generation not implemented for language: ${params.language}`);
    }
  }

  private generateJavaScriptCode(
    className: string,
    requirements: TestRequirement[],
    params: CodeGenerationParams
  ): string {
    const methods = this.extractUniqueMethods(requirements);
    const methodImplementations = methods.map(method => 
      this.generateJavaScriptMethod(method, requirements, params)
    ).join('\n\n  ');

    if (params.language === SupportedLanguage.TYPESCRIPT) {
      return `export class ${className} {
  ${methodImplementations}
}`;
    } else {
      return `class ${className} {
  ${methodImplementations}
}

module.exports = ${className};`;
    }
  }

  private generatePythonCode(
    className: string,
    requirements: TestRequirement[],
    params: CodeGenerationParams
  ): string {
    const methods = this.extractUniqueMethods(requirements);
    const methodImplementations = methods.map(method => 
      this.generatePythonMethod(method, requirements, params)
    ).join('\n\n    ');

    return `class ${className}:
    """${className} implementation generated from tests."""
    
    ${methodImplementations}`;
  }

  private generateJavaCode(
    className: string,
    requirements: TestRequirement[],
    params: CodeGenerationParams
  ): string {
    const methods = this.extractUniqueMethods(requirements);
    const methodImplementations = methods.map(method => 
      this.generateJavaMethod(method, requirements, params)
    ).join('\n\n    ');

    return `public class ${className} {
    ${methodImplementations}
}`;
  }

  private generateCSharpCode(
    className: string,
    requirements: TestRequirement[],
    params: CodeGenerationParams
  ): string {
    const methods = this.extractUniqueMethods(requirements);
    const methodImplementations = methods.map(method => 
      this.generateCSharpMethod(method, requirements, params)
    ).join('\n\n    ');

    return `public class ${className}
{
    ${methodImplementations}
}`;
  }

  private generateJavaScriptMethod(
    methodName: string,
    requirements: TestRequirement[],
    params: CodeGenerationParams
  ): string {
    const relevantReqs = requirements.filter(req => 
      req.methodCalls.some(call => call.includes(methodName))
    );

    const shouldThrow = relevantReqs.some(req => req.shouldThrow);
    
    if (params.implementationStyle === 'minimal') {
      if (shouldThrow) {
        return `${methodName}() {\n    throw new Error('Not implemented');\n  }`;
      }
      return `${methodName}() {\n    // TODO: Implement\n    return null;\n  }`;
    }

    // More comprehensive implementation
    const returnType = this.inferReturnType(relevantReqs);
    const parameters = this.inferParameters(relevantReqs);
    
    return `${methodName}(${parameters}) {\n    // Implementation based on test requirements\n    ${this.generateMethodBody(methodName, relevantReqs, params)}\n  }`;
  }

  private generatePythonMethod(
    methodName: string,
    requirements: TestRequirement[],
    params: CodeGenerationParams
  ): string {
    const relevantReqs = requirements.filter(req => 
      req.methodCalls.some(call => call.includes(methodName))
    );

    const shouldThrow = relevantReqs.some(req => req.shouldThrow);
    
    if (params.implementationStyle === 'minimal') {
      if (shouldThrow) {
        return `def ${methodName}(self):\n        raise NotImplementedError('Not implemented')`;
      }
      return `def ${methodName}(self):\n        # TODO: Implement\n        return None`;
    }

    const parameters = this.inferParameters(relevantReqs);
    return `def ${methodName}(self, ${parameters}):\n        \"\"\"${methodName} implementation based on tests.\"\"\"\n        ${this.generateMethodBody(methodName, relevantReqs, params)}`;
  }

  private generateJavaMethod(
    methodName: string,
    requirements: TestRequirement[],
    params: CodeGenerationParams
  ): string {
    const relevantReqs = requirements.filter(req => 
      req.methodCalls.some(call => call.includes(methodName))
    );

    const shouldThrow = relevantReqs.some(req => req.shouldThrow);
    const returnType = this.inferJavaReturnType(relevantReqs);
    const parameters = this.inferJavaParameters(relevantReqs);
    
    if (params.implementationStyle === 'minimal') {
      if (shouldThrow) {
        return `public ${returnType} ${methodName}(${parameters}) {\n        throw new UnsupportedOperationException("Not implemented");\n    }`;
      }
      return `public ${returnType} ${methodName}(${parameters}) {\n        // TODO: Implement\n        return null;\n    }`;
    }

    return `public ${returnType} ${methodName}(${parameters}) {\n        // Implementation based on test requirements\n        ${this.generateMethodBody(methodName, relevantReqs, params)}\n    }`;
  }

  private generateCSharpMethod(
    methodName: string,
    requirements: TestRequirement[],
    params: CodeGenerationParams
  ): string {
    const relevantReqs = requirements.filter(req => 
      req.methodCalls.some(call => call.includes(methodName))
    );

    const shouldThrow = relevantReqs.some(req => req.shouldThrow);
    const returnType = this.inferCSharpReturnType(relevantReqs);
    const parameters = this.inferCSharpParameters(relevantReqs);
    
    if (params.implementationStyle === 'minimal') {
      if (shouldThrow) {
        return `public ${returnType} ${methodName}(${parameters})\n    {\n        throw new NotImplementedException("Not implemented");\n    }`;
      }
      return `public ${returnType} ${methodName}(${parameters})\n    {\n        // TODO: Implement\n        return default;\n    }`;
    }

    return `public ${returnType} ${methodName}(${parameters})\n    {\n        // Implementation based on test requirements\n        ${this.generateMethodBody(methodName, relevantReqs, params)}\n    }`;
  }

  // Helper methods for parsing test code
  private extractMethodCalls(testBlock: string): string[] {
    const calls: string[] = [];
    const regex = /\.(\w+)\(/g;
    let match;
    while ((match = regex.exec(testBlock)) !== null) {
      calls.push(match[1]);
    }
    return calls;
  }

  private extractExpectations(testBlock: string): string[] {
    const expectations: string[] = [];
    const expectRegex = /expect\([^)]*\)\.([^(]+)/g;
    let match;
    while ((match = expectRegex.exec(testBlock)) !== null) {
      expectations.push(match[1]);
    }
    return expectations;
  }

  private extractPythonMethodCalls(testFunc: string): string[] {
    const calls: string[] = [];
    const regex = /\.(\w+)\(/g;
    let match;
    while ((match = regex.exec(testFunc)) !== null) {
      calls.push(match[1]);
    }
    return calls;
  }

  private extractPythonExpectations(testFunc: string): string[] {
    const expectations: string[] = [];
    const assertRegex = /assert\s+([^#\n]+)/g;
    let match;
    while ((match = assertRegex.exec(testFunc)) !== null) {
      expectations.push(match[1].trim());
    }
    return expectations;
  }

  private extractJavaMethodCalls(testMethod: string): string[] {
    const calls: string[] = [];
    const regex = /\.(\w+)\(/g;
    let match;
    while ((match = regex.exec(testMethod)) !== null) {
      calls.push(match[1]);
    }
    return calls;
  }

  private extractJavaExpectations(testMethod: string): string[] {
    const expectations: string[] = [];
    const assertRegex = /assert\w*\([^)]+\)/g;
    const matches = testMethod.match(assertRegex);
    if (matches) {
      expectations.push(...matches);
    }
    return expectations;
  }

  private extractCSharpMethodCalls(testMethod: string): string[] {
    const calls: string[] = [];
    const regex = /\.(\w+)\(/g;
    let match;
    while ((match = regex.exec(testMethod)) !== null) {
      calls.push(match[1]);
    }
    return calls;
  }

  private extractCSharpExpectations(testMethod: string): string[] {
    const expectations: string[] = [];
    const assertRegex = /Assert\.\w+\([^)]+\)/g;
    const matches = testMethod.match(assertRegex);
    if (matches) {
      expectations.push(...matches);
    }
    return expectations;
  }

  private extractUniqueMethods(requirements: TestRequirement[]): string[] {
    const methods = new Set<string>();
    for (const req of requirements) {
      for (const call of req.methodCalls) {
        methods.add(call);
      }
    }
    return Array.from(methods);
  }

  private extractTestNames(testCode: string): string[] {
    const names: string[] = [];
    
    // Extract from different test patterns
    const itMatches = testCode.match(/it\(['"`]([^'"`]+)['"`]/g);
    if (itMatches) {
      names.push(...itMatches.map(match => match.match(/['"`]([^'"`]+)['"`]/)?.[1] || ''));
    }

    const testMatches = testCode.match(/def (test_[^(]+)/g);
    if (testMatches) {
      names.push(...testMatches.map(match => match.replace('def ', '')));
    }

    return names.filter(name => name.length > 0);
  }

  private generateImports(requirements: TestRequirement[], language: SupportedLanguage): string[] {
    const imports: string[] = [];
    
    // Add language-specific imports based on requirements
    switch (language) {
      case SupportedLanguage.TYPESCRIPT:
        // TypeScript specific imports
        break;
      case SupportedLanguage.PYTHON:
        // Python specific imports
        if (requirements.some(req => req.shouldThrow)) {
          imports.push('from typing import Optional, Any');
        }
        break;
      case SupportedLanguage.JAVA:
        // Java specific imports
        imports.push('import java.util.*;');
        break;
      case SupportedLanguage.CSHARP:
        // C# specific imports
        imports.push('using System;');
        break;
    }
    
    return imports;
  }

  private generateExports(requirements: TestRequirement[], language: SupportedLanguage): string[] {
    const exports: string[] = [];
    
    if (requirements.length > 0) {
      exports.push(requirements[0].className);
    }
    
    return exports;
  }

  private identifyDependencies(requirements: TestRequirement[], language: SupportedLanguage): string[] {
    const dependencies: string[] = [];
    
    // Identify potential dependencies based on test requirements
    // This is a simplified implementation
    return dependencies;
  }

  private inferReturnType(requirements: TestRequirement[]): string {
    // Simple heuristic to infer return type from expectations
    const hasNumericExpectations = requirements.some(req => 
      req.expectations.some(exp => /\d+/.test(exp))
    );
    
    if (hasNumericExpectations) return 'number';
    return 'any';
  }

  private inferJavaReturnType(requirements: TestRequirement[]): string {
    return 'Object'; // Simplified
  }

  private inferCSharpReturnType(requirements: TestRequirement[]): string {
    return 'object'; // Simplified
  }

  private inferParameters(requirements: TestRequirement[]): string {
    // Simplified parameter inference
    return 'data = null';
  }

  private inferJavaParameters(requirements: TestRequirement[]): string {
    return 'Object data';
  }

  private inferCSharpParameters(requirements: TestRequirement[]): string {
    return 'object data = null';
  }

  private generateMethodBody(
    methodName: string,
    requirements: TestRequirement[],
    params: CodeGenerationParams
  ): string {
    if (params.implementationStyle === 'minimal') {
      return '// Minimal implementation to pass tests\n        return null;';
    }
    
    // Generate more comprehensive implementation
    return `// Implementation for ${methodName}\n        // TODO: Add business logic\n        return null;`;
  }
}

interface TestRequirement {
  className: string;
  testName: string;
  methodCalls: string[];
  expectations: string[];
  shouldThrow: boolean;
}