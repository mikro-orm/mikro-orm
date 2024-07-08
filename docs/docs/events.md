---
title: Events and Lifecycle Hooks
sidebar_label: Events and Hooks
---

There are two ways to hook to the lifecycle of an entity:

- **Lifecycle hooks** are methods defined on an entity prototype.
- **EventSubscriber**s are classes that can be used to hook to multiple entities or when you do not want to have the method present on an entity prototype.

> Hooks are internally executed the same way as subscribers.

> Hooks are executed before subscribers.

## Hooks

You can use lifecycle hooks to run arbitrary code when an entity gets persisted. You can mark any of entity methods with them, and multiple methods can be marked with the same hook.

All hooks support async methods with one exception - `@OnInit`.

- `@OnInit` is fired when new instance of entity is created, either manually `em.create()`, or automatically when new entities are loaded from database

- `@OnLoad` is fired when new entity is loaded into context (e.g. via `em.find()` or `em.populate()`). As opposed to `@OnInit` this will be fired only for fully loaded entities, not references, and this hook can be async.

- `@BeforeCreate()` and `@BeforeUpdate()` is fired right before you persist an entity in database

- `@AfterCreate()` and `@AfterUpdate()` is fired right after an entity is updated in database and merged to identity map. Since this event entity will have reference to `EntityManager` and will be enabled to call `wrap(entity).init()` method (including all entity references and collections).

- `@BeforeDelete()` is fired right before you delete the record from database. It is fired only when removing entity or entity reference, not when deleting records by query.

- `@AfterDelete()` is fired right after the record gets deleted from database and it is unset from the identity map.

> `@OnInit` is not fired when you create an entity manually via its constructor (`new MyEntity()`)

> `@OnInit` can be sometimes fired twice, once when an entity reference is created, and once after its populated. To distinguish between those you can use `wrap(this).isInitialized()`.

### Upsert hooks

`em.upsert()` and `em.upsertMany` cannot fire the create/update hooks, as you don't know if the query is an insert or update, those methods offer their own hooks - `beforeUpsert` and `afterUpsert`. The `beforeUpsert` event might provide a DTO instead of entity instance, based on how you call the upsert method. You can use the `EventArgs.meta` object to detect what kind of entity it belongs to. `afterUpsert` event will always receive already managed entity instance.

### Collections and `@OnUpdate` {#collections-and-on-update}

The `@OnUpdate` hook is fired when some values of an entity change and cause an `UPDATE` query. This means that only changes to the scalar properties and owning sides of M:1 and 1:1 relations are considered here - changes to `Collection`s won't trigger an update event.

When you modify a 1:M collection, you are in fact changing the owning side of this relation, which is the M:1 property on the other entity (which will get the event triggered).

For M:N relations with pivot entities (all SQL drivers), you won't get the update event fired on either of the sides, as the changes are made to the pivot table only. You can get the updated collection via `uow.getCollectionUpdates()`, and check how their last known database state looked like via `Collection.getSnapshot()`.

### Limitations of lifecycle hooks

Hooks (as well as event subscribers) are executed inside the commit action of unit of work, after all change sets are computed. This means that it is not possible to create new entities as usual from inside the hook. Calling `em.flush()` from hooks will result in validation error. Calling `em.persist()` can result in undefined behavior like locking errors.

> The **internal** instance of `EntityManager` accessible under `wrap(this, true).__em` is not meant for public usage.

## EventSubscriber

Use `EventSubscriber` to hook to multiple entities or if you do not want to pollute the entity prototype. All methods are optional, if you omit the `getSubscribedEntities()` method, it means you are subscribing to all entities.

You can either register the subscribers manually in the ORM configuration (via `subscribers` array where you put the instance):

```ts
MikroORM.init({
  subscribers: [new AuthorSubscriber()],
});
```

Another example, where you register to all the events and all entities:

```ts
import { EventArgs, TransactionEventArgs, EventSubscriber } from '@mikro-orm/core';

export class EverythingSubscriber implements EventSubscriber {

  // entity life cycle events
  onInit<T>(args: EventArgs<T>): void { ... }
  async onLoad<T>(args: EventArgs<T>): Promise<void> { ... }
  async beforeCreate<T>(args: EventArgs<T>): Promise<void> { ... }
  async afterCreate<T>(args: EventArgs<T>): Promise<void> { ... }
  async beforeUpdate<T>(args: EventArgs<T>): Promise<void> { ... }
  async afterUpdate<T>(args: EventArgs<T>): Promise<void> { ... }
  async beforeUpsert<T>(args: EventArgs<T>): Promise<void> { ... }
  async afterUpsert<T>(args: EventArgs<T>): Promise<void> { ... }
  async beforeDelete<T>(args: EventArgs<T>): Promise<void> { ... }
  async afterDelete<T>(args: EventArgs<T>): Promise<void> { ... }

  // flush events
  async beforeFlush<T>(args: FlushEventArgs): Promise<void> { ... }
  async onFlush<T>(args: FlushEventArgs): Promise<void> { ... }
  async afterFlush<T>(args: FlushEventArgs): Promise<void> { ... }

  // transaction events
  async beforeTransactionStart(args: TransactionEventArgs): Promise<void> { ... }
  async afterTransactionStart(args: TransactionEventArgs): Promise<void> { ... }
  async beforeTransactionCommit(args: TransactionEventArgs): Promise<void> { ... }
  async afterTransactionCommit(args: TransactionEventArgs): Promise<void> { ... }
  async beforeTransactionRollback(args: TransactionEventArgs): Promise<void> { ... }
  async afterTransactionRollback(args: TransactionEventArgs): Promise<void> { ... }

}
```

