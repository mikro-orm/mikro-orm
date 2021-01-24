---
id: "core.arraycollection"
title: "Class: ArrayCollection<T, O>"
sidebar_label: "ArrayCollection"
hide_title: true
---

# Class: ArrayCollection<T, O\>

[core](../modules/core.md).ArrayCollection

## Type parameters

Name |
------ |
`T` |
`O` |

## Hierarchy

* **ArrayCollection**

  ↳ [*Collection*](core.collection.md)

## Indexable

▪ [k: *number*]: T

## Constructors

### constructor

\+ **new ArrayCollection**<T, O\>(`owner`: O & *Partial*<O\> & { `__@EntityRepositoryType@41631?`: *unknown* ; `__@PrimaryKeyType@41543?`: *unknown* ; `__helper?`: *undefined* \| *IWrappedEntityInternal*<O, keyof O, keyof O\> ; `__meta?`: *undefined* \| [*EntityMetadata*](core.entitymetadata.md)<O\> ; `__platform?`: *undefined* \| [*Platform*](core.platform.md)  }, `items?`: T[]): [*ArrayCollection*](core.arraycollection.md)<T, O\>

#### Type parameters:

Name |
------ |
`T` |
`O` |

#### Parameters:

Name | Type |
------ | ------ |
`owner` | O & *Partial*<O\> & { `__@EntityRepositoryType@41631?`: *unknown* ; `__@PrimaryKeyType@41543?`: *unknown* ; `__helper?`: *undefined* \| *IWrappedEntityInternal*<O, keyof O, keyof O\> ; `__meta?`: *undefined* \| [*EntityMetadata*](core.entitymetadata.md)<O\> ; `__platform?`: *undefined* \| [*Platform*](core.platform.md)  } |
`items?` | T[] |

**Returns:** [*ArrayCollection*](core.arraycollection.md)<T, O\>

Defined in: [packages/core/src/entity/ArrayCollection.ts:14](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L14)

## Properties

### \_count

• `Protected` `Optional` **\_count**: *undefined* \| *number*

Defined in: [packages/core/src/entity/ArrayCollection.ts:13](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L13)

___

### \_property

