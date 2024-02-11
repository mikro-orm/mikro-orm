---
title: Using Multiple Schemas
---

In MySQL and PostgreSQL it is possible to define your entities in multiple schemas. In MySQL terminology, it is called database, but from an implementation point of view, it is a schema.

> To use multiple schemas, your connection needs to have access to all of them (multiple connections are not supported in a single MikroORM instance).

All you need to do is simply define the schema name via `schema` options, or table name including schema name in `tableName` option:

```ts
@Entity({ schema: 'first_schema' })
export class Foo { ... }

// or alternatively we can specify it inside custom table name
@Entity({ tableName: 'second_schema.bar' })
export class Bar { ... }
```

Then use those entities as usual. Resulting SQL queries will use this `tableName` value as a table name so as long as your connection has access to given schema, everything should work as expected.

You can also query for entity in specific schema via `EntityManager`, `EntityRepository` or `QueryBuilder`:

```ts
const user = await em.findOne(User, { ... }, { schema: 'client-123' });
```

To create entity in specific schema, you will need to use `QueryBuilder`:

```ts
const qb = em.createQueryBuilder(User);
await qb.insert({ email: 'foo@bar.com' }).withSchema('client-123');
```

## Default schema on `EntityManager`

Instead of defining schema per entity or operation it's possible to `.fork()` EntityManger and define a default schema that will be used with wildcard schemas.

```ts
const fork = em.fork({ schema: 'client-123' });
await fork.findOne(User, { ... });

// Will yield the same result as
const user = await em.findOne(User, { ... }, { schema: 'client-123' });
```

When creating an entity the fork will set default schema

```ts
const fork = em.fork({ schema: 'client-123' });
const user = new User();
user.email = 'foo@bar.com';
await fork.persist(user).flush();

// Will yield the same result as
const qb = em.createQueryBuilder(User);
await qb.insert({ email: 'foo@bar.com' }).withSchema('client-123');
```

You can also set or clear schema

```ts
em.schema = 'client-123';
const fork = em.fork({ schema: 'client-1234' });
fork.schema = null;
```

`EntityManager.schema` Respects the context, so global EM will give you the contextual schema if executed inside [request context handler](https://mikro-orm.io/docs/identity-map#-requestcontext-helper)

## Wildcard Schema

Since v5, MikroORM also supports defining entities that can exist in multiple schemas. To do that, we just specify wildcard schema:

```ts
@Entity({ schema: '*' })
export class Book {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  name?: string;

  @ManyToOne(() => Author, { nullable: true, deleteRule: 'cascade' })
  author?: Author;

  @ManyToOne(() => Book, { nullable: true })
  basedOn?: Book;

}
```

Entities like this will be by default ignored when using `SchemaGenerator`, as we need to specify which schema to use. For that we need to use the `schema` option of the `createSchema/updateSchema/dropSchema` methods or the `--schema` CLI parameter.

On runtime, the wildcard schema will be replaced with either `FindOptions.schema`, `EntityManager.schema` or with the `schema` option from the ORM config.

### Note about migrations

Currently, this is not supported via migrations, they will always ignore wildcard schema entities, and `SchemaGenerator` needs to be used explicitly. Given the dynamic nature of such entities, it makes sense to only sync the schema dynamically, e.g. in an API endpoint. We could still use the ORM migrations, but we need to add the dynamic schema queries manually to migration files. It makes sense to use the `safe` mode for such queries.
