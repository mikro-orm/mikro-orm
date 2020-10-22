---
id: "collection"
title: "Class: Collection<T, O>"
sidebar_label: "Collection"
---

## Type parameters

Name | Default |
------ | ------ |
`T` | - |
`O` | unknown |

## Hierarchy

* [ArrayCollection](arraycollection.md)&#60;T, O>

  ↳ **Collection**

  ↳↳ [LoadedCollection](../interfaces/loadedcollection.md)

## Indexable

▪ [k: number]: T

## Constructors

### constructor

\+ **new Collection**(`owner`: O, `items?`: T[], `initialized?`: boolean): [Collection](collection.md)

*Overrides [ArrayCollection](arraycollection.md).[constructor](arraycollection.md#constructor)*

*Defined in [packages/core/src/entity/Collection.ts:13](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L13)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`owner` | O | - |
`items?` | T[] | - |
`initialized` | boolean | true |

**Returns:** [Collection](collection.md)

## Properties

### \_firstItem

• `Protected` `Optional` **\_firstItem**: T

*Inherited from [ArrayCollection](arraycollection.md).[_firstItem](arraycollection.md#_firstitem)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:12](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/ArrayCollection.ts#L12)*

___

### \_lazyInitialized

• `Private` **\_lazyInitialized**: boolean = false

*Defined in [packages/core/src/entity/Collection.ts:13](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L13)*

___

### \_populated

• `Private` **\_populated**: boolean = false

*Defined in [packages/core/src/entity/Collection.ts:12](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L12)*

___

### dirty

• `Private` **dirty**: boolean = false

*Defined in [packages/core/src/entity/Collection.ts:11](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L11)*

___

### initialized

• `Protected` **initialized**: boolean = true

*Inherited from [ArrayCollection](arraycollection.md).[initialized](arraycollection.md#initialized)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:11](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/ArrayCollection.ts#L11)*

___

### items

• `Protected` `Readonly` **items**: Set&#60;T> = new Set&#60;T>()

*Inherited from [ArrayCollection](arraycollection.md).[items](arraycollection.md#items)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:10](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/ArrayCollection.ts#L10)*

___

### owner

• `Readonly` **owner**: O & [AnyEntity](../index.md#anyentity)&#60;O>

*Inherited from [ArrayCollection](arraycollection.md).[owner](arraycollection.md#owner)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:15](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/ArrayCollection.ts#L15)*

___

### snapshot

• `Private` **snapshot**: T[] \| undefined = []

*Defined in [packages/core/src/entity/Collection.ts:10](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L10)*

## Accessors

### length

• get **length**(): number

*Inherited from [ArrayCollection](arraycollection.md).[length](arraycollection.md#length)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:117](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/ArrayCollection.ts#L117)*

**Returns:** number

___

### property

• get **property**(): [EntityProperty](../interfaces/entityproperty.md)&#60;T>

*Inherited from [ArrayCollection](arraycollection.md).[property](arraycollection.md#property)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:130](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/ArrayCollection.ts#L130)*

**`internal`** 

**Returns:** [EntityProperty](../interfaces/entityproperty.md)&#60;T>

## Methods

### [Symbol.iterator]

▸ **[Symbol.iterator]**(): IterableIterator&#60;T>

*Inherited from [ArrayCollection](arraycollection.md).[[Symbol.iterator]](arraycollection.md#[symbol.iterator])*

*Defined in [packages/core/src/entity/ArrayCollection.ts:121](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/ArrayCollection.ts#L121)*

**Returns:** IterableIterator&#60;T>

___

### add

▸ **add**(...`items`: (T \| [Reference](reference.md)&#60;T>)[]): void

*Overrides [ArrayCollection](arraycollection.md).[add](arraycollection.md#add)*

*Defined in [packages/core/src/entity/Collection.ts:69](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L69)*

#### Parameters:

Name | Type |
------ | ------ |
`...items` | (T \| [Reference](reference.md)&#60;T>)[] |

**Returns:** void

___

### cancelOrphanRemoval

▸ `Private`**cancelOrphanRemoval**(`items`: T[]): void

*Defined in [packages/core/src/entity/Collection.ts:272](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L272)*

#### Parameters:

Name | Type |
------ | ------ |
`items` | T[] |

**Returns:** void

___

### checkInitialized

▸ `Private`**checkInitialized**(): void

*Defined in [packages/core/src/entity/Collection.ts:257](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L257)*

**Returns:** void

___

### contains

▸ **contains**(`item`: T \| [Reference](reference.md)&#60;T>, `check?`: boolean): boolean

*Overrides [ArrayCollection](arraycollection.md).[contains](arraycollection.md#contains)*

*Defined in [packages/core/src/entity/Collection.ts:118](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L118)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`item` | T \| [Reference](reference.md)&#60;T> | - |
`check` | boolean | true |

**Returns:** boolean

___

### count

▸ **count**(): number

*Overrides [ArrayCollection](arraycollection.md).[count](arraycollection.md#count)*

*Defined in [packages/core/src/entity/Collection.ts:126](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L126)*

**Returns:** number

___

### createCondition

▸ `Private`**createCondition**&#60;T>(`cond?`: [FilterQuery](../index.md#filterquery)&#60;T>): [FilterQuery](../index.md#filterquery)&#60;T>

*Defined in [packages/core/src/entity/Collection.ts:214](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L214)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`cond` | [FilterQuery](../index.md#filterquery)&#60;T> | {} |

**Returns:** [FilterQuery](../index.md#filterquery)&#60;T>

___

### createManyToManyCondition

▸ `Private`**createManyToManyCondition**(`cond`: [Dictionary](../index.md#dictionary)): void

*Defined in [packages/core/src/entity/Collection.ts:236](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L236)*

#### Parameters:

Name | Type |
------ | ------ |
`cond` | [Dictionary](../index.md#dictionary) |

**Returns:** void

___

### createOrderBy

▸ `Private`**createOrderBy**(`orderBy?`: [QueryOrderMap](../interfaces/queryordermap.md)): [QueryOrderMap](../interfaces/queryordermap.md)

*Defined in [packages/core/src/entity/Collection.ts:224](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L224)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`orderBy` | [QueryOrderMap](../interfaces/queryordermap.md) | {} |

**Returns:** [QueryOrderMap](../interfaces/queryordermap.md)

___

### getIdentifiers

▸ **getIdentifiers**&#60;U>(`field?`: string): U[]

*Inherited from [ArrayCollection](arraycollection.md).[getIdentifiers](arraycollection.md#getidentifiers)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:48](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/ArrayCollection.ts#L48)*

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

*Overrides [ArrayCollection](arraycollection.md).[getItems](arraycollection.md#getitems)*

*Defined in [packages/core/src/entity/Collection.ts:53](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L53)*

Returns the items (the collection must be initialized)

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`check` | boolean | true |

**Returns:** T[]

___

### getSnapshot

▸ **getSnapshot**(): T[]

*Defined in [packages/core/src/entity/Collection.ts:210](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L210)*

**`internal`** 

**Returns:** T[]

___

### hydrate

▸ **hydrate**(`items`: T[], `validate?`: boolean, `takeSnapshot?`: boolean): void

*Overrides [ArrayCollection](arraycollection.md).[hydrate](arraycollection.md#hydrate)*

*Defined in [packages/core/src/entity/Collection.ts:88](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L88)*

**`internal`** 

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`items` | T[] | - |
`validate` | boolean | false |
`takeSnapshot` | boolean | true |

**Returns:** void

___

### init

▸ **init**(`options?`: [InitOptions](../interfaces/initoptions.md)&#60;T>): Promise&#60;this>

*Defined in [packages/core/src/entity/Collection.ts:148](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L148)*

#### Parameters:

Name | Type |
------ | ------ |
`options?` | [InitOptions](../interfaces/initoptions.md)&#60;T> |

**Returns:** Promise&#60;this>

▸ **init**(`populate?`: string[], `where?`: [FilterQuery](../index.md#filterquery)&#60;T>, `orderBy?`: [QueryOrderMap](../interfaces/queryordermap.md)): Promise&#60;this>

*Defined in [packages/core/src/entity/Collection.ts:149](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L149)*

#### Parameters:

Name | Type |
------ | ------ |
`populate?` | string[] |
`where?` | [FilterQuery](../index.md#filterquery)&#60;T> |
`orderBy?` | [QueryOrderMap](../interfaces/queryordermap.md) |

**Returns:** Promise&#60;this>

___

### isDirty

▸ **isDirty**(): boolean

*Defined in [packages/core/src/entity/Collection.ts:140](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L140)*

**Returns:** boolean

___

### isInitialized

▸ **isInitialized**(`fully?`: boolean): boolean

*Inherited from [ArrayCollection](arraycollection.md).[isInitialized](arraycollection.md#isinitialized)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:109](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/ArrayCollection.ts#L109)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`fully` | boolean | false |

**Returns:** boolean

___

### loadItems

▸ **loadItems**(): Promise&#60;T[]>

*Defined in [packages/core/src/entity/Collection.ts:42](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L42)*

Initializes the collection and returns the items

**Returns:** Promise&#60;T[]>

___

### modify

▸ `Private`**modify**(`method`: &#34;add&#34; \| &#34;remove&#34;, `items`: T[]): void

*Defined in [packages/core/src/entity/Collection.ts:247](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L247)*

#### Parameters:

Name | Type |
------ | ------ |
`method` | &#34;add&#34; \| &#34;remove&#34; |
`items` | T[] |

**Returns:** void

___

### populated

▸ **populated**(`populated?`: boolean): void

*Defined in [packages/core/src/entity/Collection.ts:135](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L135)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`populated` | boolean | true |

**Returns:** void

___

### propagate

▸ `Protected`**propagate**(`item`: T, `method`: &#34;add&#34; \| &#34;remove&#34;): void

*Inherited from [ArrayCollection](arraycollection.md).[propagate](arraycollection.md#propagate)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:140](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/ArrayCollection.ts#L140)*

#### Parameters:

Name | Type |
------ | ------ |
`item` | T |
`method` | &#34;add&#34; \| &#34;remove&#34; |

**Returns:** void

___

### propagateToInverseSide

▸ `Protected`**propagateToInverseSide**(`item`: T, `method`: &#34;add&#34; \| &#34;remove&#34;): void

*Inherited from [ArrayCollection](arraycollection.md).[propagateToInverseSide](arraycollection.md#propagatetoinverseside)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:148](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/ArrayCollection.ts#L148)*

#### Parameters:

Name | Type |
------ | ------ |
`item` | T |
`method` | &#34;add&#34; \| &#34;remove&#34; |

**Returns:** void

___

### propagateToOwningSide

▸ `Protected`**propagateToOwningSide**(`item`: T, `method`: &#34;add&#34; \| &#34;remove&#34;): void

*Inherited from [ArrayCollection](arraycollection.md).[propagateToOwningSide](arraycollection.md#propagatetoowningside)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:156](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/ArrayCollection.ts#L156)*

#### Parameters:

Name | Type |
------ | ------ |
`item` | T |
`method` | &#34;add&#34; \| &#34;remove&#34; |

**Returns:** void

___

### remove

▸ **remove**(...`items`: (T \| [Reference](reference.md)&#60;T>)[]): void

*Overrides [ArrayCollection](arraycollection.md).[remove](arraycollection.md#remove)*

*Defined in [packages/core/src/entity/Collection.ts:106](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L106)*

#### Parameters:

Name | Type |
------ | ------ |
`...items` | (T \| [Reference](reference.md)&#60;T>)[] |

**Returns:** void

___

### removeAll

▸ **removeAll**(): void

*Inherited from [ArrayCollection](arraycollection.md).[removeAll](arraycollection.md#removeall)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:96](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/ArrayCollection.ts#L96)*

**Returns:** void

___

### reorderItems

▸ `Private`**reorderItems**(`items`: T[], `order`: T[]): void

*Defined in [packages/core/src/entity/Collection.ts:266](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L266)*

re-orders items after searching with `$in` operator

#### Parameters:

Name | Type |
------ | ------ |
`items` | T[] |
`order` | T[] |

**Returns:** void

___

### set

▸ **set**(`items`: (T \| [Reference](reference.md)&#60;T>)[]): void

*Overrides [ArrayCollection](arraycollection.md).[set](arraycollection.md#set)*

*Defined in [packages/core/src/entity/Collection.ts:76](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L76)*

#### Parameters:

Name | Type |
------ | ------ |
`items` | (T \| [Reference](reference.md)&#60;T>)[] |

**Returns:** void

___

### setDirty

▸ **setDirty**(`dirty?`: boolean): void

*Defined in [packages/core/src/entity/Collection.ts:144](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L144)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`dirty` | boolean | true |

**Returns:** void

___

### shouldPopulate

▸ **shouldPopulate**(): boolean

*Defined in [packages/core/src/entity/Collection.ts:131](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L131)*

**Returns:** boolean

___

### shouldPropagateToCollection

▸ `Protected`**shouldPropagateToCollection**(`collection`: [ArrayCollection](arraycollection.md)&#60;O, T>, `method`: &#34;add&#34; \| &#34;remove&#34;): boolean

*Inherited from [ArrayCollection](arraycollection.md).[shouldPropagateToCollection](arraycollection.md#shouldpropagatetocollection)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:166](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/ArrayCollection.ts#L166)*

#### Parameters:

Name | Type |
------ | ------ |
`collection` | [ArrayCollection](arraycollection.md)&#60;O, T> |
`method` | &#34;add&#34; \| &#34;remove&#34; |

**Returns:** boolean

___

### takeSnapshot

▸ **takeSnapshot**(): void

*Defined in [packages/core/src/entity/Collection.ts:202](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L202)*

**`internal`** 

**Returns:** void

___

### toArray

▸ **toArray**(): [Dictionary](../index.md#dictionary)[]

*Inherited from [ArrayCollection](arraycollection.md).[toArray](arraycollection.md#toarray)*

*Defined in [packages/core/src/entity/ArrayCollection.ts:33](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/ArrayCollection.ts#L33)*

**Returns:** [Dictionary](../index.md#dictionary)[]

___

### toJSON

▸ **toJSON**(): [Dictionary](../index.md#dictionary)[]

*Overrides [ArrayCollection](arraycollection.md).[toJSON](arraycollection.md#tojson)*

*Defined in [packages/core/src/entity/Collection.ts:61](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L61)*

**Returns:** [Dictionary](../index.md#dictionary)[]

___

### validateItemType

▸ `Private`**validateItemType**(`item`: T \| [Primary](../index.md#primary)&#60;T> \| [EntityData](../index.md#entitydata)&#60;T>): void

*Defined in [packages/core/src/entity/Collection.ts:284](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L284)*

#### Parameters:

Name | Type |
------ | ------ |
`item` | T \| [Primary](../index.md#primary)&#60;T> \| [EntityData](../index.md#entitydata)&#60;T> |

**Returns:** void

___

### validateModification

▸ `Private`**validateModification**(`items`: T[]): void

*Defined in [packages/core/src/entity/Collection.ts:290](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L290)*

#### Parameters:

Name | Type |
------ | ------ |
`items` | T[] |

**Returns:** void

___

### create

▸ `Static`**create**&#60;T, O>(`owner`: O, `prop`: keyof O, `items`: undefined \| T[], `initialized`: boolean): [Collection](collection.md)&#60;T, O>

*Defined in [packages/core/src/entity/Collection.ts:28](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/Collection.ts#L28)*

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

**Returns:** [Collection](collection.md)&#60;T, O>
