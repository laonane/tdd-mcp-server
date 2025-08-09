# Unit Testing Best Practices for TDD

## Overview

Unit testing is the foundation of Test Driven Development. This guide outlines best practices for writing effective unit tests that drive good design and provide reliable feedback.

## Core Principles

### 1. Test Structure (AAA Pattern)

Every unit test should follow the Arrange-Act-Assert pattern:

```typescript
describe('Calculator', () => {
  it('should add two numbers correctly', () => {
    // Arrange: Set up test data and dependencies
    const calculator = new Calculator();
    const firstNumber = 5;
    const secondNumber = 3;
    
    // Act: Execute the function under test
    const result = calculator.add(firstNumber, secondNumber);
    
    // Assert: Verify the outcome
    expect(result).toBe(8);
  });
});
```

### 2. Test Naming Convention

Use descriptive test names that clearly communicate:
- **What** is being tested
- **When** (under what conditions)
- **What** should happen

**Good Examples:**
```javascript
it('should return user data when valid ID is provided')
it('should throw ValidationError when email format is invalid')
it('should calculate discount correctly for premium members')
```

**Poor Examples:**
```javascript
it('should work')
it('test user function')
it('should return true')
```

### 3. One Assertion Per Test

Each test should verify only one behavior:

```typescript
// ✅ Good: Single assertion
it('should return formatted date string', () => {
  const formatter = new DateFormatter();
  const result = formatter.format(new Date('2023-01-01'));
  expect(result).toBe('2023-01-01');
});

// ❌ Bad: Multiple assertions
it('should format date and validate input', () => {
  const formatter = new DateFormatter();
  const validDate = new Date('2023-01-01');
  const invalidDate = null;
  
  expect(formatter.format(validDate)).toBe('2023-01-01');
  expect(() => formatter.format(invalidDate)).toThrow();
});
```

## Test Categories

### 1. Happy Path Tests

Test the main functionality under normal conditions:

```python
def test_withdraw_money_with_sufficient_balance():
    # Arrange
    account = BankAccount(initial_balance=100)
    
    # Act
    account.withdraw(50)
    
    # Assert
    assert account.balance == 50
```

### 2. Edge Case Tests

Test boundary conditions and limits:

```python
def test_withdraw_exact_balance():
    # Arrange
    account = BankAccount(initial_balance=100)
    
    # Act
    account.withdraw(100)
    
    # Assert
    assert account.balance == 0

def test_withdraw_zero_amount():
    # Arrange
    account = BankAccount(initial_balance=100)
    
    # Act
    account.withdraw(0)
    
    # Assert
    assert account.balance == 100
```

### 3. Error Condition Tests

Test how the system handles invalid inputs:

```python
def test_withdraw_with_insufficient_funds():
    # Arrange
    account = BankAccount(initial_balance=50)
    
    # Act & Assert
    with pytest.raises(InsufficientFundsError):
        account.withdraw(100)
```

## Test Isolation and Independence

### 1. No Test Dependencies

Each test should be completely independent:

```typescript
// ✅ Good: Independent tests
describe('UserService', () => {
  let userService: UserService;
  
  beforeEach(() => {
    userService = new UserService(new MockDatabase());
  });
  
  it('should create user with valid data', () => {
    const userData = { name: 'John', email: 'john@example.com' };
    const user = userService.createUser(userData);
    expect(user.id).toBeDefined();
  });
  
  it('should find user by id', () => {
    const userData = { name: 'Jane', email: 'jane@example.com' };
    const createdUser = userService.createUser(userData);
    const foundUser = userService.findById(createdUser.id);
    expect(foundUser.name).toBe('Jane');
  });
});
```

### 2. Clean Test State

Always start with a clean state:

```java
@BeforeEach
void setUp() {
    database.clear();
    cache.clear();
    testUser = new User("testuser", "test@example.com");
}

@AfterEach
void tearDown() {
    database.clear();
    cache.clear();
}
```

## Mocking and Test Doubles

### 1. Use Mocks for Dependencies

Isolate the unit under test by mocking external dependencies:

```typescript
describe('EmailService', () => {
  it('should send email via SMTP client', async () => {
    // Arrange
    const mockSMTPClient = {
      sendMail: jest.fn().mockResolvedValue(true)
    };
    const emailService = new EmailService(mockSMTPClient);
    
    // Act
    await emailService.send('test@example.com', 'Hello', 'Test message');
    
    // Assert
    expect(mockSMTPClient.sendMail).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Hello',
      body: 'Test message'
    });
  });
});
```

### 2. Don't Mock What You Don't Own

Only mock interfaces you control:

