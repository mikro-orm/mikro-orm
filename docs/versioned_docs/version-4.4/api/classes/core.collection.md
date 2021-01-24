---
id: "core.collection"
title: "Class: Collection<T, O>"
sidebar_label: "Collection"
hide_title: true
---

# Class: Collection<T, O\>

[core](../modules/core.md).Collection

## Type parameters

Name | Default |
------ | ------ |
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
------ | ------ |
`T` | - |
`O` | *unknown* |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`owner` | O | - |
`items?` | T[] | - |
`initialized` | *boolean* | true |

**Returns:** [*Collection*](core.collection.md)<T, O\>

Inherited from: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/Collection.ts:13](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L13)

## Properties

### \_count

• `Protected` `Optional` **\_count**: *undefined* \| *number*

Inherited from: [ArrayCollection](core.arraycollection.md).[_count](core.arraycollection.md#_count)

Defined in: [packages/core/src/entity/ArrayCollection.ts:13](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L13)

___

### \_lazyInitialized

• `Private` **\_lazyInitialized**: *boolean*= false

Defined in: [packages/core/src/entity/Collection.ts:13](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L13)

___

### \_populated

• `Private` **\_populated**: *boolean*= false

Defined in: [packages/core/src/entity/Collection.ts:12](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L12)

___

### dirty

• `Private` **dirty**: *boolean*= false

Defined in: [packages/core/src/entity/Collection.ts:11](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L11)

___

### initialized

• `Protected` **initialized**: *boolean*= true

Inherited from: [ArrayCollection](core.arraycollection.md).[initialized](core.arraycollection.md#initialized)

Defined in: [packages/core/src/entity/ArrayCollection.ts:12](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L12)

___

### items

• `Protected` `Readonly` **items**: *Set*<T\>

Inherited from: [ArrayCollection](core.arraycollection.md).[items](core.arraycollection.md#items)

Defined in: [packages/core/src/entity/ArrayCollection.ts:11](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L11)

___

### owner

• `Readonly` **owner**: O & *Partial*<O\> & { `__@EntityRepositoryType@41631?`: *unknown* ; `__@PrimaryKeyType@41543?`: *unknown* ; `__helper?`: *undefined* \| *IWrappedEntityInternal*<O, keyof O, keyof O\> ; `__meta?`: *undefined* \| [*EntityMetadata*](core.entitymetadata.md)<O\> ; `__platform?`: *undefined* \| [*Platform*](core.platform.md)  }

Inherited from: [ArrayCollection](core.arraycollection.md).[owner](core.arraycollection.md#owner)

___

### snapshot

• `Private` **snapshot**: *undefined* \| T[]

Defined in: [packages/core/src/entity/Collection.ts:10](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L10)

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

Inherited from: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:138](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L138)

___

### add

▸ **add**(...`items`: (T \| [*Reference*](core.reference.md)<T\>)[]): *void*

#### Parameters:

Name | Type |
------ | ------ |
`...items` | (T \| [*Reference*](core.reference.md)<T\>)[] |

**Returns:** *void*

Overrides: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/Collection.ts:91](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L91)

___

### cancelOrphanRemoval

▸ `Private`**cancelOrphanRemoval**(`items`: T[]): *void*

#### Parameters:

Name | Type |
------ | ------ |
`items` | T[] |

**Returns:** *void*

Defined in: [packages/core/src/entity/Collection.ts:298](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L298)

___

### checkInitialized

▸ `Private`**checkInitialized**(): *void*

**Returns:** *void*

Defined in: [packages/core/src/entity/Collection.ts:283](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L283)

___

### contains

▸ **contains**(`item`: T \| [*Reference*](core.reference.md)<T\>, `check?`: *boolean*): *boolean*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`item` | T \| [*Reference*](core.reference.md)<T\> | - |
`check` | *boolean* | true |

**Returns:** *boolean*

Overrides: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/Collection.ts:134](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L134)

___

### count

▸ **count**(): *number*

**Returns:** *number*

Overrides: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/Collection.ts:142](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L142)

___

### createCondition

