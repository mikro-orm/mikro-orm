---
id: "core.identitymap"
title: "Class: IdentityMap"
sidebar_label: "IdentityMap"
custom_edit_url: null
hide_title: true
---

# Class: IdentityMap

[core](../modules/core.md).IdentityMap

## Constructors

### constructor

\+ **new IdentityMap**(): [*IdentityMap*](core.identitymap.md)

**Returns:** [*IdentityMap*](core.identitymap.md)

## Properties

### registry

• `Private` `Readonly` **registry**: *Map*<[*Constructor*](../modules/core.md#constructor)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>, Map<string, [*AnyEntity*](../modules/core.md#anyentity)<any\>\>\>

Defined in: [packages/core/src/unit-of-work/IdentityMap.ts:5](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/IdentityMap.ts#L5)

## Methods

### [Symbol.iterator]

▸ **[Symbol.iterator]**(): *IterableIterator*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

**Returns:** *IterableIterator*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Defined in: [packages/core/src/unit-of-work/IdentityMap.ts:47](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/IdentityMap.ts#L47)

___

### clear

▸ **clear**(): *void*

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/IdentityMap.ts:33](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/IdentityMap.ts#L33)

___

### delete

▸ **delete**<T\>(`item`: T): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`item` | T |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/IdentityMap.ts:11](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/IdentityMap.ts#L11)

___

### get

▸ **get**<T\>(`hash`: *string*): *undefined* \| T

For back compatibility only.

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`hash` | *string* |

**Returns:** *undefined* \| T

Defined in: [packages/core/src/unit-of-work/IdentityMap.ts:68](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/IdentityMap.ts#L68)

___

### getByHash

▸ **getByHash**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `hash`: *string*): *undefined* \| T

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`hash` | *string* |

**Returns:** *undefined* \| T

Defined in: [packages/core/src/unit-of-work/IdentityMap.ts:15](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/IdentityMap.ts#L15)

___

### getStore

▸ **getStore**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>): *Map*<string, T\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |

**Returns:** *Map*<string, T\>

Defined in: [packages/core/src/unit-of-work/IdentityMap.ts:20](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/IdentityMap.ts#L20)

___

### keys

▸ **keys**(): *string*[]

**Returns:** *string*[]

Defined in: [packages/core/src/unit-of-work/IdentityMap.ts:55](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/IdentityMap.ts#L55)

___

### store

▸ **store**<T\>(`item`: T): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`item` | T |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/IdentityMap.ts:7](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/IdentityMap.ts#L7)

___

### values

▸ **values**(): [*AnyEntity*](../modules/core.md#anyentity)<any\>[]

**Returns:** [*AnyEntity*](../modules/core.md#anyentity)<any\>[]

Defined in: [packages/core/src/unit-of-work/IdentityMap.ts:37](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/IdentityMap.ts#L37)
