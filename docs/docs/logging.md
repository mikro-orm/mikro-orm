---
title: Logging
---

For development purposes it might come handy to enable logging and debug mode:

```ts
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

It is also useful for debugging problems with entity discovery, as you will see information about every processed entity:

```
[discovery] ORM entity discovery started
[discovery] - processing entity Author
[discovery] - using cached metadata for entity Author
[discovery] - processing entity Book
[discovery] - processing entity BookTag
[discovery] - entity discovery finished after 13 ms
```

## Disabling colored output

To disable colored output, you can use the `colors` option in the ORM config, or one of the following environment variables:

- `MIKRO_ORM_NO_COLOR`
- `NO_COLOR`
- `MIKRO_ORM_COLORS`
- `FORCE_COLOR`

## Logger Namespaces

There are multiple Logger Namespaces that you can specifically request, while omitting the rest. Just specify array of them via the `debug` option:

```ts
return MikroORM.init({
  debug: ['query'], // now only queries will be logged
});
```

Currently, there are 6 namespaces – `query`, `query-params`, `schema`, `discovery`, `info` and `deprecated`.

If you provide `query-params` then you must also provide `query` in order for it to take effect.

## Deprecation warnings

Even without `debugMode` enabled, the default logger will show `deprecated` messages in console.

When something is deprecated, it means there is an intention for it to be removed in a future version. The deprecation message should suggest alternatives for you that you should switch to before migrating to a major version.

You can ignore all deprecation warnings by setting `ignoreDeprecations` to `true`

```ts
return MikroORM.init({
  ignoreDeprecations: true, // now no deprecations will be logged, though you may be surprised when upgrading
});
```

When you are actively trying to remove deprecation warnings in preparation for an upgrade, you would likely want to tackle them one at a time. You can ignore only specific deprecation warnings you can't deal with right now, while still being alerted of others you didn't know about. To do this, list the deprecation warnings you want to ignore, e.g.

```ts
return MikroORM.init({
  ignoreDeprecations: ['D0001'], // ignore deprecation with label "D0001", but show others if they pop up
});
```

You can see a list of deprecation errors in [Configuration's section on deprecated warnings](./configuration.md#deprecation-warnings).

## Highlighters

Previously Highlight.js was used to highlight various things in the CLI, like SQL and mongo queries, or migrations or entities generated via CLI. While the library worked fine, it was causing performance issues mainly for those bundling via webpack and using lambdas, as the library was huge.

Since v4, highlighting is disabled by default, and there are 2 highlighters you can optionally use (you need to install them first).

```ts
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';

MikroORM.init({
  highlighter: new SqlHighlighter(),
  // ...
});
```

For MongoDB, you can use `MongoHighlighter` from `@mikro-orm/mongo-highlighter` package.

## Logger Customization

Several customization options exist to allow for style changes or custom logic.

### Query Labels

It may often be beneficial to log the origin of a query when using [`EntityManager.find`](./entity-manager.md#fetching-entities-with-entitymanager) or [`EntityManager.findOne`](./entity-manager.md#fetching-entities-with-entitymanager) for debugging and redundancy elimination purposes.

An optional `logging.label` option can be included within the `FindOptions` parameter of either call which will add a label to the output when debug mode is enabled.

```ts
const author = await em.findOne(Author, { id: 1 }, { logging: { label: 'Author Retrieval - /authors/me' } });
// [query] (Author Retrieval - /authors/me) select "a0".* from "Author" as "a0" where "a0"."id" = 1 limit 1 [took 21 ms]
```

### Changing `debugMode` or disabling logging for specific queries

If you'd like to disable logging or change the debug mode on a per-query basis, you can leverage `FindOptions.logging` and its `enabled` or `debugMode` property:

```ts
// MikroORM.init({ debug: true });
const author = await em.findOne(Author, { id: 1 }, { logging: { enabled: false } });
// Overrides config and displays no logger output

