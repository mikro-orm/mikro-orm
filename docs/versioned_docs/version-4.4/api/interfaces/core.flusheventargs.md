---
id: "core.flusheventargs"
title: "Interface: FlushEventArgs"
sidebar_label: "FlushEventArgs"
hide_title: true
---

# Interface: FlushEventArgs

[core](../modules/core.md).FlushEventArgs

## Hierarchy

* *Omit*<[*EventArgs*](core.eventargs.md)<*unknown*\>, *entity*\>

  ↳ **FlushEventArgs**

## Properties

### changeSet

• `Optional` **changeSet**: *undefined* \| [*ChangeSet*](../classes/core.changeset.md)<*unknown*\>

Defined in: [packages/core/src/events/EventSubscriber.ts:9](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/events/EventSubscriber.ts#L9)

___

### em

• **em**: [*EntityManager*](../classes/core.entitymanager.md)<[*IDatabaseDriver*](core.idatabasedriver.md)<[*Connection*](../classes/core.connection.md)\>\>

Defined in: [packages/core/src/events/EventSubscriber.ts:8](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/events/EventSubscriber.ts#L8)

___

### uow

• **uow**: [*UnitOfWork*](../classes/core.unitofwork.md)

Defined in: [packages/core/src/events/EventSubscriber.ts:13](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/events/EventSubscriber.ts#L13)
