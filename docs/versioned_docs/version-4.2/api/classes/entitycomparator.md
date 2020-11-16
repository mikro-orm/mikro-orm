---
id: "entitycomparator"
title: "Class: EntityComparator"
sidebar_label: "EntityComparator"
---

## Hierarchy

* **EntityComparator**

## Constructors

### constructor

\+ **new EntityComparator**(`metadata`: [IMetadataStorage](../interfaces/imetadatastorage.md), `platform`: [Platform](platform.md)): [EntityComparator](entitycomparator.md)

*Defined in [packages/core/src/utils/EntityComparator.ts:19](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/EntityComparator.ts#L19)*

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | [IMetadataStorage](../interfaces/imetadatastorage.md) |
`platform` | [Platform](platform.md) |

**Returns:** [EntityComparator](entitycomparator.md)

## Properties

### comparators

• `Private` `Readonly` **comparators**: Map&#60;string, [Comparator](../index.md#comparator)&#60;any>> = new Map&#60;string, Comparator&#60;any>>()

*Defined in [packages/core/src/utils/EntityComparator.ts:15](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/EntityComparator.ts#L15)*

___

### mappers

• `Private` `Readonly` **mappers**: Map&#60;string, [ResultMapper](../index.md#resultmapper)&#60;any>> = new Map&#60;string, ResultMapper&#60;any>>()

*Defined in [packages/core/src/utils/EntityComparator.ts:16](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/EntityComparator.ts#L16)*

___

### metadata

• `Private` `Readonly` **metadata**: [IMetadataStorage](../interfaces/imetadatastorage.md)

*Defined in [packages/core/src/utils/EntityComparator.ts:21](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/EntityComparator.ts#L21)*

___

### pkGetters

• `Private` `Readonly` **pkGetters**: Map&#60;string, [PkGetter](../index.md#pkgetter)&#60;any>> = new Map&#60;string, PkGetter&#60;any>>()

*Defined in [packages/core/src/utils/EntityComparator.ts:18](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/EntityComparator.ts#L18)*

___

### pkSerializers

• `Private` `Readonly` **pkSerializers**: Map&#60;string, [PkSerializer](../index.md#pkserializer)&#60;any>> = new Map&#60;string, PkSerializer&#60;any>>()

*Defined in [packages/core/src/utils/EntityComparator.ts:19](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/EntityComparator.ts#L19)*

___

### platform

• `Private` `Readonly` **platform**: [Platform](platform.md)

*Defined in [packages/core/src/utils/EntityComparator.ts:22](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/EntityComparator.ts#L22)*

___

### snapshotGenerators

• `Private` `Readonly` **snapshotGenerators**: Map&#60;string, [SnapshotGenerator](../index.md#snapshotgenerator)&#60;any>> = new Map&#60;string, SnapshotGenerator&#60;any>>()

*Defined in [packages/core/src/utils/EntityComparator.ts:17](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/EntityComparator.ts#L17)*

## Methods

### diffEntities

▸ **diffEntities**&#60;T>(`entityName`: string, `a`: T, `b`: T): [EntityData](../index.md#entitydata)&#60;T>

*Defined in [packages/core/src/utils/EntityComparator.ts:27](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/EntityComparator.ts#L27)*

Computes difference between two entities.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [EntityData](../index.md#entitydata)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`a` | T |
`b` | T |

**Returns:** [EntityData](../index.md#entitydata)&#60;T>

___

### getEntityComparator

▸ **getEntityComparator**&#60;T>(`entityName`: string): [Comparator](../index.md#comparator)&#60;T>

*Defined in [packages/core/src/utils/EntityComparator.ts:280](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/EntityComparator.ts#L280)*

**`internal`** Highly performance-sensitive method.

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |

**Returns:** [Comparator](../index.md#comparator)&#60;T>

___

### getGenericComparator

▸ `Private`**getGenericComparator**(`prop`: string, `cond`: string): string

*Defined in [packages/core/src/utils/EntityComparator.ts:306](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/EntityComparator.ts#L306)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | string |
`cond` | string |

**Returns:** string

___

### getPkGetter

▸ **getPkGetter**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>): any

*Defined in [packages/core/src/utils/EntityComparator.ts:52](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/EntityComparator.ts#L52)*

**`internal`** Highly performance-sensitive method.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |

**Returns:** any

___

### getPkSerializer

▸ **getPkSerializer**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>): any

*Defined in [packages/core/src/utils/EntityComparator.ts:94](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/EntityComparator.ts#L94)*

**`internal`** Highly performance-sensitive method.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |

**Returns:** any

___

### getPropertyComparator

▸ `Private`**getPropertyComparator**&#60;T>(`prop`: [EntityProperty](../interfaces/entityproperty.md)&#60;T>): string

*Defined in [packages/core/src/utils/EntityComparator.ts:315](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/EntityComparator.ts#L315)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md)&#60;T> |

**Returns:** string

___

### getPropertyCondition

▸ `Private`**getPropertyCondition**&#60;T>(`prop`: [EntityProperty](../interfaces/entityproperty.md)&#60;T>): string

*Defined in [packages/core/src/utils/EntityComparator.ts:208](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/EntityComparator.ts#L208)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md)&#60;T> |

**Returns:** string

___

### getPropertySnapshot

▸ `Private`**getPropertySnapshot**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `prop`: [EntityProperty](../interfaces/entityproperty.md)&#60;T>, `context`: Map&#60;string, any>): string

*Defined in [packages/core/src/utils/EntityComparator.ts:224](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/EntityComparator.ts#L224)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`prop` | [EntityProperty](../interfaces/entityproperty.md)&#60;T> |
`context` | Map&#60;string, any> |

**Returns:** string

___

### getResultMapper

▸ **getResultMapper**&#60;T>(`entityName`: string): [ResultMapper](../index.md#resultmapper)&#60;T>

*Defined in [packages/core/src/utils/EntityComparator.ts:166](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/EntityComparator.ts#L166)*

**`internal`** Highly performance-sensitive method.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |

**Returns:** [ResultMapper](../index.md#resultmapper)&#60;T>

___

### getSnapshotGenerator

▸ **getSnapshotGenerator**&#60;T>(`entityName`: string): [SnapshotGenerator](../index.md#snapshotgenerator)&#60;T>

*Defined in [packages/core/src/utils/EntityComparator.ts:135](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/EntityComparator.ts#L135)*

**`internal`** Highly performance-sensitive method.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |

**Returns:** [SnapshotGenerator](../index.md#snapshotgenerator)&#60;T>

___

### mapResult

▸ **mapResult**&#60;T>(`entityName`: string, `result`: [EntityData](../index.md#entitydata)&#60;T>): [EntityData](../index.md#entitydata)&#60;T> \| null

*Defined in [packages/core/src/utils/EntityComparator.ts:44](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/EntityComparator.ts#L44)*

Maps database columns to properties.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`result` | [EntityData](../index.md#entitydata)&#60;T> |

**Returns:** [EntityData](../index.md#entitydata)&#60;T> \| null

___

### prepareEntity

▸ **prepareEntity**&#60;T>(`entity`: T): [EntityData](../index.md#entitydata)&#60;T>

*Defined in [packages/core/src/utils/EntityComparator.ts:36](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/EntityComparator.ts#L36)*

Removes ORM specific code from entities and prepares it for serializing. Used before change set computation.
References will be mapped to primary keys, collections to arrays of primary keys.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |

**Returns:** [EntityData](../index.md#entitydata)&#60;T>

___

### isComparable

▸ `Static`**isComparable**&#60;T>(`prop`: [EntityProperty](../interfaces/entityproperty.md)&#60;T>, `root`: [EntityMetadata](entitymetadata.md)): boolean

*Defined in [packages/core/src/utils/EntityComparator.ts:359](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/EntityComparator.ts#L359)*

perf: used to generate list of comparable properties during discovery, so we speed up the runtime comparison

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md)&#60;T> |
`root` | [EntityMetadata](entitymetadata.md) |

**Returns:** boolean
