---
slug: mikro-orm-6-4-released
title: 'MikroORM 6.4'
authors: [B4nan]
tags: [typescript, javascript, node, sql]
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

> The method needs to be async even if you do not use `await` inside it. Before it resolves, `flush` is called automatically on the EntityManager fork, just like when using `em.transactional()`.

## Upserting managed entities

Upsert had one surprising behavior: if you tried to run it on a managed entity (one already loaded into the current context), the call was interpreted as `em.assign`, and an explicit `flush` was required to persist those changes to the database. This led to confusion when there was no query fired from the `upsert`, as well as weird patterns like always calling `flush` after `upsert`.

Now the upsert query is always issued regardless of the entity being managed or not.

```ts
// load a user into the context
const user1 = await em.findOne(User, 123);

// previously resulted in `em.assign(user1, { id: 123, name: 'Foo' })`,
// now fires the `insert on conflict` query
const user2 = await em.upsert(User, { id: 123, name: 'Foo' });

// identity
console.log(user1 === user2); // true
```

> To opt in to the previous behavior, use `upsertManaged: false` in the ORM config.

## Column prefixing in embeddables

By default, MikroORM names your embedded columns by prefixing them based on the embedded property name. While you were always in control of the prefix, the behavior of nested embeddables was a bit buggy, since the prefix override was considered as absolute. This was rather an omission in the initial design, which is now resolved.

You can use the new `prefixMode` option in your ORM config to opt in to the correct behavior, which is to respect all the levels of nesting and their `prefix` options respectively, concatenating them when computing the final colum name. There are two prefix modes available:

- `absolute` mode (default) sets the prefix at the beginning of the column.
- `relative` mode concatenates the prefix with its parent's prefix. This will be the default in v7.

Consider the following example, where `Address` has a property called `city`:

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

The column for `User.address.city` property will be just `addr_city`, while for `User.address2.city` property with the new `relative` mode, it will be `contact_addr2_city`. 

The default behavior can be defined in the ORM configuration:

```ts
MikroORM.init({
  embeddables: {
    prefixMode: 'relative',
  },
});
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

From the very beginning, you could have multiple ORM instances running in your application, each with a different config. This can be handy in several situations:

- Multitenant setups, where each tenant uses different database credentials.
- You want to use a less privileged account for your application, while for the CLI you need additional permissions (e.g., for altering your schema).
- Your application uses multiple databases (possibly with different drivers).

When it comes to actually using those multiple instances, however, you were always on your own. Any framework integration that wants to let you run multiple instances must also provide you its own means of passing either the config object itself, or a path to a config file to be imported for each instance.

With this release, this is starting to change. A single MikroORM config file can now export a function that dynamically produces a config object based on a name as an argument, or an array with a mix of config objects and functions. Based on a "contextName" option, MikroORM's CLI will pick one of the objects.

Framework integrations will be able to use a similar approach, where they can take your one config file, and create each instance you use based on available config objects and functions.

There is more work to be done to actually make such integrations, but at least there is now a standard way they can rely on, and thus have the framework integration itself "just work".

## App-level `--config` argument deprecated

When you use `MikroORM.init()` without arguments, MikroORM tries to figure out the configuration in a few different ways. As part of this step, the command line arguments of the process (`process.argv`) are checked for an option called "--config" with the value being a path to the config file.

While convenient for those who want this feature, there is no way to opt out of it for those who do not, short of explicitly setting the config. Even worse than that, it can cause conflicts if you intend to use the same argument name for something else. When you hit an error due to this conflict, it can be hard to diagnose if you are not aware of this.

So, in v7, MikroORM will no longer check the command line arguments for the path to the config file. You can still specify a custom path with the config via `MIKRO_ORM_CLI_CONFIG` environment variable, or you can parse the command line yourself and pass the resulting config to the `MikroORM.init()` call explicitly.

Because this change is breaking, and yet subtle enough for users not to realize they're relying on it, in v6.4, MikroORM will log a deprecation warning on the console output if your config is loaded based on the command line arguments. This will let you see if you would be affected by this change in v7.

This change also marks the first time MikroORM has a formal deprecation warnings system. There may be more warnings like this added before v7, or in later releases. Each deprecation warning can be disabled separately, see the [logging section](https://mikro-orm.io/docs/logging#deprecation-warnings) for more details.

## Validation of non-persistent properties

Using `persist: false` on your properties have several use cases, one of them is to define "raw properties" for your relations, e.g. `authorId: number` next to `author: Author`. When doing this, it's important to use `persist: false` on the `authorId` scalar property and not on the relation one, to get proper schema support (if you do it in the opposite way, you won't get any foreign keys generated). Some people rather want to control their schema by hand instead, so they didn't care much about this particular difference.

There are more potential problems with this approach, namely for to-one relations targeting a composite primary key. In that case, if you would keep `persist: false` on the relation property, things would start to malfunction on runtime, as such properties are internally rewritten to `formula` to preserve aliasing, and that only supports working with one column. In other words, you would end up ignoring the rest of the targeted columns in queries using this relation property.

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