▸ `Private`**createCondition**<T\>(`cond?`: [*FilterQuery*](../modules/core.md#filterquery)<T\>): [*FilterQuery*](../modules/core.md#filterquery)<T\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`cond` | [*FilterQuery*](../modules/core.md#filterquery)<T\> | ... |

**Returns:** [*FilterQuery*](../modules/core.md#filterquery)<T\>

Defined in: [packages/core/src/entity/Collection.ts:230](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L230)

___

### createLoadCountCondition

▸ `Private`**createLoadCountCondition**(`cond`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>): [*Dictionary*](../modules/core.md#dictionary)<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`cond` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> |

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<*any*\>

Defined in: [packages/core/src/entity/Collection.ts:263](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L263)

___

### createManyToManyCondition

▸ `Private`**createManyToManyCondition**(`cond`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`cond` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> |

**Returns:** *void*

Defined in: [packages/core/src/entity/Collection.ts:252](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L252)

___

### createOrderBy

▸ `Private`**createOrderBy**(`orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md)): [*QueryOrderMap*](../interfaces/core.queryordermap.md)

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`orderBy` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) | ... |

**Returns:** [*QueryOrderMap*](../interfaces/core.queryordermap.md)

Defined in: [packages/core/src/entity/Collection.ts:240](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L240)

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

Inherited from: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:53](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L53)

___

### getItems

▸ **getItems**(`check?`: *boolean*): T[]

Returns the items (the collection must be initialized)

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`check` | *boolean* | true |

**Returns:** T[]

Overrides: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/Collection.ts:75](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L75)

___

### getSnapshot

▸ **getSnapshot**(): *undefined* \| T[]

**`internal`** 

**Returns:** *undefined* \| T[]

Defined in: [packages/core/src/entity/Collection.ts:226](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L226)

___

### hydrate

▸ **hydrate**(`items`: T[]): *void*

**`internal`** 

#### Parameters:

Name | Type |
------ | ------ |
`items` | T[] |

**Returns:** *void*

Overrides: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/Collection.ts:116](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L116)

___

### incrementCount

▸ `Protected`**incrementCount**(`value`: *number*): *void*

#### Parameters:

Name | Type |
------ | ------ |
`value` | *number* |

**Returns:** *void*

Inherited from: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:197](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L197)

___

### init

▸ **init**(`options?`: [*InitOptions*](../interfaces/core.initoptions.md)<T\>): *Promise*<[*Collection*](core.collection.md)<T, O\>\>

#### Parameters:

Name | Type |
------ | ------ |
`options?` | [*InitOptions*](../interfaces/core.initoptions.md)<T\> |

**Returns:** *Promise*<[*Collection*](core.collection.md)<T, O\>\>

Defined in: [packages/core/src/entity/Collection.ts:164](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L164)

▸ **init**(`populate?`: *string*[], `where?`: { `__@PrimaryKeyType@41543?`: *any*  } \| *NonNullable*<*Query*<T\>\>, `orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md)): *Promise*<[*Collection*](core.collection.md)<T, O\>\>

#### Parameters:

Name | Type |
------ | ------ |
`populate?` | *string*[] |
`where?` | { `__@PrimaryKeyType@41543?`: *any*  } \| *NonNullable*<*Query*<T\>\> |
`orderBy?` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |

**Returns:** *Promise*<[*Collection*](core.collection.md)<T, O\>\>

Defined in: [packages/core/src/entity/Collection.ts:165](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L165)

___

### isDirty

▸ **isDirty**(): *boolean*

**Returns:** *boolean*

Defined in: [packages/core/src/entity/Collection.ts:156](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L156)

___

### isInitialized

▸ **isInitialized**(`fully?`: *boolean*): *boolean*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`fully` | *boolean* | false |

**Returns:** *boolean*

Inherited from: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:126](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L126)

___

### loadCount

▸ **loadCount**(`refresh?`: *boolean*): *Promise*<*number*\>

Gets the count of collection items from database instead of counting loaded items.
The value is cached, use `refresh = true` to force reload it.

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`refresh` | *boolean* | false |

**Returns:** *Promise*<*number*\>

Overrides: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/Collection.ts:54](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L54)

___

### loadItems

▸ **loadItems**(): *Promise*<T[]\>

Initializes the collection and returns the items

**Returns:** *Promise*<T[]\>

Defined in: [packages/core/src/entity/Collection.ts:42](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L42)

___

### modify

▸ `Private`**modify**(`method`: *add* \| *remove*, `items`: T[]): *void*

#### Parameters:

Name | Type |
------ | ------ |
`method` | *add* \| *remove* |
`items` | T[] |

**Returns:** *void*

Defined in: [packages/core/src/entity/Collection.ts:273](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L273)

___

### populated

▸ **populated**(`populated?`: *boolean*): *void*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`populated` | *boolean* | true |

**Returns:** *void*

Defined in: [packages/core/src/entity/Collection.ts:151](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L151)

___

### propagate

▸ `Protected`**propagate**(`item`: T, `method`: *add* \| *remove*): *void*

#### Parameters:

Name | Type |
------ | ------ |
`item` | T |
`method` | *add* \| *remove* |

**Returns:** *void*

Inherited from: [ArrayCollection](core.arraycollection.md)

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

Inherited from: [ArrayCollection](core.arraycollection.md)

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

Inherited from: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:173](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L173)

___

### remove

▸ **remove**(...`items`: (T \| [*Reference*](core.reference.md)<T\>)[]): *void*

#### Parameters:

Name | Type |
------ | ------ |
`...items` | (T \| [*Reference*](core.reference.md)<T\>)[] |

**Returns:** *void*

Overrides: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/Collection.ts:122](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L122)

