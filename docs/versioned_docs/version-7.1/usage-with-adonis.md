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
import { User } from '#entities/user'
import { ArticleSchema } from '#entities/article'

export default defineConfig({
  dbName: 'sqlite.db',
  entities: [User, ArticleSchema],
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
import { User } from '#entities/user'
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
      return orm.em.getRepository(User)
    })

    this.app.container.singleton(ArticleRepository, async (resolver) => {
      const orm = await resolver.make(MikroORM)
      return orm.em.getRepository(ArticleSchema)
    })
  }

  async boot() {
    const orm = await this.app.container.make(MikroORM)
    // for simplicity, we use `schema.update()` to auto-create/update tables.
    // in production, use `orm.migrator.up()` with proper migrations instead
    await orm.schema.update()
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
    // highlight-next-line
    () => import('#providers/mikro_orm_provider'),
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
  // highlight-next-line
  () => import('#middleware/mikro_orm_middleware'),
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
import { User } from '#entities/user'
import { ArticleRepository } from '#repositories/article_repository'

export const ArticleSchema = defineEntity({
  name: 'Article',
  extends: BaseSchema,
  repository: () => ArticleRepository,
  properties: {
    slug: p.string().unique(),
    title: p.string().index(),
    text: p.text().lazy(),
    author: () => p.manyToOne(User).ref(),
  },
})

export type IArticle = InferEntity<typeof ArticleSchema>
```

### Adding Methods and Hooks

To add custom methods to an entity, extend the generated class via `setClass`. Lifecycle hooks are added via `addHook`:

```ts title="app/entities/user.ts"
import { defineEntity, type EventArgs, p } from '@mikro-orm/core'
import { hash, verify } from 'argon2'
import { BaseSchema } from '#entities/base'

export const UserSchema = defineEntity({
  name: 'User',
  extends: BaseSchema,
  properties: {
    fullName: p.string(),
    email: p.string(),
    password: p.string().hidden().lazy(),
  },
})

export class User extends UserSchema.class {
  async verifyPassword(password: string) {
    return verify(this.password, password)
  }
}

UserSchema.setClass(User)

async function hashPassword(args: EventArgs<User>) {
  const password = args.changeSet?.payload.password

  if (typeof password === 'string') {
    args.entity.password = await hash(password)
  }
}

UserSchema.addHook('beforeCreate', hashPassword)
UserSchema.addHook('beforeUpdate', hashPassword)
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

  async store({ auth, request }: HttpContext) {
    const author = auth.getUserOrFail()
    const { title, text } = request.body()
    const article = this.articleRepo.create({ title, text, author })
    await this.em.flush()
    return article
  }
}
```

## Routes

Register routes in `start/routes.ts` using lazy controller imports. Protected routes use the `auth` middleware:

```ts title="start/routes.ts"
import router from '@adonisjs/core/services/router'
// highlight-next-line
import { middleware } from '#start/kernel'

const ArticlesController = () => import('#controllers/articles_controller')

// public routes
router.get('/article', [ArticlesController, 'index'])
router.get('/article/:slug', [ArticlesController, 'show'])

// protected routes
// highlight-start
router.group(() => {
  router.post('/article', [ArticlesController, 'store'])
  router.patch('/article/:id', [ArticlesController, 'update'])
  router.delete('/article/:id', [ArticlesController, 'destroy'])
}).use(middleware.auth())
// highlight-end
```

## Authentication

Instead of implementing custom JWT authentication, you can use AdonisJS's built-in [`@adonisjs/auth`](https://docs.adonisjs.com/guides/authentication) package with a custom user provider backed by MikroORM. This gives you session-based auth with full framework integration.

### Setup

Install the auth and session packages:

```bash
npm install @adonisjs/auth @adonisjs/session
```

Register the providers in `adonisrc.ts`:

```ts title="adonisrc.ts"
export default defineConfig({
  providers: [
    // ...
    // highlight-start
    () => import('@adonisjs/session/session_provider'),
    () => import('@adonisjs/auth/auth_provider'),
    // highlight-end
    () => import('#providers/mikro_orm_provider'),
  ],
})
```

### User Provider

Implement [`SessionUserProviderContract`](https://v6-docs.adonisjs.com/guides/database/introduction#authentication) to bridge MikroORM with the AdonisJS session guard. The `findById` method uses the `EntityManager`, which resolves to the request-scoped fork via [RequestContext](./identity-map.md#request-context):

```ts title="app/auth/mikro_orm_user_provider.ts"
import { symbols } from '@adonisjs/auth'
import type { SessionGuardUser, SessionUserProviderContract } from '@adonisjs/auth/types/session'
import type { EntityManager } from '@mikro-orm/sqlite'
import { UserSchema, User } from '#entities/user'

export class MikroOrmUserProvider implements SessionUserProviderContract<User> {
  declare [symbols.PROVIDER_REAL_USER]: User

  constructor(private em: EntityManager) {}

  async createUserForGuard(user: User): Promise<SessionGuardUser<User>> {
    return {
      getId() {
        return user.id
      },
      getOriginal() {
        return user
      },
    }
  }

