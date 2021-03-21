---
id: "core.collection"
title: "Class: Collection<T, O>"
sidebar_label: "Collection"
custom_edit_url: null
hide_title: true
---

# Class: Collection<T, O\>

[core](../modules/core.md).Collection

## Type parameters

Name | Default |
:------ | :------ |
`T` | - |
`O` | *unknown* |

## Hierarchy

* [*ArrayCollection*](core.arraycollection.md)<T, O\>

  ↳ **Collection**

  ↳↳ [*LoadedCollection*](../interfaces/core.loadedcollection.md)

## Constructors

### constructor

\+ **new Collection**<T, O\>(`owner`: O, `items?`: T[], `initialized?`: *boolean*): [*Collection*](core.collection.md)<T, O\>

#### Type parameters:

Name | Default |
:------ | :------ |
`T` | - |
`O` | *unknown* |

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`owner` | O | - |
`items?` | T[] | - |
`initialized` | *boolean* | true |

**Returns:** [*Collection*](core.collection.md)<T, O\>

Overrides: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/Collection.ts:22](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L22)

## Properties

### \_count

• `Protected` `Optional` **\_count**: *number*

Inherited from: [ArrayCollection](core.arraycollection.md).[_count](core.arraycollection.md#_count)

Defined in: [packages/core/src/entity/ArrayCollection.ts:13](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L13)

___

### \_lazyInitialized

• `Private` **\_lazyInitialized**: *boolean*= false

Defined in: [packages/core/src/entity/Collection.ts:22](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L22)

___

### \_populated

• `Private` **\_populated**: *boolean*= false

Defined in: [packages/core/src/entity/Collection.ts:21](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L21)

___

### dirty

• `Private` **dirty**: *boolean*= false

Defined in: [packages/core/src/entity/Collection.ts:19](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L19)

___

### initialized

• `Protected` **initialized**: *boolean*= true

Inherited from: [ArrayCollection](core.arraycollection.md).[initialized](core.arraycollection.md#initialized)

Defined in: [packages/core/src/entity/ArrayCollection.ts:12](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L12)

___

### items

• `Protected` `Readonly` **items**: *Set*<T\>

Inherited from: [ArrayCollection](core.arraycollection.md).[items](core.arraycollection.md#items)

Defined in: [packages/core/src/entity/ArrayCollection.ts:11](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L11)

___

### owner

• `Readonly` **owner**: O & *Partial*<O\> & { `[EntityRepositoryType]?`: *unknown* ; `[PrimaryKeyType]?`: *unknown* ; `__helper?`: *IWrappedEntityInternal*<O, keyof O, keyof O\> ; `__meta?`: [*EntityMetadata*](core.entitymetadata.md)<O\> ; `__platform?`: [*Platform*](core.platform.md)  }

Inherited from: [ArrayCollection](core.arraycollection.md).[owner](core.arraycollection.md#owner)

___

### readonly

• `Private` `Optional` **readonly**: *boolean*

Defined in: [packages/core/src/entity/Collection.ts:20](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L20)

___

### snapshot

• `Private` **snapshot**: *undefined* \| T[]

Defined in: [packages/core/src/entity/Collection.ts:18](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L18)

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

Inherited from: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:143](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L143)

___

### add

▸ **add**(...`items`: (T \| [*Reference*](core.reference.md)<T\>)[]): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`...items` | (T \| [*Reference*](core.reference.md)<T\>)[] |

**Returns:** *void*

Overrides: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/Collection.ts:118](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L118)

___

### cancelOrphanRemoval

▸ `Private`**cancelOrphanRemoval**(`items`: T[]): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`items` | T[] |

**Returns:** *void*

Defined in: [packages/core/src/entity/Collection.ts:332](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L332)

___

### checkInitialized

▸ `Private`**checkInitialized**(): *void*

**Returns:** *void*

Defined in: [packages/core/src/entity/Collection.ts:317](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L317)

___

### contains

▸ **contains**(`item`: T \| [*Reference*](core.reference.md)<T\>, `check?`: *boolean*): *boolean*

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`item` | T \| [*Reference*](core.reference.md)<T\> | - |
`check` | *boolean* | true |

**Returns:** *boolean*

Overrides: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/Collection.ts:161](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L161)

___

### count

▸ **count**(): *number*

**Returns:** *number*

Overrides: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/Collection.ts:169](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L169)

