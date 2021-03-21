---
id: "core.loadedreference"
title: "Interface: LoadedReference<T, P>"
sidebar_label: "LoadedReference"
custom_edit_url: null
hide_title: true
---

# Interface: LoadedReference<T, P\>

[core](../modules/core.md).LoadedReference

## Type parameters

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | - |
`P` | - | *never* |

## Hierarchy

* [*Reference*](../classes/core.reference.md)<T\>

  ↳ **LoadedReference**

## Properties

### $

• **$**: T & P

Defined in: [packages/core/src/typings.ts:385](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L385)

## Methods

### get

▸ **get**(): T & P

**Returns:** T & P

Defined in: [packages/core/src/typings.ts:386](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L386)

___

### getEntity

▸ **getEntity**(): T

**Returns:** T

Inherited from: [Reference](../classes/core.reference.md)

Defined in: [packages/core/src/entity/Reference.ts:108](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Reference.ts#L108)

___

### getProperty

▸ **getProperty**<K\>(`prop`: K): T[K]

#### Type parameters:

Name | Type |
:------ | :------ |
`K` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | K |

**Returns:** T[K]

Inherited from: [Reference](../classes/core.reference.md)

Defined in: [packages/core/src/entity/Reference.ts:116](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Reference.ts#L116)

___

### isInitialized

▸ **isInitialized**(): *boolean*

**Returns:** *boolean*

Inherited from: [Reference](../classes/core.reference.md)

Defined in: [packages/core/src/entity/Reference.ts:120](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Reference.ts#L120)

___

### load

▸ **load**(): *Promise*<T\>

Ensures the underlying entity is loaded first (without reloading it if it already is loaded).
Returns the entity.

**Returns:** *Promise*<T\>

Inherited from: [Reference](../classes/core.reference.md)

Defined in: [packages/core/src/entity/Reference.ts:67](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Reference.ts#L67)

▸ **load**<K\>(`prop`: K): *Promise*<T[K]\>

Ensures the underlying entity is loaded first (without reloading it if it already is loaded).
Returns the requested property instead of the whole entity.

#### Type parameters:

Name | Type |
:------ | :------ |
`K` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | K |

**Returns:** *Promise*<T[K]\>

Inherited from: [Reference](../classes/core.reference.md)

Defined in: [packages/core/src/entity/Reference.ts:73](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Reference.ts#L73)

___

### populated

▸ **populated**(`populated?`: *boolean*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`populated?` | *boolean* |

**Returns:** *void*

Inherited from: [Reference](../classes/core.reference.md)

Defined in: [packages/core/src/entity/Reference.ts:124](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Reference.ts#L124)

___

### set

▸ **set**(`entity`: T \| [*IdentifiedReference*](../modules/core.md#identifiedreference)<T, [*PrimaryProperty*](../modules/core.md#primaryproperty)<T\>\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T \| [*IdentifiedReference*](../modules/core.md#identifiedreference)<T, [*PrimaryProperty*](../modules/core.md#primaryproperty)<T\>\> |

**Returns:** *void*

Inherited from: [Reference](../classes/core.reference.md)

Defined in: [packages/core/src/entity/Reference.ts:91](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Reference.ts#L91)

___

### toJSON

▸ **toJSON**(...`args`: *any*[]): [*Dictionary*](../modules/core.md#dictionary)<any\>

#### Parameters:

Name | Type |
:------ | :------ |
`...args` | *any*[] |

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<any\>

Inherited from: [Reference](../classes/core.reference.md)

Defined in: [packages/core/src/entity/Reference.ts:128](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Reference.ts#L128)

___

### unwrap

▸ **unwrap**(): T

**Returns:** T

Inherited from: [Reference](../classes/core.reference.md)

Defined in: [packages/core/src/entity/Reference.ts:104](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Reference.ts#L104)
