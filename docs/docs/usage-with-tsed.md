---
title: Using MikroORM with Ts.ED framework
sidebar_label: Usage with Ts.ED
---

## Installation

Easiest way to integrate MikroORM to Ts.ED is via [`@tsed/mikro-orm` module](https://tsed.io/tutorials/mikroorm.html).
Simply install it next to Ts.ED, MikroORM and underlying driver: 

```bash
$ yarn add @mikro-orm/core @tsed/mikro-orm @mikro-orm/mongodb     # for mongo
$ yarn add @mikro-orm/core @tsed/mikro-orm @mikro-orm/mysql       # for mysql/mariadb
$ yarn add @mikro-orm/core @tsed/mikro-orm @mikro-orm/mariadb     # for mysql/mariadb
$ yarn add @mikro-orm/core @tsed/mikro-orm @mikro-orm/postgresql  # for postgresql
$ yarn add @mikro-orm/core @tsed/mikro-orm @mikro-orm/sqlite      # for sqlite
```

or

```bash
$ npm i -s @mikro-orm/core @tsed/mikro-orm @mikro-orm/mongodb     # for mongo
$ npm i -s @mikro-orm/core @tsed/mikro-orm @mikro-orm/mysql       # for mysql/mariadb
$ npm i -s @mikro-orm/core @tsed/mikro-orm @mikro-orm/mariadb     # for mysql/mariadb
$ npm i -s @mikro-orm/core @tsed/mikro-orm @mikro-orm/postgresql  # for postgresql
$ npm i -s @mikro-orm/core @tsed/mikro-orm @mikro-orm/sqlite      # for sqlite
```

Once the installation process is completed, we can import the `MikroOrmModule` into the `Server` configuration:

```typescript
import { Configuration } from '@tsed/di';
import { MikroOrmModule } from '@tsed/mikro-orm';

@Module({
  imports: [MikroOrmModule],
  mikroOrm: [
    {
      contextName: 'default',
      type: 'postgres',
      ...,

      entities: [
        './src/entity/*{.ts,.js}',
      ]
    },
    {
      contextName: 'mongo',
      type: 'mongo',
      ...
    }
  ]
})
export class Server {}
```

The `mikroOrm` options accepts the same configuration object as `init()` from the MikroORM package. Check [this page](configuration.md) for the complete configuration documentation.

## Obtain ORM instance

`@Orm` decorator lets you retrieve an instance of MikroOrm.

```ts
import { Injectable } from '@tsed/di';
import { Orm } from '@tsed/mirkro-orm';

@Injectable()
export class MyService {
  @Orm()
  private readonly orm!: MikroORM;

  async create(user: User): Promise<User> {

    // do something
    // ...
    // Then save
    await this.orm.em.persistAndFlush(user);
    console.log('Saved a new user with id: ' + user.id);

    return user;
  }

  async find(): Promise<User[]> {
    const users = await this.orm.em.find(User, {});
    console.log('Loaded users: ', users);

    return users;
  }
}
```

It's also possible to inject an ORM instance by its name:

```ts
import { Injectable } from '@tsed/di';
import { Orm } from '@tsed/mirkro-orm';

@Injectable()
export class MyService {
  @Orm('mongo')
  private readonly orm!: MikroORM;
}
```

## Use Entity with Controller

To begin, we need to define an Entity MikroORM to define a model:

```typescript
import { Entity, Property, PrimaryKey, Property } from '@mikro-orm/core';
import { Required } from '@tsed/schema';

@Entity()
export class User {
  @PrimaryKey()
  @Required()
  id: number;

  @Property()
  @MaxLength(100)
  @Required()
  firstName: string;

  @Property()
  @MaxLength(100)
  @Required()
  lastName: string;

  @Required()
  @Mininum(0)
  @Maximum(100)
  age: number;
}
```

Now, the model is correctly defined and can be used with a [Controller](https://tsed.io/docs/controllers.html).
Extra Ts.ED decorators are available to validate model and/or generate Swagger document. See more details on the dedicated 
documentation page [here](https://tsed.io/docs/model.html).

We can use this model with a Controller like that:

```typescript
import { Controller, Post, BodyParams, Inject, Post, Get } from '@tsed/common';

@Controller('/users')
export class UsersCtrl {
  @Inject()
  private usersService: UsersService;

  @Post('/')
  create(@BodyParams() user: User): Promise<User> {
    return this.usersService.create(user);
  }

  @Get('/')
  getList(): Promise<User[]> {
    return this.usersService.find();
  }
}
```

## Obtain EntityManager

`@EntityManager` and `@Em` decorators lets you retrieve an instance of EntityManager.

```typescript
import { Injectable } from '@tsed/di';
import { Em } from '@tsed/mikro-orm';
import { EntityManager } from '@mikro-orm/mysql'; // Import EntityManager from your driver package or `@mikro-orm/knex`

@Injectable()
export class UsersService {
  @Em()
  private readonly em!: EntityManager;

  async create(user: User): Promise<User> {
    await this.em.persistAndFlush(user);
    console.log('Saved a new user with id: ' + user.id);

    return user;
  }
}
```

It's also possible to inject Entity manager by his connection name:

```typescript
import { Injectable } from '@tsed/di';
import { Em } from '@tsed/mikro-orm';
import { EntityManager } from '@mikro-orm/mysql'; // Import EntityManager from your driver package or `@mikro-orm/knex`

@Injectable()
export class UsersService {
  @Em('connectionName')
  private readonly em!: EntityManager;

  async create(user: User): Promise<User> {
    await this.em.persistAndFlush(user);
    console.log('Saved a new user with id: ' + user.id);

    return user;
  }
}
```

> Notice that the `EntityManager` is imported from the `@mikro-orm/driver` package, where driver is `mysql`, `sqlite`, `postgres` or what driver you are using.
>
> In case you have `@mikro-orm/mysql` installed as a dependency, you can also import the `EntityManager` from there.

## Transactions and Request context

As mentioned in the [docs](https://mikro-orm.io/docs/identity-map), we need to isolate a state for each request. That is
handled automatically thanks to the `AsyncLocalStorage` registered via interceptor.

We can use the `@Transactional()` decorator, which will register a new request context for your method and execute it
inside the context.

```typescript
import { Controller, Post, BodyParams, Inject, Get } from '@tsed/common';
import { Transactional } from '@tsed/mikro-orm';

@Controller('/users')
export class UsersCtrl {
  @Inject()
  private usersService: UsersService;

  @Post('/')
  @Transactional()
  create(@BodyParams() user: User): Promise<User> {
    return this.usersService.create(user);
  }

  @Get('/')
  getList(): Promise<User[]> {
    return this.usersService.find();
  }
}
```
