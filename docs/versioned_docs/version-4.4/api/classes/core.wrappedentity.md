---
id: "core.wrappedentity"
title: "Class: WrappedEntity<T, PK>"
sidebar_label: "WrappedEntity"
hide_title: true
---

# Class: WrappedEntity<T, PK\>

[core](../modules/core.md).WrappedEntity

## Type parameters

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |
`PK` | keyof T |

## Hierarchy

* **WrappedEntity**

## Constructors

### constructor

\+ **new WrappedEntity**<T, PK\>(`entity`: T, `pkGetter`: (`e`: T) => [*Primary*](../modules/core.md#primary)<T\>, `pkSerializer`: (`e`: T) => *string*): [*WrappedEntity*](core.wrappedentity.md)<T, PK\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |
`PK` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`pkGetter` | (`e`: T) => [*Primary*](../modules/core.md#primary)<T\> |
`pkSerializer` | (`e`: T) => *string* |

**Returns:** [*WrappedEntity*](core.wrappedentity.md)<T, PK\>

Defined in: [packages/core/src/entity/WrappedEntity.ts:24](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L24)

## Properties

### \_\_em

• `Optional` **\_\_em**: *undefined* \| [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

Defined in: [packages/core/src/entity/WrappedEntity.ts:17](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L17)

___

### \_\_identifier

• `Optional` **\_\_identifier**: *undefined* \| [*EntityData*](../modules/core.md#entitydata)<T\>

holds wrapped primary key so we can compute change set without eager commit

Defined in: [packages/core/src/entity/WrappedEntity.ts:24](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L24)

___

### \_\_initialized

• **\_\_initialized**: *boolean*= true

Defined in: [packages/core/src/entity/WrappedEntity.ts:13](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L13)

___

### \_\_lazyInitialized

• `Optional` **\_\_lazyInitialized**: *undefined* \| *boolean*

Defined in: [packages/core/src/entity/WrappedEntity.ts:15](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L15)

___

### \_\_managed

• `Optional` **\_\_managed**: *undefined* \| *boolean*

Defined in: [packages/core/src/entity/WrappedEntity.ts:16](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L16)

___

### \_\_originalEntityData

• `Optional` **\_\_originalEntityData**: *undefined* \| [*EntityData*](../modules/core.md#entitydata)<T\>

holds last entity data snapshot so we can compute changes when persisting managed entities

Defined in: [packages/core/src/entity/WrappedEntity.ts:21](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L21)

___

### \_\_populated

• `Optional` **\_\_populated**: *undefined* \| *boolean*

Defined in: [packages/core/src/entity/WrappedEntity.ts:14](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L14)

___

### \_\_serializationContext

• **\_\_serializationContext**: { `populate?`: *undefined* \| [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[] ; `root?`: *undefined* \| [*SerializationContext*](core.serializationcontext.md)<T\>  }

#### Type declaration:

Name | Type |
------ | ------ |
`populate?` | *undefined* \| [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[] |
`root?` | *undefined* \| [*SerializationContext*](core.serializationcontext.md)<T\> |

Defined in: [packages/core/src/entity/WrappedEntity.ts:18](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L18)

## Accessors

### \_\_meta

• **__meta**(): [*EntityMetadata*](core.entitymetadata.md)<T\>

**Returns:** [*EntityMetadata*](core.entitymetadata.md)<T\>

Defined in: [packages/core/src/entity/WrappedEntity.ts:93](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L93)

___

### \_\_platform

• **__platform**(): [*Platform*](core.platform.md)

**Returns:** [*Platform*](core.platform.md)

Defined in: [packages/core/src/entity/WrappedEntity.ts:97](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L97)

___

### \_\_primaryKeyCond

• **__primaryKeyCond**(): *null* \| [*Primary*](../modules/core.md#primary)<T\> \| [*Primary*](../modules/core.md#primary)<T\>[]

**Returns:** *null* \| [*Primary*](../modules/core.md#primary)<T\> \| [*Primary*](../modules/core.md#primary)<T\>[]

Defined in: [packages/core/src/entity/WrappedEntity.ts:105](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L105)

___

### \_\_primaryKeys

• **__primaryKeys**(): [*Primary*](../modules/core.md#primary)<T\>[]

**Returns:** [*Primary*](../modules/core.md#primary)<T\>[]

Defined in: [packages/core/src/entity/WrappedEntity.ts:101](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L101)

## Methods

### \_\_@custom@36825

▸ **__@custom@36825**(): *string*

**Returns:** *string*

Defined in: [packages/core/src/entity/WrappedEntity.ts:113](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L113)

___

### assign

▸ **assign**(`data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `options?`: [*AssignOptions*](../interfaces/core.assignoptions.md)): T

#### Parameters:

Name | Type |
------ | ------ |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`options?` | [*AssignOptions*](../interfaces/core.assignoptions.md) |

**Returns:** T

Defined in: [packages/core/src/entity/WrappedEntity.ts:56](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L56)

___

### getPrimaryKey

▸ **getPrimaryKey**(): *null* \| [*Primary*](../modules/core.md#primary)<T\>

**Returns:** *null* \| [*Primary*](../modules/core.md#primary)<T\>

Defined in: [packages/core/src/entity/WrappedEntity.ts:81](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L81)

___

### getSerializedPrimaryKey

▸ **getSerializedPrimaryKey**(): *string*

**Returns:** *string*

Defined in: [packages/core/src/entity/WrappedEntity.ts:89](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L89)

___

### hasPrimaryKey

▸ **hasPrimaryKey**(): *boolean*

**Returns:** *boolean*

Defined in: [packages/core/src/entity/WrappedEntity.ts:76](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L76)

___

### init

▸ **init**<P\>(`populated?`: *boolean*, `populate?`: P, `lockMode?`: [*NONE*](../enums/core.lockmode.md#none) \| [*OPTIMISTIC*](../enums/core.lockmode.md#optimistic) \| [*PESSIMISTIC\_READ*](../enums/core.lockmode.md#pessimistic_read) \| [*PESSIMISTIC\_WRITE*](../enums/core.lockmode.md#pessimistic_write)): *Promise*<T\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`P` | [*Populate*](../modules/core.md#populate)<T\> | [*Populate*](../modules/core.md#populate)<T\\> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`populated` | *boolean* | true |
`populate?` | P | - |
`lockMode?` | [*NONE*](../enums/core.lockmode.md#none) \| [*OPTIMISTIC*](../enums/core.lockmode.md#optimistic) \| [*PESSIMISTIC\_READ*](../enums/core.lockmode.md#pessimistic_read) \| [*PESSIMISTIC\_WRITE*](../enums/core.lockmode.md#pessimistic_write) | - |

**Returns:** *Promise*<T\>

Defined in: [packages/core/src/entity/WrappedEntity.ts:64](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L64)

___

### isInitialized

▸ **isInitialized**(): *boolean*

**Returns:** *boolean*

Defined in: [packages/core/src/entity/WrappedEntity.ts:30](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L30)

___

### populated

▸ **populated**(`populated?`: *boolean*): *void*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`populated` | *boolean* | true |

**Returns:** *void*

Defined in: [packages/core/src/entity/WrappedEntity.ts:34](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L34)

___

### setPrimaryKey

▸ **setPrimaryKey**(`id`: *null* \| [*Primary*](../modules/core.md#primary)<T\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`id` | *null* \| [*Primary*](../modules/core.md#primary)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/entity/WrappedEntity.ts:85](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L85)

___

### toJSON

▸ **toJSON**(...`args`: *any*[]): [*EntityData*](../modules/core.md#entitydata)<T\>

#### Parameters:

Name | Type |
------ | ------ |
`...args` | *any*[] |

**Returns:** [*EntityData*](../modules/core.md#entitydata)<T\>

Defined in: [packages/core/src/entity/WrappedEntity.ts:51](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L51)

___

### toObject

▸ **toObject**(`ignoreFields?`: *string*[]): [*EntityData*](../modules/core.md#entitydata)<T\>

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`ignoreFields` | *string*[] | ... |

**Returns:** [*EntityData*](../modules/core.md#entitydata)<T\>

Defined in: [packages/core/src/entity/WrappedEntity.ts:43](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L43)

___

### toPOJO

▸ **toPOJO**(): [*EntityData*](../modules/core.md#entitydata)<T\>

**Returns:** [*EntityData*](../modules/core.md#entitydata)<T\>

Defined in: [packages/core/src/entity/WrappedEntity.ts:47](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L47)

___

### toReference

▸ **toReference**(): [*IdentifiedReference*](../modules/core.md#identifiedreference)<T, PK\>

**Returns:** [*IdentifiedReference*](../modules/core.md#identifiedreference)<T, PK\>

Defined in: [packages/core/src/entity/WrappedEntity.ts:39](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/WrappedEntity.ts#L39)
