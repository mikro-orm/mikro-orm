# @mikro-orm/neo4j

Neo4j driver for MikroORM - A fully-featured Object Graph Mapper (OGM) for Neo4j graph databases.

## Features

- ✅ **Full CRUD operations** - Create, Read, Update, Delete
- ✅ **Relationships** - ManyToOne, ManyToMany, self-referencing with direction and properties
- ✅ **Multiple labels** - Support for polymorphism via multiple Neo4j labels
- ✅ **Transactions** - Full transaction support with commit/rollback
- ✅ **Virtual entities** - Query projections and computed fields
- ✅ **Custom Cypher queries** - Direct Cypher execution with type safety
- ✅ **Complex queries** - $and, $or operators, orderBy, limit, offset
- ✅ **Relationship properties** - Rich relationship data with `@RelationshipProperties`
- ✅ **Graph decorators** - `@Node`, `@Rel`, `@RelMany`, `@Field` for graph-native modeling

## Installation

```bash
npm install @mikro-orm/neo4j neo4j-driver
# or
yarn add @mikro-orm/neo4j neo4j-driver
```

## Quick Start

### Basic Configuration

```typescript
import { MikroORM } from '@mikro-orm/neo4j';

const orm = await MikroORM.init({
  clientUrl: 'bolt://localhost:7687',
  user: 'neo4j',
  password: 'password',
  entities: ['./dist/entities/**/*.js'],
  dbName: 'neo4j',
});
```

## Entity Decorators

### Node Entities

Use `@Node()` for graph-native entities:

```typescript
import { Node, Field } from '@mikro-orm/neo4j';

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

### Multiple Labels (Polymorphism)

Support multiple Neo4j labels on the same entity:

```typescript
// Executive will have labels: :executive:Employee:Manager
@Node({ labels: ['Employee', 'Manager'] })
class Executive {
  @Field({ primary: true })
  id: string = crypto.randomUUID();

  @Field()
  name!: string;

  @Field()
  title!: string;
}
```

### Traditional ORM Decorators

You can also use standard MikroORM decorators:

```typescript
import { Entity, Property, PrimaryKey, ManyToOne, Collection } from '@mikro-orm/neo4j';

@Entity()
class Movie {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property()
  title!: string;

  @Property()
  released!: number;

  @ManyToOne(() => Studio, {
    ref: true,
    custom: { relationship: { type: 'PRODUCED_BY', direction: 'OUT' } },
  })
  studio?: Ref<Studio>;
}
```

## Relationships

### Relationship with Direction

```typescript
import { Rel, RelMany } from '@mikro-orm/neo4j';

@Node()
class Person {
  @Field({ primary: true })
  id: string = crypto.randomUUID();

  @Field()
  name!: string;

  // One-to-one/Many-to-one with direction
  @Rel(() => Person, {
    relationship: { type: 'KNOWS', direction: 'OUT' },
    ref: true,
    nullable: true,
  })
  knows?: Ref<Person>;

  // Many-to-many with direction
  @RelMany(() => Person, {
    relationship: { type: 'WORKS_WITH', direction: 'OUT' },
  })
  colleagues = new Collection<Person>(this);
}
```

### Relationship Properties

For relationships with data (like roles, dates, scores):

```typescript
@Entity()
@RelationshipProperties({ type: 'ACTED_IN' })
class ActedIn {
  @Property()
  roles!: string[];

  @Property()
  screenTime?: number;

  @ManyToOne(() => Actor)
  from!: Actor;

  @ManyToOne(() => Movie)
  to!: Movie;
}

@Node()
class Actor {
  @Field({ primary: true })
  id: string = crypto.randomUUID();

  @Field()
  name!: string;

  @RelMany(() => Movie, {
    relationship: { type: 'ACTED_IN', direction: 'OUT' },
  })
  movies = new Collection<Movie>(this);
}
```

## Real-World Scenarios

### Scenario 1: Virtual Entities (Projections)

Virtual entities don't exist as nodes - they're query results:

```typescript
@Entity({
  expression: () => ({
    cypher: `
      MATCH (u:User)
      OPTIONAL MATCH (u)-[:COMPLETED]->(l:Lesson)
      WITH u, count(l) AS completedLessons
      RETURN {
        id: u.id,
        name: u.name,
        completedLessons: completedLessons,
        level: CASE
          WHEN completedLessons >= 20 THEN "ADVANCED"
          WHEN completedLessons >= 10 THEN "INTERMEDIATE"
          ELSE "BEGINNER"
        END
      } AS node
    `,
  }),
})
class UserProgressView {
  @Property() id!: string;
  @Property() name!: string;
  @Property() completedLessons!: number;
  @Property() level!: string;
}

// Usage
const progress = await em.find(UserProgressView, {});
// Returns computed data without creating nodes
```

### Scenario 2: Polymorphism via Multiple Labels

```typescript
// Query entities by their role labels
const students = await em.run<{ id: string; name: string }>(
  'MATCH (u:User:Student) RETURN u.id as id, u.name as name'
);

