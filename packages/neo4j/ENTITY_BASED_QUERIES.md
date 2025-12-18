# Entity-Based Query Building

The Neo4j QueryBuilder now supports using decorated entity classes as parameters, automatically extracting metadata from decorators to create proper nodes and relationships.

## Features

### 1. Relationship Metadata Extraction

Use entity classes with `@Rel` or `@RelMany` decorators to automatically extract relationship types and directions:

```typescript
@Entity()
@Node()
class Actor {
  @Field({ primary: true })
  id!: string;

  @Field()
  name!: string;

  @ManyToMany(() => Movie)
  @RelMany({ type: 'ACTED_IN', direction: 'OUT' })
  movies = new Collection<Movie>(this);
}

@Entity()
@Node()
class Movie {
  @Field({ primary: true })
  id!: string;

  @Field()
  title!: string;

  @ManyToMany(() => Actor, actor => actor.movies)
  @RelMany({ type: 'ACTED_IN', direction: 'IN' })
  actors = new Collection<Actor>(this);
}

// Query using entity class and property name
const qb = em.createQueryBuilder<Actor>('Actor');
const { cypher, params } = qb
  .match()
  .related(Actor, 'movies')  // Extracts ACTED_IN + OUT direction from @RelMany
  .return(['name'])
  .build();

// Generated Cypher: MATCH (this0:actor)-[this1:ACTED_IN]->(this2:movie) RETURN this0.name AS name
```

### 2. Target Entity Classes

Pass entity classes in the `targetEntity` option to automatically extract node labels:

```typescript
const qb = em.createQueryBuilder<Actor>('Actor');
const { cypher } = qb
  .match()
  .related('ACTED_IN', {
    direction: 'right',
    targetEntity: Movie,  // Extracts 'movie' label from Movie entity metadata
  })
  .return(['name'])
  .build();

// Generated Cypher: MATCH (this0:actor)-[this1:ACTED_IN]->(this2:movie) RETURN this0.name AS name
```

### 3. Multiple Labels Support

Entity classes with multiple labels (via `@Node({ labels: [...] })`) are automatically extracted:

```typescript
@Entity()
@Node({ labels: ['Employee', 'Manager'] })
class Executive {
  @Field({ primary: true })
  id!: string;

  @Field()
  name!: string;
}

const qb = em.createQueryBuilder<Executive>('Executive');
const { cypher } = qb
  .match()
  .related('MANAGES', {
    targetEntity: Executive,  // Extracts: executive:Employee:Manager
  })
  .return(['name'])
  .build();
```

### 4. Combined with Properties and Variable Length

Entity-based queries work with all advanced relationship features:

```typescript
const qb = em.createQueryBuilder<Actor>('Actor');
const { cypher } = qb
  .match()
  .related(Actor, 'movies', {
    properties: { roles: ['Neo'] },
    length: { min: 1, max: 3 },
  })
  .return(['name'])
  .build();
```

## Benefits

1. **Type Safety**: Uses actual entity classes with full TypeScript type checking
2. **DRY Principle**: Relationship metadata is defined once in decorators
3. **Refactoring-Friendly**: Renaming entities or properties updates queries automatically
4. **Less Error-Prone**: No manual string typing for relationship types or labels
5. **Backward Compatible**: All existing string-based queries continue to work

## API Reference

### `related()` Signatures

```typescript
// Entity-based: Extract metadata from decorators
.related(EntityClass, 'propertyName')

// Entity-based with target: Explicit target entity
.related('RELATIONSHIP_TYPE', { targetEntity: EntityClass, ...options })

// Traditional: String-based (still supported)
.related('RELATIONSHIP_TYPE', { targetLabel: 'Label', ...options })

// Legacy: Old signature (still supported)
.related('RELATIONSHIP_TYPE', 'left' | 'right', 'TargetLabel')
```

### RelationshipOptions Interface

```typescript
interface RelationshipOptions {
  direction?: 'left' | 'right' | 'undirected';
  targetLabel?: string;
  targetLabels?: string[];
  targetEntity?: EntityClass<any>;  // NEW: Extract labels from entity
  properties?: Record<string, any>;
  variable?: Cypher.Relationship;
  length?: number | { min?: number; max?: number } | '*';
}
```

## Error Handling

The QueryBuilder validates that decorators are present:

```typescript
// Throws error if property has no @Rel or @RelMany decorator
qb.match().related(Movie, 'invalidProperty').build();
// Error: No @Rel or @RelMany decorator found on Movie.invalidProperty
```

## Migration Guide

### Before (String-based)

```typescript
const qb = em.createQueryBuilder<Actor>('Actor');
qb.match()
  .related('ACTED_IN', { 
    direction: 'right',
    targetLabel: 'Movie'
  })
  .return(['name']);
```

### After (Entity-based)

```typescript
const qb = em.createQueryBuilder<Actor>('Actor');
qb.match()
  .related(Actor, 'movies')  // Type-safe, refactoring-friendly
  .return(['name']);
```

Or:

```typescript
qb.match()
  .related('ACTED_IN', { 
    direction: 'right',
    targetEntity: Movie  // Extract labels from entity metadata
  })
  .return(['name']);
```

## Best Practices

1. **Use entity-based queries** when working with decorated entities
2. **Keep decorators up-to-date** - they're the source of truth
3. **Use `targetEntity`** for explicit control over target labels
4. **Combine with filters** for complex queries

```typescript
const qb = em.createQueryBuilder<Actor>('Actor');
const result = await qb
  .match()
  .related(Actor, 'movies')
  .where('title', 'The Matrix')
  .return(['name'])
  .execute();
```
