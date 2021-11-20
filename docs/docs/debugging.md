---
title: Logging
---

For development purposes it might come handy to enable logging and debug mode:

```typescript
return MikroORM.init({
  debug: true,
});
```

By doing this `MikroORM` will start using `console.log()` function to dump all queries:

```
[query] select `e0`.* from `author` as `e0` where `e0`.`name` = ? limit ? [took 2 ms]
[query] begin [took 1 ms]
[query] insert into `author` (`name`, `email`, `created_at`, `updated_at`, `terms_accepted`) values (?, ?, ?, ?, ?) [took 2 ms]
[query] commit [took 2 ms]
```

It is also useful for debugging problems with entity discovery, as you will see information
about every processed entity:

```
[discovery] ORM entity discovery started
[discovery] - processing entity Author
[discovery] - using cached metadata for entity Author
[discovery] - processing entity Book
[discovery] - processing entity BookTag
[discovery] - entity discovery finished after 13 ms
```

## Custom Logger

We can also provide our own logger function via `logger` option. 

```typescript
return MikroORM.init({
  debug: true,
  logger: msg => myCustomLogger.log(msg),
});
```

If we want to have more control over logging, we can use `loggerFactory`
and use our own implementation of the `Logger` interface:

```ts
import { Logger, LoggerOptions, MikroORM, Configuration } from '@mikro-orm/core';

class MyLogger implements Logger { ... }

const orm = await MikroORM.init({
  debug: true,
  loggerFactory: (options: LoggerOptions) => new MyLogger(config),
});
```

We can also extend the `DefaultLogger` instead of implementing everything from 
scratch. It is also exported from the `@mikro-orm/core` package.

The `Logger` interface is defined as follows:

```ts
interface Logger {
  log(namespace: LoggerNamespace, message: string, context?: LogContext): void;
  error(namespace: LoggerNamespace, message: string, context?: LogContext): void;
  warn(namespace: LoggerNamespace, message: string, context?: LogContext): void;
  logQuery(context: LogContext): void;
  setDebugMode(debugMode: boolean | LoggerNamespace[]): void;
  isEnabled(namespace: LoggerNamespace): boolean;
}

type LoggerNamespace = 'query' | 'query-params' | 'discovery' | 'info';

interface LogContext {
  query?: string;
  params?: unknown[];
  took?: number;
  level?: 'info' | 'warning' | 'error';
  connection?: {
    type?: string;
    name?: string;
  };
}
```

## Disabling colored output

To disable colored output, we can use multiple environment variables:

- `NO_COLOR`
- `MIKRO_ORM_NO_COLOR`
- `FORCE_COLOR`

## Logger Namespaces

There are multiple Logger Namespaces that you can specifically request, while omitting the rest.
Just specify array of them via the `debug` option:

```typescript
return MikroORM.init({
  debug: ['query'], // now only queries will be logged
});
```

Currently, there are 4 namespaces – `query`, `query-params`, `discovery` and `info`.

If you provide `query-params` then you must also provide `query` in order for it to take effect.

## Highlighters

Previously Highlight.js was used to highlight various things in the CLI, 
like SQL and mongo queries, or migrations or entities generated via CLI.
While the library worked fine, it was causing performance issues mainly 
for those bundling via webpack and using lambdas, as the library was huge.

In v4 highlighting is disabled by default, and there are 2 highlighters 
you can optionally use (you need to install them first).

```typescript
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';

MikroORM.init({
  highlighter: new SqlHighlighter(),
  // ...
});
```

For MongoDB you can use `MongoHighlighter` from `@mikro-orm/mongo-highlighter` 
package.
