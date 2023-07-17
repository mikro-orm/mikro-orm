---
title: Using MikroORM with NestJS framework
sidebar_label: Usage with NestJS
---

## Installation

Easiest way to integrate MikroORM to Nest is via [`@mikro-orm/nestjs` module](https://github.com/mikro-orm/nestjs). Simply install it next to Nest, MikroORM and underlying driver:

```bash
$ yarn add @mikro-orm/core @mikro-orm/nestjs @mikro-orm/mongodb     # for mongo
$ yarn add @mikro-orm/core @mikro-orm/nestjs @mikro-orm/mysql       # for mysql/mariadb
$ yarn add @mikro-orm/core @mikro-orm/nestjs @mikro-orm/mariadb     # for mysql/mariadb
$ yarn add @mikro-orm/core @mikro-orm/nestjs @mikro-orm/postgresql  # for postgresql
$ yarn add @mikro-orm/core @mikro-orm/nestjs @mikro-orm/sqlite      # for sqlite
```

or

```bash
$ npm i -s @mikro-orm/core @mikro-orm/nestjs @mikro-orm/mongodb     # for mongo
$ npm i -s @mikro-orm/core @mikro-orm/nestjs @mikro-orm/mysql       # for mysql/mariadb
$ npm i -s @mikro-orm/core @mikro-orm/nestjs @mikro-orm/mariadb     # for mysql/mariadb
$ npm i -s @mikro-orm/core @mikro-orm/nestjs @mikro-orm/postgresql  # for postgresql
$ npm i -s @mikro-orm/core @mikro-orm/nestjs @mikro-orm/sqlite      # for sqlite
```

Once the installation process is completed, we can import the `MikroOrmModule` into the root `AppModule`.

```ts
@Module({
  imports: [
    MikroOrmModule.forRoot({
      entities: ['./dist/entities'],
      entitiesTs: ['./src/entities'],
      dbName: 'my-db-name.sqlite3',
      type: 'sqlite',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

The `forRoot()` method accepts the same configuration object as `init()` from the MikroORM package. Check [this page](configuration.md) for the complete configuration documentation.

Alternatively we can [configure the CLI](installation.md#setting-up-the-commandline-tool) by creating a configuration file `mikro-orm.config.ts` and then call the `forRoot()` without any arguments. This won't work when you use a build tools that use tree shaking.

```ts
@Module({
  imports: [
    MikroOrmModule.forRoot(),
  ],
  ...
})
export class AppModule {}
```

Afterward, the `EntityManager` will be available to inject across entire project (without importing any module elsewhere).

```ts
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql'; // Import EntityManager from your driver package or `@mikro-orm/knex`

@Injectable()
export class MyService {

  constructor(private readonly orm: MikroORM,
              private readonly em: EntityManager) {
  }

}
```

> Notice that the `EntityManager` is imported from the `@mikro-orm/driver` package, where driver is `mysql`, `sqlite`, `postgres` or whatever driver you are using.
>
> In case you have `@mikro-orm/knex` installed as a dependency, you can also import the `EntityManager` from there.

## Repositories

MikroORM supports the repository design pattern. For every entity we can create a repository. Read the complete [documentation on repositories here](repositories.md). To define which repositories shall be registered in the current scope you can use the `forFeature()` method. For example, in this way:

> You should **not** register your base entities via `forFeature()`, as there are no repositories for those. On the other hand, base entities need to be part of the list in `forRoot()` (or in the ORM config in general).

```ts
// photo.module.ts

@Module({
  imports: [MikroOrmModule.forFeature([Photo])],
  providers: [PhotoService],
  controllers: [PhotoController],
})
export class PhotoModule {}
```

and import it into the root `AppModule`:

```ts
// app.module.ts
@Module({
  imports: [MikroOrmModule.forRoot(...), PhotoModule],
})
export class AppModule {}
```

In this way we can inject the `PhotoRepository` to the `PhotoService` using the `@InjectRepository()` decorator:

```ts
@Injectable()
export class PhotoService {
  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: EntityRepository<Photo>
  ) {}

  // ...
}
```

## Using custom repositories

When using custom repositories, we can get around the need for `@InjectRepository()` decorator by naming our repositories the same way as `getRepositoryToken()` method do:

```ts
export const getRepositoryToken = <T> (entity: EntityName<T>) => `${Utils.className(entity)}Repository`;
```

In other words, as long as we name the repository same was as the entity is called, appending `Repository` suffix, the repository will be registered automatically in the Nest.js DI container.

`**./author.entity.ts**`

```ts
@Entity({ customRepository: () => AuthorRepository })
export class Author {

  // to allow inference in `em.getRepository()`
  [EntityRepositoryType]?: AuthorRepository;

}
```

`**./author.repository.ts**`

```ts
import { EntityRepository } from '@mikro-orm/mysql'; // Import EntityManager from your driver package or `@mikro-orm/knex`

export class AuthorRepository extends EntityRepository<Author> {

  // your custom methods...

}
```

As the custom repository name is the same as what `getRepositoryToken()` would return, we do not need the `@InjectRepository()` decorator anymore:

```ts
@Injectable()
export class MyService {

