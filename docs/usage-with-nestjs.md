# Using MikroORM with NestJS framework

## Installation

Fist install the module via `yarn` or `npm` and do not forget to install the database driver as well:

```
$ yarn add mikro-orm mongodb # for mongo
$ yarn add mikro-orm mysql2 # for mysql
$ yarn add mikro-orm sqlite # for sqlite
```

or

```
$ npm i -s mikro-orm mongodb # for mongo
$ npm i -s mikro-orm mysql2 # for mysql
$ npm i -s mikro-orm sqlite # for sqlite
```

## RequestContext middleware

**`mikro-orm.middleware.ts`**

```typescript
import { Injectable, NestMiddleware, MiddlewareFunction } from '@nestjs/common';
import { MikroORM, RequestContext } from 'mikro-orm';

@Injectable()
export class MikroOrmMiddleware implements NestMiddleware {

  constructor(private readonly orm: MikroORM) { }

  resolve(...args: any[]): MiddlewareFunction {
    return (req, res, next) => {
      RequestContext.create(this.orm.em, next);
    };
  }

}
```

## Dependency Injection

```typescript
import { Module } from '@nestjs/common';
import { EntityManager, MikroORM } from 'mikro-orm';
import { MikroOrmMiddleware } from './mikro-orm.middleware';

@Module({
  providers: [
    MikroOrmMiddleware,
    { provide: MikroORM, useFactory: async () => {
      return MikroORM.init({
        entitiesDirs: ['./src/entities'],
        dbName: '...',
      });
    }},
    { provide: EntityManager, useFactory: (orm: MikroORM) => orm.em, inject: [MikroORM] },
    { provide: 'UserRepository', useFactory: (em: EntityManager) => em.getRepository(User.name), inject: [EntityManager] },
  ],
})
export class AppModule {}
```

### @InjectRepository() decorator

```typescript
import { Inject } from '@nestjs/common';
export const InjectRepository = (entity: any) => Inject(`${entity.name}Repository`);
```

and use it like this:

```typescript
constructor(
  @InjectRepository(File) 
  private readonly fileRepository: EntityRepository<File>
) { }
```
