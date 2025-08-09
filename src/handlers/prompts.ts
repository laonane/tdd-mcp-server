import {
  GetPromptRequest,
  GetPromptResult,
  ListPromptsRequest,
  ListPromptsResult,
  Prompt,
} from '@modelcontextprotocol/sdk/types.js';
import { promises as fs } from 'fs';
import path from 'path';

// Prompt definitions
const PROMPTS: Prompt[] = [
  {
    name: 'tdd_workflow',
    description: 'Complete TDD workflow guidance from requirements to implementation',
    arguments: [
      {
        name: 'feature_description',
        description: 'Description of the feature to implement using TDD',
        required: true,
      },
      {
        name: 'language',
        description: 'Programming language (typescript, python, java, etc.)',
        required: true,
      },
      {
        name: 'test_framework',
        description: 'Testing framework to use (jest, pytest, junit5, etc.)',
        required: true,
      },
      {
        name: 'complexity_level',
        description: 'Complexity level: simple, moderate, or complex',
        required: false,
      },
    ],
  },
  {
    name: 'test_generation',
    description: 'Generate comprehensive test cases following TDD best practices',
    arguments: [
      {
        name: 'requirements',
        description: 'Detailed requirements for the feature to be tested',
        required: true,
      },
      {
        name: 'existing_code',
        description: 'Existing code context (optional)',
        required: false,
      },
      {
        name: 'test_style',
        description: 'Testing style: behavior_driven, data_driven, or property_based',
        required: false,
      },
      {
        name: 'coverage_goals',
        description: 'Specific coverage goals or edge cases to test',
        required: false,
      },
    ],
  },
  {
    name: 'implementation_guide',
    description: 'Guide for implementing code that passes given tests',
    arguments: [
      {
        name: 'test_code',
        description: 'Test code that needs to pass',
        required: true,
      },
      {
        name: 'architectural_constraints',
        description: 'Architectural patterns or constraints to follow',
        required: false,
      },
      {
        name: 'performance_requirements',
        description: 'Performance requirements or optimizations needed',
        required: false,
      },
      {
        name: 'implementation_style',
        description: 'Implementation style: minimal, comprehensive, or production_ready',
        required: false,
      },
    ],
  },
  {
    name: 'refactoring_guide',
    description: 'Guide for refactoring code while maintaining test compatibility',
    arguments: [
      {
        name: 'current_code',
        description: 'Current code that needs refactoring',
        required: true,
      },
      {
        name: 'code_smells',
        description: 'Identified code smells or issues to address',
        required: false,
      },
      {
        name: 'refactoring_goals',
        description: 'Specific refactoring goals (readability, performance, maintainability)',
        required: false,
      },
      {
        name: 'preserve_behavior',
        description: 'Whether to strictly preserve existing behavior (true/false)',
        required: false,
      },
    ],
  },
  {
    name: 'red_green_refactor',
    description: 'Step-by-step guidance through a single red-green-refactor cycle',
    arguments: [
      {
        name: 'current_state',
        description: 'Current state of the TDD cycle: red, green, or refactor',
        required: true,
      },
      {
        name: 'feature_increment',
        description: 'The next small increment of functionality to add',
        required: true,
      },
      {
        name: 'existing_tests',
        description: 'Currently existing tests (if any)',
        required: false,
      },
      {
        name: 'existing_implementation',
        description: 'Currently existing implementation (if any)',
        required: false,
      },
    ],
  },
  {
    name: 'debug_failing_tests',
    description: 'Guide for debugging and fixing failing tests',
    arguments: [
      {
        name: 'failing_tests',
        description: 'Details of the failing tests and error messages',
        required: true,
      },
      {
        name: 'implementation_code',
        description: 'Current implementation code',
        required: true,
      },
      {
        name: 'expected_behavior',
        description: 'Expected behavior description',
        required: false,
      },
    ],
  },
];

