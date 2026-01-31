---
title: Events and Lifecycle Hooks
sidebar_label: Events and Hooks
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

There are two ways to hook into the lifecycle of an entity:

- **Lifecycle hooks** are methods defined on the entity that run at specific points in the entity's lifecycle.
- **EventSubscribers** are separate classes that can listen to events from multiple entities.

Both approaches support the same events. Hooks are executed before subscribers.

## Available Events

| Event | When it fires |
|-------|---------------|
| `onInit` | When an entity instance is created (via `em.create()` or when loaded from database) |
| `onLoad` | When an entity is fully loaded from the database (not for references) |
| `beforeCreate` | Before a new entity is inserted into the database |
| `afterCreate` | After a new entity is inserted and merged into the identity map |
| `beforeUpdate` | Before an existing entity is updated in the database |
| `afterUpdate` | After an entity is updated and changes are merged |
| `beforeUpsert` | Before `em.upsert()` or `em.upsertMany()` executes |
| `afterUpsert` | After upsert completes, receives the managed entity |
| `beforeDelete` | Before an entity is deleted from the database |
| `afterDelete` | After an entity is deleted and removed from identity map |

## Defining Hooks

<Tabs groupId="entity-def" defaultValue="define-entity" values={[
  {label: 'defineEntity', value: 'define-entity'},
  {label: 'Decorators', value: 'decorators'},
]}>
<TabItem value="define-entity">

With `defineEntity`, use the `addHook` method to register hook handlers:

```ts title="./entities/Article.ts"
import { defineEntity, InferEntity, EventArgs, p } from '@mikro-orm/core';

export const Article = defineEntity({
  name: 'Article',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    slug: p.string().unique(),
    updatedAt: p.datetime(),
  },
});

type IArticle = InferEntity<typeof Article>;

Article.addHook('beforeCreate', async (args: EventArgs<IArticle>) => {
  const article = args.entity;
  if (!article.slug) {
    article.slug = article.title.toLowerCase().replace(/\s+/g, '-');
  }
});

Article.addHook('beforeUpdate', async (args: EventArgs<IArticle>) => {
  args.entity.updatedAt = new Date();
});
```

The `addHook` method must be called after the entity is defined so that the `IArticle` type can be inferred from `typeof Article`.

</TabItem>
<TabItem value="decorators">

With decorators, mark entity methods with hook decorators:

```ts title="./entities/Article.ts"
import { Entity, PrimaryKey, Property, BeforeCreate, BeforeUpdate } from '@mikro-orm/core';

@Entity()
export class Article {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property({ unique: true })
  slug!: string;

  @Property()
  updatedAt?: Date;

  @BeforeCreate()
  generateSlug() {
    if (!this.slug) {
      this.slug = this.title.toLowerCase().replace(/\s+/g, '-');
    }
  }

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }

}
```

Multiple methods can have the same hook decorator.

</TabItem>
</Tabs>

### Hook Method Signatures

All hooks receive an `EventArgs` object and can be async (except `onInit`):

```ts
async function myHook(args: EventArgs<MyEntity>): Promise<void> {
  const entity = args.entity;      // the entity instance
  const em = args.em;              // the EntityManager
  const changeSet = args.changeSet; // available during flush (create/update/delete)
}
```

### Notes on Specific Hooks

**`onInit`**:
- Fired when entities are created via `em.create()` or loaded from database
- Not fired when using `new Entity()` directly
- May fire twice for references (once on reference creation, once when populated) - use `wrap(this).isInitialized()` to distinguish
- Must be synchronous

**`onLoad`**:
- Only fires for fully loaded entities, not references
- Can be async

**`beforeUpdate` / `afterUpdate`**:
- Only fires when scalar properties or owning sides of relations change
- Collection changes don't trigger update events (see [Collections and Updates](#collections-and-updates))

### Upsert Hooks

Since `em.upsert()` doesn't know if the operation will be an insert or update, it has dedicated hooks:

