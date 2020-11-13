---
id: "reference"
title: "Class: Reference<T>"
sidebar_label: "Reference"
---

## Type parameters

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

## Hierarchy

* **Reference**

  ↳ [LoadedReference](../interfaces/loadedreference.md)

## Constructors

### constructor

\+ **new Reference**(`entity`: T): [Reference](reference.md)

*Defined in [packages/core/src/entity/Reference.ts:6](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Reference.ts#L6)*

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |

**Returns:** [Reference](reference.md)

## Properties

### entity

• `Private` **entity**: T

*Defined in [packages/core/src/entity/Reference.ts:8](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Reference.ts#L8)*

## Methods

### getEntity

▸ **getEntity**(): T

*Defined in [packages/core/src/entity/Reference.ts:108](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Reference.ts#L108)*

**Returns:** T

___

### getProperty

▸ **getProperty**&#60;K>(`prop`: K): T[K]

*Defined in [packages/core/src/entity/Reference.ts:116](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Reference.ts#L116)*

#### Type parameters:

Name | Type |
------ | ------ |
`K` | keyof T |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | K |

**Returns:** T[K]

___

### isInitialized

▸ **isInitialized**(): boolean

*Defined in [packages/core/src/entity/Reference.ts:120](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Reference.ts#L120)*

**Returns:** boolean

___

### load

▸ **load**(): Promise&#60;T>

*Defined in [packages/core/src/entity/Reference.ts:67](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Reference.ts#L67)*

Ensures the underlying entity is loaded first (without reloading it if it already is loaded).
Returns the entity.

**Returns:** Promise&#60;T>

▸ **load**&#60;K>(`prop`: K): Promise&#60;T[K]>

*Defined in [packages/core/src/entity/Reference.ts:73](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Reference.ts#L73)*

Ensures the underlying entity is loaded first (without reloading it if it already is loaded).
Returns the requested property instead of the whole entity.

#### Type parameters:

Name | Type |
------ | ------ |
`K` | keyof T |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | K |

**Returns:** Promise&#60;T[K]>

___

### populated

▸ **populated**(`populated?`: boolean): void

*Defined in [packages/core/src/entity/Reference.ts:124](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Reference.ts#L124)*

#### Parameters:

Name | Type |
------ | ------ |
`populated?` | boolean |

**Returns:** void

___

### set

▸ **set**(`entity`: T \| [IdentifiedReference](../index.md#identifiedreference)&#60;T>): void

*Defined in [packages/core/src/entity/Reference.ts:91](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Reference.ts#L91)*

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T \| [IdentifiedReference](../index.md#identifiedreference)&#60;T> |

**Returns:** void

___

### toJSON

▸ **toJSON**(...`args`: any[]): [Dictionary](../index.md#dictionary)

*Defined in [packages/core/src/entity/Reference.ts:128](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Reference.ts#L128)*

#### Parameters:

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** [Dictionary](../index.md#dictionary)

___

### unwrap

▸ **unwrap**(): T

*Defined in [packages/core/src/entity/Reference.ts:104](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Reference.ts#L104)*

**Returns:** T

___

### create

▸ `Static`**create**&#60;T, PK>(`entity`: T \| [IdentifiedReference](../index.md#identifiedreference)&#60;T, PK>): [IdentifiedReference](../index.md#identifiedreference)&#60;T, PK>

*Defined in [packages/core/src/entity/Reference.ts:30](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Reference.ts#L30)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | - |
`PK` | keyof T \| unknown | PrimaryProperty\&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T \| [IdentifiedReference](../index.md#identifiedreference)&#60;T, PK> |

**Returns:** [IdentifiedReference](../index.md#identifiedreference)&#60;T, PK>

___

### isReference

▸ `Static`**isReference**&#60;T>(`data`: any): data is Reference&#60;T>

*Defined in [packages/core/src/entity/Reference.ts:41](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Reference.ts#L41)*

Checks whether the argument is instance or `Reference` wrapper.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`data` | any |

**Returns:** data is Reference&#60;T>

___

### unwrapReference

▸ `Static`**unwrapReference**&#60;T>(`ref`: T \| [Reference](reference.md)&#60;T>): T

*Defined in [packages/core/src/entity/Reference.ts:59](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Reference.ts#L59)*

Returns wrapped entity.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`ref` | T \| [Reference](reference.md)&#60;T> |

**Returns:** T

___

### wrapReference

▸ `Static`**wrapReference**&#60;T>(`entity`: T \| [Reference](reference.md)&#60;T>, `prop`: [EntityProperty](../interfaces/entityproperty.md)&#60;T>): [Reference](reference.md)&#60;T> \| T

*Defined in [packages/core/src/entity/Reference.ts:48](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Reference.ts#L48)*

Wraps the entity in a `Reference` wrapper if the property is defined as `wrappedReference`.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T \| [Reference](reference.md)&#60;T> |
`prop` | [EntityProperty](../interfaces/entityproperty.md)&#60;T> |

**Returns:** [Reference](reference.md)&#60;T> \| T
