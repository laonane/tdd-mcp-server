# JavaScript/TypeScript TDD Example using Jest

This example demonstrates a complete TDD workflow for implementing a simple shopping cart feature.

## Feature Requirements

Implement a shopping cart that can:
1. Add items to the cart
2. Remove items from the cart
3. Calculate the total price
4. Apply discount codes
5. Handle empty cart scenarios

## TDD Implementation

### Step 1: RED - First Failing Test

```javascript
// shopping-cart.test.js
describe('ShoppingCart', () => {
  it('should start with empty cart', () => {
    const cart = new ShoppingCart();
    expect(cart.getItemCount()).toBe(0);
  });
});
```

**Result**: Test fails because `ShoppingCart` class doesn't exist.

### Step 2: GREEN - Minimal Implementation

```javascript
// shopping-cart.js
class ShoppingCart {
  constructor() {
    this.items = [];
  }
  
  getItemCount() {
    return this.items.length;
  }
}

module.exports = ShoppingCart;
```

**Result**: Test passes! ✅

### Step 3: REFACTOR

Code is simple and clean, no refactoring needed yet.

### Step 4: RED - Add Item Test

```javascript
describe('ShoppingCart', () => {
  let cart;
  
  beforeEach(() => {
    cart = new ShoppingCart();
  });

  it('should start with empty cart', () => {
    expect(cart.getItemCount()).toBe(0);
  });

  it('should add item to cart', () => {
    const item = { id: 1, name: 'Apple', price: 1.50 };
    
    cart.addItem(item);
    
    expect(cart.getItemCount()).toBe(1);
    expect(cart.getItems()).toContain(item);
  });
});
```

**Result**: Test fails because `addItem()` and `getItems()` methods don't exist.

### Step 5: GREEN - Implement Add Item

```javascript
class ShoppingCart {
  constructor() {
    this.items = [];
  }
  
  getItemCount() {
    return this.items.length;
  }
  
  addItem(item) {
    this.items.push(item);
  }
  
  getItems() {
    return this.items;
  }
}
```

**Result**: Test passes! ✅

### Step 6: RED - Calculate Total Test

```javascript
it('should calculate total price correctly', () => {
  const item1 = { id: 1, name: 'Apple', price: 1.50 };
  const item2 = { id: 2, name: 'Banana', price: 2.00 };
  
  cart.addItem(item1);
  cart.addItem(item2);
  
  expect(cart.getTotal()).toBe(3.50);
});
```

**Result**: Test fails because `getTotal()` method doesn't exist.

### Step 7: GREEN - Implement Total Calculation

```javascript
class ShoppingCart {
  constructor() {
    this.items = [];
  }
  
  getItemCount() {
    return this.items.length;
  }
  
  addItem(item) {
    this.items.push(item);
  }
  
  getItems() {
    return this.items;
  }
  
  getTotal() {
    return this.items.reduce((total, item) => total + item.price, 0);
  }
}
```

**Result**: Test passes! ✅

### Step 8: RED - Remove Item Test

```javascript
it('should remove item from cart', () => {
  const item1 = { id: 1, name: 'Apple', price: 1.50 };
  const item2 = { id: 2, name: 'Banana', price: 2.00 };
  
  cart.addItem(item1);
  cart.addItem(item2);
  
  cart.removeItem(1);
  
  expect(cart.getItemCount()).toBe(1);
  expect(cart.getItems()).not.toContain(item1);
  expect(cart.getItems()).toContain(item2);
});
```

**Result**: Test fails because `removeItem()` method doesn't exist.

### Step 9: GREEN - Implement Remove Item

```javascript
class ShoppingCart {
  constructor() {
    this.items = [];
  }
  
  getItemCount() {
    return this.items.length;
  }
  
  addItem(item) {
    this.items.push(item);
  }
  
  getItems() {
    return this.items;
  }
  
  getTotal() {
    return this.items.reduce((total, item) => total + item.price, 0);
  }
  
  removeItem(itemId) {
    this.items = this.items.filter(item => item.id !== itemId);
  }
}
```

**Result**: Test passes! ✅

### Step 10: RED - Discount Code Test

