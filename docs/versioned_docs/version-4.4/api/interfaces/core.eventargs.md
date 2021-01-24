---
id: "core.eventargs"
title: "Interface: EventArgs<T>"
sidebar_label: "EventArgs"
hide_title: true
---

# Interface: EventArgs<T\>

[core](../modules/core.md).EventArgs

## Type parameters

Name |
------ |
`T` |

## Hierarchy

* **EventArgs**

## Properties

### changeSet

• `Optional` **changeSet**: *undefined* \| [*ChangeSet*](../classes/core.changeset.md)<T\>

Defined in: [packages/core/src/events/EventSubscriber.ts:9](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/events/EventSubscriber.ts#L9)

___

### em

• **em**: [*EntityManager*](../classes/core.entitymanager.md)<[*IDatabaseDriver*](core.idatabasedriver.md)<[*Connection*](../classes/core.connection.md)\>\>

Defined in: [packages/core/src/events/EventSubscriber.ts:8](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/events/EventSubscriber.ts#L8)

___

### entity

• **entity**: T

Defined in: [packages/core/src/events/EventSubscriber.ts:7](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/events/EventSubscriber.ts#L7)
