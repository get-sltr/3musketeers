# Sentry Usage Guide

This document provides examples for using Sentry in your project.

## Import Sentry

Always import Sentry using:
```typescript
import * as Sentry from "@sentry/nextjs";
```

## Exception Catching

Use `Sentry.captureException(error)` in try-catch blocks:

```typescript
try {
  // Your code
  await someRiskyOperation();
} catch (error) {
  Sentry.captureException(error);
  // Handle error
}
```

## Tracing / Performance Monitoring

Use `Sentry.startSpan` to measure performance:

### Component Actions
```typescript
const handleButtonClick = () => {
  Sentry.startSpan(
    {
      op: "ui.click",
      name: "Button Click",
    },
    (span) => {
      span.setAttribute("buttonId", "submit");
      span.setAttribute("userId", user.id);
      
      // Your action code
      submitForm();
    },
  );
};
```

### API Calls
```typescript
async function fetchUserData(userId: string) {
  return Sentry.startSpan(
    {
      op: "http.client",
      name: `GET /api/users/${userId}`,
    },
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      return data;
    },
  );
}
```

## Logging

Sentry automatically captures `console.log`, `console.warn`, and `console.error`.

For structured logging, use the Sentry logger:

```typescript
const { logger } = Sentry;

logger.trace("Starting operation", { operation: "user-fetch" });
logger.debug(logger.fmt`Cache miss for user: ${userId}`);
logger.info("User updated", { userId: 123 });
logger.warn("Rate limit approaching", { endpoint: "/api/data" });
logger.error("Payment failed", { orderId: "order_123" });
logger.fatal("Critical system failure", { component: "database" });
```

## Configuration Files

- **Client**: `src/instrumentation-client.ts`
- **Server**: `sentry.server.config.ts`
- **Edge**: `sentry.edge.config.ts`

Sentry is already initialized in these files - you don't need to initialize it elsewhere.

