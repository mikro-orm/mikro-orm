---
title: Usage with Neo4j
---

To use MikroORM with Neo4j graph database, install the `@mikro-orm/neo4j` dependency. Then call `MikroORM.init()` as part of bootstrapping your app:

> To access driver specific methods like `em.run()` and `em.createQueryBuilder()` we need to specify the driver type when calling `MikroORM.init<D>()`. Alternatively we can cast the `orm.em` to `EntityManager` exported from the driver package:
>
> ```ts
> import { EntityManager } from '@mikro-orm/neo4j';
> const em = orm.em as EntityManager;
> const result = await em.run('MATCH (n:Person) RETURN n LIMIT 10');
> ```

```ts
import { MikroORM } from '@mikro-orm/neo4j';

const orm = await MikroORM.init({
  entities: [Person, Movie, ...],
  dbName: 'neo4j', // database name
  clientUrl: 'neo4j://localhost:7687',
  user: 'neo4j',
  password: 'password',
});
console.log(orm.em); // access EntityManager via `em` property
```

## Defining Entities

Neo4j stores data as nodes and relationships in a graph structure. MikroORM provides decorators to map your entities to Neo4j's graph model.

### Basic Node Entity

```ts
import { Entity, PrimaryKey, Property, Node, Field } from '@mikro-orm/neo4j';

@Entity()
@Node()
class Person {
  @Field({ primary: true })
  id: string = crypto.randomUUID();

  @Field()
  name!: string;

  @Field()
  age!: number;
}
```

> The `@Node()` decorator marks an entity as a Neo4j node. The `@Field()` decorator is an alias for `@Property()` that can be used for graph-style syntax.

### Multiple Labels

Neo4j supports multiple labels on nodes. You can specify additional labels using the `@Node()` decorator:

```ts
@Entity()
@Node({ labels: ['Employee', 'Manager'] })
class Executive {
  @Field({ primary: true })
  id: string = crypto.randomUUID();

  @Field()
  name!: string;

  @Field()
  title!: string;

  @Field()
  department!: string;
}
```

This creates nodes with multiple labels: `:Executive:Employee:Manager`.

## Relationships

Neo4j relationships are first-class citizens in the graph model. Use the `@Rel()` decorator to specify relationship type and direction.

### Many-to-One Relationships

```ts
import { Entity, ManyToOne, Ref, Rel } from '@mikro-orm/neo4j';

@Entity()
class Product {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property()
  name!: string;

  @ManyToOne(() => Category, { ref: true })
  @Rel({ type: 'PART_OF', direction: 'OUT' })
  category!: Ref<Category>;
}

@Entity()
class Category {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property()
  name!: string;

  @OneToMany(() => Product, product => product.category)
  products = new Collection<Product>(this);
}
```

### Many-to-Many Relationships

```ts
@Entity()
class Product {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property()
  name!: string;

  @ManyToMany(() => Tag)
  @Rel({ type: 'HAS_TAG', direction: 'OUT' })
  tags = new Collection<Tag>(this);
}

@Entity()
class Tag {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property()
  name!: string;

  @ManyToMany(() => Product, p => p.tags)
  @Rel({ type: 'HAS_TAG', direction: 'IN' })
  products = new Collection<Product>(this);
}
```

### Self-Referencing Relationships

```ts
@Entity()
@Node()
class Person {
  @Field({ primary: true })
  id: string = crypto.randomUUID();

  @Field()
  name!: string;

  @ManyToOne(() => Person, { ref: true, nullable: true })
  @Rel({ type: 'KNOWS', direction: 'OUT' })
  knows?: Ref<Person>;

  @ManyToMany(() => Person)
  @Rel({ type: 'WORKS_WITH', direction: 'OUT' })
  colleagues = new Collection<Person>(this);
}
```

## Relationship Properties

Neo4j allows relationships to have properties. Use the `@RelationshipProperties()` decorator to define relationship entities:

