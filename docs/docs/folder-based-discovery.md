---
title: Folder-based Discovery
sidebar_label: Folder-based Discovery
---

Instead of explicitly listing all entities, you can use glob patterns to discover entities automatically based on file naming conventions.

## Configuration

```ts title="mikro-orm.config.ts"
import { defineConfig } from '@mikro-orm/sqlite';

export default defineConfig({
  // Glob patterns for compiled JavaScript files
  entities: ['dist/**/*.entity.js'],
  // Glob patterns for TypeScript source files (used in development)
  entitiesTs: ['src/**/*.entity.ts'],
  // ...
});
```

## How it works

1. When running from TypeScript (e.g., via tsx, or in tests), MikroORM uses `entitiesTs` patterns
2. When running from compiled JavaScript, MikroORM uses `entities` patterns
3. Files matching the patterns are dynamically imported and scanned for entity definitions

> It is important that `entities` points to the compiled JS files, and `entitiesTs` points to the TS source files. You should not mix those.

## File naming conventions

A common convention is to use the `.entity.ts` suffix:

```
src/
├── modules/
│   ├── user/
│   │   └── user.entity.ts
│   ├── article/
│   │   ├── article.entity.ts
│   │   └── tag.entity.ts
│   └── common/
│       └── base.entity.ts
└── mikro-orm.config.ts
```

## Glob patterns

The paths are resolved using native Node.js glob, so you can use standard globbing patterns:

```ts
const orm = await MikroORM.init({
  // All .entity.js files in dist folder recursively
  entities: ['./dist/**/*.entity.js'],

  // Multiple patterns
  entities: ['./dist/modules/**/*.entity.js', './dist/shared/**/*.entity.js'],

  // Negative patterns to exclude files
  entities: ['./dist/**/*.entity.js', '!./dist/**/*.test.entity.js'],
});
```

:::note Brace expansion

Native Node.js glob does not support brace expansion patterns like `src/{entities,modules}/*.ts`. If you need this feature, use `tinyglobby` directly:

```ts
import { glob } from 'tinyglobby';

export default defineConfig({
  entities: await glob(['src/{entities,modules}/*.ts']),
});
```

:::

## Debugging discovery

If you are experiencing problems with folder-based discovery, use the `mikro-orm debug` CLI command to check what paths are actually being used:

```bash
npx mikro-orm debug
```

This will show you:
- Which configuration file is being loaded
- The resolved entity paths
- Which entities were discovered

## Explicit vs Folder-based Discovery

| Aspect | Explicit (`entities: [User]`) | Folder-based (`entities: ['**/*.entity.js']`) |
|--------|------------------------------|----------------------------------------------|
| Setup complexity | More code | Less code |
| Refactoring | IDE-supported | Manual pattern updates |
| Build tools | Works everywhere | May need configuration |
| Performance | Faster startup | Slightly slower (file scanning) |
| Error detection | Compile-time | Runtime |

### When to use explicit references

- Small to medium projects
- When using bundlers like webpack or esbuild
- When you want maximum IDE support and type safety
- When using `defineEntity` (recommended approach)

### When to use folder-based discovery

- Large projects with many entities
- When using decorator-based entities with ts-morph
- When entities are spread across many modules
- When you want to avoid updating config when adding new entities

## Synchronous initialization limitation

When using the synchronous `new MikroORM()` constructor instead of `MikroORM.init()`, folder-based discovery is not supported:

```ts
// This works - async initialization supports folder-based discovery
const orm = await MikroORM.init({
  entities: ['dist/**/*.entity.js'],
});

// This does NOT work - must use explicit entity references
const orm = new MikroORM({
  entities: ['dist/**/*.entity.js'],
  // use explicit references only with sync init
  // entities: [User, Article], 
});
```

## Multiple entity locations

You can combine multiple patterns and explicit references:

```ts
import { BaseEntity } from './entities/base.entity.js';

export default defineConfig({
  entities: [
    BaseEntity, // explicit reference
    'dist/modules/**/*.entity.js', // glob pattern
  ],
  entitiesTs: [
    BaseEntity,
    'src/modules/**/*.entity.ts',
  ],
});
```

This is useful when you have base entities that need to be loaded first, or when mixing discovery approaches.

## Generating a barrel file with `discovery:export`

Instead of manually maintaining entity arrays or relying on folder-based discovery at runtime, you can use the `discovery:export` CLI command to generate a TypeScript barrel file with explicit entity imports:

```bash
npx mikro-orm discovery:export
```

This scans your entity source files (using `entitiesTs` or `entities` paths from your config) and generates a file like:

```ts
import { Article } from './entities/Article.js';
import { User } from './entities/User.js';

export const entities = [
  Article,
  User,
] as const;
```

You can then use the generated file in your config:

```ts
import { entities } from './entities.generated';

export default defineConfig({ entities });
```

This gives you the convenience of folder-based discovery (no manual updates when adding entities) with the benefits of explicit references (works with bundlers, faster startup, compile-time checking). The command also generates a `Database` type for use with [Kysely integration](./kysely.md#generating-entity-exports-with-the-cli).

See the [Kysely guide](./kysely.md#generating-entity-exports-with-the-cli) for the full command options.
