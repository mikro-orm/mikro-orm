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

\+ **new RequestContext**(`map`: Map&#60;string, [EntityManager](entitymanager.md)>): [RequestContext](requestcontext.md)

*Defined in [packages/core/src/utils/RequestContext.ts:14](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/RequestContext.ts#L14)*

#### Parameters:

Name | Type |
------ | ------ |
`map` | Map&#60;string, [EntityManager](entitymanager.md)> |

**Returns:** [RequestContext](requestcontext.md)

## Properties

### id

• `Readonly` **id**: number = RequestContext.counter++

*Defined in [packages/core/src/utils/RequestContext.ts:14](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/RequestContext.ts#L14)*

___

### map

• `Readonly` **map**: Map&#60;string, [EntityManager](entitymanager.md)>

*Defined in [packages/core/src/utils/RequestContext.ts:16](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/RequestContext.ts#L16)*

___

### counter

▪ `Static` `Private` **counter**: number = 1

*Defined in [packages/core/src/utils/RequestContext.ts:13](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/RequestContext.ts#L13)*

## Accessors

### em

• get **em**(): [EntityManager](entitymanager.md) \| undefined

*Defined in [packages/core/src/utils/RequestContext.ts:21](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/RequestContext.ts#L21)*

Returns default EntityManager.

**Returns:** [EntityManager](entitymanager.md) \| undefined

## Methods

### create

▸ `Static`**create**(`em`: [EntityManager](entitymanager.md) \| [EntityManager](entitymanager.md)[], `next`: (...args: any[]) => void): void

*Defined in [packages/core/src/utils/RequestContext.ts:28](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/RequestContext.ts#L28)*

Creates new RequestContext instance and runs the code inside its domain.

#### Parameters:

Name | Type |
------ | ------ |
`em` | [EntityManager](entitymanager.md) \| [EntityManager](entitymanager.md)[] |
`next` | (...args: any[]) => void |

**Returns:** void

___

### createAsync

▸ `Static`**createAsync**(`em`: [EntityManager](entitymanager.md) \| [EntityManager](entitymanager.md)[], `next`: (...args: any[]) => Promise&#60;void>): Promise&#60;void>

*Defined in [packages/core/src/utils/RequestContext.ts:37](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/RequestContext.ts#L37)*

Creates new RequestContext instance and runs the code inside its domain.
Async variant, when the `next` handler needs to be awaited (like in Koa).

#### Parameters:

Name | Type |
------ | ------ |
`em` | [EntityManager](entitymanager.md) \| [EntityManager](entitymanager.md)[] |
`next` | (...args: any[]) => Promise&#60;void> |

**Returns:** Promise&#60;void>

___

### createDomain

▸ `Static` `Private`**createDomain**(`em`: [EntityManager](entitymanager.md) \| [EntityManager](entitymanager.md)[]): [ORMDomain](../index.md#ormdomain)

*Defined in [packages/core/src/utils/RequestContext.ts:60](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/RequestContext.ts#L60)*

#### Parameters:

Name | Type |
------ | ------ |
`em` | [EntityManager](entitymanager.md) \| [EntityManager](entitymanager.md)[] |

**Returns:** [ORMDomain](../index.md#ormdomain)

___

### currentRequestContext

▸ `Static`**currentRequestContext**(): [RequestContext](requestcontext.md) \| undefined

*Defined in [packages/core/src/utils/RequestContext.ts:47](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/RequestContext.ts#L47)*

Returns current RequestContext (if available).

**Returns:** [RequestContext](requestcontext.md) \| undefined

___

### getEntityManager

▸ `Static`**getEntityManager**(`name?`: string): [EntityManager](entitymanager.md) \| undefined

*Defined in [packages/core/src/utils/RequestContext.ts:55](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/RequestContext.ts#L55)*

Returns current EntityManager (if available).

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`name` | string | "default" |

**Returns:** [EntityManager](entitymanager.md) \| undefined
