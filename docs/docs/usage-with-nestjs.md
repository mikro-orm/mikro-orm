---
title: Using MikroORM with NestJS framework
sidebar_label: Usage with NestJS
---

## Installation

Easiest way to integrate MikroORM to Nest is via [`@mikro-orm/nestjs` module](https://github.com/mikro-orm/nestjs).
Simply install it next to Nest, MikroORM and underlying driver: 

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

```typescript
@Module({
  imports: [
    MikroOrmModule.forRoot({
      entities: ['../dist/entities'],
      entitiesTs: ['../src/entities'],
      dbName: 'my-db-name.sqlite3',
      type: 'sqlite',
      baseDir: __dirname,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

The `forRoot()` method accepts the same configuration object as `init()` from the MikroORM package. 
You can also omit the parameter to use the CLI config.

Afterward, the `EntityManager` will be available to inject across entire project (without importing any module elsewhere).

```ts
@Injectable()
export class MyService {

  constructor(private readonly orm: MikroORM,
              private readonly em: EntityManager) { }

}
```

To define which repositories shall be registered in the current scope you can use the `forFeature()` method. For example, in this way:

> You should **not** register your base entities via `forFeature()`, as there are no
> repositories for those. On the other hand, base entities need to be part of the list
> in `forRoot()` (or in the ORM config in general).

```typescript
// photo.module.ts

@Module({
  imports: [MikroOrmModule.forFeature([Photo])],
  providers: [PhotoService],
  controllers: [PhotoController],
})
export class PhotoModule {}
```

and import it into the root `AppModule`:

```typescript
// app.module.ts
@Module({
  imports: [MikroOrmModule.forRoot(...), PhotoModule],
})
export class AppModule {}
```

In this way we can inject the `PhotoRepository` to the `PhotoService` using the `@InjectRepository()` decorator:

```typescript
@Injectable()
export class PhotoService {
  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: EntityRepository<Photo>
  ) {}

  // ...

}
```

## Auto entities automatically

Manually adding entities to the entities array of the connection options can be 
tedious. In addition, referencing entities from the root module breaks application 
domain boundaries and causes leaking implementation details to other parts of the 
application. To solve this issue, static glob paths can be used.

Note, however, that glob paths are not supported by webpack, so if you are building 
your application within a monorepo, you won't be able to use them. To address this 
issue, an alternative solution is provided. To automatically load entities, set the 
`autoLoadEntities` property of the configuration object (passed into the `forRoot()` 
method) to `true`, as shown below: 

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

With that option specified, every entity registered through the `forFeature()` 
method will be automatically added to the entities array of the configuration 
object.

> Note that entities that aren't registered through the `forFeature()` method, but 
> are only referenced from the entity (via a relationship), won't be included by 
> way of the `autoLoadEntities` setting.

> Using `autoLoadEntities` also has no effect on the MikroORM CLI - for that we 
> still need CLI config with the full list of entities. On the other hand, we can
> use globs there, as the CLI won't go thru webpack.

## Request scoped handlers in queues

As mentioned in the docs, we need a clean state for each request. That is handled
automatically thanks to the `RequestContext` helper registered via middleware. 

But middlewares are executed only for regular HTTP request handles, what if we need
a request scoped method outside of that? One example of that is queue handlers or 
scheduled tasks. 

We can use the `@UseRequestContext()` decorator. It requires you to first inject the
`MikroORM` instance to current context, it will be then used to create the context 
for you. Under the hood, the decorator will register new request context for your 
method and execute it inside the context. 

```ts
@Injectable()
export class MyService {

  constructor(private readonly orm: MikroORM) { }

  @UseRequestContext()
  async doSomething() {
    // this will be executed in a separate context
  }

}
```

## Using `AsyncLocalStorage` for request context

By default, `domain` api use used in the `RequestContext` helper. Since `@mikro-orm/core@4.0.3`,
you can use the new `AsyncLocalStorage` too, if you are on up to date node version:

```typescript
// create new (global) storage instance
const storage = new AsyncLocalStorage<EntityManager>();

