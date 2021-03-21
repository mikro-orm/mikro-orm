---
id: "core.arraycollection"
title: "Class: ArrayCollection<T, O>"
sidebar_label: "ArrayCollection"
custom_edit_url: null
hide_title: true
---

# Class: ArrayCollection<T, O\>

[core](../modules/core.md).ArrayCollection

## Type parameters

Name |
:------ |
`T` |
`O` |

## Hierarchy

* **ArrayCollection**

  ↳ [*Collection*](core.collection.md)

## Indexable

▪ [k: *number*]: T

## Constructors

### constructor

\+ **new ArrayCollection**<T, O\>(`owner`: O & *Partial*<O\> & { `[EntityRepositoryType]?`: *unknown* ; `[PrimaryKeyType]?`: *unknown* ; `__helper?`: *IWrappedEntityInternal*<O, keyof O, keyof O\> ; `__meta?`: [*EntityMetadata*](core.entitymetadata.md)<O\> ; `__platform?`: [*Platform*](core.platform.md)  }, `items?`: T[]): [*ArrayCollection*](core.arraycollection.md)<T, O\>

#### Type parameters:

Name |
:------ |
`T` |
`O` |

#### Parameters:

Name | Type |
:------ | :------ |
`owner` | O & *Partial*<O\> & { `[EntityRepositoryType]?`: *unknown* ; `[PrimaryKeyType]?`: *unknown* ; `__helper?`: *IWrappedEntityInternal*<O, keyof O, keyof O\> ; `__meta?`: [*EntityMetadata*](core.entitymetadata.md)<O\> ; `__platform?`: [*Platform*](core.platform.md)  } |
`items?` | T[] |

**Returns:** [*ArrayCollection*](core.arraycollection.md)<T, O\>

Defined in: [packages/core/src/entity/ArrayCollection.ts:14](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L14)

## Properties

### \_count

• `Protected` `Optional` **\_count**: *number*

Defined in: [packages/core/src/entity/ArrayCollection.ts:13](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L13)

___

### \_property

• `Private` `Optional` **\_property**: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>

Defined in: [packages/core/src/entity/ArrayCollection.ts:14](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L14)

___

### initialized

• `Protected` **initialized**: *boolean*= true

Defined in: [packages/core/src/entity/ArrayCollection.ts:12](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L12)

___

### items

• `Protected` `Readonly` **items**: *Set*<T\>

Defined in: [packages/core/src/entity/ArrayCollection.ts:11](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L11)

___

### owner

• `Readonly` **owner**: O & *Partial*<O\> & { `[EntityRepositoryType]?`: *unknown* ; `[PrimaryKeyType]?`: *unknown* ; `__helper?`: *IWrappedEntityInternal*<O, keyof O, keyof O\> ; `__meta?`: [*EntityMetadata*](core.entitymetadata.md)<O\> ; `__platform?`: [*Platform*](core.platform.md)  }

## Accessors

### length

• get **length**(): *number*

**Returns:** *number*

Defined in: [packages/core/src/entity/ArrayCollection.ts:139](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L139)

___

### property