___

### removeAll

▸ **removeAll**(): *void*

**Returns:** *void*

Inherited from: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:113](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L113)

___

### reorderItems

▸ `Private`**reorderItems**(`items`: T[], `order`: T[]): *void*

re-orders items after searching with `$in` operator

#### Parameters:

Name | Type |
------ | ------ |
`items` | T[] |
`order` | T[] |

**Returns:** *void*

Defined in: [packages/core/src/entity/Collection.ts:292](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L292)

___

### set

▸ **set**(`items`: (T \| [*Reference*](core.reference.md)<T\>)[]): *void*

#### Parameters:

Name | Type |
------ | ------ |
`items` | (T \| [*Reference*](core.reference.md)<T\>)[] |

**Returns:** *void*

Overrides: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/Collection.ts:98](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L98)

___

### setDirty

▸ **setDirty**(`dirty?`: *boolean*): *void*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`dirty` | *boolean* | true |

**Returns:** *void*

Defined in: [packages/core/src/entity/Collection.ts:160](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L160)

___

### shouldPopulate

▸ **shouldPopulate**(): *boolean*

**Returns:** *boolean*

Defined in: [packages/core/src/entity/Collection.ts:147](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L147)

___

### shouldPropagateToCollection

▸ `Protected`**shouldPropagateToCollection**(`collection`: [*ArrayCollection*](core.arraycollection.md)<O, T\>, `method`: *add* \| *remove*): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`collection` | [*ArrayCollection*](core.arraycollection.md)<O, T\> |
`method` | *add* \| *remove* |

**Returns:** *boolean*

Inherited from: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:184](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L184)

___

### takeSnapshot

▸ **takeSnapshot**(): *void*

**`internal`** 

**Returns:** *void*

Defined in: [packages/core/src/entity/Collection.ts:218](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L218)

___

### toArray

▸ **toArray**(): [*Dictionary*](../modules/core.md#dictionary)<*any*\>[]

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<*any*\>[]

Inherited from: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:38](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L38)

___

### toJSON

▸ **toJSON**(): [*Dictionary*](../modules/core.md#dictionary)<*any*\>[]

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<*any*\>[]

Overrides: [ArrayCollection](core.arraycollection.md)

Defined in: [packages/core/src/entity/Collection.ts:83](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L83)

___

### validateItemType

▸ `Private`**validateItemType**(`item`: T \| [*Primary*](../modules/core.md#primary)<T\> \| [*EntityData*](../modules/core.md#entitydata)<T\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`item` | T \| [*Primary*](../modules/core.md#primary)<T\> \| [*EntityData*](../modules/core.md#entitydata)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/entity/Collection.ts:310](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L310)

___

### validateModification

▸ `Private`**validateModification**(`items`: T[]): *void*

#### Parameters:

Name | Type |
------ | ------ |
`items` | T[] |

**Returns:** *void*

Defined in: [packages/core/src/entity/Collection.ts:316](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L316)

___

### create

▸ `Static`**create**<T, O\>(`owner`: O, `prop`: keyof O, `items`: *undefined* \| T[], `initialized`: *boolean*): [*Collection*](core.collection.md)<T, O\>

Creates new Collection instance, assigns it to the owning entity and sets the items to it (propagating them to their inverse sides)

#### Type parameters:

Name | Default |
------ | ------ |
`T` | - |
`O` | *any* |

#### Parameters:

Name | Type |
------ | ------ |
`owner` | O |
`prop` | keyof O |
`items` | *undefined* \| T[] |
`initialized` | *boolean* |

**Returns:** [*Collection*](core.collection.md)<T, O\>

Defined in: [packages/core/src/entity/Collection.ts:28](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L28)