export const promptsHandler = {
  async listPrompts(_request: ListPromptsRequest): Promise<ListPromptsResult> {
    return {
      prompts: PROMPTS,
    };
  },

  async getPrompt(request: GetPromptRequest): Promise<GetPromptResult> {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'tdd_workflow':
          return await getTDDWorkflowPrompt(args || {});
        case 'test_generation':
          return await getTestGenerationPrompt(args || {});
        case 'implementation_guide':
          return await getImplementationGuidePrompt(args || {});
        case 'refactoring_guide':
          return await getRefactoringGuidePrompt(args || {});
        case 'red_green_refactor':
          return await getRedGreenRefactorPrompt(args || {});
        case 'debug_failing_tests':
          return await getDebugFailingTestsPrompt(args || {});
        default:
          throw new Error(`Unknown prompt: ${name}`);
      }
    } catch (error) {
      throw new Error(`Failed to get prompt ${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
};

// Individual prompt generators
async function getTDDWorkflowPrompt(args: Record<string, string>): Promise<GetPromptResult> {
  const template = await loadTemplate('tdd-workflow.md');
  
  const content = template
    .replace('{{FEATURE_DESCRIPTION}}', args.feature_description || '[Feature Description]')
    .replace('{{LANGUAGE}}', args.language || '[Language]')
    .replace('{{TEST_FRAMEWORK}}', args.test_framework || '[Test Framework]')
    .replace('{{COMPLEXITY_LEVEL}}', args.complexity_level || 'moderate');

  return {
    description: `Complete TDD workflow for implementing: ${args.feature_description}`,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: content,
        },
      },
    ],
  };
}

async function getTestGenerationPrompt(args: Record<string, string>): Promise<GetPromptResult> {
  const template = await loadTemplate('test-generation.md');
  
  const content = template
    .replace('{{REQUIREMENTS}}', args.requirements || '[Requirements]')
    .replace('{{EXISTING_CODE}}', args.existing_code || '[No existing code provided]')
    .replace('{{TEST_STYLE}}', args.test_style || 'behavior_driven')
    .replace('{{COVERAGE_GOALS}}', args.coverage_goals || 'comprehensive coverage with edge cases');

  return {
    description: `Test generation guidance for: ${args.requirements}`,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: content,
        },
      },
    ],
  };
}

async function getImplementationGuidePrompt(args: Record<string, string>): Promise<GetPromptResult> {
  const template = await loadTemplate('implementation-guide.md');
  
  const content = template
    .replace('{{TEST_CODE}}', args.test_code || '[Test Code]')
    .replace('{{ARCHITECTURAL_CONSTRAINTS}}', args.architectural_constraints || '[No specific constraints]')
    .replace('{{PERFORMANCE_REQUIREMENTS}}', args.performance_requirements || '[No specific performance requirements]')
    .replace('{{IMPLEMENTATION_STYLE}}', args.implementation_style || 'minimal');

  return {
    description: 'Implementation guidance based on test requirements',
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: content,
        },
      },
    ],
  };
}

async function getRefactoringGuidePrompt(args: Record<string, string>): Promise<GetPromptResult> {
  const template = await loadTemplate('refactoring-guide.md');
  
  const content = template
    .replace('{{CURRENT_CODE}}', args.current_code || '[Current Code]')
    .replace('{{CODE_SMELLS}}', args.code_smells || '[No specific code smells identified]')
    .replace('{{REFACTORING_GOALS}}', args.refactoring_goals || 'improve readability and maintainability')
    .replace('{{PRESERVE_BEHAVIOR}}', args.preserve_behavior || 'true');

  return {
    description: 'Refactoring guidance while preserving test compatibility',
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: content,
        },
      },
    ],
  };
}

async function getRedGreenRefactorPrompt(args: Record<string, string>): Promise<GetPromptResult> {
  const template = await loadTemplate('red-green-refactor.md');
  
  const content = template
    .replace('{{CURRENT_STATE}}', args.current_state || '[Current State]')
    .replace('{{FEATURE_INCREMENT}}', args.feature_increment || '[Feature Increment]')
    .replace('{{EXISTING_TESTS}}', args.existing_tests || '[No existing tests]')
    .replace('{{EXISTING_IMPLEMENTATION}}', args.existing_implementation || '[No existing implementation]');

  return {
    description: `TDD cycle guidance - Current state: ${args.current_state}`,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: content,
        },
      },
    ],
  };
}

async function getDebugFailingTestsPrompt(args: Record<string, string>): Promise<GetPromptResult> {
  const template = await loadTemplate('debug-failing-tests.md');
  
  const content = template
    .replace('{{FAILING_TESTS}}', args.failing_tests || '[Failing Tests]')
    .replace('{{IMPLEMENTATION_CODE}}', args.implementation_code || '[Implementation Code]')
    .replace('{{EXPECTED_BEHAVIOR}}', args.expected_behavior || '[Expected Behavior]');

  return {
    description: 'Debug and fix failing tests',
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: content,
        },
      },
    ],
  };
}

// Helper function to load template files
async function loadTemplate(templateName: string): Promise<string> {
  try {
    const templatePath = path.join(__dirname, '../../templates', templateName);
    return await fs.readFile(templatePath, 'utf8');
  } catch (error) {
    // Return a basic template if file doesn't exist
    return getDefaultTemplate(templateName);
  }
}

function getDefaultTemplate(templateName: string): string {
  const defaultTemplates: Record<string, string> = {
    'tdd-workflow.md': `# TDD Workflow for {{FEATURE_DESCRIPTION}}

## Project Setup
- **Language**: {{LANGUAGE}}
- **Test Framework**: {{TEST_FRAMEWORK}}
- **Complexity**: {{COMPLEXITY_LEVEL}}

## Phase 1: RED - Write Failing Tests
1. Analyze the feature requirements
2. Identify the smallest testable behavior
3. Write a test that defines this behavior
4. Ensure the test fails (RED state)

## Phase 2: GREEN - Make Tests Pass
1. Write the minimum code to make the test pass
2. Focus on functionality, not optimization
3. Ensure all tests pass (GREEN state)

## Phase 3: REFACTOR - Clean Up Code
1. Improve code quality without changing behavior
2. Remove duplication
3. Enhance readability
4. Ensure all tests still pass

## Next Steps
- Repeat the cycle for the next small increment
- Maintain good test coverage
- Keep refactoring regularly`,

    'test-generation.md': `# Test Generation Guide

## Requirements
{{REQUIREMENTS}}

## Existing Code Context
{{EXISTING_CODE}}

## Test Generation Instructions
1. **Test Style**: {{TEST_STYLE}}
2. **Coverage Goals**: {{COVERAGE_GOALS}}

## Test Categories to Generate
1. **Happy Path Tests**: Test normal expected behavior
2. **Edge Cases**: Test boundary conditions
3. **Error Cases**: Test error handling and validation
4. **Integration Points**: Test interactions with dependencies

## Best Practices
- Write descriptive test names
- Use arrange-act-assert pattern
- Keep tests independent and isolated
- Test behavior, not implementation`,

    'implementation-guide.md': `# Implementation Guide

## Test Requirements
{{TEST_CODE}}

## Constraints and Requirements
- **Architectural Constraints**: {{ARCHITECTURAL_CONSTRAINTS}}
- **Performance Requirements**: {{PERFORMANCE_REQUIREMENTS}}
- **Implementation Style**: {{IMPLEMENTATION_STYLE}}

## Implementation Strategy
1. Analyze the test requirements
2. Identify the minimum implementation needed
3. Implement just enough to make tests pass
4. Follow SOLID principles
5. Keep it simple and maintainable

## Key Considerations
- Focus on making tests pass first
- Optimize later during refactoring
- Maintain clean, readable code
- Follow established patterns`,

    'refactoring-guide.md': `# Refactoring Guide

## Current Code
{{CURRENT_CODE}}

## Issues to Address
{{CODE_SMELLS}}

## Refactoring Goals
{{REFACTORING_GOALS}}

## Preserve Behavior
{{PRESERVE_BEHAVIOR}}

## Refactoring Steps
1. Ensure all tests pass before starting
2. Make one small change at a time
3. Run tests after each change
4. Focus on improving code without changing behavior
5. Commit frequently

## Common Refactoring Patterns
- Extract Method
- Remove Duplication
- Improve Naming
- Simplify Conditionals
- Extract Classes`,

    'red-green-refactor.md': `# Red-Green-Refactor Cycle

## Current State: {{CURRENT_STATE}}
## Feature Increment: {{FEATURE_INCREMENT}}

## Existing Tests
{{EXISTING_TESTS}}

## Existing Implementation
{{EXISTING_IMPLEMENTATION}}

## Next Steps Based on Current State

### If RED (Test Failing):
1. Write minimal code to make the test pass
2. Don't worry about code quality yet
3. Focus only on making the test green

### If GREEN (Test Passing):
1. Look for refactoring opportunities
2. Improve code quality
3. Remove duplication
4. Ensure tests still pass

### If REFACTOR (Improving Code):
1. Make small improvements
2. Run tests frequently
3. Don't add new functionality
4. Focus on code quality

## TDD Principles
- Take small steps
- Let tests drive the design
- Refactor regularly
- Keep tests passing`,

    'debug-failing-tests.md': `# Debug Failing Tests

## Failing Test Details
{{FAILING_TESTS}}

## Current Implementation
{{IMPLEMENTATION_CODE}}

## Expected Behavior
{{EXPECTED_BEHAVIOR}}

## Debugging Steps
1. **Understand the Failure**: Read error messages carefully
2. **Isolate the Problem**: Run single failing test
3. **Check Test Logic**: Verify test expectations are correct
4. **Trace Execution**: Follow code path that leads to failure
5. **Fix Implementation**: Make minimal changes to pass tests

## Common Failure Patterns
- **Assertion Errors**: Expected vs actual value mismatch
- **Type Errors**: Wrong data types being used
- **Logic Errors**: Incorrect business logic implementation
- **Setup Issues**: Test environment not properly configured

## Resolution Strategy
1. Make the smallest change possible
2. Verify fix doesn't break other tests
3. Consider if test itself needs updating
4. Document any assumptions or edge cases`,
  };

  return defaultTemplates[templateName] || `# {{TEMPLATE_NAME}}\n\nTemplate content not found.`;
}