• `Private` `Optional` **\_property**: *undefined* \| [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>

Defined in: [packages/core/src/entity/ArrayCollection.ts:14](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L14)

___

### initialized

• `Protected` **initialized**: *boolean*= true

Defined in: [packages/core/src/entity/ArrayCollection.ts:12](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L12)

___

### items

• `Protected` `Readonly` **items**: *Set*<T\>

Defined in: [packages/core/src/entity/ArrayCollection.ts:11](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L11)

___

### owner

• `Readonly` **owner**: O & *Partial*<O\> & { `__@EntityRepositoryType@41631?`: *unknown* ; `__@PrimaryKeyType@41543?`: *unknown* ; `__helper?`: *undefined* \| *IWrappedEntityInternal*<O, keyof O, keyof O\> ; `__meta?`: *undefined* \| [*EntityMetadata*](core.entitymetadata.md)<O\> ; `__platform?`: *undefined* \| [*Platform*](core.platform.md)  }

## Accessors

### length

• **length**(): *number*

**Returns:** *number*

Defined in: [packages/core/src/entity/ArrayCollection.ts:134](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L134)

___

### property

• **property**(): [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>

**`internal`** 

**Returns:** [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>

Defined in: [packages/core/src/entity/ArrayCollection.ts:147](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L147)

## Methods

### [Symbol.iterator]

▸ **[Symbol.iterator]**(): *IterableIterator*<T\>

**Returns:** *IterableIterator*<T\>

Defined in: [packages/core/src/entity/ArrayCollection.ts:138](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L138)

___

### add

▸ **add**(...`items`: (T \| [*Reference*](core.reference.md)<T\>)[]): *void*

#### Parameters:

Name | Type |
------ | ------ |
`...items` | (T \| [*Reference*](core.reference.md)<T\>)[] |

**Returns:** *void*

Defined in: [packages/core/src/entity/ArrayCollection.ts:71](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L71)

___

### contains

▸ **contains**(`item`: T \| [*Reference*](core.reference.md)<T\>, `check?`: *boolean*): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`item` | T \| [*Reference*](core.reference.md)<T\> |
`check?` | *boolean* |

**Returns:** *boolean*

Defined in: [packages/core/src/entity/ArrayCollection.ts:117](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L117)

___

### count

▸ **count**(): *number*

**Returns:** *number*

Defined in: [packages/core/src/entity/ArrayCollection.ts:122](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L122)

___

### getIdentifiers

▸ **getIdentifiers**<U\>(`field?`: *string*): U[]

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`U` | IPrimaryKeyValue | [*Primary*](../modules/core.md#primary)<T\\> & *string* \\| [*Primary*](../modules/core.md#primary)<T\\> & *number* \\| [*Primary*](../modules/core.md#primary)<T\\> & *bigint* \\| [*Primary*](../modules/core.md#primary)<T\\> & Date \\| [*Primary*](../modules/core.md#primary)<T\\> & { \`toHexString\`: () =\> *string*  } |

#### Parameters:

Name | Type |
------ | ------ |
`field?` | *string* |

**Returns:** U[]

Defined in: [packages/core/src/entity/ArrayCollection.ts:53](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L53)

___

### getItems

▸ **getItems**(): T[]

**Returns:** T[]

Defined in: [packages/core/src/entity/ArrayCollection.ts:34](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L34)

___

### hydrate

▸ **hydrate**(`items`: T[]): *void*

**`internal`** 

#### Parameters:

Name | Type |
------ | ------ |
`items` | T[] |

**Returns:** *void*

Defined in: [packages/core/src/entity/ArrayCollection.ts:92](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L92)

___

### incrementCount

▸ `Protected`**incrementCount**(`value`: *number*): *void*

#### Parameters:

Name | Type |
------ | ------ |
`value` | *number* |

**Returns:** *void*

Defined in: [packages/core/src/entity/ArrayCollection.ts:197](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L197)

___

### isInitialized

▸ **isInitialized**(`fully?`: *boolean*): *boolean*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`fully` | *boolean* | false |

**Returns:** *boolean*

Defined in: [packages/core/src/entity/ArrayCollection.ts:126](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L126)

___

### loadCount

▸ **loadCount**(): *Promise*<*number*\>

**Returns:** *Promise*<*number*\>

Defined in: [packages/core/src/entity/ArrayCollection.ts:30](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L30)

___

### propagate

▸ `Protected`**propagate**(`item`: T, `method`: *add* \| *remove*): *void*

#### Parameters:

Name | Type |
------ | ------ |
`item` | T |
`method` | *add* \| *remove* |

**Returns:** *void*

Defined in: [packages/core/src/entity/ArrayCollection.ts:157](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L157)

___

### propagateToInverseSide

▸ `Protected`**propagateToInverseSide**(`item`: T, `method`: *add* \| *remove*): *void*

#### Parameters:

Name | Type |
------ | ------ |
`item` | T |
`method` | *add* \| *remove* |

**Returns:** *void*

Defined in: [packages/core/src/entity/ArrayCollection.ts:165](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L165)

___

### propagateToOwningSide

▸ `Protected`**propagateToOwningSide**(`item`: T, `method`: *add* \| *remove*): *void*

#### Parameters:

Name | Type |
------ | ------ |
`item` | T |
`method` | *add* \| *remove* |

**Returns:** *void*

Defined in: [packages/core/src/entity/ArrayCollection.ts:173](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L173)

___

### remove

▸ **remove**(...`items`: (T \| [*Reference*](core.reference.md)<T\>)[]): *void*

#### Parameters:

Name | Type |
------ | ------ |
`...items` | (T \| [*Reference*](core.reference.md)<T\>)[] |

**Returns:** *void*

Defined in: [packages/core/src/entity/ArrayCollection.ts:102](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L102)

___

### removeAll

▸ **removeAll**(): *void*

**Returns:** *void*

Defined in: [packages/core/src/entity/ArrayCollection.ts:113](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L113)

___

### set

▸ **set**(`items`: (T \| [*Reference*](core.reference.md)<T\>)[]): *void*

#### Parameters:

Name | Type |
------ | ------ |
`items` | (T \| [*Reference*](core.reference.md)<T\>)[] |

**Returns:** *void*

Defined in: [packages/core/src/entity/ArrayCollection.ts:84](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L84)

___

### shouldPropagateToCollection

▸ `Protected`**shouldPropagateToCollection**(`collection`: [*ArrayCollection*](core.arraycollection.md)<O, T\>, `method`: *add* \| *remove*): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`collection` | [*ArrayCollection*](core.arraycollection.md)<O, T\> |
`method` | *add* \| *remove* |

**Returns:** *boolean*

Defined in: [packages/core/src/entity/ArrayCollection.ts:184](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L184)

___

### toArray

▸ **toArray**(): [*Dictionary*](../modules/core.md#dictionary)<*any*\>[]

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<*any*\>[]

Defined in: [packages/core/src/entity/ArrayCollection.ts:38](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L38)

___

### toJSON

▸ **toJSON**(): [*Dictionary*](../modules/core.md#dictionary)<*any*\>[]

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<*any*\>[]

Defined in: [packages/core/src/entity/ArrayCollection.ts:49](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L49)