@Module({
  imports: [
    MikroOrmModule.forRoot({
      // ...
      registerRequestContext: false, // disable automatatic middleware
      context: () => storage.getStore(), // use our AsyncLocalStorage instance
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

// register the request context middleware
const app = await NestFactory.create(AppModule, { ... });

app.use((req, res, next) => {
  storage.run(orm.em.fork(true, true), next);
});
```

## Using custom repositories

When using custom repositories, we can get around the need for `@InjectRepository()`
decorator by naming our repositories the same way as `getRepositoryToken()` method do:

```ts
export const getRepositoryToken = <T> (entity: EntityName<T>) => `${Utils.className(entity)}Repository`;
```

In other words, as long as we name the repository same was as the entity is called, 
appending `Repository` suffix, the repository will be registered automatically in 
the Nest.js DI container.

`**./author.entity.ts**`

```ts
@Entity()
export class Author {

  // to allow inference in `em.getRepository()`
  [EntityRepositoryType]?: AuthorRepository;

}
```

`**./author.repository.ts**`

```ts
@Repository(Author)
export class AuthorRepository extends EntityRepository<Author> {

  // your custom methods...

}
```

As the custom repository name is the same as what `getRepositoryToken()` would
return, we do not need the `@InjectRepository()` decorator anymore:

```ts
@Injectable()
export class MyService {

  constructor(private readonly repo: AuthorRepository) { }

}
```

## Testing

The `nestjs-mikro-orm` package exposes `getRepositoryToken()` function that returns prepared token based on a given entity to allow mocking the repository.

```typescript
@Module({
  providers: [
    PhotoService,
    {
      provide: getRepositoryToken(Photo),
      useValue: mockedRepository,
    },
  ],
})
export class PhotoModule {}
```
## Description

The [MikroORM](https://github.com/mikro-orm/mikro-orm) module for [NestJS](https://github.com/nestjs/nest).

## 🚀 Quick Start

First install the module via `yarn` or `npm` and do not forget to install the database driver as well:

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

```typescript
@Module({
  imports: [
    MikroOrmModule.forRoot({
      entities: ['../dist/entities'],
      entitiesTs: ['../src/entities'],
      dbName: 'my-db-name.sqlite3',
      type: 'sqlite',
      baseDir: __dirname,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

The `forRoot()` method accepts the same configuration object as `init()` from the MikroORM package. 
You can also omit the parameter to use the CLI config.

Afterward, the `EntityManager` will be available to inject across entire project (without importing any module elsewhere).

```ts
@Injectable()
export class MyService {

  constructor(private readonly orm: MikroORM,
              private readonly em: EntityManager) { }

}
```

To define which repositories shall be registered in the current scope you can use the `forFeature()` method. For example, in this way:

> You should **not** register your base entities via `forFeature()`, as there are no
> repositories for those. On the other hand, base entities need to be part of the list
> in `forRoot()` (or in the ORM config in general).

```typescript
// photo.module.ts

@Module({
  imports: [MikroOrmModule.forFeature([Photo])],
  providers: [PhotoService],
  controllers: [PhotoController],
})
export class PhotoModule {}
```

and import it into the root `AppModule`:

```typescript
// app.module.ts
@Module({
  imports: [MikroOrmModule.forRoot(...), PhotoModule],
})
export class AppModule {}
```

In this way we can inject the `PhotoRepository` to the `PhotoService` using the `@InjectRepository()` decorator:

```typescript
@Injectable()
export class PhotoService {
  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: EntityRepository<Photo>
  ) {}

  // ...

}
```

## Auto entities automatically

Manually adding entities to the entities array of the connection options can be 
tedious. In addition, referencing entities from the root module breaks application 
domain boundaries and causes leaking implementation details to other parts of the 
application. To solve this issue, static glob paths can be used.

Note, however, that glob paths are not supported by webpack, so if you are building 
your application within a monorepo, you won't be able to use them. To address this 
issue, an alternative solution is provided. To automatically load entities, set the 
`autoLoadEntities` property of the configuration object (passed into the `forRoot()` 
method) to `true`, as shown below: 

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

With that option specified, every entity registered through the `forFeature()` 
method will be automatically added to the entities array of the configuration 
object.

> Note that entities that aren't registered through the `forFeature()` method, but 
> are only referenced from the entity (via a relationship), won't be included by 
> way of the `autoLoadEntities` setting.

> Using `autoLoadEntities` also has no effect on the MikroORM CLI - for that we 
> still need CLI config with the full list of entities. On the other hand, we can
> use globs there, as the CLI won't go thru webpack.

## Request scoped handlers in queues

As mentioned in the docs, we need a clean state for each request. That is handled
automatically thanks to the `RequestContext` helper registered via middleware. 

But middlewares are executed only for regular HTTP request handles, what if we need
a request scoped method outside of that? One example of that is queue handlers or 
scheduled tasks. 

We can use the `@UseRequestContext()` decorator. It requires you to first inject the
`MikroORM` instance to current context, it will be then used to create the context 
for you. Under the hood, the decorator will register new request context for your 
method and execute it inside the context. 

```ts
@Injectable()
export class MyService {

  constructor(private readonly orm: MikroORM) { }

  @UseRequestContext()
  async doSomething() {
    // this will be executed in a separate context
  }

}
```

## Using `AsyncLocalStorage` for request context

By default, `domain` api use used in the `RequestContext` helper. Since `@mikro-orm/core@4.0.3`,
you can use the new `AsyncLocalStorage` too, if you are on up to date node version:

```typescript
// create new (global) storage instance
const storage = new AsyncLocalStorage<EntityManager>();

@Module({
  imports: [
    MikroOrmModule.forRoot({
      // ...
      registerRequestContext: false, // disable automatatic middleware
      context: () => storage.getStore(), // use our AsyncLocalStorage instance
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

// register the request context middleware
const app = await NestFactory.create(AppModule, { ... });

app.use((req, res, next) => {
  storage.run(orm.em.fork(true, true), next);
});
```

## Using custom repositories

When using custom repositories, we can get around the need for `@InjectRepository()`
decorator by naming our repositories the same way as `getRepositoryToken()` method do:

```ts
export const getRepositoryToken = <T> (entity: EntityName<T>) => `${Utils.className(entity)}Repository`;
```

In other words, as long as we name the repository same was as the entity is called, 
appending `Repository` suffix, the repository will be registered automatically in 
the Nest.js DI container.

`**./author.entity.ts**`

```ts
@Entity()
export class Author {

  // to allow inference in `em.getRepository()`
  [EntityRepositoryType]?: AuthorRepository;

}
```

`**./author.repository.ts**`

```ts
@Repository(Author)
export class AuthorRepository extends EntityRepository<Author> {

  // your custom methods...

}
```

As the custom repository name is the same as what `getRepositoryToken()` would
return, we do not need the `@InjectRepository()` decorator anymore:

```ts
@Injectable()
export class MyService {

  constructor(private readonly repo: AuthorRepository) { }

}
```

## Testing

The `nestjs-mikro-orm` package exposes `getRepositoryToken()` function that returns prepared token based on a given entity to allow mocking the repository.

```typescript
@Module({
  providers: [
    PhotoService,
    {
      provide: getRepositoryToken(Photo),
      useValue: mockedRepository,
    },
  ],
})
export class PhotoModule {}
```
