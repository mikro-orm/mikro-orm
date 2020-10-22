---
id: "changesetpersister"
title: "Class: ChangeSetPersister"
sidebar_label: "ChangeSetPersister"
---

## Hierarchy

* **ChangeSetPersister**

## Constructors

### constructor

\+ **new ChangeSetPersister**(`driver`: [IDatabaseDriver](../interfaces/idatabasedriver.md), `metadata`: [MetadataStorage](metadatastorage.md), `hydrator`: [IHydrator](../interfaces/ihydrator.md), `factory`: [EntityFactory](entityfactory.md), `config`: [Configuration](configuration.md)): [ChangeSetPersister](changesetpersister.md)

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:12](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L12)*

#### Parameters:

Name | Type |
------ | ------ |
`driver` | [IDatabaseDriver](../interfaces/idatabasedriver.md) |
`metadata` | [MetadataStorage](metadatastorage.md) |
`hydrator` | [IHydrator](../interfaces/ihydrator.md) |
`factory` | [EntityFactory](entityfactory.md) |
`config` | [Configuration](configuration.md) |

**Returns:** [ChangeSetPersister](changesetpersister.md)

## Properties

### config

• `Private` `Readonly` **config**: [Configuration](configuration.md)

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:18](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L18)*

___

### driver

• `Private` `Readonly` **driver**: [IDatabaseDriver](../interfaces/idatabasedriver.md)

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:14](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L14)*

___

### factory

• `Private` `Readonly` **factory**: [EntityFactory](entityfactory.md)

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:17](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L17)*

___

### hydrator

• `Private` `Readonly` **hydrator**: [IHydrator](../interfaces/ihydrator.md)

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:16](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L16)*

___

### metadata

• `Private` `Readonly` **metadata**: [MetadataStorage](metadatastorage.md)

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:15](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L15)*

___

### platform

• `Private` `Readonly` **platform**: [Platform](platform.md) = this.driver.getPlatform()

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:12](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L12)*

## Methods

### checkOptimisticLock

▸ `Private`**checkOptimisticLock**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `changeSet`: [ChangeSet](../interfaces/changeset.md)&#60;T>, `res?`: [QueryResult](../interfaces/queryresult.md)): void

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:203](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L203)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`changeSet` | [ChangeSet](../interfaces/changeset.md)&#60;T> |
`res?` | [QueryResult](../interfaces/queryresult.md) |

**Returns:** void

___

### checkOptimisticLocks

▸ `Private`**checkOptimisticLocks**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `changeSets`: [ChangeSet](../interfaces/changeset.md)&#60;T>[], `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;void>

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:184](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L184)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`changeSets` | [ChangeSet](../interfaces/changeset.md)&#60;T>[] |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;void>

___

### executeDeletes

▸ **executeDeletes**&#60;T>(`changeSets`: [ChangeSet](../interfaces/changeset.md)&#60;T>[], `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;void>

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:46](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L46)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`changeSets` | [ChangeSet](../interfaces/changeset.md)&#60;T>[] |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;void>

___

### executeInserts

▸ **executeInserts**&#60;T>(`changeSets`: [ChangeSet](../interfaces/changeset.md)&#60;T>[], `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;void>

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:20](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L20)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`changeSets` | [ChangeSet](../interfaces/changeset.md)&#60;T>[] |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;void>

___

### executeUpdates

▸ **executeUpdates**&#60;T>(`changeSets`: [ChangeSet](../interfaces/changeset.md)&#60;T>[], `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;void>

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:33](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L33)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`changeSets` | [ChangeSet](../interfaces/changeset.md)&#60;T>[] |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;void>

___

### mapPrimaryKey

▸ `Private`**mapPrimaryKey**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `value`: [IPrimaryKey](../index.md#iprimarykey), `changeSet`: [ChangeSet](../interfaces/changeset.md)&#60;T>): void

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:138](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L138)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`value` | [IPrimaryKey](../index.md#iprimarykey) |
`changeSet` | [ChangeSet](../interfaces/changeset.md)&#60;T> |

**Returns:** void

___

### mapReturnedValues

▸ `Private`**mapReturnedValues**&#60;T>(`changeSet`: [ChangeSet](../interfaces/changeset.md)&#60;T>, `res`: [QueryResult](../interfaces/queryresult.md), `meta`: [EntityMetadata](entitymetadata.md)&#60;T>): void

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:265](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L265)*

