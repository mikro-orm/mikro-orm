---
id: "loadedcollection"
title: "Interface: LoadedCollection<T, P, O>"
sidebar_label: "LoadedCollection"
---

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | - |
`P` | - | never |
`O` | - | unknown |

## Hierarchy

* [Collection](../classes/collection.md)&#60;T>

  ↳ **LoadedCollection**

## Indexable

▪ [k: number]: T

## Constructors

### constructor

\+ **new LoadedCollection**(`owner`: O, `items?`: T[], `initialized?`: boolean): [LoadedCollection](loadedcollection.md)

*Inherited from [Collection](../classes/collection.md).[constructor](../classes/collection.md#constructor)*

*Overrides [ArrayCollection](../classes/arraycollection.md).[constructor](../classes/arraycollection.md#constructor)*

*Defined in [packages/core/src/entity/Collection.ts:13](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Collection.ts#L13)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`owner` | O | - |
`items?` | T[] | - |
`initialized` | boolean | true |

**Returns:** [LoadedCollection](loadedcollection.md)

## Properties

### $

•  **$**: readonly T & P[]

*Defined in [packages/core/src/typings.ts:382](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L382)*

___

### \_count

• `Protected` `Optional` **\_count**: number

*Inherited from [ArrayCollection](../classes/arraycollection.md).[_count](../classes/arraycollection.md#_count)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:12](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L12)*

___

### initialized

• `Protected` **initialized**: boolean = true

*Inherited from [ArrayCollection](../classes/arraycollection.md).[initialized](../classes/arraycollection.md#initialized)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:11](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L11)*

___

### items

• `Protected` `Readonly` **items**: Set&#60;T> = new Set&#60;T>()

*Inherited from [ArrayCollection](../classes/arraycollection.md).[items](../classes/arraycollection.md#items)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:10](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L10)*

___

### owner

• `Readonly` **owner**: O & [AnyEntity](../index.md#anyentity)&#60;O>

*Defined in [packages/core/src/entity/ArrayCollection.ts:15](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L15)*

## Accessors

### length

• get **length**(): number

*Inherited from [ArrayCollection](../classes/arraycollection.md).[length](../classes/arraycollection.md#length)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:123](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L123)*

**Returns:** number

___

### property

• get **property**(): [EntityProperty](entityproperty.md)&#60;T>

*Inherited from [ArrayCollection](../classes/arraycollection.md).[property](../classes/arraycollection.md#property)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:136](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L136)*

**`internal`** 

**Returns:** [EntityProperty](entityproperty.md)&#60;T>

## Methods

### [Symbol.iterator]

▸ **[Symbol.iterator]**(): IterableIterator&#60;T>

*Inherited from [ArrayCollection](../classes/arraycollection.md).[[Symbol.iterator]](../classes/arraycollection.md#[symbol.iterator])*

*Defined in [packages/core/src/entity/ArrayCollection.ts:127](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L127)*

**Returns:** IterableIterator&#60;T>

___

### add

▸ **add**(...`items`: (T \| [Reference](../classes/reference.md)&#60;T>)[]): void

*Inherited from [Collection](../classes/collection.md).[add](../classes/collection.md#add)*

*Overrides [ArrayCollection](../classes/arraycollection.md).[add](../classes/arraycollection.md#add)*

*Defined in [packages/core/src/entity/Collection.ts:91](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Collection.ts#L91)*

#### Parameters:

Name | Type |
------ | ------ |
`...items` | (T \| [Reference](../classes/reference.md)&#60;T>)[] |

**Returns:** void

___

### contains

▸ **contains**(`item`: T \| [Reference](../classes/reference.md)&#60;T>, `check?`: boolean): boolean

*Inherited from [Collection](../classes/collection.md).[contains](../classes/collection.md#contains)*

*Overrides [ArrayCollection](../classes/arraycollection.md).[contains](../classes/arraycollection.md#contains)*

*Defined in [packages/core/src/entity/Collection.ts:134](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Collection.ts#L134)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`item` | T \| [Reference](../classes/reference.md)&#60;T> | - |
`check` | boolean | true |

**Returns:** boolean

___

### count

▸ **count**(): number

*Inherited from [Collection](../classes/collection.md).[count](../classes/collection.md#count)*

*Overrides [ArrayCollection](../classes/arraycollection.md).[count](../classes/arraycollection.md#count)*

*Defined in [packages/core/src/entity/Collection.ts:142](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Collection.ts#L142)*

**Returns:** number

___

### get

▸ **get**(): readonly T & P[]

*Defined in [packages/core/src/typings.ts:383](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L383)*

**Returns:** readonly T & P[]

___

### getIdentifiers

▸ **getIdentifiers**&#60;U>(`field?`: string): U[]

*Inherited from [ArrayCollection](../classes/arraycollection.md).[getIdentifiers](../classes/arraycollection.md#getidentifiers)*

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

▸ **getItems**(`check?`: boolean): T[]

*Inherited from [Collection](../classes/collection.md).[getItems](../classes/collection.md#getitems)*

*Overrides [ArrayCollection](../classes/arraycollection.md).[getItems](../classes/arraycollection.md#getitems)*

*Defined in [packages/core/src/entity/Collection.ts:75](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Collection.ts#L75)*

Returns the items (the collection must be initialized)

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`check` | boolean | true |

**Returns:** T[]

___

### getSnapshot

▸ **getSnapshot**(): T[]

*Inherited from [Collection](../classes/collection.md).[getSnapshot](../classes/collection.md#getsnapshot)*

*Defined in [packages/core/src/entity/Collection.ts:226](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Collection.ts#L226)*

**`internal`** 

**Returns:** T[]

___

### hydrate

▸ **hydrate**(`items`: T[]): void

*Inherited from [Collection](../classes/collection.md).[hydrate](../classes/collection.md#hydrate)*

*Overrides [ArrayCollection](../classes/arraycollection.md).[hydrate](../classes/arraycollection.md#hydrate)*

*Defined in [packages/core/src/entity/Collection.ts:116](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Collection.ts#L116)*

**`internal`** 

#### Parameters:

Name | Type |
------ | ------ |
`items` | T[] |

**Returns:** void

___

### incrementCount

▸ `Protected`**incrementCount**(`value`: number): void

*Inherited from [ArrayCollection](../classes/arraycollection.md).[incrementCount](../classes/arraycollection.md#incrementcount)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:185](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L185)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | number |

**Returns:** void

___

### init

▸ **init**(`options?`: [InitOptions](initoptions.md)&#60;T>): Promise&#60;this>

*Inherited from [Collection](../classes/collection.md).[init](../classes/collection.md#init)*

*Defined in [packages/core/src/entity/Collection.ts:164](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Collection.ts#L164)*

#### Parameters:

Name | Type |
------ | ------ |
`options?` | [InitOptions](initoptions.md)&#60;T> |

**Returns:** Promise&#60;this>

▸ **init**(`populate?`: string[], `where?`: [FilterQuery](../index.md#filterquery)&#60;T>, `orderBy?`: [QueryOrderMap](queryordermap.md)): Promise&#60;this>

*Inherited from [Collection](../classes/collection.md).[init](../classes/collection.md#init)*

*Defined in [packages/core/src/entity/Collection.ts:165](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Collection.ts#L165)*

#### Parameters:

Name | Type |
------ | ------ |
`populate?` | string[] |
`where?` | [FilterQuery](../index.md#filterquery)&#60;T> |
`orderBy?` | [QueryOrderMap](queryordermap.md) |

**Returns:** Promise&#60;this>

___

### isDirty

▸ **isDirty**(): boolean

*Inherited from [Collection](../classes/collection.md).[isDirty](../classes/collection.md#isdirty)*

*Defined in [packages/core/src/entity/Collection.ts:156](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Collection.ts#L156)*

**Returns:** boolean

___

### isInitialized

▸ **isInitialized**(`fully?`: boolean): boolean

*Inherited from [ArrayCollection](../classes/arraycollection.md).[isInitialized](../classes/arraycollection.md#isinitialized)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:115](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L115)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`fully` | boolean | false |

**Returns:** boolean

___

### loadCount

▸ **loadCount**(`refresh?`: boolean): Promise&#60;number>

*Inherited from [Collection](../classes/collection.md).[loadCount](../classes/collection.md#loadcount)*

*Overrides [ArrayCollection](../classes/arraycollection.md).[loadCount](../classes/arraycollection.md#loadcount)*

*Defined in [packages/core/src/entity/Collection.ts:54](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Collection.ts#L54)*

Gets the count of collection items from database instead of counting loaded items.
The value is cached, use `refresh = true` to force reload it.

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`refresh` | boolean | false |

**Returns:** Promise&#60;number>

___

### loadItems

▸ **loadItems**(): Promise&#60;T[]>

*Inherited from [Collection](../classes/collection.md).[loadItems](../classes/collection.md#loaditems)*

*Defined in [packages/core/src/entity/Collection.ts:42](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Collection.ts#L42)*

Initializes the collection and returns the items

**Returns:** Promise&#60;T[]>

___

### populated

▸ **populated**(`populated?`: boolean): void

*Inherited from [Collection](../classes/collection.md).[populated](../classes/collection.md#populated)*

*Defined in [packages/core/src/entity/Collection.ts:151](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Collection.ts#L151)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`populated` | boolean | true |

**Returns:** void

___

### propagate

▸ `Protected`**propagate**(`item`: T, `method`: &#34;add&#34; \| &#34;remove&#34;): void

*Inherited from [ArrayCollection](../classes/arraycollection.md).[propagate](../classes/arraycollection.md#propagate)*

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

*Inherited from [ArrayCollection](../classes/arraycollection.md).[propagateToInverseSide](../classes/arraycollection.md#propagatetoinverseside)*

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

*Inherited from [ArrayCollection](../classes/arraycollection.md).[propagateToOwningSide](../classes/arraycollection.md#propagatetoowningside)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:162](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L162)*

#### Parameters:

Name | Type |
------ | ------ |
`item` | T |
`method` | &#34;add&#34; \| &#34;remove&#34; |

**Returns:** void

___

### remove

▸ **remove**(...`items`: (T \| [Reference](../classes/reference.md)&#60;T>)[]): void

*Inherited from [Collection](../classes/collection.md).[remove](../classes/collection.md#remove)*

*Overrides [ArrayCollection](../classes/arraycollection.md).[remove](../classes/arraycollection.md#remove)*

*Defined in [packages/core/src/entity/Collection.ts:122](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Collection.ts#L122)*

#### Parameters:

Name | Type |
------ | ------ |
`...items` | (T \| [Reference](../classes/reference.md)&#60;T>)[] |

**Returns:** void

___

### removeAll

▸ **removeAll**(): void

*Inherited from [ArrayCollection](../classes/arraycollection.md).[removeAll](../classes/arraycollection.md#removeall)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:102](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L102)*

**Returns:** void

___

### set

▸ **set**(`items`: (T \| [Reference](../classes/reference.md)&#60;T>)[]): void

*Inherited from [Collection](../classes/collection.md).[set](../classes/collection.md#set)*

*Overrides [ArrayCollection](../classes/arraycollection.md).[set](../classes/arraycollection.md#set)*

*Defined in [packages/core/src/entity/Collection.ts:98](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Collection.ts#L98)*

#### Parameters:

Name | Type |
------ | ------ |
`items` | (T \| [Reference](../classes/reference.md)&#60;T>)[] |

**Returns:** void

___

### setDirty

▸ **setDirty**(`dirty?`: boolean): void

*Inherited from [Collection](../classes/collection.md).[setDirty](../classes/collection.md#setdirty)*

*Defined in [packages/core/src/entity/Collection.ts:160](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Collection.ts#L160)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`dirty` | boolean | true |

**Returns:** void

___

### shouldPopulate

▸ **shouldPopulate**(): boolean

*Inherited from [Collection](../classes/collection.md).[shouldPopulate](../classes/collection.md#shouldpopulate)*

*Defined in [packages/core/src/entity/Collection.ts:147](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Collection.ts#L147)*

**Returns:** boolean

___

### shouldPropagateToCollection

▸ `Protected`**shouldPropagateToCollection**(`collection`: [ArrayCollection](../classes/arraycollection.md)&#60;O, T>, `method`: &#34;add&#34; \| &#34;remove&#34;): boolean

*Inherited from [ArrayCollection](../classes/arraycollection.md).[shouldPropagateToCollection](../classes/arraycollection.md#shouldpropagatetocollection)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:172](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L172)*

#### Parameters:

Name | Type |
------ | ------ |
`collection` | [ArrayCollection](../classes/arraycollection.md)&#60;O, T> |
`method` | &#34;add&#34; \| &#34;remove&#34; |

**Returns:** boolean

___

### takeSnapshot

▸ **takeSnapshot**(): void

*Inherited from [Collection](../classes/collection.md).[takeSnapshot](../classes/collection.md#takesnapshot)*

*Defined in [packages/core/src/entity/Collection.ts:218](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Collection.ts#L218)*

**`internal`** 

**Returns:** void

___

### toArray

▸ **toArray**(): [Dictionary](../index.md#dictionary)[]

*Inherited from [ArrayCollection](../classes/arraycollection.md).[toArray](../classes/arraycollection.md#toarray)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:37](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/ArrayCollection.ts#L37)*

**Returns:** [Dictionary](../index.md#dictionary)[]

___

### toJSON

▸ **toJSON**(): [Dictionary](../index.md#dictionary)[]

*Inherited from [Collection](../classes/collection.md).[toJSON](../classes/collection.md#tojson)*

*Overrides [ArrayCollection](../classes/arraycollection.md).[toJSON](../classes/arraycollection.md#tojson)*

*Defined in [packages/core/src/entity/Collection.ts:83](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Collection.ts#L83)*

**Returns:** [Dictionary](../index.md#dictionary)[]

___

### create

▸ `Static`**create**&#60;T, O>(`owner`: O, `prop`: keyof O, `items`: undefined \| T[], `initialized`: boolean): [Collection](../classes/collection.md)&#60;T, O>

*Inherited from [Collection](../classes/collection.md).[create](../classes/collection.md#create)*

*Defined in [packages/core/src/entity/Collection.ts:28](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/Collection.ts#L28)*

Creates new Collection instance, assigns it to the owning entity and sets the items to it (propagating them to their inverse sides)

#### Type parameters:

Name | Default |
------ | ------ |
`T` | - |
`O` | any |

#### Parameters:

Name | Type |
------ | ------ |
`owner` | O |
`prop` | keyof O |
`items` | undefined \| T[] |
`initialized` | boolean |

**Returns:** [Collection](../classes/collection.md)&#60;T, O>