  async findById(identifier: number): Promise<SessionGuardUser<User> | null> {
    const user = await this.em.findOne(UserSchema, identifier)

    if (!user) {
      return null
    }

    return this.createUserForGuard(user as User)
  }
}
```

### Auth Configuration

Configure the session guard with the custom MikroORM provider using `configProvider.create` for lazy resolution:

```ts title="config/auth.ts"
import { defineConfig } from '@adonisjs/auth'
import { sessionGuard } from '@adonisjs/auth/session'
import { configProvider } from '@adonisjs/core'
import { EntityManager } from '@mikro-orm/sqlite'
import type { InferAuthenticators } from '@adonisjs/auth/types'

const authConfig = defineConfig({
  default: 'web',
  guards: {
    web: sessionGuard({
      useRememberMeTokens: false,
      provider: configProvider.create(async (app) => {
        const { MikroOrmUserProvider } = await import('#auth/mikro_orm_user_provider')
        const em = await app.container.make(EntityManager)
        return new MikroOrmUserProvider(em)
      }),
    }),
  },
})

export default authConfig

declare module '@adonisjs/auth/types' {
  interface Authenticators extends InferAuthenticators<typeof authConfig> {}
}
```

### Middleware Stack

Register session and auth middleware in `start/kernel.ts`. The `InitializeAuthMiddleware` adds `ctx.auth` to every request. The named `auth` middleware protects specific routes:

```ts title="start/kernel.ts"
import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

server.errorHandler(() => import('#exceptions/handler'))

server.use([
  () => import('#middleware/container_bindings_middleware'),
  () => import('#middleware/mikro_orm_middleware'),
  // highlight-start
  () => import('@adonisjs/session/session_middleware'),
  () => import('@adonisjs/auth/initialize_auth_middleware'),
  // highlight-end
])

router.use([() => import('@adonisjs/core/bodyparser_middleware')])

// highlight-start
export const middleware = router.named({
  auth: () => import('#middleware/auth_middleware'),
})
// highlight-end
```

The auth middleware uses the framework's `authenticateUsing` method:

```ts title="app/middleware/auth_middleware.ts"
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

export default class AuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: { guards?: (keyof Authenticators)[] } = {}) {
    await ctx.auth.authenticateUsing(options.guards || [ctx.auth.defaultGuard])
    return next()
  }
}
```

### Using Auth in Controllers

Use `ctx.auth` to log users in and access the authenticated user:

```ts title="app/controllers/users_controller.ts"
@inject()
export default class UsersController {
  constructor(protected em: EntityManager, protected userRepo: UserRepository) {}

  async signIn({ request, response, auth }: HttpContext) {
    const { email, password } = request.body()
    const user = await this.userRepo.login(email, password)
    // highlight-next-line
    await auth.use('web').login(user)
    return user
  }

  async profile({ auth }: HttpContext) {
    // highlight-next-line
    return auth.getUserOrFail()
  }
}
```

## Testing

Tests use Japa (AdonisJS's test runner). Register the `sessionApiClient` and `authApiClient` plugins for session-based auth testing:

```ts title="tests/bootstrap.ts"
import { assert } from '@japa/assert'
import { apiClient } from '@japa/api-client'
import app from '@adonisjs/core/services/app'
import type { Config } from '@japa/runner/types'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
// highlight-start
import { authApiClient } from '@adonisjs/auth/plugins/api_client'
import { sessionApiClient } from '@adonisjs/session/plugins/api_client'
// highlight-end
import testUtils from '@adonisjs/core/services/test_utils'

export const plugins: Config['plugins'] = [
  assert(),
  apiClient(),
  pluginAdonisJS(app),
  // highlight-start
  sessionApiClient(app),
  authApiClient(app),
  // highlight-end
]
```

The `authApiClient` plugin adds a `loginAs` helper that authenticates requests via sessions — no manual token handling needed:

```ts title="tests/functional/user.spec.ts"
import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { MikroORM } from '@mikro-orm/sqlite'
import { UserSchema, User } from '#entities/user'

test.group('User', () => {
  test('sign in with valid credentials', async ({ client }) => {
    const response = await client.post('/user/sign-in').json({
      email: 'foo@bar.com',
      password: 'password123',
    })

    response.assertStatus(200)
    response.assertBodyContains({ fullName: 'Foo Bar' })
  })

  test('update profile', async ({ client, assert }) => {
    const orm = await app.container.make(MikroORM)
    const user = await orm.em.fork().findOneOrFail(UserSchema, { email: 'foo@bar.com' })

    // highlight-next-line
    const response = await client.patch('/user/profile').loginAs(user as User).json({
      bio: 'Updated bio text',
    })

    response.assertStatus(200)
    assert.equal(response.body().bio, 'Updated bio text')
  })
})
```

## Example

A full working example with users, articles, comments, tags, soft delete, virtual entities, and tests can be found in the [adonis-example-app](https://github.com/mikro-orm/adonis-example-app) repository.