```javascript
it('should apply 10% discount with valid code', () => {
  const item = { id: 1, name: 'Apple', price: 10.00 };
  cart.addItem(item);
  
  cart.applyDiscount('SAVE10');
  
  expect(cart.getTotal()).toBe(9.00);
});

it('should not apply discount with invalid code', () => {
  const item = { id: 1, name: 'Apple', price: 10.00 };
  cart.addItem(item);
  
  cart.applyDiscount('INVALID');
  
  expect(cart.getTotal()).toBe(10.00);
});
```

**Result**: Tests fail because `applyDiscount()` method doesn't exist.

### Step 11: GREEN - Implement Discount

```javascript
class ShoppingCart {
  constructor() {
    this.items = [];
    this.discountRate = 0;
  }
  
  getItemCount() {
    return this.items.length;
  }
  
  addItem(item) {
    this.items.push(item);
  }
  
  getItems() {
    return this.items;
  }
  
  getTotal() {
    const subtotal = this.items.reduce((total, item) => total + item.price, 0);
    return subtotal - (subtotal * this.discountRate);
  }
  
  removeItem(itemId) {
    this.items = this.items.filter(item => item.id !== itemId);
  }
  
  applyDiscount(discountCode) {
    const validCodes = {
      'SAVE10': 0.1,
      'SAVE20': 0.2
    };
    
    this.discountRate = validCodes[discountCode] || 0;
  }
}
```

**Result**: Tests pass! ✅

### Step 12: REFACTOR - Improve Code Quality

Looking at our code, we can identify several improvements:

1. Extract discount logic to separate class
2. Use more descriptive variable names
3. Add input validation

```javascript
// discount-manager.js
class DiscountManager {
  constructor() {
    this.validCodes = {
      'SAVE10': 0.1,
      'SAVE20': 0.2,
      'WELCOME': 0.15
    };
  }
  
  getDiscountRate(code) {
    return this.validCodes[code] || 0;
  }
  
  isValidCode(code) {
    return code in this.validCodes;
  }
}

module.exports = DiscountManager;
```

```javascript
// shopping-cart.js (refactored)
const DiscountManager = require('./discount-manager');

class ShoppingCart {
  constructor() {
    this.items = [];
    this.discountManager = new DiscountManager();
    this.appliedDiscountRate = 0;
  }
  
  getItemCount() {
    return this.items.length;
  }
  
  addItem(item) {
    if (!item || !item.id || !item.name || typeof item.price !== 'number') {
      throw new Error('Invalid item format');
    }
    this.items.push(item);
  }
  
  getItems() {
    return [...this.items]; // Return copy to prevent external modification
  }
  
  getSubtotal() {
    return this.items.reduce((total, item) => total + item.price, 0);
  }
  
  getTotal() {
    const subtotal = this.getSubtotal();
    const discountAmount = subtotal * this.appliedDiscountRate;
    return Math.round((subtotal - discountAmount) * 100) / 100; // Round to 2 decimal places
  }
  
  removeItem(itemId) {
    if (!itemId) {
      throw new Error('Item ID is required');
    }
    
    const initialLength = this.items.length;
    this.items = this.items.filter(item => item.id !== itemId);
    
    if (this.items.length === initialLength) {
      throw new Error(`Item with ID ${itemId} not found`);
    }
  }
  
  applyDiscount(discountCode) {
    if (!discountCode) {
      throw new Error('Discount code is required');
    }
    
    this.appliedDiscountRate = this.discountManager.getDiscountRate(discountCode);
  }
  
  clearCart() {
    this.items = [];
    this.appliedDiscountRate = 0;
  }
}

module.exports = ShoppingCart;
```

### Step 13: Add Edge Case Tests

