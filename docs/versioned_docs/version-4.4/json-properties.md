---
title: Using JSON properties
---

## Defining JSON properties

Each database driver behaves a bit differently when it comes to JSON properties. 
MikroORM tries to unify the experience via [JsonType](custom-types.md#jsontype). 
This type will be also used if you specify `type: 'json'`. 

```ts
@Entity()
export class Book {
  
  @Property({ type: 'json', nullable: true })
  meta?: { foo: string; bar: number };

}
```

## Querying by JSON object properties

> Support for querying by JSON object properties was added in v4.4.2

We can query by JSON object properties easily:

```ts
const b = await em.findOne(Book, {
  meta: {
    valid: true,
    nested: { 
      foo: '123', 
      bar: 321, 
      deep: { 
        baz: 59,
        qux: false,
      },
    },
  },
});
```

Will produce following query (in postgres):

```sql
select "e0".* 
from "book" as "e0" 
where ("meta"->>'valid')::bool = true 
  and "meta"->'nested'->>'foo' = '123' 
  and ("meta"->'nested'->>'bar')::float8 = 321 
  and ("meta"->'nested'->'deep'->>'baz')::float8 = 59 
  and ("meta"->'nested'->'deep'->>'qux')::bool = false 
limit 1
```

> All drivers are currently supported (including sqlite and mongo). In postgres we
> also try to cast the value if we detect number or boolean on the right-hand side.
