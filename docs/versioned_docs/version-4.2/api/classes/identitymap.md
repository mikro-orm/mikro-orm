---
id: "identitymap"
title: "Class: IdentityMap"
sidebar_label: "IdentityMap"
---

## Hierarchy

* **IdentityMap**

## Properties

### registry

• `Private` `Readonly` **registry**: Map&#60;[Constructor](../index.md#constructor)&#60;[AnyEntity](../index.md#anyentity)&#60;any>>, Map&#60;string, [AnyEntity](../index.md#anyentity)&#60;any>>> = new Map&#60;Constructor&#60;AnyEntity>, Map&#60;string, AnyEntity>>()

*Defined in [packages/core/src/unit-of-work/IdentityMap.ts:5](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/unit-of-work/IdentityMap.ts#L5)*

## Methods

### clear

▸ **clear**(): void

*Defined in [packages/core/src/unit-of-work/IdentityMap.ts:33](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/unit-of-work/IdentityMap.ts#L33)*

**Returns:** void

___

### delete

▸ **delete**&#60;T>(`item`: T): void

*Defined in [packages/core/src/unit-of-work/IdentityMap.ts:11](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/unit-of-work/IdentityMap.ts#L11)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`item` | T |

**Returns:** void

___

### get

▸ **get**&#60;T>(`hash`: string): T \| undefined

*Defined in [packages/core/src/unit-of-work/IdentityMap.ts:60](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/unit-of-work/IdentityMap.ts#L60)*

For back compatibility only.

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`hash` | string |

**Returns:** T \| undefined

___

### getByHash

▸ **getByHash**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `hash`: string): T \| undefined

*Defined in [packages/core/src/unit-of-work/IdentityMap.ts:15](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/unit-of-work/IdentityMap.ts#L15)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`hash` | string |

**Returns:** T \| undefined

___

### getStore

▸ **getStore**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>): Map&#60;string, T>

*Defined in [packages/core/src/unit-of-work/IdentityMap.ts:20](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/unit-of-work/IdentityMap.ts#L20)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |

**Returns:** Map&#60;string, T>

___

### keys

▸ **keys**(): string[]

*Defined in [packages/core/src/unit-of-work/IdentityMap.ts:47](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/unit-of-work/IdentityMap.ts#L47)*

**Returns:** string[]

___

### store

▸ **store**&#60;T>(`item`: T): void

*Defined in [packages/core/src/unit-of-work/IdentityMap.ts:7](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/unit-of-work/IdentityMap.ts#L7)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`item` | T |

**Returns:** void

___

### values

▸ **values**(): [AnyEntity](../index.md#anyentity)[]

*Defined in [packages/core/src/unit-of-work/IdentityMap.ts:37](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/unit-of-work/IdentityMap.ts#L37)*

**Returns:** [AnyEntity](../index.md#anyentity)[]
