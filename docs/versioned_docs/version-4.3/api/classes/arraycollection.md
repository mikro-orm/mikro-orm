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

*Defined in [packages/core/src/entity/ArrayCollection.ts:13](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L13)*

#### Parameters:

Name | Type |
------ | ------ |
`owner` | O & [AnyEntity](../index.md#anyentity)&#60;O> |
`items?` | T[] |

**Returns:** [ArrayCollection](arraycollection.md)

## Properties

### \_count

• `Protected` `Optional` **\_count**: number

*Defined in [packages/core/src/entity/ArrayCollection.ts:12](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L12)*

___

### \_property

• `Private` `Optional` **\_property**: [EntityProperty](../interfaces/entityproperty.md)

*Defined in [packages/core/src/entity/ArrayCollection.ts:13](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L13)*

___

### initialized

• `Protected` **initialized**: boolean = true

*Defined in [packages/core/src/entity/ArrayCollection.ts:11](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L11)*

___

### items

• `Protected` `Readonly` **items**: Set&#60;T> = new Set&#60;T>()

*Defined in [packages/core/src/entity/ArrayCollection.ts:10](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L10)*

___

### owner

• `Readonly` **owner**: O & [AnyEntity](../index.md#anyentity)&#60;O>

*Defined in [packages/core/src/entity/ArrayCollection.ts:15](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L15)*

## Accessors

### length

• get **length**(): number

*Defined in [packages/core/src/entity/ArrayCollection.ts:123](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L123)*

**Returns:** number

___

### property

• get **property**(): [EntityProperty](../interfaces/entityproperty.md)&#60;T>

*Defined in [packages/core/src/entity/ArrayCollection.ts:136](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L136)*

**`internal`** 

**Returns:** [EntityProperty](../interfaces/entityproperty.md)&#60;T>

## Methods

### [Symbol.iterator]

▸ **[Symbol.iterator]**(): IterableIterator&#60;T>

*Defined in [packages/core/src/entity/ArrayCollection.ts:127](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L127)*

**Returns:** IterableIterator&#60;T>

___

### add

▸ **add**(...`items`: (T \| [Reference](reference.md)&#60;T>)[]): void

*Defined in [packages/core/src/entity/ArrayCollection.ts:64](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L64)*

#### Parameters:

Name | Type |
------ | ------ |
`...items` | (T \| [Reference](reference.md)&#60;T>)[] |

**Returns:** void

___

### contains

▸ **contains**(`item`: T \| [Reference](reference.md)&#60;T>, `check?`: boolean): boolean

*Defined in [packages/core/src/entity/ArrayCollection.ts:106](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L106)*

#### Parameters:

Name | Type |
------ | ------ |
`item` | T \| [Reference](reference.md)&#60;T> |
`check?` | boolean |

**Returns:** boolean

___

### count

▸ **count**(): number

*Defined in [packages/core/src/entity/ArrayCollection.ts:111](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L111)*

**Returns:** number

___

### getIdentifiers

▸ **getIdentifiers**&#60;U>(`field?`: string): U[]

*Defined in [packages/core/src/entity/ArrayCollection.ts:52](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L52)*

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

*Defined in [packages/core/src/entity/ArrayCollection.ts:33](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L33)*

**Returns:** T[]

___

### hydrate

▸ **hydrate**(`items`: T[]): void

*Defined in [packages/core/src/entity/ArrayCollection.ts:85](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L85)*

**`internal`** 

#### Parameters:

Name | Type |
------ | ------ |
`items` | T[] |

**Returns:** void

___

### incrementCount

▸ `Protected`**incrementCount**(`value`: number): void

*Defined in [packages/core/src/entity/ArrayCollection.ts:185](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L185)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | number |

**Returns:** void

___

### isInitialized

▸ **isInitialized**(`fully?`: boolean): boolean

*Defined in [packages/core/src/entity/ArrayCollection.ts:115](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L115)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`fully` | boolean | false |

**Returns:** boolean

___

### loadCount

▸ **loadCount**(): Promise&#60;number>

*Defined in [packages/core/src/entity/ArrayCollection.ts:29](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L29)*

**Returns:** Promise&#60;number>

___

### propagate

▸ `Protected`**propagate**(`item`: T, `method`: &#34;add&#34; \| &#34;remove&#34;): void

*Defined in [packages/core/src/entity/ArrayCollection.ts:146](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L146)*

#### Parameters:

Name | Type |
------ | ------ |
`item` | T |
`method` | &#34;add&#34; \| &#34;remove&#34; |

**Returns:** void

___

### propagateToInverseSide

▸ `Protected`**propagateToInverseSide**(`item`: T, `method`: &#34;add&#34; \| &#34;remove&#34;): void

*Defined in [packages/core/src/entity/ArrayCollection.ts:154](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L154)*

#### Parameters:

Name | Type |
------ | ------ |
`item` | T |
`method` | &#34;add&#34; \| &#34;remove&#34; |

**Returns:** void

___

### propagateToOwningSide

▸ `Protected`**propagateToOwningSide**(`item`: T, `method`: &#34;add&#34; \| &#34;remove&#34;): void

*Defined in [packages/core/src/entity/ArrayCollection.ts:162](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L162)*

#### Parameters:

Name | Type |
------ | ------ |
`item` | T |
`method` | &#34;add&#34; \| &#34;remove&#34; |

**Returns:** void

___

### remove

▸ **remove**(...`items`: (T \| [Reference](reference.md)&#60;T>)[]): void

*Defined in [packages/core/src/entity/ArrayCollection.ts:91](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L91)*

#### Parameters:

Name | Type |
------ | ------ |
`...items` | (T \| [Reference](reference.md)&#60;T>)[] |

**Returns:** void

___

### removeAll

▸ **removeAll**(): void

*Defined in [packages/core/src/entity/ArrayCollection.ts:102](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L102)*

**Returns:** void

___

### set

▸ **set**(`items`: (T \| [Reference](reference.md)&#60;T>)[]): void

*Defined in [packages/core/src/entity/ArrayCollection.ts:77](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L77)*

#### Parameters:

Name | Type |
------ | ------ |
`items` | (T \| [Reference](reference.md)&#60;T>)[] |

**Returns:** void

___

### shouldPropagateToCollection

▸ `Protected`**shouldPropagateToCollection**(`collection`: [ArrayCollection](arraycollection.md)&#60;O, T>, `method`: &#34;add&#34; \| &#34;remove&#34;): boolean

*Defined in [packages/core/src/entity/ArrayCollection.ts:172](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L172)*

#### Parameters:

Name | Type |
------ | ------ |
`collection` | [ArrayCollection](arraycollection.md)&#60;O, T> |
`method` | &#34;add&#34; \| &#34;remove&#34; |

**Returns:** boolean

___

### toArray

▸ **toArray**(): [Dictionary](../index.md#dictionary)[]

*Defined in [packages/core/src/entity/ArrayCollection.ts:37](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L37)*

**Returns:** [Dictionary](../index.md#dictionary)[]

___

### toJSON

▸ **toJSON**(): [Dictionary](../index.md#dictionary)[]

*Defined in [packages/core/src/entity/ArrayCollection.ts:48](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L48)*

**Returns:** [Dictionary](../index.md#dictionary)[]
