# TDD Workflow for {{FEATURE_DESCRIPTION}}

## Project Configuration
- **Programming Language**: {{LANGUAGE}}
- **Test Framework**: {{TEST_FRAMEWORK}}
- **Complexity Level**: {{COMPLEXITY_LEVEL}}

## Complete TDD Cycle Implementation

### Phase 1: RED - Write Failing Tests 🔴

#### 1.1 Analyze Requirements
Before writing any tests, break down the feature requirements:
- Identify the main functionality
- List all expected inputs and outputs
- Consider edge cases and error conditions
- Define acceptance criteria

#### 1.2 Design Test Strategy
Choose appropriate test types based on complexity:

**Simple Features:**
- Focus on unit tests
- Test happy path first
- Add edge cases gradually

**Moderate Features:**
- Add integration tests
- Include error handling tests
- Test boundary conditions

**Complex Features:**
- Include end-to-end tests
- Performance testing if needed
- Security testing for sensitive features

#### 1.3 Write First Failing Test
```{{LANGUAGE}}
// Example test structure for {{TEST_FRAMEWORK}}
describe('{{FEATURE_DESCRIPTION}}', () => {
  it('should [describe expected behavior]', () => {
    // Arrange: Set up test data and conditions
    
    // Act: Execute the functionality
    
    // Assert: Verify the expected outcome
    expect(result).toBe(expected);
  });
});
```

#### 1.4 Verify Test Fails
- Run the test suite
- Confirm the new test fails for the right reason
- Fix any test setup issues
- Ensure failure message is clear and helpful

### Phase 2: GREEN - Make Tests Pass 🟢

#### 2.1 Implement Minimal Solution
Write the smallest amount of code to make the test pass:

**Key Principles:**
- Don't over-engineer
- Hardcode values if necessary
- Focus only on making the current test pass
- Ignore code quality concerns temporarily

#### 2.2 Run Tests Frequently
- Execute tests after each small change
- Fix any breaking changes immediately
- Ensure all tests pass before proceeding

#### 2.3 Add More Tests Gradually
For each new test:
1. Write a failing test for the next small behavior
2. Implement minimal code to pass
3. Verify all tests still pass
4. Repeat until feature is complete

### Phase 3: REFACTOR - Improve Code Quality 🔄

#### 3.1 Identify Refactoring Opportunities
Look for:
- Code duplication
- Long methods or classes
- Poor naming
- Complex conditionals
- Violations of SOLID principles

#### 3.2 Apply Refactoring Techniques
Common refactoring patterns:
- **Extract Method**: Break down long methods
- **Extract Class**: Separate responsibilities
- **Rename Variables/Methods**: Improve clarity
- **Remove Duplication**: DRY principle
- **Simplify Conditionals**: Reduce complexity

#### 3.3 Refactor in Small Steps
For each refactoring:
1. Make a small improvement
2. Run all tests immediately
3. Commit if tests pass
4. Revert if tests fail
5. Continue until satisfied

#### 3.4 Maintain Test Coverage
- Ensure all tests continue to pass
- Add tests if new edge cases are discovered
- Remove obsolete tests if appropriate

## TDD Best Practices

### Commit Strategy
Create meaningful commit messages that reflect TDD phases:
```bash
git commit -m "RED: Add failing test for user authentication"
git commit -m "GREEN: Implement basic user authentication"
git commit -m "REFACTOR: Extract validation logic to separate method"
```

### Test Quality Guidelines
- **Clear Test Names**: Describe what is being tested
- **Single Assertion**: One concept per test
- **Independent Tests**: No dependencies between tests
- **Fast Execution**: Keep tests lightweight and quick

### Code Quality Checkpoints
After each refactor phase, verify:
- [ ] Code is readable and self-documenting
- [ ] Methods have single responsibilities
- [ ] Classes follow SOLID principles
- [ ] No code duplication exists
- [ ] Complex logic is properly abstracted

## Next Steps and Iteration

### Continue the Cycle
1. Identify the next small increment of functionality
2. Return to RED phase with a new failing test
3. Repeat the cycle until feature is complete

### Feature Completion Criteria
- [ ] All acceptance criteria are met
- [ ] Test coverage is comprehensive
- [ ] Code quality meets team standards
- [ ] Documentation is updated
- [ ] Integration tests pass
- [ ] Performance requirements are met

### Retrospective Questions
After completing the feature:
- Did we follow TDD discipline throughout?
- Were our tests effective at driving design?
- What refactoring opportunities did we miss?
- How can we improve our TDD practice?

## Common TDD Antipatterns to Avoid

### Writing Tests After Implementation
❌ **Wrong**: Implement first, then write tests to match
✅ **Right**: Write failing test first, then minimal implementation

### Skipping Refactoring
❌ **Wrong**: Move to next feature without cleaning up code
✅ **Right**: Always complete the refactor phase before new features

### Writing Too Many Tests at Once
❌ **Wrong**: Write comprehensive test suite before any implementation
✅ **Right**: Write one test at a time, implement, then next test

### Over-Engineering Early
❌ **Wrong**: Build flexible, extensible solution from the start
✅ **Right**: Implement simplest solution, refactor when needed

Remember: TDD is about **rhythm and discipline**. The key is to take small steps and maintain the red-green-refactor cycle consistently.