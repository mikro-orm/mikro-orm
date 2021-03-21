---
id: "core.reference"
title: "Class: Reference<T>"
sidebar_label: "Reference"
custom_edit_url: null
hide_title: true
---

# Class: Reference<T\>

[core](../modules/core.md).Reference

## Type parameters

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

## Hierarchy

* **Reference**

  ↳ [*LoadedReference*](../interfaces/core.loadedreference.md)

## Constructors

### constructor

\+ **new Reference**<T\>(`entity`: T): [*Reference*](core.reference.md)<T\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |

**Returns:** [*Reference*](core.reference.md)<T\>

Defined in: [packages/core/src/entity/Reference.ts:6](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Reference.ts#L6)

## Methods

### getEntity

▸ **getEntity**(): T

**Returns:** T

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

Defined in: [packages/core/src/entity/Reference.ts:116](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Reference.ts#L116)

___

### isInitialized

▸ **isInitialized**(): *boolean*

**Returns:** *boolean*

Defined in: [packages/core/src/entity/Reference.ts:120](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Reference.ts#L120)

___

### load

▸ **load**(): *Promise*<T\>

Ensures the underlying entity is loaded first (without reloading it if it already is loaded).
Returns the entity.

**Returns:** *Promise*<T\>

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

Defined in: [packages/core/src/entity/Reference.ts:73](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Reference.ts#L73)

___

### populated

▸ **populated**(`populated?`: *boolean*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`populated?` | *boolean* |

**Returns:** *void*

Defined in: [packages/core/src/entity/Reference.ts:124](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Reference.ts#L124)

___

### set

▸ **set**(`entity`: T \| [*IdentifiedReference*](../modules/core.md#identifiedreference)<T, [*PrimaryProperty*](../modules/core.md#primaryproperty)<T\>\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T \| [*IdentifiedReference*](../modules/core.md#identifiedreference)<T, [*PrimaryProperty*](../modules/core.md#primaryproperty)<T\>\> |

**Returns:** *void*

Defined in: [packages/core/src/entity/Reference.ts:91](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Reference.ts#L91)

___

### toJSON

▸ **toJSON**(...`args`: *any*[]): [*Dictionary*](../modules/core.md#dictionary)<any\>

#### Parameters:

Name | Type |
:------ | :------ |
`...args` | *any*[] |

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<any\>

Defined in: [packages/core/src/entity/Reference.ts:128](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Reference.ts#L128)

___

### unwrap

▸ **unwrap**(): T

**Returns:** T

Defined in: [packages/core/src/entity/Reference.ts:104](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Reference.ts#L104)

___

### create

▸ `Static`**create**<T, PK\>(`entity`: T \| [*IdentifiedReference*](../modules/core.md#identifiedreference)<T, PK\>): [*IdentifiedReference*](../modules/core.md#identifiedreference)<T, PK\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | - |
`PK` | *unknown* | [*PrimaryProperty*](../modules/core.md#primaryproperty)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T \| [*IdentifiedReference*](../modules/core.md#identifiedreference)<T, PK\> |

**Returns:** [*IdentifiedReference*](../modules/core.md#identifiedreference)<T, PK\>

Defined in: [packages/core/src/entity/Reference.ts:30](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Reference.ts#L30)

___

### isReference

▸ `Static`**isReference**<T\>(`data`: *any*): data is Reference<T\>

Checks whether the argument is instance or `Reference` wrapper.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`data` | *any* |

**Returns:** data is Reference<T\>

Defined in: [packages/core/src/entity/Reference.ts:41](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Reference.ts#L41)

___

### unwrapReference

▸ `Static`**unwrapReference**<T\>(`ref`: T \| [*Reference*](core.reference.md)<T\>): T

Returns wrapped entity.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`ref` | T \| [*Reference*](core.reference.md)<T\> |

**Returns:** T

Defined in: [packages/core/src/entity/Reference.ts:59](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Reference.ts#L59)

___

### wrapReference

▸ `Static`**wrapReference**<T\>(`entity`: T \| [*Reference*](core.reference.md)<T\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>): T \| [*Reference*](core.reference.md)<T\>

Wraps the entity in a `Reference` wrapper if the property is defined as `wrappedReference`.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T \| [*Reference*](core.reference.md)<T\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |

**Returns:** T \| [*Reference*](core.reference.md)<T\>

Defined in: [packages/core/src/entity/Reference.ts:48](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Reference.ts#L48)
