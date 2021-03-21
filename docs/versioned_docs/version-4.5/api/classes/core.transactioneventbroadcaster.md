---
id: "core.transactioneventbroadcaster"
title: "Class: TransactionEventBroadcaster"
sidebar_label: "TransactionEventBroadcaster"
custom_edit_url: null
hide_title: true
---

# Class: TransactionEventBroadcaster

[core](../modules/core.md).TransactionEventBroadcaster

## Constructors

### constructor

\+ **new TransactionEventBroadcaster**(`em`: [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>, `uow?`: [*UnitOfWork*](core.unitofwork.md)): [*TransactionEventBroadcaster*](core.transactioneventbroadcaster.md)

#### Parameters:

Name | Type |
:------ | :------ |
`em` | [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |
`uow?` | [*UnitOfWork*](core.unitofwork.md) |

**Returns:** [*TransactionEventBroadcaster*](core.transactioneventbroadcaster.md)

Defined in: [packages/core/src/events/TransactionEventBroadcaster.ts:8](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/TransactionEventBroadcaster.ts#L8)

## Properties

### eventManager

• `Private` `Readonly` **eventManager**: [*EventManager*](core.eventmanager.md)

Defined in: [packages/core/src/events/TransactionEventBroadcaster.ts:8](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/TransactionEventBroadcaster.ts#L8)

## Methods

### dispatchEvent

▸ **dispatchEvent**(`event`: [*TransactionEventType*](../modules/core.md#transactioneventtype), `transaction?`: *any*): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`event` | [*TransactionEventType*](../modules/core.md#transactioneventtype) |
`transaction?` | *any* |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/events/TransactionEventBroadcaster.ts:13](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/TransactionEventBroadcaster.ts#L13)
