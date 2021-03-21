---
id: "core.loadedcollection"
title: "Interface: LoadedCollection<T, P>"
sidebar_label: "LoadedCollection"
custom_edit_url: null
hide_title: true
---

# Interface: LoadedCollection<T, P\>

[core](../modules/core.md).LoadedCollection

## Type parameters

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | - |
`P` | - | *never* |

## Hierarchy

* [*Collection*](../classes/core.collection.md)<T\>

  ↳ **LoadedCollection**

## Properties

### $

• **$**: readonly T & P[]

Defined in: [packages/core/src/typings.ts:390](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L390)

___

### \_count

• `Protected` `Optional` **\_count**: *number*

Inherited from: [Collection](../classes/core.collection.md).[_count](../classes/core.collection.md#_count)

Defined in: [packages/core/src/entity/ArrayCollection.ts:13](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L13)

___

### initialized

• `Protected` **initialized**: *boolean*= true

Inherited from: [Collection](../classes/core.collection.md).[initialized](../classes/core.collection.md#initialized)

Defined in: [packages/core/src/entity/ArrayCollection.ts:12](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L12)

___

### items

• `Protected` `Readonly` **items**: *Set*<T\>

Inherited from: [Collection](../classes/core.collection.md).[items](../classes/core.collection.md#items)

Defined in: [packages/core/src/entity/ArrayCollection.ts:11](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L11)

___

### owner

• `Readonly` **owner**: *Partial*<unknown\> & { `[EntityRepositoryType]?`: *unknown* ; `[PrimaryKeyType]?`: *unknown* ; `__helper?`: *IWrappedEntityInternal*<unknown, never, never\> ; `__meta?`: [*EntityMetadata*](../classes/core.entitymetadata.md)<unknown\> ; `__platform?`: [*Platform*](../classes/core.platform.md)  }

Inherited from: [Collection](../classes/core.collection.md).[owner](../classes/core.collection.md#owner)

## Accessors

### length

• get **length**(): *number*

**Returns:** *number*

Defined in: [packages/core/src/entity/ArrayCollection.ts:139](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L139)

___

### property

• get **property**(): [*EntityProperty*](core.entityproperty.md)<T\>

**`internal`** 

**Returns:** [*EntityProperty*](core.entityproperty.md)<T\>

Defined in: [packages/core/src/entity/ArrayCollection.ts:152](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L152)

## Methods

### [Symbol.iterator]

▸ **[Symbol.iterator]**(): *IterableIterator*<T\>

**Returns:** *IterableIterator*<T\>

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:143](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L143)

___

### add

▸ **add**(...`items`: (T \| [*Reference*](../classes/core.reference.md)<T\>)[]): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`...items` | (T \| [*Reference*](../classes/core.reference.md)<T\>)[] |

**Returns:** *void*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:118](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L118)

___

### contains

▸ **contains**(`item`: T \| [*Reference*](../classes/core.reference.md)<T\>, `check?`: *boolean*): *boolean*

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`item` | T \| [*Reference*](../classes/core.reference.md)<T\> | - |
`check` | *boolean* | true |

**Returns:** *boolean*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:161](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L161)

___

### count

▸ **count**(): *number*

**Returns:** *number*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:169](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L169)

___

### get

▸ **get**(): readonly T & P[]

**Returns:** readonly T & P[]

Defined in: [packages/core/src/typings.ts:391](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L391)

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

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:53](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L53)

___

### getItems

▸ **getItems**(`check?`: *boolean*): T[]

Returns the items (the collection must be initialized)

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`check` | *boolean* | true |

**Returns:** T[]

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:102](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L102)

___

### getSnapshot

▸ **getSnapshot**(): *undefined* \| T[]

**`internal`** 

**Returns:** *undefined* \| T[]

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:249](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L249)

___

### hydrate

▸ **hydrate**(`items`: T[]): *void*

**`internal`** 

#### Parameters:

Name | Type |
:------ | :------ |
`items` | T[] |

**Returns:** *void*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:143](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L143)

___

### incrementCount

▸ `Protected`**incrementCount**(`value`: *number*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`value` | *number* |

**Returns:** *void*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:202](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L202)

___

### init

