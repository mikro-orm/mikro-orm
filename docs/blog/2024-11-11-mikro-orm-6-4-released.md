---
slug: mikro-orm-6-4-released
title: 'MikroORM 6.4'
authors: [B4nan]
tags: [typescript, javascript, node, sql]
draft: true
---

[MikroORM v6.4](https://github.com/mikro-orm/mikro-orm/releases/tag/v6.4.0) is out. This release brings lots of smaller improvements all over the board, let's talk about some of them!

<!--truncate-->

## `@Transactional()` decorator

First-class support for transactions was always one of the MikroORM's selling points, and it just got better with the addition of the `@Transactional()` decorator. It works similarly to the existing `@CreateRequestContext()` decorator, but wraps the method in an explicit transaction.

```ts
import { EntityManager, MikroORM, Transactional } from '@mikro-orm/core';

export class MyService {

  constructor(private readonly em: EntityManager) { }

  @Transactional()
  async doSomething() {
    //... do some work
    const user = new User();
    user.name = 'George';
    em.persist(user); 
  }

}
```

## Upserting managed entities

Upsert had one surprising behavior: if you tried to run it on a managed entity (one already loaded into the current context), the call was interpreted as `em.assign`, and an explicit `flush` was required to persist those changes to the database. This led to confusion when there was no query fired from the `upsert`, as well as weird patterns like always calling `flush` after `upsert`.

Now the upsert query is always issued regardless of the entity being managed or not.

```ts
// load a user into the context
const user1 = await em.findOne(User, 123);

// previously resulted in `em.assign(user1, { id: 123, name: 'Foo' })`
const user2 = await em.upsert(User, { id: 123, name: 'Foo' });

// identity
console.log(user1 === user2); // true
```

> To opt in to the previous behavior, use `upsertManaged: false` in the ORM config.

## Column prefixing in embeddables

By default, MikroORM names your columns by prefixing them, using the value object name.

Following the example above, your columns would be named as `address_street`, `address_postal_code`...

You can change this behavior to meet your needs by changing the `prefix` attribute in the `@Embedded()` notation.

The following example shows you how to set your prefix to `myPrefix_`:

```ts
@Entity()
export class User {

  @Embedded(() => Address, { prefix: 'myPrefix_' })
  address!: Address;

}
```

You can also decide more precisely how the column name is determined with an explicit prefix. With the example below:

- `absolute` mode (default) sets the prefix at the beginning of the **column**, naming them `addr_city`, `addr_street`, ...
- `relative` mode **concatenates** the prefix with its parent's prefix (if any), naming them `contact_addr2_city`, `contact_addr2_street`, ...

:::warning

The default value of `prefixMode` will change in v7 to `relative`, its current default is set to stay compatible with the initial behavior.

:::

```ts
@Embeddable()
export class Contact {

  @Embedded({ entity: () => Address, prefix: 'addr_', prefixMode: 'absolute' })
  address!: Address;

  @Embedded({ entity: () => Address, prefix: 'addr2_', prefixMode: 'relative' })
  address2!: Address;

}

@Entity()
export class User {

  @Embedded(() => Contact)
  contact!: Contact;

}
```

The default behavior can be defined in the ORM configuration:

```ts
MikroORM.init({ embeddables: { prefixMode: 'absolute' } });
```

To have MikroORM drop the prefix and use the value object's property name directly, set `prefix: false`:

```ts
@Embedded({ entity: () => Address, prefix: false })
address!: Address;
```

## `onQuery` hook and observability

Sometimes you might want to alter the generated queries. One use case for that might be adding contextual query hints to allow observability. Before a more native approach is added to the ORM, you can use the `onQuery` hook to modify all the queries by hand. The hook will be fired for every query before its execution.

```ts
import { AsyncLocalStorage } from 'node:async_hooks';

const ctx = new AsyncLocalStorage();

// provide the necessary data to the store in some middleware
app.use((req, res, next) => {
  const store = { endpoint: req.url };
  ctx.run(store, next);
});

MikroORM.init({
  onQuery: (sql: string, params: unknown[]) => {
    const store = ctx.getStore();

    if (!store) {
      return sql;
    }

    // your function that generates the necessary query hint
    const hint = createQueryHint(store);

    return sql + hint;
  },
});
```

## Support for multiple ORM configurations

[//]: # (TODO)

## App-level `--config` argument deprecated

When you use `MikroORM.init()` without arguments, MikroORM tries to figure out the configuration in a few different ways. As part of this step, the command line arguments of the process (`process.argv`) are checked for an option called "--config" with the value being a path to the config file.

While convenient for those who want this feature, there is no way to opt out of it for those who do not, short of explicitly setting the config. Even worse than that, it can cause conflicts if you intend to use the same argument name for something else. When you hit an error due to this conflict, it can be hard to diagnose if you are not aware of this.

So, in v7, MikroORM will no longer check the command line arguments for the path to the config file. You can still specify a custom path with the config via `MIKRO_ORM_CLI_CONFIG` environment variable, or you can parse the command line yourself and pass the resulting config to the `MikroORM.init()` call explicitly.

Because this change is breaking, and yet subtle enough for users not to realize they're relying on it, in v6.4, MikroORM will log a deprecation warning on the console output if your config is loaded based on the command line arguments. This will let you see if you would be affected by this change in v7.

This change also marks the first time MikroORM has a formal deprecation warnings system. There may be more warnings like this added before v7, or in later releases. Each deprecation warning can be disabled separately, see the [logging section](https://mikro-orm.io/docs/logging#deprecation-warnings) for more details.

## Validation of non-persistent properties

Using `persist: false` on your properties have several use cases, one of them is to define "raw properties" for your relations, e.g. `authorId: number` next to `author: Author`. When doing this, it's important to use `persist: false` on the `authorId` scalar property and not on the relation one, to get proper schema support (if you do it in the opposite way, you won't get any foreign keys generated). But many people rather want to control their schema by hand instead, so they didn't care much about this particular difference. There are more potential problems with this approach, namely for to-one relations targeting a composite primary key. In that case, if you would keep `persist: false` on the relation property, things would start to malfunction on runtime, as such properties are internally rewritten to `formula` to preserve aliasing, and that only supports working with one column. In other words, you would end up ignoring the rest of the targeted columns in queries using this relation property.

Imagine this example:

```ts
@Entity()
class User {
  
  @PrimaryKey()
  email: string;

  @PrimaryKey()
  tenant: string;

}

// bad, will fail the validation now
@Entity()
class Resource {

  @PrimaryKey()
  id: number;

  @ManyToOne(() => User, { persist: false })
  owner: User;

  @Property()
  ownerEmail: string;

  @Property()
  ownerTenant: string;

}

// good, works as expected
@Entity()
class Resource {

  @PrimaryKey()
  id: number;

  @ManyToOne(() => User)
  owner: User;

  @Property({ persist: false })
  ownerEmail: string;

  @Property({ persist: false })
  ownerTenant: string;

}
```

This is now validated, and such entity definition will cause an error during entity discovery. You can opt out of this validation via `checkNonPersistentCompositeProps` discovery option. We might enforce this for non-composite relations too in v7.

## Renamed `tsNode` option to `preferTs`

One small change to wrap this up - the `tsNode` option is now renamed to `preferTs`, to reflect better what it is actually about. Its name could give people a false sense of it enabling `ts-node`, or TypeScript support in general. Yet all it does is forcing the ORM to use the TypeScript related options for folder-based entity discovery (`entitiesTs`) and for migrations and seeders folder (`pathTs`) when they provided. Its value is normally automatically detected, but this can sometimes fail, or you might want to set its value to `false` for production builds.

## What do you think?

So those were some highlights from the new version. There are many other improvements as well as lots of bug fixes, so be sure to check the [full changelog](https://github.com/mikro-orm/mikro-orm/releases/tag/v6.4.0) too, and let us know what you think about it in the comments!
