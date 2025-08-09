import { z } from 'zod';
import { SupportedLanguage, TestType } from './tdd.js';

// 测试框架配置
export const TestFrameworkConfigSchema = z.object({
  name: z.string(),
  language: z.nativeEnum(SupportedLanguage),
  version: z.string().optional(),
  supportedTestTypes: z.array(z.nativeEnum(TestType)),
  configFiles: z.array(z.string()),
  testFilePatterns: z.array(z.string()),
  commands: z.object({
    install: z.string(),
    run: z.string(),
    watch: z.string().optional(),
    coverage: z.string().optional(),
    init: z.string().optional(),
  }),
  dependencies: z.array(z.string()),
  devDependencies: z.array(z.string()),
});

// 框架特定的代码模板
export const TestTemplateSchema = z.object({
  framework: z.string(),
  language: z.nativeEnum(SupportedLanguage),
  templates: z.object({
    testSuite: z.string(),
    testCase: z.string(),
    setup: z.string().optional(),
    teardown: z.string().optional(),
    mock: z.string().optional(),
    assertion: z.object({
      equals: z.string(),
      notEquals: z.string(),
      truthy: z.string(),
      falsy: z.string(),
      throws: z.string(),
      async: z.string().optional(),
    }),
  }),
});

// 支持的测试框架定义
export const SUPPORTED_FRAMEWORKS = {
  // JavaScript/TypeScript
  jest: {
    name: 'Jest',
    language: SupportedLanguage.TYPESCRIPT,
    supportedTestTypes: [TestType.UNIT, TestType.INTEGRATION],
    configFiles: ['jest.config.js', 'jest.config.ts', 'jest.config.json'],
    testFilePatterns: ['**/*.test.{js,ts}', '**/*.spec.{js,ts}', '**/__tests__/**/*.{js,ts}'],
    commands: {
      install: 'npm install --save-dev jest @types/jest ts-jest',
      run: 'jest',
      watch: 'jest --watch',
      coverage: 'jest --coverage',
      init: 'jest --init',
    },
    dependencies: [],
    devDependencies: ['jest', '@types/jest', 'ts-jest'],
  },
  
  mocha: {
    name: 'Mocha',
    language: SupportedLanguage.TYPESCRIPT,
    supportedTestTypes: [TestType.UNIT, TestType.INTEGRATION, TestType.E2E],
    configFiles: ['.mocharc.json', '.mocharc.js', '.mocharc.yaml'],
    testFilePatterns: ['test/**/*.{js,ts}', 'tests/**/*.{js,ts}', '**/*.test.{js,ts}'],
    commands: {
      install: 'npm install --save-dev mocha @types/mocha chai @types/chai ts-node',
      run: 'mocha',
      watch: 'mocha --watch',
      coverage: 'nyc mocha',
    },
    dependencies: [],
    devDependencies: ['mocha', '@types/mocha', 'chai', '@types/chai', 'nyc'],
  },

  vitest: {
    name: 'Vitest',
    language: SupportedLanguage.TYPESCRIPT,
    supportedTestTypes: [TestType.UNIT, TestType.INTEGRATION],
    configFiles: ['vitest.config.ts', 'vitest.config.js', 'vite.config.ts'],
    testFilePatterns: ['**/*.test.{js,ts}', '**/*.spec.{js,ts}'],
    commands: {
      install: 'npm install --save-dev vitest',
      run: 'vitest run',
      watch: 'vitest',
      coverage: 'vitest run --coverage',
    },
    dependencies: [],
    devDependencies: ['vitest'],
  },

  // Python
  pytest: {
    name: 'pytest',
    language: SupportedLanguage.PYTHON,
    supportedTestTypes: [TestType.UNIT, TestType.INTEGRATION, TestType.E2E],
    configFiles: ['pytest.ini', 'pyproject.toml', 'setup.cfg'],
    testFilePatterns: ['test_*.py', '*_test.py', 'tests/**/*.py'],
    commands: {
      install: 'pip install pytest pytest-cov',
      run: 'pytest',
      watch: 'pytest-watch',
      coverage: 'pytest --cov',
    },
    dependencies: ['pytest'],
    devDependencies: ['pytest-cov', 'pytest-watch'],
  },

  unittest: {
    name: 'unittest',
    language: SupportedLanguage.PYTHON,
    supportedTestTypes: [TestType.UNIT, TestType.INTEGRATION],
    configFiles: [],
    testFilePatterns: ['test_*.py', '*_test.py', 'tests/**/*.py'],
    commands: {
      install: '', // built-in
      run: 'python -m unittest discover',
      coverage: 'coverage run -m unittest discover && coverage report',
    },
    dependencies: [],
    devDependencies: ['coverage'],
  },

  // Java
  junit5: {
    name: 'JUnit 5',
    language: SupportedLanguage.JAVA,
    supportedTestTypes: [TestType.UNIT, TestType.INTEGRATION],
    configFiles: ['junit-platform.properties'],
    testFilePatterns: ['**/*Test.java', '**/*Tests.java'],
    commands: {
      install: '', // handled by build tools
      run: 'mvn test',
      coverage: 'mvn test jacoco:report',
    },
    dependencies: ['org.junit.jupiter:junit-jupiter'],
    devDependencies: [],
  },

  // C#
  xunit: {
    name: 'xUnit',
    language: SupportedLanguage.CSHARP,
    supportedTestTypes: [TestType.UNIT, TestType.INTEGRATION],
    configFiles: [],
    testFilePatterns: ['**/*Test.cs', '**/*Tests.cs'],
    commands: {
      install: 'dotnet add package xunit dotnet add package xunit.runner.visualstudio',
      run: 'dotnet test',
      coverage: 'dotnet test --collect:"XPlat Code Coverage"',
    },
    dependencies: ['xunit', 'xunit.runner.visualstudio'],
    devDependencies: [],
  },

  // Go
  gotest: {
    name: 'Go Test',
    language: SupportedLanguage.GO,
    supportedTestTypes: [TestType.UNIT, TestType.INTEGRATION, TestType.PERFORMANCE],
    configFiles: [],
    testFilePatterns: ['*_test.go'],
    commands: {
      install: '', // built-in
      run: 'go test ./...',
      coverage: 'go test -cover ./...',
    },
    dependencies: [],
    devDependencies: [],
  },

  // Rust
  cargo_test: {
    name: 'Cargo Test',
    language: SupportedLanguage.RUST,
    supportedTestTypes: [TestType.UNIT, TestType.INTEGRATION],
    configFiles: ['Cargo.toml'],
    testFilePatterns: ['src/**/*.rs', 'tests/**/*.rs'],
    commands: {
      install: '', // built-in
      run: 'cargo test',
      coverage: 'cargo tarpaulin',
    },
    dependencies: [],
    devDependencies: ['tarpaulin'],
  },

  // PHP
  phpunit: {
    name: 'PHPUnit',
    language: SupportedLanguage.PHP,
    supportedTestTypes: [TestType.UNIT, TestType.INTEGRATION],
    configFiles: ['phpunit.xml', 'phpunit.xml.dist'],
    testFilePatterns: ['**/*Test.php', '**/Test*.php'],
    commands: {
      install: 'composer require --dev phpunit/phpunit',
      run: './vendor/bin/phpunit',
      coverage: './vendor/bin/phpunit --coverage-html coverage',
    },
    dependencies: [],
    devDependencies: ['phpunit/phpunit'],
  },
} as const;

export type TestFrameworkConfig = z.infer<typeof TestFrameworkConfigSchema>;
export type TestTemplate = z.infer<typeof TestTemplateSchema>;
export type SupportedFramework = keyof typeof SUPPORTED_FRAMEWORKS;