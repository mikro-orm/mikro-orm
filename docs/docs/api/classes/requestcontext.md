---
id: "requestcontext"
title: "Class: RequestContext"
sidebar_label: "RequestContext"
---

For node 14 and above it is suggested to use `AsyncLocalStorage` instead,

**`see`** https://mikro-orm.io/docs/async-local-storage/

## Hierarchy

* **RequestContext**

## Constructors

### constructor

\+ **new RequestContext**(`em`: [EntityManager](entitymanager.md)): [RequestContext](requestcontext.md)

*Defined in [packages/core/src/utils/RequestContext.ts:13](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/RequestContext.ts#L13)*

#### Parameters:

Name | Type |
------ | ------ |
`em` | [EntityManager](entitymanager.md) |

**Returns:** [RequestContext](requestcontext.md)

## Properties

### em

• `Readonly` **em**: [EntityManager](entitymanager.md)

*Defined in [packages/core/src/utils/RequestContext.ts:15](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/RequestContext.ts#L15)*

___

### id

• `Readonly` **id**: number = this.em.id

*Defined in [packages/core/src/utils/RequestContext.ts:13](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/RequestContext.ts#L13)*

## Methods

### create

▸ `Static`**create**(`em`: [EntityManager](entitymanager.md), `next`: (...args: any[]) => void): void

*Defined in [packages/core/src/utils/RequestContext.ts:20](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/RequestContext.ts#L20)*

Creates new RequestContext instance and runs the code inside its domain.

#### Parameters:

Name | Type |
------ | ------ |
`em` | [EntityManager](entitymanager.md) |
`next` | (...args: any[]) => void |

**Returns:** void

___

### createAsync

▸ `Static`**createAsync**(`em`: [EntityManager](entitymanager.md), `next`: (...args: any[]) => Promise&#60;void>): Promise&#60;void>

*Defined in [packages/core/src/utils/RequestContext.ts:31](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/RequestContext.ts#L31)*

Creates new RequestContext instance and runs the code inside its domain.
Async variant, when the `next` handler needs to be awaited (like in Koa).

#### Parameters:

Name | Type |
------ | ------ |
`em` | [EntityManager](entitymanager.md) |
`next` | (...args: any[]) => Promise&#60;void> |

**Returns:** Promise&#60;void>

___

### currentRequestContext

▸ `Static`**currentRequestContext**(): [RequestContext](requestcontext.md) \| undefined

*Defined in [packages/core/src/utils/RequestContext.ts:43](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/RequestContext.ts#L43)*

Returns current RequestContext (if available).

**Returns:** [RequestContext](requestcontext.md) \| undefined

___

### getEntityManager

▸ `Static`**getEntityManager**(): [EntityManager](entitymanager.md) \| undefined

*Defined in [packages/core/src/utils/RequestContext.ts:51](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/RequestContext.ts#L51)*

Returns current EntityManager (if available).

**Returns:** [EntityManager](entitymanager.md) \| undefined
