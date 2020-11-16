---
id: "arraycollection"
title: "Class: ArrayCollection<T, O>"
sidebar_label: "ArrayCollection"
---

## Type parameters

Name |
------ |
`T` |
`O` |

## Hierarchy

* **ArrayCollection**

  ↳ [Collection](collection.md)

## Indexable

▪ [k: number]: T

## Constructors

### constructor

\+ **new ArrayCollection**(`owner`: O & [AnyEntity](../index.md#anyentity)&#60;O>, `items?`: T[]): [ArrayCollection](arraycollection.md)

*Defined in [packages/core/src/entity/ArrayCollection.ts:13](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L13)*

#### Parameters:

Name | Type |
------ | ------ |
`owner` | O & [AnyEntity](../index.md#anyentity)&#60;O> |
`items?` | T[] |

**Returns:** [ArrayCollection](arraycollection.md)

## Properties

### \_firstItem

• `Protected` `Optional` **\_firstItem**: T

*Defined in [packages/core/src/entity/ArrayCollection.ts:12](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L12)*

___

### \_property

• `Private` `Optional` **\_property**: [EntityProperty](../interfaces/entityproperty.md)

*Defined in [packages/core/src/entity/ArrayCollection.ts:13](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L13)*

___

### initialized

• `Protected` **initialized**: boolean = true

*Defined in [packages/core/src/entity/ArrayCollection.ts:11](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L11)*

___

### items

• `Protected` `Readonly` **items**: Set&#60;T> = new Set&#60;T>()

*Defined in [packages/core/src/entity/ArrayCollection.ts:10](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L10)*

___

### owner

• `Readonly` **owner**: O & [AnyEntity](../index.md#anyentity)&#60;O>

*Defined in [packages/core/src/entity/ArrayCollection.ts:15](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L15)*

## Accessors

### length

• get **length**(): number

*Defined in [packages/core/src/entity/ArrayCollection.ts:117](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L117)*

**Returns:** number

___

### property

• get **property**(): [EntityProperty](../interfaces/entityproperty.md)&#60;T>

*Defined in [packages/core/src/entity/ArrayCollection.ts:130](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L130)*

**`internal`** 

**Returns:** [EntityProperty](../interfaces/entityproperty.md)&#60;T>

## Methods

### [Symbol.iterator]

▸ **[Symbol.iterator]**(): IterableIterator&#60;T>

*Defined in [packages/core/src/entity/ArrayCollection.ts:121](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L121)*

**Returns:** IterableIterator&#60;T>

___

### add

▸ **add**(...`items`: (T \| [Reference](reference.md)&#60;T>)[]): void

*Defined in [packages/core/src/entity/ArrayCollection.ts:60](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L60)*

#### Parameters:

Name | Type |
------ | ------ |
`...items` | (T \| [Reference](reference.md)&#60;T>)[] |

**Returns:** void

___

### contains

▸ **contains**(`item`: T \| [Reference](reference.md)&#60;T>, `check?`: boolean): boolean

*Defined in [packages/core/src/entity/ArrayCollection.ts:100](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L100)*

#### Parameters:

Name | Type |
------ | ------ |
`item` | T \| [Reference](reference.md)&#60;T> |
`check?` | boolean |

**Returns:** boolean

___

### count

▸ **count**(): number

*Defined in [packages/core/src/entity/ArrayCollection.ts:105](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L105)*

**Returns:** number

___

### getIdentifiers

▸ **getIdentifiers**&#60;U>(`field?`: string): U[]

*Defined in [packages/core/src/entity/ArrayCollection.ts:48](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L48)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`U` | [IPrimaryKey](../index.md#iprimarykey) | Primary\&#60;T> & IPrimaryKey |

#### Parameters:

Name | Type |
------ | ------ |
`field?` | string |

**Returns:** U[]

___

### getItems

▸ **getItems**(): T[]

*Defined in [packages/core/src/entity/ArrayCollection.ts:29](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L29)*

**Returns:** T[]

___

### hydrate

▸ **hydrate**(`items`: T[]): void

*Defined in [packages/core/src/entity/ArrayCollection.ts:81](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L81)*

**`internal`** 

#### Parameters:

Name | Type |
------ | ------ |
`items` | T[] |

**Returns:** void

___

### isInitialized

▸ **isInitialized**(`fully?`: boolean): boolean

*Defined in [packages/core/src/entity/ArrayCollection.ts:109](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L109)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`fully` | boolean | false |

**Returns:** boolean

___

### propagate

▸ `Protected`**propagate**(`item`: T, `method`: &#34;add&#34; \| &#34;remove&#34;): void

*Defined in [packages/core/src/entity/ArrayCollection.ts:140](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L140)*

#### Parameters:

Name | Type |
------ | ------ |
`item` | T |
`method` | &#34;add&#34; \| &#34;remove&#34; |

**Returns:** void

___

### propagateToInverseSide

▸ `Protected`**propagateToInverseSide**(`item`: T, `method`: &#34;add&#34; \| &#34;remove&#34;): void

*Defined in [packages/core/src/entity/ArrayCollection.ts:148](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L148)*

#### Parameters:

Name | Type |
------ | ------ |
`item` | T |
`method` | &#34;add&#34; \| &#34;remove&#34; |

**Returns:** void

___

### propagateToOwningSide

▸ `Protected`**propagateToOwningSide**(`item`: T, `method`: &#34;add&#34; \| &#34;remove&#34;): void

*Defined in [packages/core/src/entity/ArrayCollection.ts:156](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L156)*

#### Parameters:

Name | Type |
------ | ------ |
`item` | T |
`method` | &#34;add&#34; \| &#34;remove&#34; |

**Returns:** void

___

### remove

▸ **remove**(...`items`: (T \| [Reference](reference.md)&#60;T>)[]): void

*Defined in [packages/core/src/entity/ArrayCollection.ts:86](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L86)*

#### Parameters:

Name | Type |
------ | ------ |
`...items` | (T \| [Reference](reference.md)&#60;T>)[] |

**Returns:** void

___

### removeAll

▸ **removeAll**(): void

*Defined in [packages/core/src/entity/ArrayCollection.ts:96](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L96)*

**Returns:** void

___

### set

▸ **set**(`items`: (T \| [Reference](reference.md)&#60;T>)[]): void

*Defined in [packages/core/src/entity/ArrayCollection.ts:73](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L73)*

#### Parameters:

Name | Type |
------ | ------ |
`items` | (T \| [Reference](reference.md)&#60;T>)[] |

**Returns:** void

___

### shouldPropagateToCollection

▸ `Protected`**shouldPropagateToCollection**(`collection`: [ArrayCollection](arraycollection.md)&#60;O, T>, `method`: &#34;add&#34; \| &#34;remove&#34;): boolean

*Defined in [packages/core/src/entity/ArrayCollection.ts:166](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L166)*

#### Parameters:

Name | Type |
------ | ------ |
`collection` | [ArrayCollection](arraycollection.md)&#60;O, T> |
`method` | &#34;add&#34; \| &#34;remove&#34; |

**Returns:** boolean

___

### toArray

▸ **toArray**(): [Dictionary](../index.md#dictionary)[]

*Defined in [packages/core/src/entity/ArrayCollection.ts:33](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L33)*

**Returns:** [Dictionary](../index.md#dictionary)[]

___

### toJSON

▸ **toJSON**(): [Dictionary](../index.md#dictionary)[]

*Defined in [packages/core/src/entity/ArrayCollection.ts:44](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/ArrayCollection.ts#L44)*

**Returns:** [Dictionary](../index.md#dictionary)[]