```ts
@Entity()
@Node()
class Actor {
  @Field({ primary: true })
  id: string = crypto.randomUUID();

  @Field()
  name!: string;

  @OneToMany(() => ActedIn, a => a.actor)
  actedIn = new Collection<ActedIn>(this);
}

@Entity()
@Node()
class Movie {
  @Field({ primary: true })
  id: string = crypto.randomUUID();

  @Field()
  title!: string;

  @OneToMany(() => ActedIn, a => a.movie)
  actors = new Collection<ActedIn>(this);
}

@Entity()
@RelationshipProperties({ type: 'ACTED_IN' })
class ActedIn {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @ManyToOne(() => Actor, { ref: true })
  actor!: Ref<Actor>;

  @ManyToOne(() => Movie, { ref: true })
  movie!: Ref<Movie>;

  @Property()
  roles!: string[];

  @Property()
  year!: number;
}
```

> Relationship entities must have exactly two `@ManyToOne` properties representing the source and target nodes.

## Querying

### Basic CRUD Operations

```ts
// Create
const person = em.create(Person, { name: 'John Doe', age: 30 });
await em.flush();

// Find
const people = await em.find(Person, { age: { $gte: 25 } });
const john = await em.findOne(Person, { name: 'John Doe' });

// Update
john.age = 31;
await em.flush();

// Delete
await em.remove(john).flush();
```

### Raw Cypher Queries

Use `em.run()` to execute raw Cypher queries:

```ts
const result = await em.run<{ name: string; age: number }>(
  'MATCH (p:Person) WHERE p.age > $age RETURN p.name as name, p.age as age',
  { age: 25 }
);
```

### Query Builder

The Neo4j driver provides a fluent query builder for constructing Cypher queries programmatically:

```ts
const qb = em.createQueryBuilder<Movie>('Movie');

// Simple query
const movies = await qb
  .match()
  .where('released', 1999)
  .return(['title', 'released'])
  .execute();

// Advanced query with relationships
const qb2 = em.createQueryBuilder<Movie>('Movie');
const node = qb2.getNode();
const Cypher = qb2.getCypher();

const result = await qb2
  .match()
  .related('ACTED_IN', 'left', 'Person')
  .where(Cypher.eq(node.property('title'), new Cypher.Param('The Matrix')))
  .return(['title', 'released'])
  .execute();
```

#### Query Builder Features

- **Pattern matching**: `match()`, `create()`, `merge()`
- **Relationships**: `related()` with direction and properties
- **Variable-length relationships**: `related('KNOWS', 'out', 'Person', { length: { min: 1, max: 3 } })`
- **Filtering**: `where()` with Cypher predicates
- **Sorting**: `orderBy()` with ASC/DESC
- **Pagination**: `limit()`, `skip()`
- **Updates**: `set()`, `remove()`
- **Deletes**: `delete()`, `detachDelete()`
- **Subqueries**: `call()`, `with()`
- **Pattern existence**: `exists()`, `count()`

### Repository Query Builder

Repositories have access to a pre-configured query builder:

```ts
const movieRepo = em.getRepository(Movie);

const movies = await movieRepo.createQueryBuilder()
  .match()
  .where('released', 1999)
  .orderBy('title', 'ASC')
  .limit(10)
  .execute();
```

## Virtual Entities

Virtual entities allow you to map Cypher query results to entity classes without storing them as nodes:

```ts
@Entity({
  expression: () => ({
    cypher: `
      MATCH (c:Category)
      RETURN {
        categoryName: c.categoryName,
        totalProducts: COUNT { (c)<-[:PART_OF]-(:Product) }
      } as node
    `,
  }),
})
class CategorySummary {
  @Property()
  categoryName!: string;

  @Property()
  totalProducts!: number;
}

// Query virtual entity
const summaries = await em.find(CategorySummary, {});
```

### Dynamic Virtual Entities

Virtual entities can accept parameters and options:

```ts
@Entity({
  expression: (em: EntityManager, where: any, options: any) => {
    const cypher = `
      MATCH (p:Product)-[:PART_OF]->(c:Category)
      RETURN {
        productName: p.productName,
        categoryName: c.categoryName,
        price: p.price
      } as node
      ${options.orderBy ? 'ORDER BY node.price DESC' : ''}
      ${options.limit ? `LIMIT ${options.limit}` : ''}
    `;
    return { cypher, params: {} };
  },
})
class ProductWithCategory {
  @Property()
  productName!: string;

  @Property()
  categoryName!: string;

  @Property({ nullable: true })
  price?: number;
}
```

## Transactions

The Neo4j driver supports transactions for ensuring data consistency:

