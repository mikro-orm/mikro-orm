---
title: Using MikroORM with Next.js
sidebar_label: Usage with Next.js
---

This guide covers integrating MikroORM with Next.js, addressing the unique challenges that arise from Next.js's bundler environment. For a complete working example, see the [nextjs-example-app](https://github.com/mikro-orm/nextjs-example-app) repository.

## Key Challenges

Next.js uses a bundler (Turbopack/Webpack) that introduces several constraints:

1. **Class name mangling** in production builds
2. **No filesystem access** at runtime for entity discovery
3. **Code splitting** affects how migrations are loaded

## Entity Definition

The `defineEntity` approach is the path of least resistance when working with Next.js. While decorators work, they require additional setup (such as `@mikro-orm/reflection` package or other metadata provider).

### Base Entity

```ts
// lib/base.entity.ts
import { defineEntity, p } from '@mikro-orm/sqlite';

export abstract class BaseEntity {
  id!: number;
  createdAt? = new Date();
  updatedAt? = new Date();
}

export const BaseSchema = defineEntity({
  name: 'BaseEntity',
  class: BaseEntity,
  properties: {
    id: p.integer().primary(),
    createdAt: p.datetime({ defaultRaw: 'current_timestamp' }),
    updatedAt: p.datetime({ defaultRaw: 'current_timestamp', onUpdate: () => new Date() }),
  },
});
```

### Example Entity

```ts
// lib/user.entity.ts
import { defineEntity, p } from '@mikro-orm/sqlite';
import { BaseEntity, BaseProperties } from './base.entity';
import { UserRepository } from './user.repository';

export class User extends BaseEntity {
  fullName!: string;
  email!: string;
  password!: string;
  bio?: string;

  constructor(fullName: string, email: string, password: string) {
    super();
    this.fullName = fullName;
    this.email = email;
    this.password = password;
  }

  async hashPassword() {
    const argon2 = await import('argon2');
    this.password = await argon2.hash(this.password);
  }
}

export const UserSchema = defineEntity({
  name: 'User',
  class: User,
  tableName: 'user', // REQUIRED: explicit table name
  repository: () => UserRepository,
  extends: BaseEntity, // inherits id, createdAt, updatedAt
  constructorParams: ['fullName', 'email', 'password'],
  properties: {
    fullName: p.string(),
    email: p.string({ unique: true }),
    password: p.string({ hidden: true, lazy: true }),
    bio: p.text().nullable(),
  },
  hooks: {
    beforeCreate: ['hashPassword'],
    beforeUpdate: ['hashPassword'],
  },
});
```

## Explicit Table Names Are Required

**Production builds mangle class names.** If you don't specify explicit table names, your entities might end up with table names like `a` or `t` instead of `user` or `article`.

Always set `tableName` in your entity definition:

```ts
export const UserSchema = defineEntity({
  name: 'User',
  tableName: 'user', // Always specify this!
  // ...
});
```

With decorators, use:

```ts
@Entity({ tableName: 'user' })
export class User {}
```

## No Folder-Based Discovery

**Folder-based entity discovery does not work with bundlers.** The following will fail:

```ts
// This won't work with Next.js!
export default defineConfig({
  entities: ['./lib/**/*.entity.ts'],
});
```

Instead, explicitly import and list all entities:

```ts
// mikro-orm.config.ts
import { defineConfig } from '@mikro-orm/sqlite';
import { UserSchema } from './lib/user.entity';
import { ArticleSchema } from './lib/article.entity';
import { TagSchema } from './lib/tag.entity';
import { CommentSchema } from './lib/comment.entity';

export default defineConfig({
  dbName: 'sqlite.db',
  entities: [UserSchema, ArticleSchema, TagSchema, CommentSchema],
});
```

## Migrations Require Explicit Configuration

Migrations face two bundler-related issues:

1. **Glob patterns don't work** - you cannot use `path` or `pathTs` options
2. **Extensions must be explicitly provided** - the Migrator isn't auto-loaded

### Configure Migrations Explicitly

```ts
// mikro-orm.config.ts
import { defineConfig } from '@mikro-orm/sqlite';
import { Migrator } from '@mikro-orm/migrations';
import { Migration20251221173216 } from '@/migrations/Migration20251221173216';

export default defineConfig({
  dbName: 'sqlite.db',
  entities: [/* ... */],

  // Explicitly register the Migrator extension
  extensions: [Migrator],

  // List migrations explicitly instead of using glob patterns
  migrations: {
    migrationsList: [Migration20251221173216],
  },
});
```

When you create new migrations, add them to the `migrationsList` array:

```ts
import { Migration20251221173216 } from '@/migrations/Migration20251221173216';
import { Migration20251225120000 } from '@/migrations/Migration20251225120000';

migrations: {
  migrationsList: [
    Migration20251221173216,
    Migration20251225120000,
  ],
},
```

## Database Connection Management

Use a singleton pattern with request context isolation:

```ts
// lib/db.ts
import { MikroORM, RequestContext } from '@mikro-orm/sqlite';
import config from '../mikro-orm.config';

export interface Services {
  orm: MikroORM;
  em: EntityManager;
}

let cache: Services;

export async function initORM(options?: Options): Promise<Services> {
  if (cache) {
    return cache;
  }

  const orm = await MikroORM.init({
    ...config,
    ...options,
  });

  // Run pending migrations on startup
  await orm.migrator.up();

  return cache = { orm, em: orm.em };
}

export async function withRequestContext<T>(
  callback: () => Promise<T>,
): Promise<T> {
  const { orm } = await initORM();
  return RequestContext.create(orm.em, callback);
}
```

### Using in Server Components / Route Handlers

```ts
// app/users/page.tsx
import { initORM, withRequestContext } from '@/lib/db';
import { User } from '@/lib/user.entity';

export default async function UsersPage() {
  return withRequestContext(async () => {
    const { em } = await initORM();
    const users = await em.findAll(User);

    return (
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.fullName}</li>
        ))}
      </ul>
    );
  });
}
```

## Full Configuration Example

```ts
// mikro-orm.config.ts
import { defineConfig } from '@mikro-orm/sqlite';
import { Migrator } from '@mikro-orm/migrations';
import { UserSchema, Social } from './lib/user.entity';
import { ArticleSchema } from './lib/article.entity';
import { TagSchema } from './lib/tag.entity';
import { CommentSchema } from './lib/comment.entity';
import { Migration20251221173216 } from '@/migrations/Migration20251221173216';

export default defineConfig({
  dbName: 'sqlite.db',
  debug: process.env.NODE_ENV !== 'production',

  // Explicit entity list - no glob patterns
  entities: [
    UserSchema,
    ArticleSchema,
    TagSchema,
    CommentSchema,
    Social, // Don't forget embeddables
  ],

  // Explicitly register extensions
  extensions: [Migrator],

  // Explicit migration list - no glob patterns
  migrations: {
    migrationsList: [Migration20251221173216],
  },
});
```

## Summary

| Concern | Solution |
|---------|----------|
| Entity definition | Use `defineEntity` (decorators need extra setup) |
| Table names | Always specify `tableName` explicitly |
| Entity discovery | Import and list entities explicitly |
| Migrations path | Use `migrationsList` with explicit imports |
| Migrator extension | Add `Migrator` to `extensions` array |
| Connection management | Singleton with `RequestContext` per request |

## Example

A real world example of Next.js with MikroORM can be found [here](https://github.com/mikro-orm/nextjs-example-app).
