---
title: Using MikroORM with NestJS framework
sidebar_label: Usage with NestJS
---

## Installation

Easiest way to integrate MikroORM to Nest is via [`@mikro-orm/nestjs` module](https://github.com/mikro-orm/nestjs).
Simply install it next to Nest, MikroORM and underlying driver: 

```
yarn add @mikro-orm/core @mikro-orm/nestjs @mikro-orm/mongodb       # for mongo
yarn add @mikro-orm/core @mikro-orm/nestjs @mikro-orm/mysql         # for mysql
yarn add @mikro-orm/core @mikro-orm/nestjs @mikro-orm/postgresql    # for postgre
yarn add @mikro-orm/core @mikro-orm/nestjs @mikro-orm/sqlite        # for sqlite
```

or

```
npm i -s @mikro-orm/core @mikro-orm/nestjs @mikro-orm/mongodb       # for mongo
npm i -s @mikro-orm/core @mikro-orm/nestjs @mikro-orm/mysql         # for mysql
npm i -s @mikro-orm/core @mikro-orm/nestjs @mikro-orm/postgresql    # for postgre
npm i -s @mikro-orm/core @mikro-orm/nestjs @mikro-orm/sqlite        # for sqlite
```

Then import the `MikroOrmModule` in your top level module (usually called `AppModule`) via 
`forRoot()`, which will register `MikroORM` and `EntityManager` services. It will also 
create the request context for you automatically.

```typescript
@Module({
  imports: [
    MikroOrmModule.forRoot({
      entities: ['dist/**/*.entity.js'], // compiled JS files
      entitiesTs: ['src/**/*.entity.ts'], // TS source files
      dbName: 'my-db-name.sqlite3',
      type: 'sqlite',
    }),
    // ... your feature modules
  ],
})
export class AppModule {}
```

Then use `forFeature()` to register entity repositories at feature module level:

```typescript
@Module({
  imports: [MikroOrmModule.forFeature([Photo])],
  providers: [PhotoService],
  controllers: [PhotoController],
})
export class PhotoModule {}
```

> Don't forget to import the feature module in your top level module.
