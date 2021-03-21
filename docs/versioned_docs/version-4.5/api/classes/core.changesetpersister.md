---
id: "core.changesetpersister"
title: "Class: ChangeSetPersister"
sidebar_label: "ChangeSetPersister"
custom_edit_url: null
hide_title: true
---

# Class: ChangeSetPersister

[core](../modules/core.md).ChangeSetPersister

## Constructors

### constructor

\+ **new ChangeSetPersister**(`driver`: [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>, `metadata`: [*MetadataStorage*](core.metadatastorage.md), `hydrator`: IHydrator, `factory`: [*EntityFactory*](core.entityfactory.md), `config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>): [*ChangeSetPersister*](core.changesetpersister.md)

#### Parameters:

Name | Type |
:------ | :------ |
`driver` | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\> |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |
`hydrator` | IHydrator |
`factory` | [*EntityFactory*](core.entityfactory.md) |
`config` | [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |

**Returns:** [*ChangeSetPersister*](core.changesetpersister.md)

Defined in: [packages/core/src/unit-of-work/ChangeSetPersister.ts:12](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSetPersister.ts#L12)

## Properties

### platform

• `Private` `Readonly` **platform**: [*Platform*](core.platform.md)

Defined in: [packages/core/src/unit-of-work/ChangeSetPersister.ts:12](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSetPersister.ts#L12)

## Methods

### checkOptimisticLock

▸ `Private`**checkOptimisticLock**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `changeSet`: [*ChangeSet*](core.changeset.md)<T\>, `res?`: [*QueryResult*](../interfaces/core.queryresult.md)): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`changeSet` | [*ChangeSet*](core.changeset.md)<T\> |
`res?` | [*QueryResult*](../interfaces/core.queryresult.md) |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/ChangeSetPersister.ts:211](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSetPersister.ts#L211)

___

### checkOptimisticLocks

▸ `Private`**checkOptimisticLocks**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `changeSets`: [*ChangeSet*](core.changeset.md)<T\>[], `ctx?`: *any*): *Promise*<void\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`changeSets` | [*ChangeSet*](core.changeset.md)<T\>[] |
`ctx?` | *any* |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/unit-of-work/ChangeSetPersister.ts:192](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSetPersister.ts#L192)

___

### executeDeletes

▸ **executeDeletes**<T\>(`changeSets`: [*ChangeSet*](core.changeset.md)<T\>[], `ctx?`: *any*): *Promise*<void\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`changeSets` | [*ChangeSet*](core.changeset.md)<T\>[] |
`ctx?` | *any* |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/unit-of-work/ChangeSetPersister.ts:46](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSetPersister.ts#L46)

___

### executeInserts

▸ **executeInserts**<T\>(`changeSets`: [*ChangeSet*](core.changeset.md)<T\>[], `ctx?`: *any*): *Promise*<void\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`changeSets` | [*ChangeSet*](core.changeset.md)<T\>[] |
`ctx?` | *any* |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/unit-of-work/ChangeSetPersister.ts:20](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSetPersister.ts#L20)

___

### executeUpdates

▸ **executeUpdates**<T\>(`changeSets`: [*ChangeSet*](core.changeset.md)<T\>[], `batched`: *boolean*, `ctx?`: *any*): *Promise*<void\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`changeSets` | [*ChangeSet*](core.changeset.md)<T\>[] |
`batched` | *boolean* |
`ctx?` | *any* |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/unit-of-work/ChangeSetPersister.ts:33](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSetPersister.ts#L33)

___

### mapPrimaryKey

▸ `Private`**mapPrimaryKey**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `value`: IPrimaryKeyValue, `changeSet`: [*ChangeSet*](core.changeset.md)<T\>): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`value` | IPrimaryKeyValue |
`changeSet` | [*ChangeSet*](core.changeset.md)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/ChangeSetPersister.ts:142](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSetPersister.ts#L142)

___

### mapReturnedValues

▸ `Private`**mapReturnedValues**<T\>(`changeSet`: [*ChangeSet*](core.changeset.md)<T\>, `res`: [*QueryResult*](../interfaces/core.queryresult.md), `meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>): *void*

Maps values returned via `returning` statement (postgres) or the inserted id (other sql drivers).
No need to handle composite keys here as they need to be set upfront.
We do need to map to the change set payload too, as it will be used in the originalEntityData for new entities.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`changeSet` | [*ChangeSet*](core.changeset.md)<T\> |
`res` | [*QueryResult*](../interfaces/core.queryresult.md) |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/ChangeSetPersister.ts:273](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSetPersister.ts#L273)

___

### markAsPopulated

▸ `Private`**markAsPopulated**<T\>(`changeSet`: [*ChangeSet*](core.changeset.md)<T\>, `meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>): *void*

Sets populate flag to new entities so they are serialized like if they were loaded from the db

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`changeSet` | [*ChangeSet*](core.changeset.md)<T\> |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/ChangeSetPersister.ts:162](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSetPersister.ts#L162)

___

### persistManagedEntities

▸ `Private`**persistManagedEntities**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `changeSets`: [*ChangeSet*](core.changeset.md)<T\>[], `ctx?`: *any*): *Promise*<void\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`changeSets` | [*ChangeSet*](core.changeset.md)<T\>[] |
`ctx?` | *any* |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/unit-of-work/ChangeSetPersister.ts:126](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSetPersister.ts#L126)

___

### persistManagedEntitiesBatch

▸ `Private`**persistManagedEntitiesBatch**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `changeSets`: [*ChangeSet*](core.changeset.md)<T\>[], `ctx?`: *any*): *Promise*<void\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`changeSets` | [*ChangeSet*](core.changeset.md)<T\>[] |
`ctx?` | *any* |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/unit-of-work/ChangeSetPersister.ts:136](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSetPersister.ts#L136)

___

### persistManagedEntity

▸ `Private`**persistManagedEntity**<T\>(`changeSet`: [*ChangeSet*](core.changeset.md)<T\>, `ctx?`: *any*): *Promise*<void\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`changeSet` | [*ChangeSet*](core.changeset.md)<T\> |
`ctx?` | *any* |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/unit-of-work/ChangeSetPersister.ts:118](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSetPersister.ts#L118)

___

### persistNewEntities

▸ `Private`**persistNewEntities**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `changeSets`: [*ChangeSet*](core.changeset.md)<T\>[], `ctx?`: *any*): *Promise*<void\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`changeSets` | [*ChangeSet*](core.changeset.md)<T\>[] |
`ctx?` | *any* |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/unit-of-work/ChangeSetPersister.ts:86](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSetPersister.ts#L86)

___

### persistNewEntitiesBatch

▸ `Private`**persistNewEntitiesBatch**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `changeSets`: [*ChangeSet*](core.changeset.md)<T\>[], `ctx?`: *any*): *Promise*<void\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`changeSets` | [*ChangeSet*](core.changeset.md)<T\>[] |
`ctx?` | *any* |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/unit-of-work/ChangeSetPersister.ts:99](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSetPersister.ts#L99)

___

### persistNewEntity

▸ `Private`**persistNewEntity**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `changeSet`: [*ChangeSet*](core.changeset.md)<T\>, `ctx?`: *any*): *Promise*<void\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`changeSet` | [*ChangeSet*](core.changeset.md)<T\> |
`ctx?` | *any* |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/unit-of-work/ChangeSetPersister.ts:66](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSetPersister.ts#L66)

___

### processProperties

▸ `Private`**processProperties**<T\>(`changeSet`: [*ChangeSet*](core.changeset.md)<T\>): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`changeSet` | [*ChangeSet*](core.changeset.md)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/ChangeSetPersister.ts:58](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSetPersister.ts#L58)

___

### processProperty

▸ `Private`**processProperty**<T\>(`changeSet`: [*ChangeSet*](core.changeset.md)<T\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`changeSet` | [*ChangeSet*](core.changeset.md)<T\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/ChangeSetPersister.ts:244](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSetPersister.ts#L244)

___

### reloadVersionValues

▸ `Private`**reloadVersionValues**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `changeSets`: [*ChangeSet*](core.changeset.md)<T\>[], `ctx?`: *any*): *Promise*<void\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`changeSets` | [*ChangeSet*](core.changeset.md)<T\>[] |
`ctx?` | *any* |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/unit-of-work/ChangeSetPersister.ts:217](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSetPersister.ts#L217)

___

### updateEntity

▸ `Private`**updateEntity**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `changeSet`: [*ChangeSet*](core.changeset.md)<T\>, `ctx?`: *any*): *Promise*<[*QueryResult*](../interfaces/core.queryresult.md)\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`changeSet` | [*ChangeSet*](core.changeset.md)<T\> |
`ctx?` | *any* |

**Returns:** *Promise*<[*QueryResult*](../interfaces/core.queryresult.md)\>

Defined in: [packages/core/src/unit-of-work/ChangeSetPersister.ts:179](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSetPersister.ts#L179)
