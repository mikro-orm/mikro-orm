---
title: Using Multiple Schemas
---

In MySQL and PostgreSQL is is possible to define your entities in multiple schemas. In MySQL 
terminology, it is called database, but from implementation point of view, it is a schema. 

> To use multiple schemas, your connection needs to have access to all of them (multiple 
> connections are not supported).

All you need to do is simply define the table name including schema name in `collection` option:

```typescript
@Entity({ tableName: 'first_schema.foo' })
export class Foo { ... }

@Entity({ tableName: 'second_schema.bar' })
export class Bar { ... }
```

Then use those entities as usual. Resulting SQL queries will use this `tableName` value as a 
table name so as long as your connection has access to given schema, everything should work 
as expected.

You can also query for entity in specific schema via `EntityManager`, `EntityRepository` or 
`QueryBuilder`:

```typescript
const user = await em.findOne(User, { ... }, { schema: 'client-123' });
```

To create entity in specific schema, you will need to use `QueryBuilder`:

```typescript
const qb = em.createQueryBuilder(User);
await qb.insert({ email: 'foo@bar.com' }).withSchema('client-123');
```
