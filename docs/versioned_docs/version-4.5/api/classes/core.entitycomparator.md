---
id: "core.entitycomparator"
title: "Class: EntityComparator"
sidebar_label: "EntityComparator"
custom_edit_url: null
hide_title: true
---

# Class: EntityComparator

[core](../modules/core.md).EntityComparator

## Constructors

### constructor

\+ **new EntityComparator**(`metadata`: IMetadataStorage, `platform`: [*Platform*](core.platform.md)): [*EntityComparator*](core.entitycomparator.md)

#### Parameters:

Name | Type |
:------ | :------ |
`metadata` | IMetadataStorage |
`platform` | [*Platform*](core.platform.md) |

**Returns:** [*EntityComparator*](core.entitycomparator.md)

Defined in: [packages/core/src/utils/EntityComparator.ts:19](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/EntityComparator.ts#L19)

## Properties

### comparators

• `Private` `Readonly` **comparators**: *Map*<string, Comparator<any\>\>

Defined in: [packages/core/src/utils/EntityComparator.ts:15](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/EntityComparator.ts#L15)

___

### mappers

• `Private` `Readonly` **mappers**: *Map*<string, ResultMapper<any\>\>

Defined in: [packages/core/src/utils/EntityComparator.ts:16](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/EntityComparator.ts#L16)

___

### pkGetters

• `Private` `Readonly` **pkGetters**: *Map*<string, PkGetter<any\>\>

Defined in: [packages/core/src/utils/EntityComparator.ts:18](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/EntityComparator.ts#L18)

___

### pkSerializers

• `Private` `Readonly` **pkSerializers**: *Map*<string, PkSerializer<any\>\>

Defined in: [packages/core/src/utils/EntityComparator.ts:19](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/EntityComparator.ts#L19)

___

### snapshotGenerators

• `Private` `Readonly` **snapshotGenerators**: *Map*<string, SnapshotGenerator<any\>\>

Defined in: [packages/core/src/utils/EntityComparator.ts:17](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/EntityComparator.ts#L17)

## Methods

### diffEntities

▸ **diffEntities**<T\>(`entityName`: *string*, `a`: T, `b`: T): [*EntityData*](../modules/core.md#entitydata)<T\>

Computes difference between two entities.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*EntityData*](../modules/core.md#entitydata)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`a` | T |
`b` | T |

**Returns:** [*EntityData*](../modules/core.md#entitydata)<T\>

Defined in: [packages/core/src/utils/EntityComparator.ts:27](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/EntityComparator.ts#L27)

___

### getEmbeddedArrayPropertySnapshot

▸ `Private`**getEmbeddedArrayPropertySnapshot**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>, `context`: *Map*<string, any\>, `level`: *number*, `path?`: *string*[], `dataKey?`: *string*, `object?`: *boolean*, `serialize?`: *boolean*): *string*

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |
`context` | *Map*<string, any\> |
`level` | *number* |
`path` | *string*[] |
`dataKey?` | *string* |
`object?` | *boolean* |
`serialize?` | *boolean* |

**Returns:** *string*

Defined in: [packages/core/src/utils/EntityComparator.ts:225](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/EntityComparator.ts#L225)

___

### getEmbeddedPropertySnapshot

▸ `Private`**getEmbeddedPropertySnapshot**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>, `context`: *Map*<string, any\>, `level`: *number*, `path?`: *string*[], `dataKey?`: *string*, `object?`: *undefined* \| *boolean*): *string*

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |
`context` | *Map*<string, any\> |
`level` | *number* |
`path` | *string*[] |
`dataKey?` | *string* |
`object` | *undefined* \| *boolean* |

**Returns:** *string*

Defined in: [packages/core/src/utils/EntityComparator.ts:259](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/EntityComparator.ts#L259)

___

### getEntityComparator

▸ **getEntityComparator**<T\>(`entityName`: *string*): *Comparator*<T\>

**`internal`** Highly performance-sensitive method.

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |

**Returns:** *Comparator*<T\>

Defined in: [packages/core/src/utils/EntityComparator.ts:355](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/EntityComparator.ts#L355)

___

### getGenericComparator

▸ `Private`**getGenericComparator**(`prop`: *string*, `cond`: *string*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | *string* |
`cond` | *string* |

**Returns:** *string*

Defined in: [packages/core/src/utils/EntityComparator.ts:381](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/EntityComparator.ts#L381)

___

### getPkGetter

▸ **getPkGetter**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>): *any*

**`internal`** Highly performance-sensitive method.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |

**Returns:** *any*

Defined in: [packages/core/src/utils/EntityComparator.ts:52](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/EntityComparator.ts#L52)

___

### getPkSerializer

▸ **getPkSerializer**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>): *any*

**`internal`** Highly performance-sensitive method.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |

**Returns:** *any*

Defined in: [packages/core/src/utils/EntityComparator.ts:94](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/EntityComparator.ts#L94)

___

### getPropertyComparator

▸ `Private`**getPropertyComparator**<T\>(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>): *string*

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |

**Returns:** *string*

Defined in: [packages/core/src/utils/EntityComparator.ts:390](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/EntityComparator.ts#L390)

___

### getPropertyCondition

▸ `Private`**getPropertyCondition**<T\>(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>): *string*

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |

**Returns:** *string*

Defined in: [packages/core/src/utils/EntityComparator.ts:209](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/EntityComparator.ts#L209)

___

### getPropertySnapshot

▸ `Private`**getPropertySnapshot**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>, `context`: *Map*<string, any\>, `dataKey?`: *string*, `path?`: *string*[], `level?`: *number*, `object?`: *boolean*): *string*

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> | - |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> | - |
`context` | *Map*<string, any\> | - |
`dataKey?` | *string* | - |
`path?` | *string*[] | - |
`level` | *number* | 1 |
`object?` | *boolean* | - |

**Returns:** *string*

Defined in: [packages/core/src/utils/EntityComparator.ts:301](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/EntityComparator.ts#L301)

___

### getResultMapper

▸ **getResultMapper**<T\>(`entityName`: *string*): *ResultMapper*<T\>

**`internal`** Highly performance-sensitive method.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |

**Returns:** *ResultMapper*<T\>

Defined in: [packages/core/src/utils/EntityComparator.ts:172](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/EntityComparator.ts#L172)

___

### getSnapshotGenerator

▸ **getSnapshotGenerator**<T\>(`entityName`: *string*): *SnapshotGenerator*<T\>

**`internal`** Highly performance-sensitive method.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |

**Returns:** *SnapshotGenerator*<T\>

Defined in: [packages/core/src/utils/EntityComparator.ts:135](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/EntityComparator.ts#L135)

___

### mapResult

▸ **mapResult**<T\>(`entityName`: *string*, `result`: [*EntityData*](../modules/core.md#entitydata)<T\>): *null* \| [*EntityData*](../modules/core.md#entitydata)<T\>

Maps database columns to properties.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`result` | [*EntityData*](../modules/core.md#entitydata)<T\> |

**Returns:** *null* \| [*EntityData*](../modules/core.md#entitydata)<T\>

Defined in: [packages/core/src/utils/EntityComparator.ts:44](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/EntityComparator.ts#L44)

___

### prepareEntity

▸ **prepareEntity**<T\>(`entity`: T): [*EntityData*](../modules/core.md#entitydata)<T\>

Removes ORM specific code from entities and prepares it for serializing. Used before change set computation.
References will be mapped to primary keys, collections to arrays of primary keys.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |

**Returns:** [*EntityData*](../modules/core.md#entitydata)<T\>

Defined in: [packages/core/src/utils/EntityComparator.ts:36](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/EntityComparator.ts#L36)

___

### shouldSerialize

▸ `Private`**shouldSerialize**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `dataKey`: *string*): *boolean*

we need to serialize only object embeddables, and only the top level ones, so root object embeddable
properties and first child nested object embeddables with inlined parent

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`dataKey` | *string* |

**Returns:** *boolean*

Defined in: [packages/core/src/utils/EntityComparator.ts:251](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/EntityComparator.ts#L251)

___

### isComparable

▸ `Static`**isComparable**<T\>(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>, `root`: [*EntityMetadata*](core.entitymetadata.md)<any\>): *boolean*

perf: used to generate list of comparable properties during discovery, so we speed up the runtime comparison

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |
`root` | [*EntityMetadata*](core.entitymetadata.md)<any\> |

**Returns:** *boolean*

Defined in: [packages/core/src/utils/EntityComparator.ts:434](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/EntityComparator.ts#L434)
