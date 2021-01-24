---
id: "core.loadedcollection"
title: "Interface: LoadedCollection<T, P>"
sidebar_label: "LoadedCollection"
hide_title: true
---

# Interface: LoadedCollection<T, P\>

[core](../modules/core.md).LoadedCollection

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | - |
`P` | - | *never* |

## Hierarchy

* [*Collection*](../classes/core.collection.md)<T\>

  ↳ **LoadedCollection**

## Properties

### $

• **$**: readonly T & P[]

Defined in: [packages/core/src/typings.ts:384](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/typings.ts#L384)

___

### \_count

• `Protected` `Optional` **\_count**: *undefined* \| *number*

Inherited from: [Collection](../classes/core.collection.md).[_count](../classes/core.collection.md#_count)

Defined in: [packages/core/src/entity/ArrayCollection.ts:13](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L13)

___

### initialized

• `Protected` **initialized**: *boolean*= true

Inherited from: [Collection](../classes/core.collection.md).[initialized](../classes/core.collection.md#initialized)

Defined in: [packages/core/src/entity/ArrayCollection.ts:12](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L12)

___

### items

• `Protected` `Readonly` **items**: *Set*<T\>

Inherited from: [Collection](../classes/core.collection.md).[items](../classes/core.collection.md#items)

Defined in: [packages/core/src/entity/ArrayCollection.ts:11](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L11)

___

### owner

• `Readonly` **owner**: *Partial*<*unknown*\> & { `__@EntityRepositoryType@41631?`: *unknown* ; `__@PrimaryKeyType@41543?`: *unknown* ; `__helper?`: *undefined* \| *IWrappedEntityInternal*<*unknown*, *never*, *never*\> ; `__meta?`: *undefined* \| [*EntityMetadata*](../classes/core.entitymetadata.md)<*unknown*\> ; `__platform?`: *undefined* \| [*Platform*](../classes/core.platform.md)  }

Inherited from: [Collection](../classes/core.collection.md).[owner](../classes/core.collection.md#owner)

## Accessors

### length

• **length**(): *number*

**Returns:** *number*

Defined in: [packages/core/src/entity/ArrayCollection.ts:134](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L134)

___

### property

• **property**(): [*EntityProperty*](core.entityproperty.md)<T\>

**`internal`** 

**Returns:** [*EntityProperty*](core.entityproperty.md)<T\>

Defined in: [packages/core/src/entity/ArrayCollection.ts:147](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L147)

## Methods

### [Symbol.iterator]

▸ **[Symbol.iterator]**(): *IterableIterator*<T\>

**Returns:** *IterableIterator*<T\>

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:138](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L138)

___

### add

▸ **add**(...`items`: (T \| [*Reference*](../classes/core.reference.md)<T\>)[]): *void*

#### Parameters:

Name | Type |
------ | ------ |
`...items` | (T \| [*Reference*](../classes/core.reference.md)<T\>)[] |

**Returns:** *void*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:91](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L91)

___

### contains

▸ **contains**(`item`: T \| [*Reference*](../classes/core.reference.md)<T\>, `check?`: *boolean*): *boolean*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`item` | T \| [*Reference*](../classes/core.reference.md)<T\> | - |
`check` | *boolean* | true |

**Returns:** *boolean*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:134](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L134)

___

### count

▸ **count**(): *number*

**Returns:** *number*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:142](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L142)

___

### get

▸ **get**(): readonly T & P[]

**Returns:** readonly T & P[]

Defined in: [packages/core/src/typings.ts:385](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/typings.ts#L385)

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

Inherited from: [Collection](../classes/core.collection.md)

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

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:75](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L75)

___

### getSnapshot

▸ **getSnapshot**(): *undefined* \| T[]

**`internal`** 

**Returns:** *undefined* \| T[]

Inherited from: [Collection](../classes/core.collection.md)

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

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:116](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L116)

___

### incrementCount

▸ `Protected`**incrementCount**(`value`: *number*): *void*

#### Parameters:

Name | Type |
------ | ------ |
`value` | *number* |

**Returns:** *void*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:197](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L197)

___

### init

