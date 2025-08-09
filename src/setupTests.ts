// Jest setup file for TDD MCP Server tests

// Extend Jest matchers
import '@jest/globals';

// Mock console methods to reduce noise in tests
const originalConsole = global.console;

beforeAll(() => {
  global.console = {
    ...originalConsole,
    // Keep error and warn for important messages
    error: jest.fn(),
    warn: jest.fn(),
    // Mock info, debug, log for cleaner test output
    info: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  } as any;
});

afterAll(() => {
  global.console = originalConsole;
});

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});