const admins = await em.run<{ id: string; name: string }>(
  'MATCH (u:User:Admin) RETURN u.id as id, u.name as name'
);

// Get all roles for a user
const userRoles = await em.run<{ roles: string[] }>(
  `MATCH (u:User {id: $userId})
   RETURN [label IN labels(u) WHERE label <> 'User'] as roles`,
  { userId: user.id }
);
```

### Scenario 3: Relationships with Properties

```typescript
// Create relationship with properties
await em.run(
  `MATCH (u:User {id: $userId}), (l:Lesson {id: $lessonId})
   CREATE (u)-[r:COMPLETED {
     progress: $progress,
     completedAt: $completedAt
   }]->(l)
   RETURN r`,
  {
    userId: user.id,
    lessonId: lesson.id,
    progress: 100,
    completedAt: new Date().toISOString(),
  }
);

// Query relationship properties
const completions = await em.run<{
  userId: string;
  lessonId: string;
  progress: number;
  completedAt: string;
}>(
  `MATCH (u:User)-[r:COMPLETED]->(l:Lesson)
   RETURN u.id as userId,
          l.id as lessonId,
          r.progress as progress,
          r.completedAt as completedAt`
);
```

## Custom Cypher Queries

Execute raw Cypher with type safety:

```typescript
// Via EntityManager
const results = await em.run<{ name: string; count: number }>(
  'MATCH (p:Person)-[:ACTED_IN]->(m:Movie) RETURN p.name as name, count(m) as count'
);

// Via Repository
const repo = em.getRepository(Movie);
const movies = await repo.run<{ title: string; year: number }>(
  'MATCH (m:Movie) WHERE m.released > $year RETURN m.title as title, m.released as year',
  { year: 2000 }
);

// Aggregations
const stats = await em.aggregate<{ total: number; avg: number }>(
  'MATCH (p:Product) RETURN count(p) as total, avg(p.price) as avg'
);
```

## Transactions

```typescript
// Automatic transaction
await em.transactional(async (em) => {
  const user = em.create(User, { name: 'John' });
  await em.persistAndFlush(user);
  // Auto-commits on success, rolls back on error
});

// Manual transaction
await em.begin();
try {
  const user = em.create(User, { name: 'John' });
  await em.persistAndFlush(user);
  await em.commit();
} catch (error) {
  await em.rollback();
  throw error;
}
```

## Advanced Queries

```typescript
// Complex WHERE with $and/$or
const results = await em.find(Product, {
  $and: [
    { price: { $gt: 100 } },
    { $or: [{ category: 'Electronics' }, { category: 'Computers' }] },
  ],
});

// Ordering, pagination, populate
const products = await em.find(
  Product,
  { category: { $ne: null } },
  {
    populate: ['category', 'tags'],
    orderBy: { price: 'DESC' },
    limit: 10,
    offset: 0,
  }
);
```

## Schema Management

```typescript
// Clear all data
await orm.schema.clearDatabase();

// In tests
beforeEach(async () => {
  await orm.schema.clearDatabase();
});
```

## Best Practices

1. **Use `@Node()` for graph-native modeling** - Clearer intent than `@Entity()`
2. **Specify relationship direction** - OUT/IN for clear graph semantics
3. **Use multiple labels for polymorphism** - Better than discriminator columns
4. **Leverage virtual entities** - For computed views and aggregations
5. **Use relationship properties** - For rich relationship data (dates, scores, etc.)
6. **Use `ref: true`** - For lazy-loading relationships
7. **Clear between tests** - Use `schema.clearDatabase()` in test setup

## Example: Complete Movie Database

```typescript
@Node()
class Actor {
  @Field({ primary: true })
  id: string = crypto.randomUUID();

  @Field()
  name!: string;

  @Field()
  born!: number;

  @RelMany(() => Movie, {
    relationship: { type: 'ACTED_IN', direction: 'OUT' },
  })
  movies = new Collection<Movie>(this);
}

@Node()
class Movie {
  @Field({ primary: true })
  id: string = crypto.randomUUID();

  @Field()
  title!: string;

  @Field()
  released!: number;

  @RelMany(() => Actor, actor => actor.movies, {
    relationship: { type: 'ACTED_IN', direction: 'IN' },
  })
  actors = new Collection<Actor>(this);
}

// Usage
const actor = orm.em.create(Actor, {
  name: 'Keanu Reeves',
  born: 1964,
});

const movie = orm.em.create(Movie, {
  title: 'The Matrix',
  released: 1999,
});

actor.movies.add(movie);
await orm.em.persistAndFlush([actor, movie]);

// Query with relationships
const keanu = await orm.em.findOne(
  Actor,
  { name: 'Keanu Reeves' },
  { populate: ['movies'] }
);

console.log(keanu.movies.getItems()); // [Movie { title: 'The Matrix', ... }]
```

## License

MIT
