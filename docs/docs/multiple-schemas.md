---
title: Using Multiple Schemas
---

In MySQL and PostgreSQL is is possible to define your entities in multiple schemas. In MySQL 
terminology, it is called database, but from implementation point of view, it is a schema. 

> To use multiple schemas, your connection needs to have access to all of them (multiple 
> connections are not supported).

All you need to do is simply define the schema name in the `schema` option:

```typescript
@Entity({ tableName: 'foo', schema: 'first_schema' })
export class Foo { ... }

@Entity({ tableName: 'bar', schema: 'second_schema' })
export class Bar { ... }
```

Then use those entities as usual. Resulting SQL queries will combine this `schema` and `tableName` value and so as long 
as your connection has access to given schema, everything should work as expected.

Even if you haven't defined the schema on your entity, you can query for that entity in a specific schema via 
`EntityManager`, `EntityRepository` or `QueryBuilder`:

```typescript
const user = await em.findOne(User, { ... }, { schema: 'client-123' });
```

To create entity in specific schema, you will need to use `QueryBuilder`:

```typescript
const qb = em.createQueryBuilder(User);
await qb.insert({ email: 'foo@bar.com' }).withSchema('client-123');
```
