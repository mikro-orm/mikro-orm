---
id: "core.wrappedentity"
title: "Class: WrappedEntity<T, PK>"
sidebar_label: "WrappedEntity"
custom_edit_url: null
hide_title: true
---

# Class: WrappedEntity<T, PK\>

[core](../modules/core.md).WrappedEntity

## Type parameters

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |
`PK` | keyof T |

## Constructors

### constructor

\+ **new WrappedEntity**<T, PK\>(`entity`: T, `pkGetter`: (`e`: T) => [*Primary*](../modules/core.md#primary)<T\>, `pkSerializer`: (`e`: T) => *string*): [*WrappedEntity*](core.wrappedentity.md)<T, PK\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |
`PK` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`pkGetter` | (`e`: T) => [*Primary*](../modules/core.md#primary)<T\> |
`pkSerializer` | (`e`: T) => *string* |

**Returns:** [*WrappedEntity*](core.wrappedentity.md)<T, PK\>

Defined in: [packages/core/src/entity/WrappedEntity.ts:25](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L25)

## Properties

### \_\_em

• `Optional` **\_\_em**: [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

Defined in: [packages/core/src/entity/WrappedEntity.ts:18](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L18)

___

### \_\_identifier

• `Optional` **\_\_identifier**: [*EntityIdentifier*](core.entityidentifier.md)

holds wrapped primary key so we can compute change set without eager commit

Defined in: [packages/core/src/entity/WrappedEntity.ts:25](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L25)

___

### \_\_initialized

• **\_\_initialized**: *boolean*= true

Defined in: [packages/core/src/entity/WrappedEntity.ts:14](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L14)

___

### \_\_lazyInitialized

• `Optional` **\_\_lazyInitialized**: *boolean*

Defined in: [packages/core/src/entity/WrappedEntity.ts:16](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L16)

___

### \_\_managed

• `Optional` **\_\_managed**: *boolean*

Defined in: [packages/core/src/entity/WrappedEntity.ts:17](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L17)

___

### \_\_originalEntityData

• `Optional` **\_\_originalEntityData**: [*EntityData*](../modules/core.md#entitydata)<T\>

holds last entity data snapshot so we can compute changes when persisting managed entities

Defined in: [packages/core/src/entity/WrappedEntity.ts:22](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L22)

___

### \_\_populated

• `Optional` **\_\_populated**: *boolean*

Defined in: [packages/core/src/entity/WrappedEntity.ts:15](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L15)

___

### \_\_serializationContext

• **\_\_serializationContext**: *object*

#### Type declaration:

Name | Type |
:------ | :------ |
`populate`? | [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[] |
`root`? | [*SerializationContext*](core.serializationcontext.md)<T\> |

Defined in: [packages/core/src/entity/WrappedEntity.ts:19](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L19)

## Accessors

### \_\_meta

• get **__meta**(): [*EntityMetadata*](core.entitymetadata.md)<T\>

**Returns:** [*EntityMetadata*](core.entitymetadata.md)<T\>

Defined in: [packages/core/src/entity/WrappedEntity.ts:94](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L94)

___

### \_\_platform

• get **__platform**(): [*Platform*](core.platform.md)

**Returns:** [*Platform*](core.platform.md)

Defined in: [packages/core/src/entity/WrappedEntity.ts:98](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L98)

___

### \_\_primaryKeyCond

• get **__primaryKeyCond**(): *null* \| [*Primary*](../modules/core.md#primary)<T\> \| [*Primary*](../modules/core.md#primary)<T\>[]

**Returns:** *null* \| [*Primary*](../modules/core.md#primary)<T\> \| [*Primary*](../modules/core.md#primary)<T\>[]

Defined in: [packages/core/src/entity/WrappedEntity.ts:106](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L106)

___

### \_\_primaryKeys

• get **__primaryKeys**(): [*Primary*](../modules/core.md#primary)<T\>[]

**Returns:** [*Primary*](../modules/core.md#primary)<T\>[]

Defined in: [packages/core/src/entity/WrappedEntity.ts:102](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L102)

## Methods

### [custom]

▸ **[custom]**(): *string*

**Returns:** *string*

Defined in: [packages/core/src/entity/WrappedEntity.ts:114](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L114)

___

### assign

▸ **assign**(`data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `options?`: [*AssignOptions*](../interfaces/core.assignoptions.md)): T

#### Parameters:

Name | Type |
:------ | :------ |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`options?` | [*AssignOptions*](../interfaces/core.assignoptions.md) |

**Returns:** T

Defined in: [packages/core/src/entity/WrappedEntity.ts:57](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L57)

___

### getPrimaryKey

▸ **getPrimaryKey**(): *null* \| [*Primary*](../modules/core.md#primary)<T\>

**Returns:** *null* \| [*Primary*](../modules/core.md#primary)<T\>

Defined in: [packages/core/src/entity/WrappedEntity.ts:82](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L82)

___

### getSerializedPrimaryKey

▸ **getSerializedPrimaryKey**(): *string*

**Returns:** *string*

Defined in: [packages/core/src/entity/WrappedEntity.ts:90](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L90)

___

### hasPrimaryKey

▸ **hasPrimaryKey**(): *boolean*

**Returns:** *boolean*

Defined in: [packages/core/src/entity/WrappedEntity.ts:77](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L77)

___

### init

▸ **init**<P\>(`populated?`: *boolean*, `populate?`: P, `lockMode?`: [*LockMode*](../enums/core.lockmode.md)): *Promise*<T\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`P` | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> |

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`populated` | *boolean* | true |
`populate?` | P | - |
`lockMode?` | [*LockMode*](../enums/core.lockmode.md) | - |

**Returns:** *Promise*<T\>

Defined in: [packages/core/src/entity/WrappedEntity.ts:65](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L65)

___

### isInitialized

▸ **isInitialized**(): *boolean*

**Returns:** *boolean*

Defined in: [packages/core/src/entity/WrappedEntity.ts:31](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L31)

___

### populated

▸ **populated**(`populated?`: *boolean*): *void*

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`populated` | *boolean* | true |

**Returns:** *void*

Defined in: [packages/core/src/entity/WrappedEntity.ts:35](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L35)

___

### setPrimaryKey

▸ **setPrimaryKey**(`id`: *null* \| [*Primary*](../modules/core.md#primary)<T\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`id` | *null* \| [*Primary*](../modules/core.md#primary)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/entity/WrappedEntity.ts:86](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L86)

___

### toJSON

▸ **toJSON**(...`args`: *any*[]): { [P in string \| number \| symbol]?: any} & [*Dictionary*](../modules/core.md#dictionary)<any\>

#### Parameters:

Name | Type |
:------ | :------ |
`...args` | *any*[] |

**Returns:** { [P in string \| number \| symbol]?: any} & [*Dictionary*](../modules/core.md#dictionary)<any\>

Defined in: [packages/core/src/entity/WrappedEntity.ts:52](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L52)

___

### toObject

▸ **toObject**(`ignoreFields?`: *string*[]): [*EntityData*](../modules/core.md#entitydata)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`ignoreFields` | *string*[] |

**Returns:** [*EntityData*](../modules/core.md#entitydata)<T\>

Defined in: [packages/core/src/entity/WrappedEntity.ts:44](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L44)

___

### toPOJO

▸ **toPOJO**(): [*EntityData*](../modules/core.md#entitydata)<T\>

**Returns:** [*EntityData*](../modules/core.md#entitydata)<T\>

Defined in: [packages/core/src/entity/WrappedEntity.ts:48](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L48)

___

### toReference

▸ **toReference**(): [*IdentifiedReference*](../modules/core.md#identifiedreference)<T, PK\>

**Returns:** [*IdentifiedReference*](../modules/core.md#identifiedreference)<T, PK\>

Defined in: [packages/core/src/entity/WrappedEntity.ts:40](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/WrappedEntity.ts#L40)
