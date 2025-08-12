import { CodeGeneratorService } from '../code-generator.js';
import { SupportedLanguage } from '../../types/tdd.js';

describe('CodeGeneratorService', () => {
  let codeGenerator: CodeGeneratorService;

  beforeEach(() => {
    codeGenerator = new CodeGeneratorService();
  });

  describe('generateImplementation', () => {
    it('should generate TypeScript implementation from test code', async () => {
      const testCode = `
        describe('Calculator', () => {
          it('should add two numbers', () => {
            const calculator = new Calculator();
            const result = calculator.add(2, 3);
            expect(result).toBe(5);
          });
        });
      `;

      const result = await codeGenerator.generateImplementation({
        testCode,
        language: SupportedLanguage.TYPESCRIPT,
        implementationStyle: 'minimal'
      });

      expect(result.language).toBe(SupportedLanguage.TYPESCRIPT);
      expect(result.code).toContain('class Calculator');
      expect(result.code).toContain('add(');
      expect(result.metadata.implementationStyle).toBe('minimal');
    });

    it('should generate Python implementation from test code', async () => {
      const testCode = `
        def test_calculator_add():
            calculator = Calculator()
            result = calculator.add(2, 3)
            assert result == 5
      `;

      const result = await codeGenerator.generateImplementation({
        testCode,
        language: SupportedLanguage.PYTHON,
        implementationStyle: 'comprehensive'
      });

      expect(result.language).toBe(SupportedLanguage.PYTHON);
      expect(result.code).toContain('class Calculator');
      expect(result.code).toContain('def add(');
      expect(result.metadata.implementationStyle).toBe('comprehensive');
    });

    it('should throw error for unsupported language', async () => {
      await expect(codeGenerator.generateImplementation({
        testCode: 'some test',
        language: 'unsupported' as SupportedLanguage,
        implementationStyle: 'minimal'
      })).rejects.toThrow('Test parsing not implemented for language: unsupported');
    });

    it('should handle empty test code', async () => {
      await expect(codeGenerator.generateImplementation({
        testCode: '',
        language: SupportedLanguage.TYPESCRIPT,
        implementationStyle: 'minimal'
      })).rejects.toThrow('No requirements could be parsed from test code');
    });
  });

  describe('parseTestRequirements', () => {
    it('should parse JavaScript test requirements correctly', () => {
      const testCode = `
        describe('UserService', () => {
          it('should create user', () => {
            const service = new UserService();
            const user = service.createUser('john');
            expect(user).toBeDefined();
          });
        });
      `;

      const codeGeneratorAny = codeGenerator as any;
      const requirements = codeGeneratorAny.parseTestRequirements(testCode, SupportedLanguage.TYPESCRIPT);

      expect(requirements).toHaveLength(1);
      expect(requirements[0].className).toBe('UserService');
      expect(requirements[0].testName).toBe('should create user');
      expect(requirements[0].methodCalls).toContain('createUser');
    });

    it('should parse Python test requirements correctly', () => {
      const testCode = `
        def test_user_service_create():
            service = UserService()
            user = service.create_user('john')
            assert user is not None
      `;

      const codeGeneratorAny = codeGenerator as any;
      const requirements = codeGeneratorAny.parseTestRequirements(testCode, SupportedLanguage.PYTHON);

      expect(requirements).toHaveLength(1);
      expect(requirements[0].className).toBe('UserService');
      expect(requirements[0].methodCalls).toContain('create_user');
    });
  });

  describe('parseJavaScriptTests', () => {
    it('should extract describe block class name', () => {
      const testCode = `describe('Calculator', () => {
        it('should add', () => {
          const calc = new Calculator();
        });
      });`;

      const codeGeneratorAny = codeGenerator as any;
      const requirements = codeGeneratorAny.parseJavaScriptTests(testCode);

      expect(requirements[0].className).toBe('Calculator');
    });

    it('should extract test name from it blocks', () => {
      const testCode = `describe('Math', () => {
        it('should multiply numbers', () => {
          // test code
        });
      });`;

      const codeGeneratorAny = codeGenerator as any;
      const requirements = codeGeneratorAny.parseJavaScriptTests(testCode);

      expect(requirements[0].testName).toBe('should multiply numbers');
    });

    it('should detect throw expectations', () => {
      const testCode = `describe('Validator', () => {
        it('should throw for invalid input', () => {
          expect(() => validator.validate(null)).toThrow();
        });
      });`;

      const codeGeneratorAny = codeGenerator as any;
      const requirements = codeGeneratorAny.parseJavaScriptTests(testCode);

      expect(requirements[0].shouldThrow).toBe(true);
    });
  });

  describe('generateCode', () => {
    it('should generate TypeScript code with export', () => {
      const requirements = [{
        className: 'TestClass',
        testName: 'test',
        methodCalls: ['testMethod'],
        expectations: [],
        shouldThrow: false
      }];

      const params = {
        testCode: '',
        language: SupportedLanguage.TYPESCRIPT,
        implementationStyle: 'minimal' as const
      };

      const codeGeneratorAny = codeGenerator as any;
      const code = codeGeneratorAny.generateCode(requirements, params);

      expect(code).toContain('export class TestClass');
      expect(code).toContain('testMethod()');
    });

    it('should generate JavaScript code with module.exports', () => {
      const requirements = [{
        className: 'TestClass',
        testName: 'test',
        methodCalls: ['testMethod'],
        expectations: [],
        shouldThrow: false
      }];

      const params = {
        testCode: '',
        language: SupportedLanguage.JAVASCRIPT,
        implementationStyle: 'minimal' as const
      };

      const codeGeneratorAny = codeGenerator as any;
      const code = codeGeneratorAny.generateCode(requirements, params);

      expect(code).toContain('class TestClass');
      expect(code).toContain('module.exports = TestClass');
    });
  });

  describe('generateJavaScriptMethod', () => {
    it('should generate minimal method that throws', () => {
      const requirements = [{
        className: 'Test',
        testName: 'test',
        methodCalls: ['throwMethod'],
        expectations: [],
        shouldThrow: true
      }];

      const params = {
        testCode: '',
        language: SupportedLanguage.TYPESCRIPT,
        implementationStyle: 'minimal' as const
      };

      const codeGeneratorAny = codeGenerator as any;
      const method = codeGeneratorAny.generateJavaScriptMethod('throwMethod', requirements, params);

      expect(method).toContain('throw new Error');
    });

    it('should generate minimal method that returns null', () => {
      const requirements = [{
        className: 'Test',
        testName: 'test',
        methodCalls: ['normalMethod'],
        expectations: [],
        shouldThrow: false
      }];

      const params = {
        testCode: '',
        language: SupportedLanguage.TYPESCRIPT,
        implementationStyle: 'minimal' as const
      };

      const codeGeneratorAny = codeGenerator as any;
      const method = codeGeneratorAny.generateJavaScriptMethod('normalMethod', requirements, params);

      expect(method).toContain('return null');
    });
  });

  describe('extractMethodCalls', () => {
    it('should extract method calls from test block', () => {
      const testBlock = `
        const obj = new TestClass();
        obj.method1();
        obj.method2(param);
        expect(obj.method3()).toBe(true);
      `;

      const codeGeneratorAny = codeGenerator as any;
      const methods = codeGeneratorAny.extractMethodCalls(testBlock);

      expect(methods).toContain('method1');
      expect(methods).toContain('method2');
      expect(methods).toContain('method3');
    });
  });

  describe('extractExpectations', () => {
    it('should extract expect statements', () => {
      const testBlock = `
        expect(result).toBe(5);
        expect(user).toBeDefined();
        expect(() => service.fail()).toThrow();
      `;

      const codeGeneratorAny = codeGenerator as any;
      const expectations = codeGeneratorAny.extractExpectations(testBlock);

      expect(expectations).toContain('toBe');
      expect(expectations).toContain('toBeDefined');
      // Note: toThrow is extracted from the inner function, not the expect call
    });
  });

  describe('extractUniqueMethods', () => {
    it('should return unique method names', () => {
      const requirements = [
        {
          className: 'Test',
          testName: 'test1',
          methodCalls: ['method1', 'method2'],
          expectations: [],
          shouldThrow: false
        },
        {
          className: 'Test',
          testName: 'test2',
          methodCalls: ['method1', 'method3'],
          expectations: [],
          shouldThrow: false
        }
      ];

      const codeGeneratorAny = codeGenerator as any;
      const uniqueMethods = codeGeneratorAny.extractUniqueMethods(requirements);

      expect(uniqueMethods).toHaveLength(3);
      expect(uniqueMethods).toContain('method1');
      expect(uniqueMethods).toContain('method2');
      expect(uniqueMethods).toContain('method3');
    });
  });

  describe('extractTestNames', () => {
    it('should extract test names from JavaScript tests', () => {
      const testCode = `
        it('should work correctly', () => {});
        it('should handle errors', () => {});
      `;

      const codeGeneratorAny = codeGenerator as any;
      const testNames = codeGeneratorAny.extractTestNames(testCode);

      expect(testNames).toContain('should work correctly');
      expect(testNames).toContain('should handle errors');
    });

    it('should extract test names from Python tests', () => {
      const testCode = `
        def test_functionality():
            pass
        def test_error_handling():
            pass
      `;

      const codeGeneratorAny = codeGenerator as any;
      const testNames = codeGeneratorAny.extractTestNames(testCode);

      expect(testNames).toContain('test_functionality');
      expect(testNames).toContain('test_error_handling');
    });
  });

  describe('generateImports', () => {
    it('should generate Python imports for throwing methods', () => {
      const requirements = [{
        className: 'Test',
        testName: 'test',
        methodCalls: [],
        expectations: [],
        shouldThrow: true
      }];

      const codeGeneratorAny = codeGenerator as any;
      const imports = codeGeneratorAny.generateImports(requirements, SupportedLanguage.PYTHON);

      expect(imports).toContain('from typing import Optional, Any');
    });

    it('should generate Java imports', () => {
      const codeGeneratorAny = codeGenerator as any;
      const imports = codeGeneratorAny.generateImports([], SupportedLanguage.JAVA);

      expect(imports).toContain('import java.util.*;');
    });

    it('should generate C# imports', () => {
      const codeGeneratorAny = codeGenerator as any;
      const imports = codeGeneratorAny.generateImports([], SupportedLanguage.CSHARP);

      expect(imports).toContain('using System;');
    });
  });
});