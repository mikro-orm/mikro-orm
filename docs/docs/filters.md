---
title: Filters
---

MikroORM has the ability to pre-define filter criteria and attach those filters 
to given entities. The application can then decide at runtime whether certain 
filters should be enabled and what their parameter values should be. Filters 
can be used like database views, but they are parameterized inside the application.

> Filter can be defined at the entity level, dynamically via EM (global filters) 
> or in the ORM configuration.

Filters are applied to those methods of `EntityManager`: `find()`, `findOne()`, 
`findAndCount()`, `findOneOrFail()`, `count()`, `nativeUpdate()` and `nativeDelete()`. 

> The `cond` parameter can be a callback, possibly asynchronous.

```typescript
@Entity()
@Filter({ name: 'expensive', cond: { price: { $gt: 1000 } } })
@Filter({ name: 'long', cond: { 'length(text)': { $gt: 10000 } } })
@Filter({ name: 'hasAuthor', cond: { author: { $ne: null } }, default: true })
@Filter({ name: 'writtenBy', cond: args => ({ author: { name: args.name } }) })
export class Book {
  ...
}

const books1 = await orm.em.find(Book, {}, {
  filters: ['long', 'expensive'],
});
const books2 = await orm.em.find(Book, {}, {
  filters: { hasAuthor: false, long: true, writtenBy: { name: 'God' } },
});
```

## Properties of filter

There are three parameters you can use:
- `name` - can be used to enable a filter on the query can also used to pass a parameter
- `cond` - is the condition that should be added to the query when the filter is enabled. This can be a callback, even async
- `default` - indicates if the filter is enabled by default on the query

## Parameters

You can define the `cond` dynamically as a callback. This callback can be also 
asynchronous. It will get three arguments:

- `args` - dictionary of parameters provided by user
- `type` - type of operation that is being filtered, one of `'read'`, `'update'`, `'delete'`
- `em` - current instance of `EntityManager`

```typescript
import type { EntityManager } from '@mikro-orm/mysql';

@Entity()
@Filter({ name: 'writtenBy', cond: async (args, type, em: EntityManager) => {
  if (type === 'update') {
    return {}; // do not apply when updating
  }

  return { 
    author: { name: args.name }, 
    publishedAt: { $lte: em.raw('now()') },
  };
} })
export class Book {
  ...
}

const books = await orm.em.find(Book, {}, {
  filters: { writtenBy: { name: 'God' } },
});
```

### Filters without parameters

If we want to have a filter condition that do not need arguments, but we want
to access the `type` parameter, we will need to explicitly set `args: false`, 
otherwise error will be raised due to missing parameters:

```ts
@Filter({
  name: 'withoutParams',
  cond(_, type) {
    return { ... };
  },
  args: false,
  default: true,
})
```

## Global filters

We can also register filters dynamically via `EntityManager` API. We call such filters 
global. They are enabled by default (unless disabled via last parameter in `addFilter()`
method), and applied to all entities. You can limit the global filter to only specified
entities. 

> Filters as well as filter params set on the EM will be copied to all its forks.

```typescript
// bound to entity, enabled by default
em.addFilter('writtenBy', args => ({ author: args.id }), Book);

// global, enabled by default, for all entities
em.addFilter('tenant', args => { ... });

// global, enabled by default, for only specified entities
em.addFilter('tenant', args => { ... }, [Author, Book]);
...

// set params (probably in some middleware)
em.setFilterParams('tenant', { tenantId: 123 });
em.setFilterParams('writtenBy', { id: 321 });
```

Global filters can be also registered via ORM configuration:

```typescript
MikroORM.init({
  filters: { tenant: { cond: args => ({ tenant: args.tenant }), entity: ['Author', 'User'] } },
  ...
})
```

## Using filters

We can control what filters will be applied via `filter` parameter in `FindOptions`.
We can either provide an array of names of filters you want to enable, or options 
object, where we can also disable a filter (that was enabled by default), or pass some
parameters to those that are expecting them.

> By passing `filters: false` we can also disable all the filters for given call. 

```typescript
em.find(Book, {}); // same as `{ tenantId: 123 }`
em.find(Book, {}, { filters: ['writtenBy'] }); // same as `{ author: 321, tenantId: 123 }`
em.find(Book, {}, { filters: { tenant: false } }); // disabled tenant filter, so truly `{}`
em.find(Book, {}, { filters: false }); // disabled all filters, so truly `{}`
```

## Filters and populating of relationships

When populating relationships, filters will be applied only to the root entity of 
given query, but not to those that are auto-joined. On the other hand, this means that
when you use the default loading strategy - `LoadStrategy.SELECT_IN` - filters will
be applied to every entity populated this way, as the child entities will become
root entities in their respective load calls.

## Naming of filters

When toggling filters via `FindOptions`, we do not care about the entity name. This
means that when you have multiple filters defined on different entities, but with 
the same name, they will be controlled via single toggle in the `FindOptions`. 

```typescript
@Entity()
@Filter({ name: 'tenant', cond: args => ({ tenant: args.tenant }) })
export class Author {
  ...
}

@Entity()
@Filter({ name: 'tenant', cond: args => ({ tenant: args.tenant }) })
export class Book {
  ...
}

// this will apply the tenant filter to both Author and Book entities (with SELECT_IN loading strategy)
const authors = await orm.em.find(Author, {}, {
  populate: ['books'],
  filters: { tenant: 123 },
});
```