  constructor(private readonly repo: AuthorRepository) { }

}
```

## Load entities automatically

> `autoLoadEntities` option was added in v4.1.0

Manually adding entities to the entities array of the connection options can be tedious. In addition, referencing entities from the root module breaks application domain boundaries and causes leaking implementation details to other parts of the application. To solve this issue, static glob paths can be used.

Note, however, that glob paths are not supported by webpack, so if you are building your application within a monorepo, you won't be able to use them. To address this issue, an alternative solution is provided. To automatically load entities, set the `autoLoadEntities` property of the configuration object (passed into the `forRoot()` method) to `true`, as shown below:

```ts
@Module({
  imports: [
    MikroOrmModule.forRoot({
      ...
        autoLoadEntities: true,
}),
],
})
export class AppModule {}
```

With that option specified, every entity registered through the `forFeature()` method will be automatically added to the entities array of the configuration object.

> Note that entities that aren't registered through the `forFeature()` method, but are only referenced from the entity (via a relationship), won't be included by way of the `autoLoadEntities` setting.

> Using `autoLoadEntities` also has no effect on the MikroORM CLI - for that we still need CLI config with the full list of entities. On the other hand, we can use globs there, as the CLI won't go through webpack.

## Request scoped handlers in queues

> `@UseRequestContext()` decorator was added in v4.1.0

> Since v5, `@UseRequestContext()` decorator is available in the `@mikro-orm/core` package. It is valid approach not just for nestjs projects.

As mentioned in the [docs](identity-map.md), we need a clean state for each request. That is handled automatically thanks to the `RequestContext` helper registered via middleware.

But middlewares are executed only for regular HTTP request handles, what if we need a request scoped method outside of that? One example of that is queue handlers or scheduled tasks.

We can use the `@UseRequestContext()` decorator. It requires you to first inject the `MikroORM` instance to current context, it will be then used to create the context for you. Under the hood, the decorator will register new request context for your method and execute it inside the context.

> `@UseRequestContext()` should be used only on the top level methods. It should not be nested - a method decorated with it should not call another method that is also decorated with it.

```ts
@Controller()
export class MyService {

  constructor(private readonly orm: MikroORM) { }

  @UseRequestContext()
  async doSomething() {
    // this will be executed in a separate context
  }

}
```

Alternatively we can provide a callback that will return the `MikroORM` instance.

```ts
import { DI } from '..';

export class MyService {

  @UseRequestContext(() => DI.orm)
  async doSomething() {
    // this will be executed in a separate context
  }

}
```

Another thing to look out for how you combine them with other decorators. For example if you use it in combination with NestJS's "[BullJS queues module](https://docs.nestjs.com/techniques/queues)", a safe bet is to extract the part of the code that needs a clean [docs](identity-map.md), either in a new method or inject a separate service.

```ts
@Processor({
  name: 'example-queue',
})
export class MyConsumer {
  constructor(private readonly orm: MikroORM) { }

  @Process()
  async doSomething(job: Job<any>) {
    await this.doSomethingWithMikro();
  }

  @UseRequestContext()
  async doSomethingWithMikro() {
    // this will be executed in a separate context
  }
}
```

As in this case, the `@Process()` decorator expects to receive an executable function, but if we add `@UseRequestContext()` to the handler as well, if `@UseRequestContext()` is executed before `@Process()`, the later will receive `void`.

## Request scoping when using GraphQL

The GraphQL module in NestJS uses `apollo-server-express` which enables `bodyparser` by default. ([source](https://github.com/mikro-orm/mikro-orm/issues/696#issuecomment-669846919)) As mentioned in "[RequestContext helper for DI containers](https://mikro-orm.io/docs/identity-map/#requestcontext-helper-for-di-containers)" this causes issues as the Middleware the NestJS MikroORM module installs needs to be loaded after `bodyparser`. At the same time make sure to disable body-parser in NestJs itself as well.

This can be done by adding bodyparser to your main.ts file

```ts
import { NestFactory } from '@nestjs/core';
import express from 'express';
async function bootstrap() {
 const app = await NestFactory.create(AppModule,{ bodyParser: false });
 app.use(express.json());
 await app.listen(5555);
}
```

And at the same time disabling the bodyparser in the GraphQL Module

```ts
@Module({
 imports: [
   GraphQLModule.forRoot({
     bodyParserConfig: false,
   }),
 ],
})
```

## App shutdown and cleanup

By default, NestJS does not listen for system process termination signals (for example SIGTERM). Because of this, the MikroORM shutdown logic will never executed if the process is terminated, which could lead to database connections remaining open and consuming resources. To enable this, the `enableShutdownHooks` function needs to be called when starting up the application.

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  await app.listen(3000);
}
```

