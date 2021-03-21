---
title: Lifecycle Hooks and EventSubscriber
sidebar_label: Hooks and Events
---

There are two ways to hook to the lifecycle of an entity: 

- **Lifecycle hooks** are methods defined on the entity prototype.
- **EventSubscriber**s are classes that can be used to hook to multiple entities
  or when you do not want to have the method present on the entity prototype.

> Hooks are internally executed the same way as subscribers.

> Hooks are executed before subscribers.

## Hooks

You can use lifecycle hooks to run some code when entity gets persisted. You can mark any of
entity methods with them, you can also mark multiple methods with same hook.

All hooks support async methods with one exception - `@OnInit`.

- `@OnInit` is fired when new instance of entity is created, either manually `em.create()`, or 
automatically when new entities are loaded from database

- `@BeforeCreate()` and `@BeforeUpdate()` is fired right before we persist the entity in database

- `@AfterCreate()` and `@AfterUpdate()` is fired right after the entity is updated in database and 
merged to identity map. Since this event entity will have reference to `EntityManager` and will be 
enabled to call `wrap(entity).init()` method (including all entity references and collections).

- `@BeforeDelete()` is fired right before we delete the record from database. It is fired only when
removing entity or entity reference, not when deleting records by query. 

- `@AfterDelete()` is fired right after the record gets deleted from database and it is unset from 
the identity map.

> `@OnInit` is not fired when you create the entity manually via its constructor (`new MyEntity()`)

## Limitations of lifecycle hooks

Hooks are executed inside the commit action of unit of work, after all change 
sets are computed. This means that it is not possible to create new entities as
usual from inside the hook. Calling `em.flush()` from hooks will result in 
validation error. Calling `em.persist()` can result in undefined behaviour like
locking errors. 

> The **internal** instance of `EntityManager` accessible under `wrap(this, true).__em` is 
> not meant for public usage. 

## EventSubscriber

Use `EventSubscriber` to hook to multiple entities or if you do not want to pollute
the entity prototype. All methods are optional, if you omit the `getSubscribedEntities()`
method, it means you are subscribing to all entities.

You can either register the subscribers manually in the ORM configuration (via 
`subscribers` array where you put the instance):

```typescript
MikroORM.init({
  subscribers: [new AuthorSubscriber()],
});
```

Or use `@Subscriber()` decorator - keep in mind that you need to make sure the file gets 
loaded in order to make this decorator registration work (e.g. you import that file 
explicitly somewhere).

```typescript
import { EntityName, EventArgs, EventSubscriber, Subscriber } from '@mikro-orm/core';

@Subscriber()
export class AuthorSubscriber implements EventSubscriber<Author> {

  getSubscribedEntities(): EntityName<Author>[] {
    return [Author];
  }

  async afterCreate(args: EventArgs<Author>): Promise<void> {
    // ...
  }

  async afterUpdate(args: EventArgs<Author>): Promise<void> {
    // ... 
  }

}
```

Another example, where we register to all the events and all entities: 

```typescript
import { EventArgs, EventSubscriber, Subscriber } from '@mikro-orm/core';

@Subscriber()
export class EverythingSubscriber implements EventSubscriber {

  async beforeCreate<T>(args: EventArgs<T>): Promise<void> { ... }
  async afterCreate<T>(args: EventArgs<T>): Promise<void> { ... }
  async beforeUpdate<T>(args: EventArgs<T>): Promise<void> { ... }
  async afterUpdate<T>(args: EventArgs<T>): Promise<void> { ... }
  async beforeDelete<T>(args: EventArgs<T>): Promise<void> { ... }
  async afterDelete<T>(args: EventArgs<T>): Promise<void> { ... }
  async beforeFlush<T>(args: EventArgs<T>): Promise<void> { ... }
  async onFlush<T>(args: EventArgs<T>): Promise<void> { ... }
  async afterFlush<T>(args: EventArgs<T>): Promise<void> { ... }
  onInit<T>(args: EventArgs<T>): void { ... }

}
```

## EventArgs

As a parameter to the hook method we get `EventArgs` instance. It will always contain
reference to the current `EntityManager` and the particular entity. Events fired
from `UnitOfWork` during flush operation also contain the `ChangeSet` object.

```typescript
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
  originalEntity?: EntityData<T>; // snapshot of the entity when it was loaded from db
}

enum ChangeSetType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}
```

## Flush events

There is a special kind of events executed during the commit phase (flush operation).
They are executed before, during and after the flush, and they are not bound to any
entity in particular. 

- `beforeFlush` is executed before change sets are computed, this is the only
  event where it is safe to persist new entities. 
- `onFlush` is executed after the change sets are computed.
- `afterFlush` is executed as the last step just before the `flush` call resolves.
  it will be executed even if there are no changes to be flushed. 

Flush event args will not contain any entity instance, as they are entity agnostic.
They do contain additional reference to the `UnitOfWork` instance.

```typescript
interface FlushEventArgs extends Omit<EventArgs<unknown>, 'entity'> {
  uow?: UnitOfWork;
}
``` 

> Flush events are entity agnostic, specifying `getSubscribedEntities()` method
> will not have any effect for those. They are fired only once per the `flush` 
> operation.

### Getting the changes from UnitOfWork

You can observe all the changes that are part of given UnitOfWork via those methods:

```typescript
UnitOfWork.getChangeSets(): ChangeSet<AnyEntity>[];
UnitOfWork.getOriginalEntityData(): Map<string, EntityData<AnyEntity>>;
UnitOfWork.getPersistStack(): Set<AnyEntity>;
UnitOfWork.getRemoveStack(): Set<AnyEntity>;
UnitOfWork.getCollectionUpdates(): Collection<AnyEntity>[];
UnitOfWork.getExtraUpdates(): Set<[AnyEntity, string, (AnyEntity | Reference<AnyEntity>)]>;
```

### Using onFlush event

In following example we have 2 entities: `FooBar` and `FooBaz`, connected via 
M:1 relation. Our subscriber will automatically create new `FooBaz` entity and 
connect it to the `FooBar` when we detect it in the change sets.

We first use `uow.getChangeSets()` method to look up the change set of entity
we are interested in. After we create the `FooBaz` instance and link it with 
`FooBar`, we need to do two things:

1. Call `uow.computeChangeSet(baz)` to compute the change set of newly created 
  `FooBaz` entity
2. Call `uow.recomputeSingleChangeSet(cs.entity)` to recalculate the existing 
  change set of the `FooBar` entity.

```typescript
@Subscriber()
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
await em.persistAndFlush(bar);
```
