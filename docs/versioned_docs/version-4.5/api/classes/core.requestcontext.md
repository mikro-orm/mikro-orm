---
id: "core.requestcontext"
title: "Class: RequestContext"
sidebar_label: "RequestContext"
custom_edit_url: null
hide_title: true
---

# Class: RequestContext

[core](../modules/core.md).RequestContext

For node 14 and above it is suggested to use `AsyncLocalStorage` instead,

**`see`** https://mikro-orm.io/docs/async-local-storage/

## Constructors

### constructor

\+ **new RequestContext**(`map`: *Map*<string, [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>\>): [*RequestContext*](core.requestcontext.md)

#### Parameters:

Name | Type |
:------ | :------ |
`map` | *Map*<string, [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>\> |

**Returns:** [*RequestContext*](core.requestcontext.md)

Defined in: [packages/core/src/utils/RequestContext.ts:14](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/RequestContext.ts#L14)

## Properties

### id

• `Readonly` **id**: *number*

Defined in: [packages/core/src/utils/RequestContext.ts:14](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/RequestContext.ts#L14)

___

### map

• `Readonly` **map**: *Map*<string, [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>\>

___

### counter

▪ `Private` `Static` **counter**: *number*= 1

Defined in: [packages/core/src/utils/RequestContext.ts:13](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/RequestContext.ts#L13)

## Accessors

### em

• get **em**(): *undefined* \| [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

Returns default EntityManager.

**Returns:** *undefined* \| [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

Defined in: [packages/core/src/utils/RequestContext.ts:21](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/RequestContext.ts#L21)

## Methods

### create

▸ `Static`**create**(`em`: [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> \| [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>[], `next`: (...`args`: *any*[]) => *void*): *void*

Creates new RequestContext instance and runs the code inside its domain.

#### Parameters:

Name | Type |
:------ | :------ |
`em` | [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> \| [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>[] |
`next` | (...`args`: *any*[]) => *void* |

**Returns:** *void*

Defined in: [packages/core/src/utils/RequestContext.ts:28](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/RequestContext.ts#L28)

___

### createAsync

▸ `Static`**createAsync**(`em`: [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> \| [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>[], `next`: (...`args`: *any*[]) => *Promise*<void\>): *Promise*<void\>

Creates new RequestContext instance and runs the code inside its domain.
Async variant, when the `next` handler needs to be awaited (like in Koa).

#### Parameters:

Name | Type |
:------ | :------ |
`em` | [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> \| [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>[] |
`next` | (...`args`: *any*[]) => *Promise*<void\> |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/utils/RequestContext.ts:37](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/RequestContext.ts#L37)

___

### createDomain

▸ `Private` `Static`**createDomain**(`em`: [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> \| [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>[]): [*ORMDomain*](../modules/core.md#ormdomain)

#### Parameters:

Name | Type |
:------ | :------ |
`em` | [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> \| [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>[] |

**Returns:** [*ORMDomain*](../modules/core.md#ormdomain)

Defined in: [packages/core/src/utils/RequestContext.ts:60](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/RequestContext.ts#L60)

___

### currentRequestContext

▸ `Static`**currentRequestContext**(): *undefined* \| [*RequestContext*](core.requestcontext.md)

Returns current RequestContext (if available).

**Returns:** *undefined* \| [*RequestContext*](core.requestcontext.md)

Defined in: [packages/core/src/utils/RequestContext.ts:47](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/RequestContext.ts#L47)

___

### getEntityManager

▸ `Static`**getEntityManager**(`name?`: *string*): *undefined* \| [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

Returns current EntityManager (if available).

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`name` | *string* | 'default' |

**Returns:** *undefined* \| [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

Defined in: [packages/core/src/utils/RequestContext.ts:55](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/RequestContext.ts#L55)