Maps values returned via `returning` statement (postgres) or the inserted id (other sql drivers).
No need to handle composite keys here as they need to be set upfront.
We do need to map to the change set payload too, as it will be used in the originalEntityData for new entities.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`changeSet` | [ChangeSet](../interfaces/changeset.md)&#60;T> |
`res` | [QueryResult](../interfaces/queryresult.md) |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |

**Returns:** void

___

### markAsPopulated

▸ `Private`**markAsPopulated**&#60;T>(`changeSet`: [ChangeSet](../interfaces/changeset.md)&#60;T>, `meta`: [EntityMetadata](entitymetadata.md)&#60;T>): void

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:154](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L154)*

Sets populate flag to new entities so they are serialized like if they were loaded from the db

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`changeSet` | [ChangeSet](../interfaces/changeset.md)&#60;T> |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |

**Returns:** void

___

### persistManagedEntities

▸ `Private`**persistManagedEntities**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `changeSets`: [ChangeSet](../interfaces/changeset.md)&#60;T>[], `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;void>

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:122](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L122)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`changeSets` | [ChangeSet](../interfaces/changeset.md)&#60;T>[] |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;void>

___

### persistManagedEntitiesBatch

▸ `Private`**persistManagedEntitiesBatch**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `changeSets`: [ChangeSet](../interfaces/changeset.md)&#60;T>[], `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;void>

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:132](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L132)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`changeSets` | [ChangeSet](../interfaces/changeset.md)&#60;T>[] |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;void>

___

### persistManagedEntity

▸ `Private`**persistManagedEntity**&#60;T>(`changeSet`: [ChangeSet](../interfaces/changeset.md)&#60;T>, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;void>

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:114](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L114)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`changeSet` | [ChangeSet](../interfaces/changeset.md)&#60;T> |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;void>

___

### persistNewEntities

▸ `Private`**persistNewEntities**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `changeSets`: [ChangeSet](../interfaces/changeset.md)&#60;T>[], `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;void>

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:82](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L82)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`changeSets` | [ChangeSet](../interfaces/changeset.md)&#60;T>[] |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;void>

___

### persistNewEntitiesBatch

▸ `Private`**persistNewEntitiesBatch**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `changeSets`: [ChangeSet](../interfaces/changeset.md)&#60;T>[], `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;void>

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:95](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L95)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`changeSets` | [ChangeSet](../interfaces/changeset.md)&#60;T>[] |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;void>

___

### persistNewEntity

▸ `Private`**persistNewEntity**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `changeSet`: [ChangeSet](../interfaces/changeset.md)&#60;T>, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;void>

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:66](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L66)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`changeSet` | [ChangeSet](../interfaces/changeset.md)&#60;T> |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;void>

___

### processProperties

▸ `Private`**processProperties**&#60;T>(`changeSet`: [ChangeSet](../interfaces/changeset.md)&#60;T>): void

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:58](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L58)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`changeSet` | [ChangeSet](../interfaces/changeset.md)&#60;T> |

**Returns:** void

___

### processProperty

▸ `Private`**processProperty**&#60;T>(`changeSet`: [ChangeSet](../interfaces/changeset.md)&#60;T>, `prop`: [EntityProperty](../interfaces/entityproperty.md)&#60;T>): void

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:236](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L236)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`changeSet` | [ChangeSet](../interfaces/changeset.md)&#60;T> |
`prop` | [EntityProperty](../interfaces/entityproperty.md)&#60;T> |

**Returns:** void

___

### reloadVersionValues

▸ `Private`**reloadVersionValues**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `changeSets`: [ChangeSet](../interfaces/changeset.md)&#60;T>[], `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;void>

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:209](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L209)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`changeSets` | [ChangeSet](../interfaces/changeset.md)&#60;T>[] |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;void>

___

### updateEntity

▸ `Private`**updateEntity**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `changeSet`: [ChangeSet](../interfaces/changeset.md)&#60;T>, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;[QueryResult](../interfaces/queryresult.md)>

*Defined in [packages/core/src/unit-of-work/ChangeSetPersister.ts:171](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/unit-of-work/ChangeSetPersister.ts#L171)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`changeSet` | [ChangeSet](../interfaces/changeset.md)&#60;T> |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;[QueryResult](../interfaces/queryresult.md)>
