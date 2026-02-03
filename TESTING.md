# 🧪 Testing Guide

## Running Tests

### Run all tests
```bash
bun test
```

### Run with watch mode
```bash
bun run test:watch
```

### Run with coverage
```bash
bun run test:coverage
```

### Run specific test file
```bash
bun test tests/user.test.ts
```

## Test Structure

```
tests/
├── helpers.ts           # Test utilities & fixtures
├── user.test.ts         # User API tests
├── plan.test.ts         # Plan & subscription tests
├── notes.test.ts        # Notes marketplace tests
├── mocktest.test.ts     # Mock test API tests
├── ai.test.ts           # AI features tests
├── admin.test.ts        # Admin dashboard tests
└── integration.test.ts  # Integration tests
```

## Test Coverage

### ✅ User API (user.test.ts)
- Profile retrieval
- Profile updates
- Current plan checking
- Authentication validation

### ✅ Plan API (plan.test.ts)
- List all plans
- Purchase plans
- Purchase history
- Invalid plan handling

### ✅ Notes Marketplace (notes.test.ts)
- Browse notes
- Filter by subject, price
- Create & update notes
- Purchase notes
- Escrow system
- Buyer/seller views
- Duplicate purchase prevention

### ✅ Mock Tests (mocktest.test.ts)
- List tests
- Test details with questions
- Submit attempts
- Score calculation
- Weak topic tracking
- Filter by subject

### ✅ AI Features (ai.test.ts)
- Process AI requests
- Prompt caching
- Daily limits enforcement
- Request history
- Usage statistics

### ✅ Admin Dashboard (admin.test.ts)
- Dashboard statistics
- Revenue tracking
- User statistics
- User management
- Role updates
- Pending approvals
- Metric history
- Access control

### ✅ Integration Tests (integration.test.ts)
- Health checks
- Error handling
- CORS & security
- Content-type validation

## Key Test Features

### 🔄 Database Cleanup
Each test suite cleans up the database before and after running.

### 🎭 Mock Data
Reusable test data generators in `helpers.ts`:
- Users (student, teacher, admin)
- Plans
- Notes
- Mock tests
- Questions

### 🔐 Authentication
Mock Firebase tokens for testing authenticated endpoints.

### ✅ Assertions
- Status code validation
- Response structure validation
- Data integrity checks
- Business logic validation

## Writing New Tests

Example test structure:
```typescript
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { setupTestDatabase, cleanupTestDatabase } from './helpers';

describe('Feature Name', () => {
  beforeAll(async () => {
    await setupTestDatabase();
    // Setup test data
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  test('should do something', async () => {
    // Arrange
    const data = { test: 'data' };

    // Act
    const response = await fetch('http://localhost:3000/api/endpoint');

    // Assert
    expect(response.status).toBe(200);
  });
});
```

## Test Environment

Tests assume the server is running on `http://localhost:3000`.

Start the server before running tests:
```bash
bun run dev
```

Then in another terminal:
```bash
bun test
```

## CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Run tests
  run: |
    bun install
    bun run db:push
    bun test
```