More information about [enableShutdownHooks](https://docs.nestjs.com/fundamentals/lifecycle-events#application-shutdown)

## Multiple Database Connections

You can define multiple database connections by registering multiple `MikroOrmModule` and setting their `contextName`. If you want to use middleware request context you must disable automatic middleware and register `MikroOrmModule` with `forMiddleware()` or use NestJS `Injection Scope`

```typescript
@Module({
  imports: [
    MikroOrmModule.forRoot({
      contextName: 'db1',
      registerRequestContext: false, // disable automatatic middleware
      ...
    }),
    MikroOrmModule.forRoot({
      contextName: 'db2',
      registerRequestContext: false, // disable automatatic middleware
      ...
    }),
    MikroOrmModule.forMiddleware()
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

To access different `MikroORM`/`EntityManager` connections you have to use the new injection tokens `@InjectMikroORM()`/`@InjectEntityManager()` where you are required to pass the `contextName` in:

```ts
@Injectable()
export class MyService {

  constructor(@InjectMikroORM('db1') private readonly orm1: MikroORM,
              @InjectMikroORM('db2') private readonly orm2: MikroORM,
              @InjectEntityManager('db1') private readonly em1: EntityManager,
              @InjectEntityManager('db2') private readonly em2: EntityManager) { }

}
```

When defining your repositories with `forFeature()` method you will need to set which `contextName` you want it registered against:

```typescript
// photo.module.ts

@Module({
  imports: [MikroOrmModule.forFeature([Photo], 'db1')],
  providers: [PhotoService],
  controllers: [PhotoController],
})
export class PhotoModule {}
```

When using the `@InjectRepository` decorator you will also need to pass the `contextName` you want to get it from:

```typescript
@Injectable()
export class PhotoService {
  constructor(
    @InjectRepository(Photo, 'db1')
    private readonly photoRepository: EntityRepository<Photo>
  ) {}

  // ...

}
```

## Serialization caveat

[NestJS built-in serialization](https://docs.nestjs.com/techniques/serialization) relies on [class-transformer](https://github.com/typestack/class-transformer). Since MikroORM wraps every single entity relation in a `Reference` or a `Collection` instance (for type-safety), this will make the built-in `ClassSerializerInterceptor` blind to any wrapped relations. In other words, if you return MikroORM entities from your HTTP or WebSocket handlers, all of their relations will NOT be serialized.

Luckily, MikroORM provides a [serialization API](https://mikro-orm.io/docs/serializing) which can be used in lieu of `ClassSerializerInterceptor`.

```typescript
@Entity()
export class Book {
  @Property({ hidden: true })   // --> Equivalent of class-transformer's `@Exclude`
  hiddenField: number = Date.now();

  @Property({ persist: false }) // --> Will only exist in memory (and will be serialized). Similar to class-transformer's `@Expose()`
  count?: number;

  @ManyToOne({ serializer: value => value.name, serializedName: 'authorName' })   // Equivalent of class-transformer's `@Transform()`
  author: Author;
}
```

## Testing

The `@mikro-orm/nestjs` package exposes `getRepositoryToken()` function that returns prepared token based on a given entity to allow mocking the repository.

> If we register the provider only via `getRepositoryToken()`, we need to use the `@InjectRepository` decorator. To be able to use custom repository without this decorator, we need to register it with `provide: PhotoRepository`. `provide`:

```ts
@Module({
  providers: [
    PhotoService,
    // required for `@InjectRepository` decorator
    {
      provide: getRepositoryToken(Photo),
      useValue: mockedRepository,
    },

    // required for custom repositories if we don't want to use `@InjectRepository`
    {
      provide: PhotoRepository,
      useValue: mockedRepository,
    },
  ],
})
export class PhotoModule {}
```

## Using `AsyncLocalStorage` for request context

:::info

Since v5 `AsyncLocalStorage` is used inside `RequestContext` helper so this section is no longer valid.

:::

In older versions, the `domain` api was used in the `RequestContext` helper. Since `@mikro-orm/core@4.0.3`, we can use the new `AsyncLocalStorage` too, if you are on up to date node version:

```ts
// create new (global) storage instance
const storage = new AsyncLocalStorage<EntityManager>();

@Module({
  imports: [
    MikroOrmModule.forRoot({
      // ...
      registerRequestContext: false, // disable automatic middleware
      context: () => storage.getStore(), // use our AsyncLocalStorage instance
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

// register the request context middleware
const app = await NestFactory.create(AppModule, { ... });

const orm = app.get(MikroORM);
app.use((req, res, next) => {
  storage.run(orm.em.fork({ useContext: true }), next);
});
```

## Using `EventSubscriber`

You should use `@Injectable` and register subscriber manually instead of `@Subscriber` decorator.

```typescript
import { Injectable } from '@nestjs/common';
import { EntityName, EventArgs, EventSubscriber } from '@mikro-orm/core';

@Injectable()
export class AuthorSubscriber implements EventSubscriber<Author> {

  constructor(em: EntityManager) {
    em.getEventManager().registerSubscriber(this);
  }

  getSubscribedEntities(): EntityName<Author>[] {
    return [Author];
  }

  async afterCreate(args: EventArgs<Author>): Promise<void> {
    // ...
  }

  async afterUpdate(args: EventArgs<Author>): Promise<void> {
    // ...
  }

}
```

## Example

A real world example of NestJS with MikroORM can be found [here](https://github.com/mikro-orm/nestjs-realworld-example-app)
