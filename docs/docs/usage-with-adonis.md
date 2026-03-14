---
title: Using MikroORM with AdonisJS
sidebar_label: Usage with AdonisJS
---

This guide covers integrating MikroORM with [AdonisJS](https://adonisjs.com/), replacing the default Lucid ORM with MikroORM's Unit of Work and Identity Map patterns. For a complete working example, see the [adonis-example-app](https://github.com/mikro-orm/adonis-example-app) repository.

The example app is based on the [AdonisJS slim starter kit](https://github.com/adonisjs/slim-starter-kit) and uses the same blog domain as the [MikroORM Getting Started Guide](https://mikro-orm.io/docs/guide).

## Installation

Start with an AdonisJS project (e.g. the [slim starter kit](https://github.com/adonisjs/slim-starter-kit)), then install MikroORM:

```bash
npm install @mikro-orm/core @mikro-orm/sqlite    # or any other driver
npm install -D @mikro-orm/cli @mikro-orm/migrations @mikro-orm/seeder
```

## MikroORM Configuration

Create a MikroORM config file. This is used both by the application and the CLI (for migrations):

```ts title="config/mikro-orm.config.ts"
import { defineConfig } from '@mikro-orm/sqlite'
import { Migrator } from '@mikro-orm/migrations'
import { SeedManager } from '@mikro-orm/seeder'
import { UserSchema } from '#entities/user'
import { ArticleSchema } from '#entities/article'

export default defineConfig({
  dbName: 'sqlite.db',
  entities: [UserSchema, ArticleSchema],
  extensions: [Migrator, SeedManager],
  debug: true,
})
```

Add the CLI configuration to your `package.json`:

```json
{
  "mikro-orm": {
    "useTsNode": true,
    "configPaths": [
      "./config/mikro-orm.config.ts",
      "./build/config/mikro-orm.config.js"
    ]
  }
}
```

## Service Provider

The service provider registers `MikroORM`, `EntityManager`, and repositories in the AdonisJS IoC container. Note the imports from the **driver package** (`@mikro-orm/sqlite`) so the `EntityManager` type includes query builder support:

```ts title="providers/mikro_orm_provider.ts"
import { MikroORM, EntityManager } from '@mikro-orm/sqlite'
import type { ApplicationService } from '@adonisjs/core/types'
import config from '#config/mikro-orm.config'
import { UserRepository } from '#repositories/user_repository'
import { ArticleRepository } from '#repositories/article_repository'
import { UserSchema } from '#entities/user'
import { ArticleSchema } from '#entities/article'

export default class MikroOrmProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    // MikroORM v7 supports synchronous initialization
    this.app.container.singleton(MikroORM, () => {
      return new MikroORM(config)
    })

    // import EntityManager from the driver package for query builder support
    this.app.container.singleton(EntityManager, async (resolver) => {
      const orm = await resolver.make(MikroORM)
      return orm.em
    })

    // register custom repositories
    this.app.container.singleton(UserRepository, async (resolver) => {
      const orm = await resolver.make(MikroORM)
      return orm.em.getRepository(UserSchema)
    })

    this.app.container.singleton(ArticleRepository, async (resolver) => {
      const orm = await resolver.make(MikroORM)
      return orm.em.getRepository(ArticleSchema)
    })
  }

  async boot() {
    const orm = await this.app.container.make(MikroORM)
    // run pending migrations on startup (or use schema.update() for development)
    await orm.migrator.up()
  }

  async shutdown() {
    const orm = await this.app.container.make(MikroORM)
    await orm.close()
  }
}
```

Register the provider in `adonisrc.ts`:

```ts title="adonisrc.ts"
import { defineConfig } from '@adonisjs/core/app'

export default defineConfig({
  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
    () => import('#providers/mikro_orm_provider'), // highlight-line
  ],
  preloads: [() => import('#start/routes'), () => import('#start/kernel')],
  // ...
})
```

## RequestContext Middleware

The most critical part of the integration is the [RequestContext](./identity-map.md#request-context) middleware. It ensures each HTTP request gets its own identity map, preventing entity state from leaking between requests:

```ts title="app/middleware/mikro_orm_middleware.ts"
import { RequestContext } from '@mikro-orm/core'
import { MikroORM } from '@mikro-orm/sqlite'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

@inject()
export default class MikroOrmMiddleware {
  constructor(protected orm: MikroORM) {}

  handle(_ctx: HttpContext, next: NextFn) {
    return RequestContext.create(this.orm.em, () => next())
  }
}
```

Register it as server-level middleware in `start/kernel.ts` so it runs on every request:

```ts title="start/kernel.ts"
import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

server.errorHandler(() => import('#exceptions/handler'))

server.use([
  () => import('#middleware/container_bindings_middleware'),
  () => import('#middleware/mikro_orm_middleware'), // highlight-line
])

router.use([() => import('@adonisjs/core/bodyparser_middleware')])
```

> `RequestContext.create()` wraps the `next()` call, so all downstream middleware and the controller handler run within the request context's async local storage scope.

## Error Handling

Handle MikroORM's `NotFoundError` (thrown by `findOneOrFail`) in the AdonisJS exception handler:

```ts title="app/exceptions/handler.ts"
import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import { NotFoundError } from '@mikro-orm/core'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof NotFoundError) {
      ctx.response.status(404).send({ error: error.message })
      return
    }

    return super.handle(error, ctx)
  }
}
```

## Entity Definitions

Define entities using `defineEntity` for full type inference:

```ts title="app/entities/base.ts"
import { defineEntity, p } from '@mikro-orm/core'

export const BaseSchema = defineEntity({
  name: 'BaseEntity',
  abstract: true,
  properties: {
    id: p.integer().primary(),
    createdAt: p.datetime().onCreate(() => new Date()),
    updatedAt: p.datetime().onCreate(() => new Date()).onUpdate(() => new Date()),
  },
})
```

```ts title="app/entities/article.ts"
import { defineEntity, type InferEntity, p } from '@mikro-orm/core'
import { BaseSchema } from '#entities/base'
import { UserSchema } from '#entities/user'
import { ArticleRepository } from '#repositories/article_repository'

export const ArticleSchema = defineEntity({
  name: 'Article',
  extends: BaseSchema,
  repository: () => ArticleRepository,
  properties: {
    slug: p.string().unique(),
    title: p.string().index(),
    text: p.text().lazy(),
    author: () => p.manyToOne(UserSchema).ref(),
  },
})

export type IArticle = InferEntity<typeof ArticleSchema>
```

## Using in Controllers

Controllers inject `EntityManager` and repositories directly via `@inject()`. The `RequestContext` middleware ensures the injected `EntityManager` resolves to the correct request-scoped fork automatically:

```ts title="app/controllers/articles_controller.ts"
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { EntityManager } from '@mikro-orm/sqlite'
import { ArticleRepository } from '#repositories/article_repository'

@inject()
export default class ArticlesController {
  constructor(
    protected em: EntityManager,
    protected articleRepo: ArticleRepository,
  ) {}

  async index({ request }: HttpContext) {
    const limit = request.input('limit')
    const offset = request.input('offset')
    const { items, total } = await this.articleRepo.listArticles({ limit, offset })
    return { items, total }
  }

  async show({ params }: HttpContext) {
    return this.articleRepo.findOneOrFail({ slug: params.slug }, {
      populate: ['author', 'text'],
    })
  }

  async store(ctx: HttpContext) {
    const article = this.articleRepo.create(ctx.request.body())
    await this.em.flush()
    return article
  }
}
```

## Routes

Register routes in `start/routes.ts` using lazy controller imports:

```ts title="start/routes.ts"
import router from '@adonisjs/core/services/router'

const ArticlesController = () => import('#controllers/articles_controller')

router.get('/article', [ArticlesController, 'index'])
router.get('/article/:slug', [ArticlesController, 'show'])
router.post('/article', [ArticlesController, 'store'])
router.patch('/article/:id', [ArticlesController, 'update'])
router.delete('/article/:id', [ArticlesController, 'destroy'])
```

## Authentication Middleware

Middleware can also inject dependencies directly:

```ts title="app/middleware/auth_middleware.ts"
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { UserRepository } from '#repositories/user_repository'

@inject()
export default class AuthMiddleware {
  constructor(protected userRepo: UserRepository) {}

  async handle(ctx: HttpContext, next: NextFn) {
    const header = ctx.request.header('authorization')

    if (header?.startsWith('Bearer ')) {
      const token = header.slice(7)
      try {
        const payload = verifyJwt(token) // your JWT verification
        ctx.user = await this.userRepo.findOneOrFail(payload.id)
      } catch {
        // ignore invalid tokens
      }
    }

    return next()
  }
}
```

Augment the `HttpContext` type to include your user:

```ts title="app/types.ts"
import type { User } from '#entities/user'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    user?: User
  }
}
```

## Testing

Tests use Japa (AdonisJS's test runner). The MikroORM provider handles schema setup automatically:

```ts title="tests/functional/user.spec.ts"
import { test } from '@japa/runner'

test.group('User', () => {
  test('sign in with valid credentials', async ({ client }) => {
    const response = await client.post('/user/sign-in').json({
      email: 'foo@bar.com',
      password: 'password123',
    })

    response.assertStatus(200)
    response.assertBodyContains({ fullName: 'Foo Bar' })
  })
})
```

## Example

A full working example with users, articles, comments, tags, soft delete, virtual entities, and tests can be found in the [adonis-example-app](https://github.com/mikro-orm/adonis-example-app) repository.
