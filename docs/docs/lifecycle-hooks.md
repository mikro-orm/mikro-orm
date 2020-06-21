---
title: Lifecycle Hooks and EventSubscriber
sidebar_label: Hooks and Events
---

There are two ways to hook to the lifecycle of an entity: 

- **Lifecycle hooks** are methods defined on the entity prototype.
- **EventSubscriber**s are classes that can be used to hook to multiple entities
  or when you do not want to have the method present on the entity prototype.

## Hooks

You can use lifecycle hooks to run some code when entity gets persisted. You can mark any of
entity methods with them, you can also mark multiple methods with same hook.

All hooks support async methods with one exception - `@OnInit`.

- `@OnInit` is fired when new instance of entity is created, either manually `em.create()`, or 
automatically when new entities are loaded from database

- `@BeforeCreate()` and `@BeforeUpdate()` is fired right before we persist the entity in database

- `@AfterCreate()` and `@AfterUpdate()` is fired right after the entity is updated in database and 
merged to identity map. Since this event entity will have reference to `EntityManager` and will be 
enabled to call `entity.init()` method (including all entity references and collections).

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

> The **internal** instance of `EntityManager` accessible under `wrap(this).__em` is 
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

  getSubscribedEntities(): EntityName<Author2>[] {
    return [Author2];
  }

  async afterCreate(args: EventArgs<Author2>): Promise<void> {
    // ...
  }

  async afterUpdate(args: EventArgs<Author2>): Promise<void> {
    // ... 
  }

}
```

Another example, where we register to all the events and all entities: 

```typescript
import { EventArgs, EventSubscriber, Subscriber } from '@mikro-orm/core';

@Subscriber()
export class EverythingSubscriber implements EventSubscriber {

  async afterCreate<T>(args: EventArgs<T>): Promise<void> { ... }
  async afterDelete<T>(args: EventArgs<T>): Promise<void> { ... }
  async afterUpdate<T>(args: EventArgs<T>): Promise<void> { ... }
  async beforeCreate<T>(args: EventArgs<T>): Promise<void> { ... }
  async beforeDelete<T>(args: EventArgs<T>): Promise<void> { ... }
  async beforeUpdate<T>(args: EventArgs<T>): Promise<void> { ... }
  onInit<T>(args: EventArgs<T>): void { ... }

}
```