• get **property**(): [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>

**`internal`** 

**Returns:** [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>

Defined in: [packages/core/src/entity/ArrayCollection.ts:152](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L152)

## Methods

### [Symbol.iterator]

▸ **[Symbol.iterator]**(): *IterableIterator*<T\>

**Returns:** *IterableIterator*<T\>

Defined in: [packages/core/src/entity/ArrayCollection.ts:143](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L143)

___

### add

▸ **add**(...`items`: (T \| [*Reference*](core.reference.md)<T\>)[]): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`...items` | (T \| [*Reference*](core.reference.md)<T\>)[] |

**Returns:** *void*

Defined in: [packages/core/src/entity/ArrayCollection.ts:71](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L71)

___

### contains

▸ **contains**(`item`: T \| [*Reference*](core.reference.md)<T\>, `check?`: *boolean*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`item` | T \| [*Reference*](core.reference.md)<T\> |
`check?` | *boolean* |

**Returns:** *boolean*

Defined in: [packages/core/src/entity/ArrayCollection.ts:122](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L122)

___

### count

▸ **count**(): *number*

**Returns:** *number*

Defined in: [packages/core/src/entity/ArrayCollection.ts:127](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L127)

___

### getIdentifiers

▸ **getIdentifiers**<U\>(`field?`: *string*): U[]

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`U` | IPrimaryKeyValue | [*Primary*](../modules/core.md#primary)<T\> & IPrimaryKeyValue |

#### Parameters:

Name | Type |
:------ | :------ |
`field?` | *string* |

**Returns:** U[]

Defined in: [packages/core/src/entity/ArrayCollection.ts:53](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L53)

___

### getItems

▸ **getItems**(): T[]

**Returns:** T[]

Defined in: [packages/core/src/entity/ArrayCollection.ts:34](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L34)

___

### hydrate

▸ **hydrate**(`items`: T[]): *void*

**`internal`** 

#### Parameters:

Name | Type |
:------ | :------ |
`items` | T[] |

**Returns:** *void*

Defined in: [packages/core/src/entity/ArrayCollection.ts:92](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L92)

___

### incrementCount

▸ `Protected`**incrementCount**(`value`: *number*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`value` | *number* |

**Returns:** *void*

Defined in: [packages/core/src/entity/ArrayCollection.ts:202](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L202)

___

### isInitialized

▸ **isInitialized**(`fully?`: *boolean*): *boolean*

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`fully` | *boolean* | false |

**Returns:** *boolean*

Defined in: [packages/core/src/entity/ArrayCollection.ts:131](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L131)

___

### loadCount

▸ **loadCount**(): *Promise*<number\>

**Returns:** *Promise*<number\>

Defined in: [packages/core/src/entity/ArrayCollection.ts:30](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L30)

___

### propagate

▸ `Protected`**propagate**(`item`: T, `method`: *add* \| *remove*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`item` | T |
`method` | *add* \| *remove* |

**Returns:** *void*

Defined in: [packages/core/src/entity/ArrayCollection.ts:162](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L162)

___

### propagateToInverseSide

▸ `Protected`**propagateToInverseSide**(`item`: T, `method`: *add* \| *remove*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`item` | T |
`method` | *add* \| *remove* |

**Returns:** *void*

Defined in: [packages/core/src/entity/ArrayCollection.ts:170](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L170)

___

### propagateToOwningSide

▸ `Protected`**propagateToOwningSide**(`item`: T, `method`: *add* \| *remove*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`item` | T |
`method` | *add* \| *remove* |

**Returns:** *void*

Defined in: [packages/core/src/entity/ArrayCollection.ts:178](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L178)

___

### remove

▸ **remove**(...`items`: (T \| [*Reference*](core.reference.md)<T\>)[]): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`...items` | (T \| [*Reference*](core.reference.md)<T\>)[] |

**Returns:** *void*

Defined in: [packages/core/src/entity/ArrayCollection.ts:102](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L102)

___

### removeAll

▸ **removeAll**(): *void*

**Returns:** *void*

Defined in: [packages/core/src/entity/ArrayCollection.ts:118](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L118)

___

### set

▸ **set**(`items`: (T \| [*Reference*](core.reference.md)<T\>)[]): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`items` | (T \| [*Reference*](core.reference.md)<T\>)[] |

**Returns:** *void*

Defined in: [packages/core/src/entity/ArrayCollection.ts:84](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L84)

___

### shouldPropagateToCollection

▸ `Protected`**shouldPropagateToCollection**(`collection`: [*ArrayCollection*](core.arraycollection.md)<O, T\>, `method`: *add* \| *remove*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`collection` | [*ArrayCollection*](core.arraycollection.md)<O, T\> |
`method` | *add* \| *remove* |

**Returns:** *boolean*

Defined in: [packages/core/src/entity/ArrayCollection.ts:189](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L189)

___

### toArray

▸ **toArray**(): [*Dictionary*](../modules/core.md#dictionary)<any\>[]

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<any\>[]

Defined in: [packages/core/src/entity/ArrayCollection.ts:38](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L38)

___

### toJSON

▸ **toJSON**(): [*Dictionary*](../modules/core.md#dictionary)<any\>[]

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<any\>[]

Defined in: [packages/core/src/entity/ArrayCollection.ts:49](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L49)