▸ **init**(`options?`: [*InitOptions*](core.initoptions.md)<T\>): *Promise*<[*LoadedCollection*](core.loadedcollection.md)<T, P\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`options?` | [*InitOptions*](core.initoptions.md)<T\> |

**Returns:** *Promise*<[*LoadedCollection*](core.loadedcollection.md)<T, P\>\>

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:191](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L191)

▸ **init**(`populate?`: *string*[], `where?`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `orderBy?`: [*QueryOrderMap*](core.queryordermap.md)): *Promise*<[*LoadedCollection*](core.loadedcollection.md)<T, P\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`populate?` | *string*[] |
`where?` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`orderBy?` | [*QueryOrderMap*](core.queryordermap.md) |

**Returns:** *Promise*<[*LoadedCollection*](core.loadedcollection.md)<T, P\>\>

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:192](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L192)

___

### isDirty

▸ **isDirty**(): *boolean*

**Returns:** *boolean*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:183](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L183)

___

### isInitialized

▸ **isInitialized**(`fully?`: *boolean*): *boolean*

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`fully` | *boolean* | false |

**Returns:** *boolean*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:131](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L131)

___

### loadCount

▸ **loadCount**(`refresh?`: *boolean*): *Promise*<number\>

Gets the count of collection items from database instead of counting loaded items.
The value is cached, use `refresh = true` to force reload it.

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`refresh` | *boolean* | false |

**Returns:** *Promise*<number\>

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:63](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L63)

___

### loadItems

▸ **loadItems**(): *Promise*<T[]\>

Initializes the collection and returns the items

**Returns:** *Promise*<T[]\>

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:51](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L51)

___

### matching

▸ **matching**(`options`: [*MatchingOptions*](core.matchingoptions.md)<T, readonly *string*[] \| readonly keyof T[] \| boolean \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| PopulateChildren<T\>\>): *Promise*<T[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`options` | [*MatchingOptions*](core.matchingoptions.md)<T, readonly *string*[] \| readonly keyof T[] \| boolean \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| PopulateChildren<T\>\> |

**Returns:** *Promise*<T[]\>

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:77](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L77)

___

### populated

▸ **populated**(`populated?`: *boolean*): *void*

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`populated` | *boolean* | true |

**Returns:** *void*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:178](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L178)

___

### propagate

▸ `Protected`**propagate**(`item`: T, `method`: *add* \| *remove*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`item` | T |
`method` | *add* \| *remove* |

**Returns:** *void*

Inherited from: [Collection](../classes/core.collection.md)

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

Inherited from: [Collection](../classes/core.collection.md)

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

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:178](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L178)

___

### remove

▸ **remove**(...`items`: (T \| [*Reference*](../classes/core.reference.md)<T\>)[]): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`...items` | (T \| [*Reference*](../classes/core.reference.md)<T\>)[] |

**Returns:** *void*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:149](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L149)

___

### removeAll

▸ **removeAll**(): *void*

**Returns:** *void*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:118](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L118)

___

### set

▸ **set**(`items`: (T \| [*Reference*](../classes/core.reference.md)<T\>)[]): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`items` | (T \| [*Reference*](../classes/core.reference.md)<T\>)[] |

**Returns:** *void*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:125](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L125)

___

### setDirty

▸ **setDirty**(`dirty?`: *boolean*): *void*

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`dirty` | *boolean* | true |

**Returns:** *void*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:187](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L187)

___

### shouldPopulate

▸ **shouldPopulate**(): *boolean*

**Returns:** *boolean*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:174](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L174)

___

### shouldPropagateToCollection

▸ `Protected`**shouldPropagateToCollection**(`collection`: [*ArrayCollection*](../classes/core.arraycollection.md)<unknown, T\>, `method`: *add* \| *remove*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`collection` | [*ArrayCollection*](../classes/core.arraycollection.md)<unknown, T\> |
`method` | *add* \| *remove* |

**Returns:** *boolean*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:189](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L189)

___

### takeSnapshot

▸ **takeSnapshot**(): *void*

**`internal`** 

**Returns:** *void*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:241](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L241)

___

### toArray

▸ **toArray**(): [*Dictionary*](../modules/core.md#dictionary)<any\>[]

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<any\>[]

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:38](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L38)

___

### toJSON

▸ **toJSON**(): [*Dictionary*](../modules/core.md#dictionary)<any\>[]

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<any\>[]

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:110](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L110)
