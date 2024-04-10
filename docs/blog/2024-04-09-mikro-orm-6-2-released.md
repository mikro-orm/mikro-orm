---
slug: mikro-orm-6-2-released
title: 'MikroORM 6.2: Say hello to SQL Server (and libSQL)'
author: Martin Adámek
authorTitle: Author of MikroORM
authorURL: https://github.com/B4nan
authorImageURL: https://avatars1.githubusercontent.com/u/615580?s=460&v=4
authorTwitter: B4nan
tags: [typescript, javascript, node, sql]
---

I am pleased to announce [MikroORM v6.2](https://github.com/mikro-orm/mikro-orm/releases/tag/v6.2.0). This release is special, after a very long time, two new SQL drivers are added, namely the Microsoft SQL Server (`@mikro-orm/mssql` package) and libSQL driver (`@mikro-orm/libsql` package). And there is more!

<!--truncate-->

## New drivers

Adding the new **Microsoft SQL Server** support was far away from a simple task. In fact, it took almost 4 years to finish it, and a huge part of it was implemented by [Michael Walters](https://github.com/UTGuy), so let me use this opportunity thank him again!

Please note that there were many differences in how SQL Server works, both runtime wise and schema wise, and some things might not fully work, namely:

- UUID values are returned in upper case
- cycles in cascade paths are not supported
- schema diffing capabilities are limited
- no native support for fulltext search
- upsert support is limited

The second driver for **libSQL** was a much easier thing to achieve, as the libSQL driver has the exact same interface as the already existing better-sqlite driver. You should be able to use this new driver with the [Turso database](https://turso.tech/). The internals for SQLite drivers were also refactored, so it should be straightforward to create more third party drivers that use SQLite - [just check](https://github.com/mikro-orm/mikro-orm/tree/master/packages/libsql/src) how much code the `libSQL` driver actually has.

## Serialization groups

Explicit serialization now supports a new `groups` option, inspired by the [`class-transformer`](https://github.com/typestack/class-transformer) package. 

Let's consider the following entity:

```ts
@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  username!: string;

  @Property({ groups: ['public', 'private'] })
  name!: string;

  @Property({ groups: ['private'] })
  email!: string;

}
```

Now when you call `serialize()`:
- without the `groups` option, you get all the properties
- with `groups: ['public']` you get `id`, `username` and `name` properties
- with `groups: ['private']` you get `id`, `username`, `name` and `email` properties
- with `groups: []` you get only the `id` and `username` properties (those without groups)

```ts
const dto1 = serialize(user);
// User { id: 1, username: 'foo', name: 'Jon', email: 'jon@example.com' }

const dto2 = serialize(user, { groups: ['public'] });
// User { id: 1, username: 'foo', name: 'Jon' }
```

## Better type-safety for custom types

When your custom type maps a value to an object, it might break the internal types like in `em.create()`, as there is no easy way to detect whether some object type is an entity or something else. In those cases, it can be handy to use `IType` to provide more information about your type on the type-level. It has three arguments, the first represents the runtime type, the second one is the raw value type, and the last optional argument allows overriding the serialized type (which defaults to the raw value type).

Consider the following custom type:

```ts
class MyClass {
  constructor(private value: string) {}
}

class MyType extends Type<MyClass, string> {

  convertToDatabaseValue(value: MyClass): string {
    return value.value;
  }

  convertToJSValue(value: string): MyClass {
    return new MyClass(value);
  }

}
```

Now let's use it together with the `IType`:

```ts
import { IType } from '@mikro-orm/core';

@Entity()
class MyEntity {

  @Property({ type: MyType })
  // highlight-next-line
  foo?: IType<MyClass, string>;

}
```

This will make the `em.create()` properly disallow values other than MyClass, as well as convert the value type to `string` when serializing. Without the `IType`, there would be no error with `em.create()` and the serialization would result in `MyClass` on type level (but would be a `string` value on runtime):

```ts
// this will fail but wouldn't without the `IType`
const entity = em.create(MyEntity, { foo: 'bar' });

// serialized value is now correctly typed to `string`
const object = wrap(e).toObject(); // `{ foo: string }`
```

## Collection updates

When you want to check which collections were updated during a flush event (in a subscriber), you were previously left behind with an incomplete list of dirty collections provided via the `uow.getCollectionUpdates()` method. This list included only those collections that required additional processing, namely those that were not loaded, or many-to-many properties in general. Now this method will include all dirty collections, regardless of how they were processed.

## Improvements in schema diffing

As part of the bigger refactoring behind SQL Server support, the schema diffing is now also improved in other dialects. One notable change is improved detection of renamed columns (which now checks for foreign key constraints too).

Another notable improvement is in the `orm.schema.execute()` method. It now respects grouping automatically based on blank lines—keep a blank line between groups of statements if you want to execute them separately. This is important for queries that cannot be part of a single batch.

## Improvements in pagination mechanism

There are two notable changes here: 

- There is a new implementation for the MariaDB driver, which finally works as expected. 
- The pagination mechanism used to add unnecessary join branches for to-many properties, sometimes resulting in serious performance degradation. This is now resolved, as no extra join branches should be present.

## One more thing…

Finally, I'm thrilled to announce some exciting news! Starting last month, MikroORM welcomed a major sponsor, [CDN77](https://www.cdn77.com/)—a leading content delivery network serving over a billion users monthly, ensuring top-notch online experiences. This support enables me to dedicate more time to its development.

[![CDN77.com][cdn77logo]][cdn77link]

[cdn77link]: https://www.cdn77.com/
[cdn77logo]: /img/cdn77-logo-dark.svg

If you are using MikroORM, please [consider donating](https://github.com/sponsors/B4nan) to support the development too. 