```javascript
describe('ShoppingCart Edge Cases', () => {
  let cart;
  
  beforeEach(() => {
    cart = new ShoppingCart();
  });

  it('should handle empty cart total', () => {
    expect(cart.getTotal()).toBe(0);
  });

  it('should throw error when adding invalid item', () => {
    expect(() => cart.addItem(null)).toThrow('Invalid item format');
    expect(() => cart.addItem({})).toThrow('Invalid item format');
    expect(() => cart.addItem({ id: 1 })).toThrow('Invalid item format');
  });

  it('should throw error when removing non-existent item', () => {
    expect(() => cart.removeItem(999)).toThrow('Item with ID 999 not found');
  });

  it('should throw error for invalid discount code input', () => {
    expect(() => cart.applyDiscount('')).toThrow('Discount code is required');
    expect(() => cart.applyDiscount(null)).toThrow('Discount code is required');
  });

  it('should clear cart completely', () => {
    const item = { id: 1, name: 'Apple', price: 1.50 };
    cart.addItem(item);
    cart.applyDiscount('SAVE10');
    
    cart.clearCart();
    
    expect(cart.getItemCount()).toBe(0);
    expect(cart.getTotal()).toBe(0);
  });

  it('should handle quantity for same item', () => {
    const apple1 = { id: 1, name: 'Apple', price: 1.50 };
    const apple2 = { id: 1, name: 'Apple', price: 1.50 };
    
    cart.addItem(apple1);
    cart.addItem(apple2);
    
    expect(cart.getItemCount()).toBe(2);
    expect(cart.getTotal()).toBe(3.00);
  });
});
```

## Final Test Suite

```javascript
// shopping-cart.test.js
const ShoppingCart = require('./shopping-cart');

describe('ShoppingCart', () => {
  let cart;
  
  beforeEach(() => {
    cart = new ShoppingCart();
  });

  describe('Basic functionality', () => {
    it('should start with empty cart', () => {
      expect(cart.getItemCount()).toBe(0);
      expect(cart.getTotal()).toBe(0);
    });

    it('should add item to cart', () => {
      const item = { id: 1, name: 'Apple', price: 1.50 };
      
      cart.addItem(item);
      
      expect(cart.getItemCount()).toBe(1);
      expect(cart.getItems()).toContain(item);
    });

    it('should calculate total price correctly', () => {
      const item1 = { id: 1, name: 'Apple', price: 1.50 };
      const item2 = { id: 2, name: 'Banana', price: 2.00 };
      
      cart.addItem(item1);
      cart.addItem(item2);
      
      expect(cart.getTotal()).toBe(3.50);
    });

    it('should remove item from cart', () => {
      const item1 = { id: 1, name: 'Apple', price: 1.50 };
      const item2 = { id: 2, name: 'Banana', price: 2.00 };
      
      cart.addItem(item1);
      cart.addItem(item2);
      
      cart.removeItem(1);
      
      expect(cart.getItemCount()).toBe(1);
      expect(cart.getItems()).not.toContain(item1);
      expect(cart.getItems()).toContain(item2);
    });
  });

  describe('Discount functionality', () => {
    it('should apply 10% discount with valid code', () => {
      const item = { id: 1, name: 'Apple', price: 10.00 };
      cart.addItem(item);
      
      cart.applyDiscount('SAVE10');
      
      expect(cart.getTotal()).toBe(9.00);
    });

    it('should not apply discount with invalid code', () => {
      const item = { id: 1, name: 'Apple', price: 10.00 };
      cart.addItem(item);
      
      cart.applyDiscount('INVALID');
      
      expect(cart.getTotal()).toBe(10.00);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should throw error when adding invalid item', () => {
      expect(() => cart.addItem(null)).toThrow('Invalid item format');
      expect(() => cart.addItem({})).toThrow('Invalid item format');
    });

    it('should throw error when removing non-existent item', () => {
      expect(() => cart.removeItem(999)).toThrow('Item with ID 999 not found');
    });

    it('should clear cart completely', () => {
      const item = { id: 1, name: 'Apple', price: 1.50 };
      cart.addItem(item);
      cart.applyDiscount('SAVE10');
      
      cart.clearCart();
      
      expect(cart.getItemCount()).toBe(0);
      expect(cart.getTotal()).toBe(0);
    });
  });
});
```

## Key TDD Principles Demonstrated

1. **Red-Green-Refactor Cycle**: Each new feature followed the cycle
2. **Minimal Implementation**: Wrote only enough code to pass tests
3. **Incremental Development**: Added one feature at a time
4. **Test First**: Every line of production code was driven by a failing test
5. **Refactoring**: Improved code quality without changing behavior
6. **Edge Case Testing**: Added comprehensive error handling tests

## Running the Tests

```bash
# Install Jest
npm install --save-dev jest

# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode for development
npm test -- --watch
```

This example shows how TDD leads to:
- **Better design**: Clean separation of concerns
- **Comprehensive testing**: Both happy path and edge cases covered
- **Confidence in changes**: Refactoring backed by tests
- **Documentation**: Tests serve as living documentation