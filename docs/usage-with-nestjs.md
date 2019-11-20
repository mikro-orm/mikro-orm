---
---

# Using MikroORM with NestJS framework

## Installation

Easiest way to integrate MikroORM to Nest is via [`nestjs-mikro-orm` module](https://github.com/dario1985/nestjs-mikro-orm).
Simply install it next to Nest, MikroORM and underlying driver: 

```
$ yarn add mikro-orm nestjs-mikro-orm mongodb # for mongo
$ yarn add mikro-orm nestjs-mikro-orm mysql2  # for mysql
$ yarn add mikro-orm nestjs-mikro-orm pg      # for postgre
$ yarn add mikro-orm nestjs-mikro-orm sqlite3 # for sqlite
```

or

```
$ npm i -s mikro-orm nestjs-mikro-orm mongodb # for mongo
$ npm i -s mikro-orm nestjs-mikro-orm mysql2  # for mysql
$ npm i -s mikro-orm nestjs-mikro-orm pg      # for postgre
$ npm i -s mikro-orm nestjs-mikro-orm sqlite3 # for sqlite
```

Then import the `MikroOrmModule` in your top level module (usually called `AppModule`) via 
`forRoot()`, which will register `MikroORM` and `EntityManager` services. It will also 
create the request context for you automatically.

```typescript
@Module({
  imports: [
    MikroOrmModule.forRoot({
      entitiesDirs: ['dist/entities'],
      entitiesDirsTs: ['src/entities'],
      dbName: 'my-db-name.sqlite3',
      type: 'sqlite',
      autoFlush: false, // read more here: https://mikro-orm.io/unit-of-work/
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

[&larr; Back to table of contents](index.md#table-of-contents)
