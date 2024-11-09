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

[//]: # (TODO)

## Renamed `tsNode` option to `preferTs`

[//]: # (TODO)

## Validation of non-persistent properties

[//]: # (TODO)
