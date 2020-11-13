---
id: "transactioncontext"
title: "Class: TransactionContext"
sidebar_label: "TransactionContext"
---

## Hierarchy

* **TransactionContext**

## Constructors

### constructor

\+ **new TransactionContext**(`em`: [EntityManager](entitymanager.md)): [TransactionContext](transactioncontext.md)

*Defined in [packages/core/src/utils/TransactionContext.ts:9](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/TransactionContext.ts#L9)*

#### Parameters:

Name | Type |
------ | ------ |
`em` | [EntityManager](entitymanager.md) |

**Returns:** [TransactionContext](transactioncontext.md)

## Properties

### em

• `Readonly` **em**: [EntityManager](entitymanager.md)

*Defined in [packages/core/src/utils/TransactionContext.ts:11](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/TransactionContext.ts#L11)*

___

### id

• `Readonly` **id**: number = this.em.id

*Defined in [packages/core/src/utils/TransactionContext.ts:9](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/TransactionContext.ts#L9)*

## Methods

### createAsync

▸ `Static`**createAsync**&#60;T>(`em`: [EntityManager](entitymanager.md), `next`: (...args: any[]) => Promise&#60;T>): Promise&#60;T>

*Defined in [packages/core/src/utils/TransactionContext.ts:16](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/TransactionContext.ts#L16)*

Creates new TransactionContext instance and runs the code inside its domain.

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`em` | [EntityManager](entitymanager.md) |
`next` | (...args: any[]) => Promise&#60;T> |

**Returns:** Promise&#60;T>

___

### currentTransactionContext

▸ `Static`**currentTransactionContext**(): [TransactionContext](transactioncontext.md) \| undefined

*Defined in [packages/core/src/utils/TransactionContext.ts:31](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/TransactionContext.ts#L31)*

Returns current TransactionContext (if available).

**Returns:** [TransactionContext](transactioncontext.md) \| undefined

___

### getEntityManager

▸ `Static`**getEntityManager**(): [EntityManager](entitymanager.md) \| undefined

*Defined in [packages/core/src/utils/TransactionContext.ts:39](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/TransactionContext.ts#L39)*

Returns current EntityManager (if available).

**Returns:** [EntityManager](entitymanager.md) \| undefined