## EventArgs

As a parameter to the hook method you get `EventArgs` instance. It will always contain reference to the current `EntityManager` and the particular entity. Events fired from `UnitOfWork` during flush operation also contain the `ChangeSet` object.

```ts
interface EventArgs<T> {
  entity: T;
  em: EntityManager;
  changeSet?: ChangeSet<T>;
}

interface ChangeSet<T> {
  name: string;                   // entity name
  collection: string;             // db table name
  type: ChangeSetType;            // type of operation
  entity: T;                      // up to date entity instance
  payload: EntityData<T>;         // changes that will be used to build the update query
  persisted: boolean;             // whether the changeset was already persisted/executed
  originalEntity?: EntityData<T>; // snapshot of an entity when it was loaded from db
}

enum ChangeSetType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  DELETE_EARLY = 'delete_early',
}
```

## Flush events

There is a special kind of events executed during the commit phase (flush operation). They are executed before, during and after the flush, and they are not bound to any entity in particular.

- `beforeFlush` is executed before change sets are computed, this is the only event where it is safe to persist new entities.
- `onFlush` is executed after the change sets are computed.
- `afterFlush` is executed as the last step just before the `flush` call resolves. it will be executed even if there are no changes to be flushed.

Flush event args will not contain any entity instance, as they are entity agnostic. They do contain additional reference to the `UnitOfWork` instance.

```ts
interface FlushEventArgs extends Omit<EventArgs<unknown>, 'entity'> {
  uow?: UnitOfWork;
}
```

> Flush events are entity agnostic, specifying `getSubscribedEntities()` method will not have any effect for those. They are fired only once per the `flush` operation.

## Transaction events

You can also tap into the database transaction events:

- `beforeTransactionStart`
- `afterTransactionStart`
- `beforeTransactionCommit`
- `afterTransactionCommit`
- `beforeTransactionRollback`
- `afterTransactionRollback`

Transaction event args will not contain any entity instance, as they are entity agnostic. They do contain additional reference to the `UnitOfWork` instance and native `Transaction` object (e.g. for SQL drivers it will be knex client instance).

```ts
export interface TransactionEventArgs extends Omit<EventArgs<unknown>, 'entity' | 'changeSet'> {
  transaction?: Transaction;
  uow?: UnitOfWork;
}
```

### Getting the changes from UnitOfWork

You can observe all the changes that are part of given UnitOfWork via those methods:

```ts
UnitOfWork.getChangeSets(): ChangeSet<AnyEntity>[];
UnitOfWork.getOriginalEntityData(entity): EntityData<AnyEntity>;
UnitOfWork.getPersistStack(): Set<AnyEntity>;
UnitOfWork.getRemoveStack(): Set<AnyEntity>;
UnitOfWork.getCollectionUpdates(): Collection<AnyEntity>[];
UnitOfWork.getExtraUpdates(): Set<[AnyEntity, string, (AnyEntity | Reference<AnyEntity>)]>;
```

### Using onFlush event

In following example we have 2 entities: `FooBar` and `FooBaz`, connected via M:1 relation. Our subscriber will automatically create new `FooBaz` entity and connect it to the `FooBar` when we detect it in the change sets.

We first use `uow.getChangeSets()` method to look up the change set of entity we are interested in. After we create the `FooBaz` instance and link it with `FooBar`, we need to do two things:

1. Call `uow.computeChangeSet(baz)` to compute the change set of newly created `FooBaz` entity
2. Call `uow.recomputeSingleChangeSet(cs.entity)` to recalculate the existing change set of the `FooBar` entity.

```ts
export class FooBarSubscriber implements EventSubscriber {

  async onFlush(args: FlushEventArgs): Promise<void> {
    const changeSets = args.uow.getChangeSets();
    const cs = changeSets.find(cs => cs.type === ChangeSetType.CREATE && cs.entity instanceof FooBar);

    if (cs) {
      const baz = new FooBaz();
      baz.name = 'dynamic';
      cs.entity.baz = baz;
      args.uow.computeChangeSet(baz);
      args.uow.recomputeSingleChangeSet(cs.entity);
    }
  }

}

const bar = new FooBar();
bar.name = 'bar';
await em.persist(bar).flush();
```

To create a `DELETE` changeset, you can use the second parameter of `uow.computeChangeSet()`:

```ts
async onFlush(args: FlushEventArgs): Promise<void> {
  const changeSets = args.uow.getChangeSets();
  const cs = changeSets.find(cs => cs.type === ChangeSetType.UPDATE && cs.entity instanceof FooBar);

  if (cs) {
    args.uow.computeChangeSet(cs.entity, ChangeSetType.DELETE);
  }
}
```

## Transaction events

Transaction events happen at the beginning and end of a transaction.

- `beforeTransactionStart` is executed before a transaction starts.
- `afterTransactionStart` is executed after a transaction starts.
- `beforeTransactionCommit` is executed before a transaction is committed.
- `afterTransactionCommit` is executed after a transaction is committed.
- `beforeTransactionRollback` is executed before a transaction is rolled back.
- `afterTransactionRollback` is executed after a transaction is rolled back.

They are also entity agnostic and will only reference the transaction, `UnitOfWork` instance and `EntityManager` instance.