- `beforeUpsert` - may receive a DTO instead of entity instance
- `afterUpsert` - always receives the managed entity instance

Use `EventArgs.meta` to identify the entity type when receiving a DTO.

### Collections and Updates

The `beforeUpdate`/`afterUpdate` hooks fire when an `UPDATE` query is generated. This only happens for changes to:
- Scalar properties
- Owning sides of M:1 and 1:1 relations

Collection changes don't trigger update events because:
- **1:M relations**: Changes affect the M:1 side on the related entity (which gets the event)
- **M:N relations**: Changes only affect the pivot table

To observe collection changes during flush, use `uow.getCollectionUpdates()` in a flush event subscriber.

### Limitations

Hooks execute inside the Unit of Work commit phase, after change sets are computed:

- **Don't call `em.flush()`** - throws a validation error
- **Don't call `em.persist()`** - can cause undefined behavior
- **To create new entities**, use the `beforeFlush` event instead (see [Flush Events](#flush-events))

## Event Subscribers

Use `EventSubscriber` when you want to:
- Listen to events from multiple entity types
- Keep event logic separate from entity definitions
- Access the full `EventArgs` including change sets

### Registering Subscribers

Register globally in the ORM config:

```ts
MikroORM.init({
  subscribers: [new ArticleSubscriber(), new AuditSubscriber()],
});
```

Or dynamically at runtime:

```ts
em.getEventManager().registerSubscriber(new ArticleSubscriber());
```

### Creating a Subscriber

```ts
import { EventSubscriber, EventArgs } from '@mikro-orm/core';
import { Article } from './entities/Article.js';

export class ArticleSubscriber implements EventSubscriber<Article> {

  // Only subscribe to Article events
  getSubscribedEntities() {
    return [Article];
  }

  async beforeCreate(args: EventArgs<Article>) {
    console.log('Creating article:', args.entity.title);
  }

  async afterUpdate(args: EventArgs<Article>) {
    // args.changeSet contains the changes
    console.log('Updated fields:', Object.keys(args.changeSet?.payload ?? {}));
  }

}
```

Omit `getSubscribedEntities()` to subscribe to all entities:

```ts
export class AuditSubscriber implements EventSubscriber {

  async afterCreate(args: EventArgs<unknown>) {
    console.log('Created:', args.changeSet?.name, args.changeSet?.entity);
  }

}
```

### Full Subscriber Interface

```ts
import { EventArgs, FlushEventArgs, TransactionEventArgs, EventSubscriber } from '@mikro-orm/core';

export class FullSubscriber implements EventSubscriber {

  // Entity lifecycle events
  onInit<T>(args: EventArgs<T>): void { }
  async onLoad<T>(args: EventArgs<T>): Promise<void> { }
  async beforeCreate<T>(args: EventArgs<T>): Promise<void> { }
  async afterCreate<T>(args: EventArgs<T>): Promise<void> { }
  async beforeUpdate<T>(args: EventArgs<T>): Promise<void> { }
  async afterUpdate<T>(args: EventArgs<T>): Promise<void> { }
  async beforeUpsert<T>(args: EventArgs<T>): Promise<void> { }
  async afterUpsert<T>(args: EventArgs<T>): Promise<void> { }
  async beforeDelete<T>(args: EventArgs<T>): Promise<void> { }
  async afterDelete<T>(args: EventArgs<T>): Promise<void> { }

  // Flush events
  async beforeFlush(args: FlushEventArgs): Promise<void> { }
  async onFlush(args: FlushEventArgs): Promise<void> { }
  async afterFlush(args: FlushEventArgs): Promise<void> { }

  // Transaction events
  async beforeTransactionStart(args: TransactionEventArgs): Promise<void> { }
  async afterTransactionStart(args: TransactionEventArgs): Promise<void> { }
  async beforeTransactionCommit(args: TransactionEventArgs): Promise<void> { }
  async afterTransactionCommit(args: TransactionEventArgs): Promise<void> { }
  async beforeTransactionRollback(args: TransactionEventArgs): Promise<void> { }
  async afterTransactionRollback(args: TransactionEventArgs): Promise<void> { }

}
```

## EventArgs

Event handlers receive an `EventArgs` object:

```ts
interface EventArgs<T> {
  entity: T;
  em: EntityManager;
  changeSet?: ChangeSet<T>;  // Available during flush operations
}

interface ChangeSet<T> {
  name: string;                   // Entity name
  collection: string;             // Database table name
  type: ChangeSetType;            // 'create' | 'update' | 'delete' | 'delete_early'
  entity: T;                      // The entity instance
  payload: EntityData<T>;         // Changes for the UPDATE query
  persisted: boolean;             // Whether already executed
  originalEntity?: EntityData<T>; // Snapshot when loaded from database
}
```

## Flush Events

Flush events fire during `em.flush()` and are not tied to any specific entity:

| Event | When it fires | Use case |
|-------|---------------|----------|
| `beforeFlush` | Before change sets are computed | Safe to persist new entities here |
| `onFlush` | After change sets are computed | Modify or add change sets |
| `afterFlush` | After all queries complete | Cleanup, notifications |

```ts
interface FlushEventArgs extends Omit<EventArgs<unknown>, 'entity'> {
  uow: UnitOfWork;
}
```

> `getSubscribedEntities()` has no effect on flush events - they always fire regardless of entity type filters.

### Accessing Changes in Flush Events

The `UnitOfWork` provides methods to inspect pending changes:

```ts
async onFlush(args: FlushEventArgs) {
  const uow = args.uow;

  // All pending change sets
  const changeSets = uow.getChangeSets();

  // Original data when entity was loaded
  const original = uow.getOriginalEntityData(entity);

  // Entities marked for persist/remove
  const toInsert = uow.getPersistStack();
  const toDelete = uow.getRemoveStack();

  // Collection modifications
  const collectionUpdates = uow.getCollectionUpdates();
}
```

### Creating Entities in Flush Events

Use `beforeFlush` to safely create new entities:

```ts
async beforeFlush(args: FlushEventArgs) {
  // Safe to create and persist new entities here
  const log = args.em.create(AuditLog, { action: 'flush', timestamp: new Date() });
}
```

### Modifying Change Sets in onFlush

In `onFlush`, you can add or modify change sets:

```ts
async onFlush(args: FlushEventArgs) {
  const changeSets = args.uow.getChangeSets();
  const cs = changeSets.find(cs =>
    cs.type === ChangeSetType.CREATE && cs.name === 'FooBar'
  );

  if (cs) {
    // Create a related entity
    const related = new FooBaz();
    related.name = 'auto-created';
    cs.entity.baz = related;

    // Compute change set for the new entity
    args.uow.computeChangeSet(related);
    // Recompute the original entity's change set
    args.uow.recomputeSingleChangeSet(cs.entity);
  }
}
```

To convert an update to a delete:

```ts
async onFlush(args: FlushEventArgs) {
  const cs = args.uow.getChangeSets().find(cs =>
    cs.type === ChangeSetType.UPDATE && cs.entity.shouldDelete
  );

  if (cs) {
    args.uow.computeChangeSet(cs.entity, ChangeSetType.DELETE);
  }
}
```

## Transaction Events

Transaction events fire at transaction boundaries:

| Event | When it fires |
|-------|---------------|
| `beforeTransactionStart` | Before a transaction begins |
| `afterTransactionStart` | After a transaction begins |
| `beforeTransactionCommit` | Before a transaction commits |
| `afterTransactionCommit` | After a transaction commits |
| `beforeTransactionRollback` | Before a transaction rolls back |
| `afterTransactionRollback` | After a transaction rolls back |

```ts
interface TransactionEventArgs extends Omit<EventArgs<unknown>, 'entity' | 'changeSet'> {
  transaction?: Transaction;  // Native transaction (e.g., Knex client for SQL)
  uow?: UnitOfWork;
}
```

Transaction events are entity-agnostic - `getSubscribedEntities()` has no effect on them.
