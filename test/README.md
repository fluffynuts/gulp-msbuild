# Tests

This directory contains the test suite for gulp-msbuild.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Files

- `index.test.ts` - Tests for the main MSBuild plugin entry point
- `msbuild-command-builder.test.ts` - Tests for MSBuild command construction logic
- `msbuild-options.test.ts` - Tests for MSBuild options handling
- `msbuild-runner.test.ts` - Tests for MSBuild process execution (requires mocking)
- `ArchitectureService.test.ts` - Tests for architecture detection utility

## Notes

- Tests are excluded from the TypeScript build output (dist folder)
- The `tsconfig.json` excludes `test/**`, `**/*.test.ts`, and `**/*.spec.ts`
- Tests use Jest as the testing framework with ts-jest for TypeScript support

## Writing Tests

When adding new tests:
1. Create test files with `.test.ts` extension
2. Place them in the `test/` directory
3. Follow the existing patterns for describe/it blocks
4. Mock external dependencies (child_process, fs, etc.) as needed

## Coverage

Coverage reports are generated in the `coverage/` directory when running `npm run test:coverage`.