// ...

// MikroORM.init({ debug: false });
const author = await em.findOne(Author, { id: 1 }, { logging: { enabled: true } });
// Overrides config and displays logger output

// ...

// MikroORM.init({ debug: ['query-labels'] });
const author = await em.findOne(Author, { id: 1 }, { logging: { debugMode: ['query'] } });
// Overrides config and displays logger output for query
```

### Using a custom logger

You can provide your own logger function via the `logger` option:

```ts
return MikroORM.init({
  debug: true,
  logger: msg => myCustomLogger.log(msg),
});
```

### Using a custom `LoggerFactory`

If you want more control over what is logged and how, use the `loggerFactory` option in your config and extend the `SimpleLogger` class, extend the `DefaultLogger` class, or make your `Logger` from scratch:

#### Extending `DefaultLogger` or `SimpleLogger`

You can extend the `DefaultLogger` or `SimpleLogger` instead of implementing everything from scratch. `DefaultLogger` and `SimpleLogger` are both exported from the `@mikro-orm/core` package with `SimpleLogger` being colorless.

```ts
class CustomLogger extends DefaultLogger {
  log(namespace: LoggerNamespace, message: string, context?: LogContext) {
    // Create your own implementation for output:
    console.log(`[${namespace}] (${context.label}) ${message}`);

    // OR Utilize DefaultLogger's implementation:
    super.log(namespace, message, context)
  }
}

return MikroORM.init({
  debug: true,
  loggerFactory: (options) => new CustomLogger(options),
});
```

To use `SimpleLogger` instead, simply replace `DefaultLogger` in the example above:
```ts
class CustomLogger extends SimpleLogger {
  // ...
}
```

#### Creating a custom logger from scratch

You can use `loggerFactory` and use your own implementation of the `Logger` interface:

```ts
import { Logger, LoggerOptions, MikroORM, Configuration } from '@mikro-orm/core';

class MyLogger implements Logger {
  // ...
}

const orm = await MikroORM.init({
  debug: true,
  loggerFactory: (options) => new MyLogger(options),
});
```

The `Logger` interface is defined as follows:

```ts
interface Logger {
  log(namespace: LoggerNamespace, message: string, context?: LogContext): void;
  error(namespace: LoggerNamespace, message: string, context?: LogContext): void;
  warn(namespace: LoggerNamespace, message: string, context?: LogContext): void;
  logQuery(context: LogContext): void;
  setDebugMode(debugMode: boolean | LoggerNamespace[]): void;
  isEnabled(namespace: LoggerNamespace, context?: LogContext): boolean;
}

type LoggerNamespace = 'query' | 'query-params' | 'schema' | 'discovery' | 'info';

interface LogContext extends Dictionary {
  query?: string;
  label?: string;
  params?: unknown[];
  took?: number;
  level?: 'info' | 'warning' | 'error';
  enabled?: boolean;
  debugMode?: LoggerNamespace[];
  connection?: {
    type?: string;
    name?: string;
  };
}
```

### Providing additional context to a custom logger

If you have implemented your own `LoggerFactory` and need to access additional contextual values inside your customer logger implementation, utilize the `loggerContext` property of `FindOptions`. Adding additional key/value pairs to that object will make them available inside your custom logger:

```ts
const res = await em.findAll(Author, { loggerContext: { meaningOfLife: 42 } });

// ...

class CustomLogger extends DefaultLogger {
  log(namespace: LoggerNamespace, message: string, context?: LogContext) {
    console.log(context?.meaningOfLife);
    // 42
  }
}
```

The logger context can be also set on `EntityManager` level, e.g. via `em.fork()`:

```ts
const fork = em.fork({
  loggerContext: { meaningOfLife: 42 },
});
const res = await fork.findAll(Author); // same as previous example
```

> The default logger context of `EntityManager` contains the fork `id`, this way you can tell which `EntityManager` instance issued what queries.
