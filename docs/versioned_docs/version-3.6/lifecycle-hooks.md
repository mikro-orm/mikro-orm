---
title: Lifecycle Hooks
---

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