```typescript
// ✅ Good: Mock your own interface
interface PaymentGateway {
  processPayment(amount: number): Promise<PaymentResult>;
}

const mockPaymentGateway: PaymentGateway = {
  processPayment: jest.fn().mockResolvedValue({ success: true })
};

// ❌ Avoid: Mocking third-party libraries directly
// const mockStripe = jest.mock('stripe');
```

## Test Data Management

### 1. Use Object Mothers/Builders

Create reusable test data builders:

```typescript
class UserBuilder {
  private user: Partial<User> = {};
  
  withName(name: string): UserBuilder {
    this.user.name = name;
    return this;
  }
  
  withEmail(email: string): UserBuilder {
    this.user.email = email;
    return this;
  }
  
  build(): User {
    return new User(
      this.user.name || 'Default Name',
      this.user.email || 'default@example.com'
    );
  }
}

// Usage in tests
it('should validate user email', () => {
  const user = new UserBuilder()
    .withEmail('invalid-email')
    .build();
    
  expect(() => user.validate()).toThrow();
});
```

### 2. Keep Test Data Minimal

Only include data relevant to the test:

```python
# ✅ Good: Minimal test data
def test_user_age_calculation():
    user = User(birth_date=date(1990, 1, 1))
    assert user.age == 33  # Assuming current year is 2023

# ❌ Bad: Excessive irrelevant data
def test_user_age_calculation():
    user = User(
        name="John Doe",
        email="john@example.com",
        address="123 Main St",
        phone="555-1234",
        birth_date=date(1990, 1, 1),
        occupation="Engineer",
        # ... more irrelevant fields
    )
    assert user.age == 33
```

## Common Anti-Patterns to Avoid

### 1. Testing Implementation Details

Test behavior, not implementation:

```typescript
// ❌ Bad: Testing implementation details
it('should call validateEmail method', () => {
  const spy = jest.spyOn(userService, 'validateEmail');
  userService.createUser({ email: 'test@example.com' });
  expect(spy).toHaveBeenCalled();
});

// ✅ Good: Testing behavior
it('should reject user with invalid email', () => {
  expect(() => {
    userService.createUser({ email: 'invalid-email' });
  }).toThrow('Invalid email format');
});
```

### 2. Overly Complex Tests

Keep tests simple and focused:

```java
// ❌ Bad: Complex test with multiple scenarios
@Test
void testUserOperations() {
    User user = createUser();
    user.setAge(25);
    assertTrue(user.isAdult());
    
    user.addFriend(createFriend());
    assertEquals(1, user.getFriends().size());
    
    user.deactivate();
    assertFalse(user.isActive());
}

// ✅ Good: Separate focused tests
@Test
void shouldBeAdultWhenAgeIs25() {
    User user = new User();
    user.setAge(25);
    assertTrue(user.isAdult());
}

@Test
void shouldAddFriendToFriendsList() {
    User user = new User();
    User friend = new User();
    
    user.addFriend(friend);
    
    assertEquals(1, user.getFriends().size());
}
```

### 3. Ignoring Test Maintenance

Treat test code with the same care as production code:

- Refactor tests when they become hard to understand
- Remove duplicate test setup code
- Use descriptive variable names
- Keep tests DRY (Don't Repeat Yourself)

## Test Performance

### 1. Keep Tests Fast

Unit tests should run in milliseconds:

```typescript
// ✅ Good: Fast test with mocks
it('should process order quickly', () => {
  const mockPayment = jest.fn().mockResolvedValue(true);
  const orderProcessor = new OrderProcessor(mockPayment);
  
  const result = orderProcessor.process(testOrder);
  
  expect(result.status).toBe('processed');
});

// ❌ Slow: Real database/network calls in unit tests
it('should process order', async () => {
  const database = new PostgreSQLDatabase();
  const paymentGateway = new StripeGateway();
  const orderProcessor = new OrderProcessor(paymentGateway, database);
  
  const result = await orderProcessor.process(testOrder);
  
  expect(result.status).toBe('processed');
});
```

### 2. Parallel Test Execution

Configure tests to run in parallel when possible:

```javascript
// jest.config.js
module.exports = {
  maxWorkers: '50%', // Use 50% of available CPU cores
  testTimeout: 5000,  // 5 second timeout per test
};
```

## Continuous Improvement

### 1. Monitor Test Quality Metrics

Track important metrics:
- Test coverage (aim for >80% line coverage)
- Test execution time
- Test failure rate
- Number of flaky tests

### 2. Regular Test Review

Periodically review tests for:
- Clarity and readability
- Relevance and value
- Maintenance burden
- Redundancy

### 3. Team Standards

Establish team conventions for:
- Test naming patterns
- Test file organization
- Mock usage guidelines
- Test data management

Remember: **Good unit tests are your safety net**. They should give you confidence to refactor and change code without fear of breaking existing functionality.