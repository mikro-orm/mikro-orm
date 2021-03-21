---
id: "core.transactioneventargs"
title: "Interface: TransactionEventArgs"
sidebar_label: "TransactionEventArgs"
custom_edit_url: null
hide_title: true
---

# Interface: TransactionEventArgs

[core](../modules/core.md).TransactionEventArgs

## Hierarchy

* *Omit*<[*EventArgs*](core.eventargs.md)<unknown\>, *entity* \| *changeSet*\>

  ↳ **TransactionEventArgs**

## Properties

### em

• **em**: [*EntityManager*](../classes/core.entitymanager.md)<[*IDatabaseDriver*](core.idatabasedriver.md)<[*Connection*](../classes/core.connection.md)\>\>

Inherited from: void

Defined in: [packages/core/src/events/EventSubscriber.ts:8](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventSubscriber.ts#L8)

___

### transaction

• `Optional` **transaction**: *any*

Defined in: [packages/core/src/events/EventSubscriber.ts:17](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventSubscriber.ts#L17)

___

### uow

• `Optional` **uow**: [*UnitOfWork*](../classes/core.unitofwork.md)

Defined in: [packages/core/src/events/EventSubscriber.ts:18](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventSubscriber.ts#L18)
