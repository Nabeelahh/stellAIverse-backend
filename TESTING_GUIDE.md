# Automated Testing Framework Setup

This project uses [Jest](https://jestjs.io/) for automated testing, which is well-suited for TypeScript and Node.js applications. All production code resides in the `src/` directory, while test code is separated into the `test/` directory.

## Running Tests

- **Unit tests:**
  ```bash
  npm test
  ```
- **End-to-End (E2E) tests:**
  ```bash
  npm run test:e2e
  ```
- **Test coverage:**
  ```bash
  npm run test:cov
  ```

## Adding New Tests

1. **Unit Tests:**
   - Create a new file in the `test/` directory, e.g., `test/my-feature.spec.ts`.
   - Use Jest's `describe` and `it` blocks to structure your tests.
   - Import the module/service you want to test from `src/`.

2. **E2E Tests:**
   - Place E2E test files in the `test/` directory, following the naming convention `*.e2e-spec.ts`.
   - Use NestJS's `@nestjs/testing` utilities for integration tests.

## Example Unit Test

```typescript
// test/example.spec.ts
import { MyService } from '../src/my-service';

describe('MyService', () => {
  it('should return expected value', () => {
    const service = new MyService();
    expect(service.getValue()).toBe('expected');
  });
});
```

## Example E2E Test

```typescript
// test/example.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    // Example test
  });
});
```

## Project Structure

- `src/` — Production code
- `test/` — Test code (unit and E2E)

## More Information
- See `jest.config.js` for Jest configuration.
- See `PROJECT_COMPLETION.md` and `WALLET_AUTH.md` for test coverage details.

---

For further help, visit the [Jest documentation](https://jestjs.io/docs/getting-started).
