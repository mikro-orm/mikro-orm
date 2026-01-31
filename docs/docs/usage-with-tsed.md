---
title: Using MikroORM with Ts.ED framework
sidebar_label: Usage with Ts.ED
---

## Installation

:::info
[@tsed/mikro-orm](https://tsed.dev/tutorials/mikroorm.html) is a third party package and is not managed by the MikroORM core team. 
Please report any issues found with the library in the [appropriate repository](https://github.com/tsedio/tsed).
:::

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
import { AfterRoutesInit } from '@tsed/platform-http';
import { Injectable } from '@tsed/di';
import { Orm } from '@tsed/mikro-orm';
import { MikroORM } from '@mikro-orm/core';

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
import { Orm } from '@tsed/mikro-orm';

@Injectable()
export class MyService {
  @Orm('mongo')
  private readonly orm!: MikroORM;
}
```

## Use Entity with Controller

To begin, we need to define an Entity MikroORM to define a model:

```typescript
import { Entity, Property, PrimaryKey } from '@mikro-orm/core';
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

Now, the model is correctly defined and can be used with a [Controller](https://tsed.dev/docs/controllers.html).
Extra Ts.ED decorators are available to validate model and/or generate Swagger document. See more details on the dedicated 
documentation page [here](https://tsed.dev/docs/model.html).

We can use this model with a Controller like that:

```typescript
import {Post, Post, Get} from '@tsed/schema';
import {Controller, Inject} from '@tsed/di';
import {BodyParams} from '@tsed/platform-params';

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


## Use Entity with Controller

To begin, we need to define an Entity MikroORM like this and use Ts.ED Decorator to define the JSON Schema.

```typescript
import { MaxLength, Required } from '@tsed/schema';
import { Entity, Property, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class User {
  @PrimaryKey()
  @Required()
  id!: number;

  @Column()
  @MaxLength(100)
  @Required()
  firstName!: string;

  @Column()
  @MaxLength(100)
  @Required()
  lastName!: string;

  @Column()
  @Mininum(0)
  @Maximum(100)
  age!: number;
}
```

Now, the model is correctly defined and can be used with a [Controller](https://tsed.dev/docs/controllers.html)
, [AJV validation](https://tsed.dev/tutorials/ajv.html),
[Swagger](https://tsed.dev/tutorials/swagger.html) and [MikroORM](https://mikro-orm.io/docs/defining-entities).

We can use this model with a Controller like that:

```typescript
import { Post, Post, Get } from '@tsed/schema';
import { Controller, Inject } from '@tsed/di';
import { BodyParams } from '@tsed/platform-params';

@Controller('/users')
export class UsersCtrl {
  @Inject()
  private readonly usersService!: UsersService;

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

## Transactions and Request context

As mentioned in the [docs](https://mikro-orm.io/docs/identity-map), we need to isolate a state for each request. That is
handled automatically thanks to the `AsyncLocalStorage` registered via interceptor.

We can use the `@Transactional()` decorator, which will register a new request context for your method and execute it
inside the context.

```typescript
import { Post, Post, Get } from '@tsed/schema';
import { Controller, Inject } from '@tsed/di';
import { BodyParams } from '@tsed/platform-params';
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

## Retry policy

By default, `IsolationLevel.READ_COMMITTED` is used. You can override it, specifying the isolation level for the transaction by supplying it as the `isolationLevel` parameter in the `@Transactional` decorator:

```typescript
import { Post } from '@tsed/schema';
import { Controller } from '@tsed/di';
import { BodyParams } from '@tsed/platform-params';
import { Transactional } from '@tsed/mikro-orm';

@Controller('/users')
class UsersController {
  @Post('/')
  @Transactional({ isolationLevel: IsolationLevel.SERIALIZABLE })
  create(@BodyParams() user: User): Promise<User> {
    return this.usersService.create(user);
  }
}
```

The MikroORM supports the standard isolation levels such as `SERIALIZABLE` or `REPEATABLE READ`, the full list of available options see [here](https://mikro-orm.io/docs/transactions#isolation-levels).

You can also set the [flushing strategy](https://mikro-orm.io/docs/unit-of-work#flush-modes) for the transaction by setting the `flushMode`:

```typescript
import { Post } from '@tsed/schema';
import { Controller } from '@tsed/di';
import { BodyParams } from '@tsed/platform-params';
import { Transactional } from '@tsed/mikro-orm';

@Controller('/users')
class UsersController {
  @Post('/')
  @Transactional({ flushMode: FlushMode.AUTO })
  create(@BodyParams() user: User): Promise<User> {
    return this.usersService.create(user);
  }
}
```

In some cases, you might need to avoid an explicit transaction, but preserve an async context to prevent the usage of the global identity map. For example, starting with v3.4, the MongoDB driver supports transactions. Yet, you have to use a replica set, otherwise, the driver will raise an exception.

To prevent `@Transactional()` use of an explicit transaction, you just need to set the `disabled` field to `true`:

```typescript
import { Post } from '@tsed/schema';
import { Controller } from '@tsed/di';
import { BodyParams } from '@tsed/platform-params';
import { Transactional } from '@tsed/mikro-orm';

@Controller('/users')
class UsersController {
  @Post('/')
  @Transactional({ disabled: true })
  create(@BodyParams() user: User): Promise<User> {
    return this.usersService.create(user);
  }
}
```

By default, the automatic retry policy is disabled. You can implement your own to match the business requirements and the nature of the failure. For some noncritical operations, it is better to fail as soon as possible rather than retry a coupe of times. For example, in an interactive web application, it is better to fail right after a smaller number of retries with only a short delay between retry attempts, and display a message to the user (for example, "please try again later").

The `@Transactional()` decorator allows you to enable a retry policy for the particular resources. You just need to implement the `RetryStrategy` interface and use `registerProvider()` or `@OverrideProvider()` to register it in the IoC container. Below you can find an example to handle occurred optimistic locks based on [an exponential backoff retry strategy](https://en.wikipedia.org/wiki/Exponential_backoff).

```typescript
import { OptimisticLockError } from '@mikro-orm/core';
import { RetryStrategy } from '@tsed/mikro-orm';
import { OverrideProvider } from '@tsed/di';
import { setTimeout } from 'timers/promises';

@OverrideProvider(RetryStrategy)
export class ExponentialBackoff implements RetryStrategy {
  private readonly maxDepth = 3;
  private depth = 0;

  public async acquire<T extends (...args: unknown[]) => unknown>(task: T): Promise<ReturnType<T>> {
    try {
      return (await task()) as ReturnType<T>;
    } catch (e) {
      if (this.shouldRetry(e as Error) && this.depth < this.options.maxDepth) {
        return this.retry(task);
      }

      throw e;
    }
  }

  private shouldRetry(error: Error): boolean {
    return error instanceof OptimisticLockError;
  }

  private async retry<T extends (...args: unknown[]) => unknown>(task: T): Promise<ReturnType<T>> {
    await setTimeout(2 ** this.depth * 50);

    this.depth += 1;

    return this.acquire(task);
  }
}
```

`ExponentialBackoff` invokes passed function recursively is contained in a try/catch block. The method returns control to the interceptor if the call to the `task` function succeeds without throwing an exception. If the `task` method fails, the catch block examines the reason for the failure. If it's optimistic locking the code waits for a short delay before retrying the operation.

Once a retry strategy is implemented, you can enable an automatic retry mechanism using the `@Transactional` decorator like that:

```typescript
import { Post, Post, Get } from '@tsed/schema';
import { Controller, Inject } from '@tsed/di';
import { BodyParams } from '@tsed/platform-params';
import { Transactional } from '@tsed/mikro-orm';

@Controller('/users')
export class UsersCtrl {
  @Inject()
  private readonly usersService!: UsersService;

  @Post('/')
  @Transactional({ retry: true })
  create(@BodyParams() user: User): Promise<User> {
    return this.usersService.create(user);
  }

  @Get('/')
  getList(): Promise<User[]> {
    return this.usersService.find();
  }
}
```

## Managing Lifecycle of Subscribers

With Ts.ED, managing the lifecycle of subscribers registered with MikroORM using the IoC container is simple. To automatically resolve a subscriber's dependencies, you can use the `@Subscriber` decorator as follows:

```typescript
import { EventSubscriber } from '@mikro-orm/core';
import { Subscriber } from '@tsed/mikro-orm';

@Subscriber()
export class SomeSubscriber implements EventSubscriber {
  // ...
}
```

In this example, we register the `SomeSubscriber` subscriber, which is automatically instantiated by the module using the IoC container, allowing you to easily manage the dependencies of your subscribers.

You can also specify the context name for a subscriber to tie it to a particular instance of the ORM:

```typescript
import { EventSubscriber } from '@mikro-orm/core';
import { Subscriber } from '@tsed/mikro-orm';

@Subscriber({ contextName: "mongodb" })
export class SomeSubscriber implements EventSubscriber {
  // ...
}
```

## Transaction Hooks

The transaction hooks allow you to customize the default transaction behavior. These hooks enable you to execute custom code before and after committing data to the database. These transaction hooks provide a flexible way to extend the default transaction behavior and implement advanced patterns such as the Inbox pattern or domain event dispatching.

### BeforeTransactionCommit Hook

The `BeforeTransactionCommit` interface allows you to define hooks that are executed right before committing data to the database. This hook provides a way to modify data within the same transaction context and perform additional operations before the transaction is committed.

To use the `BeforeTransactionCommit` hook, first, you have to implement the `BeforeTransactionCommit` interface:

```typescript
import { BeforeTransactionCommit } from '@tsed/mikro-orm';
import { EntityManager} from '@mikro-orm/core';
import { Injectable } from '@tsed/di';

@Injectable()
export class Hooks implements BeforeTransactionCommit {
  $beforeTransactionCommit(em: EntityManager): Promise<unknown> | unknown {
    // Custom code executed before committing data
  }
}
```

Then just write your code inside the `$beforeTransactionCommit` method. This code will be executed before the transaction is committed.

### AfterTransactionCommit Hook

The `AfterTransactionCommit` interface allows you to define hooks that are executed right after committing data to the database. This hook enables you to execute code after the data is committed, making multiple transactions.

To use the `AfterTransactionCommit` hook, you have to implement the `AfterTransactionCommit` interface:

```typescript
import { AfterTransactionCommit } from '@tsed/mikro-orm';
import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@tsed/di';

@Injectable()
export class Hooks implements AfterTransactionCommit {
  $afterTransactionCommit(em: EntityManager): Promise<unknown> | unknown {
    // Custom code executed after committing data
  }
}
```

It's important to note that when using the `AfterTransactionCommit` hook, you need to handle eventual consistency and compensatory actions in case of failures on your own.