___

### createCondition

▸ `Private`**createCondition**<T\>(`cond?`: [*FilterQuery*](../modules/core.md#filterquery)<T\>): [*FilterQuery*](../modules/core.md#filterquery)<T\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`cond` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |

**Returns:** [*FilterQuery*](../modules/core.md#filterquery)<T\>

Defined in: [packages/core/src/entity/Collection.ts:263](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L263)

___

### createLoadCountCondition

▸ `Private`**createLoadCountCondition**(`cond`: [*Dictionary*](../modules/core.md#dictionary)<any\>): [*Dictionary*](../modules/core.md#dictionary)<any\>

#### Parameters:

Name | Type |
:------ | :------ |
`cond` | [*Dictionary*](../modules/core.md#dictionary)<any\> |

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<any\>

Defined in: [packages/core/src/entity/Collection.ts:296](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L296)

___

### createManyToManyCondition

▸ `Private`**createManyToManyCondition**(`cond`: [*Dictionary*](../modules/core.md#dictionary)<any\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`cond` | [*Dictionary*](../modules/core.md#dictionary)<any\> |

**Returns:** *void*

Defined in: [packages/core/src/entity/Collection.ts:285](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L285)

___

### createOrderBy

▸ `Private`**createOrderBy**(`orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md)): [*QueryOrderMap*](../interfaces/core.queryordermap.md)

#### Parameters:

Name | Type |
:------ | :------ |
`orderBy` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |

**Returns:** [*QueryOrderMap*](../interfaces/core.queryordermap.md)

Defined in: [packages/core/src/entity/Collection.ts:273](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L273)

___

### getEntityManager

▸ `Private`**getEntityManager**(): *any*

**Returns:** *any*

Defined in: [packages/core/src/entity/Collection.ts:253](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L253)

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

Inherited from: [ArrayCollection](core.arraycollection.md)

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

Overrides: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/Collection.ts:102](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L102)

___

### getSnapshot

▸ **getSnapshot**(): *undefined* \| T[]

**`internal`** 

**Returns:** *undefined* \| T[]

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

Overrides: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/Collection.ts:143](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L143)

___

### incrementCount

▸ `Protected`**incrementCount**(`value`: *number*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`value` | *number* |

**Returns:** *void*

Inherited from: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:202](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L202)

___

### init

▸ **init**(`options?`: [*InitOptions*](../interfaces/core.initoptions.md)<T\>): *Promise*<[*Collection*](core.collection.md)<T, O\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`options?` | [*InitOptions*](../interfaces/core.initoptions.md)<T\> |

**Returns:** *Promise*<[*Collection*](core.collection.md)<T, O\>\>

Defined in: [packages/core/src/entity/Collection.ts:191](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L191)

▸ **init**(`populate?`: *string*[], `where?`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md)): *Promise*<[*Collection*](core.collection.md)<T, O\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`populate?` | *string*[] |
`where?` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`orderBy?` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |

**Returns:** *Promise*<[*Collection*](core.collection.md)<T, O\>\>

Defined in: [packages/core/src/entity/Collection.ts:192](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L192)

___

### isDirty

▸ **isDirty**(): *boolean*

**Returns:** *boolean*

Defined in: [packages/core/src/entity/Collection.ts:183](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L183)

___

### isInitialized

▸ **isInitialized**(`fully?`: *boolean*): *boolean*

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`fully` | *boolean* | false |

**Returns:** *boolean*

Inherited from: [ArrayCollection](core.arraycollection.md)

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

Overrides: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/Collection.ts:63](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L63)

___

### loadItems

▸ **loadItems**(): *Promise*<T[]\>

Initializes the collection and returns the items

**Returns:** *Promise*<T[]\>

Defined in: [packages/core/src/entity/Collection.ts:51](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L51)

___

### matching

▸ **matching**(`options`: [*MatchingOptions*](../interfaces/core.matchingoptions.md)<T, readonly *string*[] \| readonly keyof T[] \| boolean \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| PopulateChildren<T\>\>): *Promise*<T[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`options` | [*MatchingOptions*](../interfaces/core.matchingoptions.md)<T, readonly *string*[] \| readonly keyof T[] \| boolean \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| PopulateChildren<T\>\> |

**Returns:** *Promise*<T[]\>

Defined in: [packages/core/src/entity/Collection.ts:77](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L77)

___

### modify

▸ `Private`**modify**(`method`: *add* \| *remove*, `items`: T[]): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`method` | *add* \| *remove* |
`items` | T[] |

**Returns:** *void*

Defined in: [packages/core/src/entity/Collection.ts:307](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L307)

___

### populated

▸ **populated**(`populated?`: *boolean*): *void*

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`populated` | *boolean* | true |

**Returns:** *void*

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

Inherited from: [ArrayCollection](core.arraycollection.md)

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

Inherited from: [ArrayCollection](core.arraycollection.md)

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

Inherited from: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:178](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L178)

___

### remove

▸ **remove**(...`items`: (T \| [*Reference*](core.reference.md)<T\>)[]): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`...items` | (T \| [*Reference*](core.reference.md)<T\>)[] |

**Returns:** *void*

Overrides: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/Collection.ts:149](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L149)

___

### removeAll

▸ **removeAll**(): *void*

**Returns:** *void*

Inherited from: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:118](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L118)

___

### reorderItems

▸ `Private`**reorderItems**(`items`: T[], `order`: T[]): *void*

re-orders items after searching with `$in` operator

#### Parameters:

Name | Type |
:------ | :------ |
`items` | T[] |
`order` | T[] |

**Returns:** *void*

Defined in: [packages/core/src/entity/Collection.ts:326](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L326)

___

### set

▸ **set**(`items`: (T \| [*Reference*](core.reference.md)<T\>)[]): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`items` | (T \| [*Reference*](core.reference.md)<T\>)[] |

**Returns:** *void*

Overrides: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/Collection.ts:125](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L125)

___

### setDirty

▸ **setDirty**(`dirty?`: *boolean*): *void*

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`dirty` | *boolean* | true |

**Returns:** *void*

Defined in: [packages/core/src/entity/Collection.ts:187](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L187)

___

### shouldPopulate

▸ **shouldPopulate**(): *boolean*

**Returns:** *boolean*

Defined in: [packages/core/src/entity/Collection.ts:174](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L174)

___

### shouldPropagateToCollection

▸ `Protected`**shouldPropagateToCollection**(`collection`: [*ArrayCollection*](core.arraycollection.md)<O, T\>, `method`: *add* \| *remove*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`collection` | [*ArrayCollection*](core.arraycollection.md)<O, T\> |
`method` | *add* \| *remove* |

**Returns:** *boolean*

Inherited from: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:189](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L189)

___

### takeSnapshot

▸ **takeSnapshot**(): *void*

**`internal`** 

**Returns:** *void*

Defined in: [packages/core/src/entity/Collection.ts:241](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L241)

___

### toArray

▸ **toArray**(): [*Dictionary*](../modules/core.md#dictionary)<any\>[]

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<any\>[]

Inherited from: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:38](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/ArrayCollection.ts#L38)

___

### toJSON

▸ **toJSON**(): [*Dictionary*](../modules/core.md#dictionary)<any\>[]

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<any\>[]

Overrides: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/Collection.ts:110](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L110)

___

### validateItemType

▸ `Private`**validateItemType**(`item`: T \| [*Primary*](../modules/core.md#primary)<T\> \| [*EntityData*](../modules/core.md#entitydata)<T\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`item` | T \| [*Primary*](../modules/core.md#primary)<T\> \| [*EntityData*](../modules/core.md#entitydata)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/entity/Collection.ts:344](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L344)

___

### validateModification

▸ `Private`**validateModification**(`items`: T[]): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`items` | T[] |

**Returns:** *void*

Defined in: [packages/core/src/entity/Collection.ts:350](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L350)

___

### create

▸ `Static`**create**<T, O\>(`owner`: O, `prop`: keyof O, `items`: *undefined* \| T[], `initialized`: *boolean*): [*Collection*](core.collection.md)<T, O\>

Creates new Collection instance, assigns it to the owning entity and sets the items to it (propagating them to their inverse sides)

#### Type parameters:

Name | Default |
:------ | :------ |
`T` | - |
`O` | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`owner` | O |
`prop` | keyof O |
`items` | *undefined* \| T[] |
`initialized` | *boolean* |

**Returns:** [*Collection*](core.collection.md)<T, O\>

Defined in: [packages/core/src/entity/Collection.ts:37](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L37)
