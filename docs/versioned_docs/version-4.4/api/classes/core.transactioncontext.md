---
id: "core.transactioncontext"
title: "Class: TransactionContext"
sidebar_label: "TransactionContext"
hide_title: true
---

# Class: TransactionContext

[core](../modules/core.md).TransactionContext

## Hierarchy

* **TransactionContext**

## Constructors

### constructor

\+ **new TransactionContext**(`em`: [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>): [*TransactionContext*](core.transactioncontext.md)

#### Parameters:

Name | Type |
------ | ------ |
`em` | [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |

**Returns:** [*TransactionContext*](core.transactioncontext.md)

Defined in: [packages/core/src/utils/TransactionContext.ts:9](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/TransactionContext.ts#L9)

## Properties

### em

• `Readonly` **em**: [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

___

### id

• `Readonly` **id**: *number*

Defined in: [packages/core/src/utils/TransactionContext.ts:9](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/TransactionContext.ts#L9)

## Methods

### createAsync

▸ `Static`**createAsync**<T\>(`em`: [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>, `next`: (...`args`: *any*[]) => *Promise*<T\>): *Promise*<T\>

Creates new TransactionContext instance and runs the code inside its domain.

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`em` | [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |
`next` | (...`args`: *any*[]) => *Promise*<T\> |

**Returns:** *Promise*<T\>

Defined in: [packages/core/src/utils/TransactionContext.ts:16](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/TransactionContext.ts#L16)

___

### currentTransactionContext

▸ `Static`**currentTransactionContext**(): *undefined* \| [*TransactionContext*](core.transactioncontext.md)

Returns current TransactionContext (if available).

**Returns:** *undefined* \| [*TransactionContext*](core.transactioncontext.md)

Defined in: [packages/core/src/utils/TransactionContext.ts:31](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/TransactionContext.ts#L31)

___

### getEntityManager

▸ `Static`**getEntityManager**(): *undefined* \| [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

Returns current EntityManager (if available).

**Returns:** *undefined* \| [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

Defined in: [packages/core/src/utils/TransactionContext.ts:39](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/TransactionContext.ts#L39)