```ts
await em.transactional(async em => {
  const person = em.create(Person, { name: 'Alice', age: 28 });
  const category = em.create(Category, { name: 'Electronics' });
  await em.flush();
});

// Explicit transaction management
await em.begin();
try {
  const person = em.create(Person, { name: 'Bob', age: 35 });
  await em.flush();
  await em.commit();
} catch (error) {
  await em.rollback();
  throw error;
}
```

## Schema Operations

### Clear Database

Remove all nodes and relationships from the database:

```ts
await orm.schema.clearDatabase();
```

### Ensure Database

Verify database connectivity:

```ts
const exists = await orm.schema.ensureDatabase();
```

> Neo4j is schemaless for nodes and relationships. Indexes and constraints can be managed separately through Cypher queries if needed.

## Configuration Options

```ts
import { defineNeo4jConfig } from '@mikro-orm/neo4j';

export default defineNeo4jConfig({
  entities: ['./dist/entities'],
  entitiesTs: ['./src/entities'],
  dbName: 'neo4j',
  clientUrl: 'neo4j://localhost:7687',
  user: 'neo4j',
  password: 'password',
  // Optional driver-specific options
  driverOptions: {
    maxConnectionPoolSize: 100,
    connectionAcquisitionTimeout: 60000,
  },
});
```

## Best Practices

1. **Use `@Rel()` decorator**: Always specify relationship types and directions explicitly for clarity.
2. **Leverage query builder**: Use the query builder for complex queries instead of raw Cypher when possible.
3. **Index frequently queried properties**: Create indexes on properties used in WHERE clauses.
4. **Use transactions**: Wrap related operations in transactions to ensure consistency.
5. **Optimize relationship traversals**: Be mindful of variable-length relationships as they can impact performance.
6. **Use relationship properties**: When relationships need metadata, use `@RelationshipProperties()` instead of intermediate nodes.
7. **Virtual entities for reporting**: Use virtual entities for read-only aggregated data.

## Differences from SQL Drivers

- **No migrations**: Neo4j is schemaless; schema changes don't require migrations.
- **No entity generator**: Schema introspection is not supported yet.
- **Graph-based queries**: Relationships are first-class and queried differently than SQL joins.
- **UUID primary keys**: String-based UUIDs are recommended for primary keys.
- **No cascade operations**: Relationship cascading works differently; use `DETACH DELETE` for cascading deletes.

## Example: Complete Application

```ts
import { MikroORM, Entity, PrimaryKey, Property, ManyToOne, ManyToMany, Collection, Ref, Node, Rel, Field } from '@mikro-orm/neo4j';

@Entity()
@Node()
class Person {
  @Field({ primary: true })
  id: string = crypto.randomUUID();

  @Field()
  name!: string;

  @Field()
  born!: number;

  @ManyToMany(() => Movie)
  @Rel({ type: 'ACTED_IN', direction: 'OUT' })
  movies = new Collection<Movie>(this);
}

@Entity()
@Node()
class Movie {
  @Field({ primary: true })
  id: string = crypto.randomUUID();

  @Field()
  title!: string;

  @Field()
  released!: number;

  @ManyToMany(() => Person, p => p.movies)
  @Rel({ type: 'ACTED_IN', direction: 'IN' })
  actors = new Collection<Person>(this);
}

const orm = await MikroORM.init({
  entities: [Person, Movie],
  dbName: 'neo4j',
  clientUrl: 'neo4j://localhost:7687',
  user: 'neo4j',
  password: 'password',
});

// Create data
const tom = orm.em.create(Person, { name: 'Tom Hanks', born: 1956 });
const matrix = orm.em.create(Movie, { title: 'The Matrix', released: 1999 });
tom.movies.add(matrix);
await orm.em.flush();

// Query with relationships
const movies = await orm.em.find(Movie, {}, {
  populate: ['actors'],
  orderBy: { released: 'DESC' },
});

// Use query builder
const qb = orm.em.createQueryBuilder<Movie>('Movie');
const recentMovies = await qb
  .match()
  .where('released', { $gte: 1990 })
  .related('ACTED_IN', 'left', 'Person')
  .return(['title', 'released'])
  .orderBy('released', 'DESC')
  .limit(10)
  .execute();

await orm.close();
```
