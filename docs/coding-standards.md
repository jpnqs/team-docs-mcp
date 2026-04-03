# Coding Standards

## General Principles

- Write clean, readable, and maintainable code
- Follow DRY (Don't Repeat Yourself) principle
- Use meaningful variable and function names
- Keep functions small and focused on a single responsibility

## TypeScript Guidelines

### Naming Conventions

- **Variables and Functions**: camelCase (e.g., `getUserData`, `isActive`)
- **Classes and Interfaces**: PascalCase (e.g., `UserService`, `IUserRepository`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`, `API_BASE_URL`)
- **Private class members**: Prefix with underscore (e.g., `_privateMethod`)

### Type Safety

- Always use explicit types for function parameters and return values
- Avoid `any` type; use `unknown` when type is truly uncertain
- Prefer interfaces over type aliases for object shapes
- Use strict TypeScript configuration

```typescript
// Good
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Bad
function calculateTotal(items: any): any {
  return items.reduce((sum: any, item: any) => sum + item.price, 0);
}
```

## Error Handling

### Best Practices

- Always handle errors explicitly
- Use custom error classes for domain-specific errors
- Log errors with sufficient context
- Never swallow errors silently

```typescript
// Good
try {
  await processPayment(order);
} catch (error) {
  logger.error("Payment processing failed", { orderId: order.id, error });
  throw new PaymentError("Failed to process payment", { cause: error });
}

// Bad
try {
  await processPayment(order);
} catch (error) {
  console.log("Error");
}
```

## Code Reviews

### Required Checks

- Code builds without errors
- All tests pass
- No linter warnings
- Documentation updated if public API changes
- Security considerations addressed

### Review Focus Areas

- Logic correctness
- Performance implications
- Security vulnerabilities
- Code readability
- Test coverage

## Testing

- Write unit tests for all business logic
- Aim for 80%+ code coverage
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

```typescript
describe("UserService", () => {
  it("should throw error when creating user with existing email", async () => {
    // Arrange
    const existingUser = { email: "test@example.com" };
    await userService.create(existingUser);

    // Act & Assert
    await expect(userService.create(existingUser)).rejects.toThrow(
      "User already exists",
    );
  });
});
```