▸ **init**(`options?`: [*InitOptions*](core.initoptions.md)<T\>): *Promise*<[*LoadedCollection*](core.loadedcollection.md)<T, P\>\>

#### Parameters:

Name | Type |
------ | ------ |
`options?` | [*InitOptions*](core.initoptions.md)<T\> |

**Returns:** *Promise*<[*LoadedCollection*](core.loadedcollection.md)<T, P\>\>

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:164](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L164)

▸ **init**(`populate?`: *string*[], `where?`: { `__@PrimaryKeyType@41543?`: *any*  } \| *NonNullable*<*Query*<T\>\>, `orderBy?`: [*QueryOrderMap*](core.queryordermap.md)): *Promise*<[*LoadedCollection*](core.loadedcollection.md)<T, P\>\>

#### Parameters:

Name | Type |
------ | ------ |
`populate?` | *string*[] |
`where?` | { `__@PrimaryKeyType@41543?`: *any*  } \| *NonNullable*<*Query*<T\>\> |
`orderBy?` | [*QueryOrderMap*](core.queryordermap.md) |

**Returns:** *Promise*<[*LoadedCollection*](core.loadedcollection.md)<T, P\>\>

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:165](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L165)

___

### isDirty

▸ **isDirty**(): *boolean*

**Returns:** *boolean*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:156](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L156)

___

### isInitialized

▸ **isInitialized**(`fully?`: *boolean*): *boolean*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`fully` | *boolean* | false |

**Returns:** *boolean*

Inherited from: [Collection](../classes/core.collection.md)

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

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:54](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L54)

___

### loadItems

▸ **loadItems**(): *Promise*<T[]\>

Initializes the collection and returns the items

**Returns:** *Promise*<T[]\>

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:42](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L42)

___

### populated

▸ **populated**(`populated?`: *boolean*): *void*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`populated` | *boolean* | true |

**Returns:** *void*

Inherited from: [Collection](../classes/core.collection.md)

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

Inherited from: [Collection](../classes/core.collection.md)

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

Inherited from: [Collection](../classes/core.collection.md)

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

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:173](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L173)

___

### remove

▸ **remove**(...`items`: (T \| [*Reference*](../classes/core.reference.md)<T\>)[]): *void*

#### Parameters:

Name | Type |
------ | ------ |
`...items` | (T \| [*Reference*](../classes/core.reference.md)<T\>)[] |

**Returns:** *void*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:122](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L122)

___

### removeAll

▸ **removeAll**(): *void*

**Returns:** *void*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:113](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L113)

___

### set

▸ **set**(`items`: (T \| [*Reference*](../classes/core.reference.md)<T\>)[]): *void*

#### Parameters:

Name | Type |
------ | ------ |
`items` | (T \| [*Reference*](../classes/core.reference.md)<T\>)[] |

**Returns:** *void*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:98](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L98)

___

### setDirty

▸ **setDirty**(`dirty?`: *boolean*): *void*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`dirty` | *boolean* | true |

**Returns:** *void*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:160](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L160)

___

### shouldPopulate

▸ **shouldPopulate**(): *boolean*

**Returns:** *boolean*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:147](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L147)

___

### shouldPropagateToCollection

▸ `Protected`**shouldPropagateToCollection**(`collection`: [*ArrayCollection*](../classes/core.arraycollection.md)<*unknown*, T\>, `method`: *add* \| *remove*): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`collection` | [*ArrayCollection*](../classes/core.arraycollection.md)<*unknown*, T\> |
`method` | *add* \| *remove* |

**Returns:** *boolean*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:184](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L184)

___

### takeSnapshot

▸ **takeSnapshot**(): *void*

**`internal`** 

**Returns:** *void*

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:218](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L218)

___

### toArray

▸ **toArray**(): [*Dictionary*](../modules/core.md#dictionary)<*any*\>[]

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<*any*\>[]

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/ArrayCollection.ts:38](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/ArrayCollection.ts#L38)

___

### toJSON

▸ **toJSON**(): [*Dictionary*](../modules/core.md#dictionary)<*any*\>[]

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<*any*\>[]

Inherited from: [Collection](../classes/core.collection.md)

Defined in: [packages/core/src/entity/Collection.ts:83](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L83)
