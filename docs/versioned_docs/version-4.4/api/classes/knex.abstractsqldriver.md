---
id: "knex.abstractsqldriver"
title: "Class: AbstractSqlDriver<C>"
sidebar_label: "AbstractSqlDriver"
hide_title: true
---

# Class: AbstractSqlDriver<C\>

[knex](../modules/knex.md).AbstractSqlDriver

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`C` | [*AbstractSqlConnection*](knex.abstractsqlconnection.md) | [*AbstractSqlConnection*](knex.abstractsqlconnection.md) |

## Hierarchy

* [*DatabaseDriver*](core.databasedriver.md)<C\>

  ↳ **AbstractSqlDriver**

## Constructors

### constructor

\+ `Protected`**new AbstractSqlDriver**<C\>(`config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>, `platform`: [*AbstractSqlPlatform*](knex.abstractsqlplatform.md), `connection`: [*Constructor*](../modules/core.md#constructor)<C\>, `connector`: *string*[]): [*AbstractSqlDriver*](knex.abstractsqldriver.md)<C\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`C` | [*AbstractSqlConnection*](knex.abstractsqlconnection.md)<C\> | [*AbstractSqlConnection*](knex.abstractsqlconnection.md) |

#### Parameters:

Name | Type |
------ | ------ |
`config` | [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |
`platform` | [*AbstractSqlPlatform*](knex.abstractsqlplatform.md) |
`connection` | [*Constructor*](../modules/core.md#constructor)<C\> |
`connector` | *string*[] |

**Returns:** [*AbstractSqlDriver*](knex.abstractsqldriver.md)<C\>

Inherited from: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/knex/src/AbstractSqlDriver.ts:19](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L19)

## Properties

### \_\_@EntityManagerType@43871

• **\_\_@EntityManagerType@43871**: [*EntityManager*](knex.entitymanager.md)<[*AbstractSqlDriver*](knex.abstractsqldriver.md)<C\>\>

Overrides: [DatabaseDriver](core.databasedriver.md).[__@EntityManagerType@43871](core.databasedriver.md#__@entitymanagertype@43871)

Defined in: [packages/knex/src/AbstractSqlDriver.ts:15](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L15)

___

### comparator

• `Protected` **comparator**: [*EntityComparator*](core.entitycomparator.md)

Inherited from: [DatabaseDriver](core.databasedriver.md).[comparator](core.databasedriver.md#comparator)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:21](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L21)

___

### config

• `Protected` `Readonly` **config**: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

Inherited from: [DatabaseDriver](core.databasedriver.md).[config](core.databasedriver.md#config)

___

### connection

• `Protected` `Readonly` **connection**: C

Overrides: [DatabaseDriver](core.databasedriver.md).[connection](core.databasedriver.md#connection)

Defined in: [packages/knex/src/AbstractSqlDriver.ts:17](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L17)

___

### dependencies

• `Protected` `Readonly` **dependencies**: *string*[]

Inherited from: [DatabaseDriver](core.databasedriver.md).[dependencies](core.databasedriver.md#dependencies)

___

### logger

• `Protected` `Readonly` **logger**: [*Logger*](core.logger.md)

Inherited from: [DatabaseDriver](core.databasedriver.md).[logger](core.databasedriver.md#logger)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:20](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L20)

___

### metadata

• `Protected` **metadata**: [*MetadataStorage*](core.metadatastorage.md)

Inherited from: [DatabaseDriver](core.databasedriver.md).[metadata](core.databasedriver.md#metadata)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:22](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L22)

___

### platform

• `Protected` `Readonly` **platform**: [*AbstractSqlPlatform*](knex.abstractsqlplatform.md)

Overrides: [DatabaseDriver](core.databasedriver.md).[platform](core.databasedriver.md#platform)

Defined in: [packages/knex/src/AbstractSqlDriver.ts:19](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L19)

___

### replicas

• `Protected` `Readonly` **replicas**: C[]

Overrides: [DatabaseDriver](core.databasedriver.md).[replicas](core.databasedriver.md#replicas)

Defined in: [packages/knex/src/AbstractSqlDriver.ts:18](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L18)

## Methods

### aggregate

▸ **aggregate**(`entityName`: *string*, `pipeline`: *any*[]): *Promise*<*any*[]\>

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |
`pipeline` | *any*[] |

**Returns:** *Promise*<*any*[]\>

Inherited from: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:49](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L49)

___

### appendToCollection

▸ `Private`**appendToCollection**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `collection`: [*EntityData*](../modules/core.md#entitydata)<T\>[], `relationPojo`: [*EntityData*](../modules/core.md#entitydata)<T\>): *void*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`collection` | [*EntityData*](../modules/core.md#entitydata)<T\>[] |
`relationPojo` | [*EntityData*](../modules/core.md#entitydata)<T\> |

**Returns:** *void*

Defined in: [packages/knex/src/AbstractSqlDriver.ts:157](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L157)

___

### autoJoinOneToOneOwner

▸ `Protected`**autoJoinOneToOneOwner**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `populate`: [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[], `fields?`: (*string* \| [*FieldsMap*](../modules/core.md#fieldsmap))[]): [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[]

1:1 owner side needs to be marked for population so QB auto-joins the owner id

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> | - |
`populate` | [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[] | - |
`fields` | (*string* \| [*FieldsMap*](../modules/core.md#fieldsmap))[] | ... |

**Returns:** [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[]

Defined in: [packages/knex/src/AbstractSqlDriver.ts:419](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L419)

___

### buildFields

▸ `Protected`**buildFields**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `populate`: [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[], `joinedProps`: [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[], `qb`: [*QueryBuilder*](knex.querybuilder.md)<T\>, `fields?`: [*Field*](../modules/knex.md#field)<T\>[]): [*Field*](../modules/knex.md#field)<T\>[]

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`populate` | [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[] |
`joinedProps` | [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[] |
`qb` | [*QueryBuilder*](knex.querybuilder.md)<T\> |
`fields?` | [*Field*](../modules/knex.md#field)<T\>[] |

**Returns:** [*Field*](../modules/knex.md#field)<T\>[]

Defined in: [packages/knex/src/AbstractSqlDriver.ts:586](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L586)

___

### close

▸ **close**(`force?`: *boolean*): *Promise*<*void*\>

#### Parameters:

Name | Type |
------ | ------ |
`force?` | *boolean* |

**Returns:** *Promise*<*void*\>

Inherited from: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:93](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L93)

___

### connect

▸ **connect**(): *Promise*<C\>

**Returns:** *Promise*<C\>

Inherited from: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:71](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L71)

___

### convertException

▸ **convertException**(`exception`: Error): [*DriverException*](core.driverexception.md)

**`inheritdoc`** 

#### Parameters:

Name | Type |
------ | ------ |
`exception` | Error |

**Returns:** [*DriverException*](core.driverexception.md)

Inherited from: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:244](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L244)

___

### count

▸ **count**<T\>(`entityName`: *string*, `where`: *any*, `options?`: [*CountOptions*](../interfaces/core.countoptions.md)<T\>, `ctx?`: [*Transaction*](../interfaces/knex.knex.transaction.md)<*any*, *any*\>): *Promise*<*number*\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | *string* | - |
`where` | *any* | - |
`options` | [*CountOptions*](../interfaces/core.countoptions.md)<T\> | ... |
`ctx?` | [*Transaction*](../interfaces/knex.knex.transaction.md)<*any*, *any*\> | - |

**Returns:** *Promise*<*number*\>

Overrides: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/knex/src/AbstractSqlDriver.ts:171](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L171)

___

### createEntityManager

▸ **createEntityManager**<D\>(`useContext?`: *boolean*): D[*typeof* [*EntityManagerType*](../modules/core.md#entitymanagertype)]

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`D` | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md), D\> | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\\> |

#### Parameters:

Name | Type |
------ | ------ |
`useContext?` | *boolean* |

**Returns:** D[*typeof* [*EntityManagerType*](../modules/core.md#entitymanagertype)]

Overrides: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/knex/src/AbstractSqlDriver.ts:32](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L32)

___

### createQueryBuilder

▸ `Protected`**createQueryBuilder**<T\>(`entityName`: *string*, `ctx?`: [*Transaction*](../interfaces/knex.knex.transaction.md)<*any*, *any*\>, `write?`: *boolean*, `convertCustomTypes?`: *boolean*): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |
`ctx?` | [*Transaction*](../interfaces/knex.knex.transaction.md)<*any*, *any*\> |
`write?` | *boolean* |
`convertCustomTypes?` | *boolean* |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/AbstractSqlDriver.ts:500](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L500)

___

### createReplicas

▸ `Protected`**createReplicas**(`cb`: (`c`: [*ConnectionOptions*](../interfaces/core.connectionoptions.md)) => C): C[]

#### Parameters:

Name | Type |
------ | ------ |
`cb` | (`c`: [*ConnectionOptions*](../interfaces/core.connectionoptions.md)) => C |

**Returns:** C[]

Inherited from: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:205](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L205)

___

### ensureIndexes

▸ **ensureIndexes**(): *Promise*<*void*\>

**Returns:** *Promise*<*void*\>

Inherited from: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:117](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L117)

___

### execute

▸ **execute**<T\>(`queryOrKnex`: *string* \| [*QueryBuilder*](knex.knex.querybuilder.md)<*any*, *any*\> \| [*Raw*](../interfaces/knex.knex.raw.md)<*any*\>, `params?`: *any*[], `method?`: *all* \| *get* \| *run*, `ctx?`: *any*): *Promise*<T\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [*QueryResult*](../interfaces/core.queryresult.md) \| [*EntityData*](../modules/core.md#entitydata)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\> \| [*EntityData*](../modules/core.md#entitydata)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>[] | [*EntityData*](../modules/core.md#entitydata)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\\>\\>[] |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`queryOrKnex` | *string* \| [*QueryBuilder*](knex.knex.querybuilder.md)<*any*, *any*\> \| [*Raw*](../interfaces/knex.knex.raw.md)<*any*\> | - |
`params` | *any*[] | ... |
`method` | *all* \| *get* \| *run* | 'all' |
`ctx?` | *any* | - |

**Returns:** *Promise*<T\>

Defined in: [packages/knex/src/AbstractSqlDriver.ts:412](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L412)

___

### extractManyToMany

▸ `Protected`**extractManyToMany**<T\>(`entityName`: *string*, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>): [*EntityData*](../modules/core.md#entitydata)<T\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |

**Returns:** [*EntityData*](../modules/core.md#entitydata)<T\>

Defined in: [packages/knex/src/AbstractSqlDriver.ts:510](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L510)

___

### find

▸ **find**<T\>(`entityName`: *string*, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `options?`: [*FindOptions*](../interfaces/core.findoptions.md)<T, [*Populate*](../modules/core.md#populate)<T\>\>, `ctx?`: [*Transaction*](../interfaces/knex.knex.transaction.md)<*any*, *any*\>): *Promise*<[*EntityData*](../modules/core.md#entitydata)<T\>[]\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | *string* | - |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> | - |
`options` | [*FindOptions*](../interfaces/core.findoptions.md)<T, [*Populate*](../modules/core.md#populate)<T\>\> | ... |
`ctx?` | [*Transaction*](../interfaces/knex.knex.transaction.md)<*any*, *any*\> | - |

**Returns:** *Promise*<[*EntityData*](../modules/core.md#entitydata)<T\>[]\>

Overrides: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/knex/src/AbstractSqlDriver.ts:36](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L36)

___

### findOne

▸ **findOne**<T\>(`entityName`: *string*, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `options?`: [*FindOneOptions*](../interfaces/core.findoneoptions.md)<T, [*Populate*](../modules/core.md#populate)<T\>\>, `ctx?`: [*Transaction*](../interfaces/knex.knex.transaction.md)<*any*, *any*\>): *Promise*<*null* \| [*EntityData*](../modules/core.md#entitydata)<T\>\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`options?` | [*FindOneOptions*](../interfaces/core.findoneoptions.md)<T, [*Populate*](../modules/core.md#populate)<T\>\> |
`ctx?` | [*Transaction*](../interfaces/knex.knex.transaction.md)<*any*, *any*\> |

**Returns:** *Promise*<*null* \| [*EntityData*](../modules/core.md#entitydata)<T\>\>

Overrides: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/knex/src/AbstractSqlDriver.ts:74](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L74)

___

### getConnection

▸ **getConnection**(`type?`: *read* \| *write*): C

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`type` | *read* \| *write* | 'write' |

**Returns:** C

Inherited from: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:83](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L83)

___

### getDependencies

▸ **getDependencies**(): *string*[]

**Returns:** *string*[]

Inherited from: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:113](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L113)

___

### getFieldsForJoinedLoad

▸ `Protected`**getFieldsForJoinedLoad**<T\>(`qb`: [*QueryBuilder*](knex.querybuilder.md)<T\>, `meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `populate?`: [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[], `parentTableAlias?`: *string*, `parentJoinPath?`: *string*): [*Field*](../modules/knex.md#field)<T\>[]

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`qb` | [*QueryBuilder*](knex.querybuilder.md)<T\> | - |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> | - |
`populate` | [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[] | ... |
`parentTableAlias?` | *string* | - |
`parentJoinPath?` | *string* | - |

**Returns:** [*Field*](../modules/knex.md#field)<T\>[]

Defined in: [packages/knex/src/AbstractSqlDriver.ts:460](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L460)

___

### getPivotInverseProperty

▸ `Protected`**getPivotInverseProperty**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>

Inherited from: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:190](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L190)

___

### getPivotOrderBy

▸ `Protected`**getPivotOrderBy**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md)): [*QueryOrderMap*](../interfaces/core.queryordermap.md)

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`orderBy?` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |

**Returns:** [*QueryOrderMap*](../interfaces/core.queryordermap.md)

Inherited from: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:169](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L169)

___

### getPlatform

▸ **getPlatform**(): [*AbstractSqlPlatform*](knex.abstractsqlplatform.md)

**Returns:** [*AbstractSqlPlatform*](knex.abstractsqlplatform.md)

Overrides: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/knex/src/AbstractSqlDriver.ts:28](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L28)

___

### getPrimaryKeyFields

▸ `Protected`**getPrimaryKeyFields**(`entityName`: *string*): *string*[]

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |

**Returns:** *string*[]

Inherited from: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:185](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L185)

___

### inlineEmbeddables

▸ `Protected`**inlineEmbeddables**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `data`: T, `where?`: *boolean*): *void*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`data` | T |
`where?` | *boolean* |

**Returns:** *void*

Inherited from: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:121](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L121)

___

### joinedProps

▸ `Protected`**joinedProps**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `populate`: [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[]): [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[]

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`populate` | [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[] |

**Returns:** [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[]

Defined in: [packages/knex/src/AbstractSqlDriver.ts:432](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L432)

___

### loadFromPivotTable

▸ **loadFromPivotTable**<T, O\>(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `owners`: [*Primary*](../modules/core.md#primary)<O\>[][], `where?`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md), `ctx?`: *any*, `options?`: [*FindOptions*](../interfaces/core.findoptions.md)<T, [*Populate*](../modules/core.md#populate)<T\>\>): *Promise*<[*Dictionary*](../modules/core.md#dictionary)<T[]\>\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |
`O` | [*AnyEntity*](../modules/core.md#anyentity)<O\> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> | - |
`owners` | [*Primary*](../modules/core.md#primary)<O\>[][] | - |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> | ... |
`orderBy?` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) | - |
`ctx?` | *any* | - |
`options?` | [*FindOptions*](../interfaces/core.findoptions.md)<T, [*Populate*](../modules/core.md#populate)<T\>\> | - |

**Returns:** *Promise*<[*Dictionary*](../modules/core.md#dictionary)<T[]\>\>

Overrides: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/knex/src/AbstractSqlDriver.ts:381](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L381)

___

### lockPessimistic

▸ **lockPessimistic**<T\>(`entity`: T, `mode`: [*LockMode*](../enums/core.lockmode.md), `ctx?`: *any*): *Promise*<*void*\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`mode` | [*LockMode*](../enums/core.lockmode.md) |
`ctx?` | *any* |

**Returns:** *Promise*<*void*\>

Overrides: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/knex/src/AbstractSqlDriver.ts:578](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L578)

___

### mapJoinedProps

▸ `Private`**mapJoinedProps**<T\>(`result`: [*EntityData*](../modules/core.md#entitydata)<T\>, `meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `populate`: [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[], `qb`: [*QueryBuilder*](knex.querybuilder.md)<T\>, `root`: [*EntityData*](../modules/core.md#entitydata)<T\>, `map`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>, `parentJoinPath?`: *string*): *void*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`result` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`populate` | [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[] |
`qb` | [*QueryBuilder*](knex.querybuilder.md)<T\> |
`root` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`map` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> |
`parentJoinPath?` | *string* |

**Returns:** *void*

Defined in: [packages/knex/src/AbstractSqlDriver.ts:104](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L104)

___

### mapPropToFieldNames

▸ **mapPropToFieldNames**<T\>(`qb`: [*QueryBuilder*](knex.querybuilder.md)<T\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>, `tableAlias?`: *string*): [*Field*](../modules/knex.md#field)<T\>[]

**`internal`** 

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`qb` | [*QueryBuilder*](knex.querybuilder.md)<T\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |
`tableAlias?` | *string* |

**Returns:** [*Field*](../modules/knex.md#field)<T\>[]

Defined in: [packages/knex/src/AbstractSqlDriver.ts:485](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L485)

___

### mapResult

▸ **mapResult**<T\>(`result`: [*EntityData*](../modules/core.md#entitydata)<T\>, `meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `populate?`: [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[], `qb?`: [*QueryBuilder*](knex.querybuilder.md)<T\>, `map?`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>): *null* \| [*EntityData*](../modules/core.md#entitydata)<T\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`result` | [*EntityData*](../modules/core.md#entitydata)<T\> | - |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> | - |
`populate` | [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[] | ... |
`qb?` | [*QueryBuilder*](knex.querybuilder.md)<T\> | - |
`map` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> | ... |

**Returns:** *null* \| [*EntityData*](../modules/core.md#entitydata)<T\>

Overrides: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/knex/src/AbstractSqlDriver.ts:89](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L89)

___

### mergeJoinedResult

▸ **mergeJoinedResult**<T\>(`rawResults`: [*EntityData*](../modules/core.md#entitydata)<T\>[], `meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>): [*EntityData*](../modules/core.md#entitydata)<T\>[]

**`internal`** 

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`rawResults` | [*EntityData*](../modules/core.md#entitydata)<T\>[] |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |

**Returns:** [*EntityData*](../modules/core.md#entitydata)<T\>[]

Defined in: [packages/knex/src/AbstractSqlDriver.ts:442](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L442)

___

### nativeDelete

▸ **nativeDelete**<T\>(`entityName`: *string*, `where`: *any*, `ctx?`: [*Transaction*](../interfaces/knex.knex.transaction.md)<*any*, *any*\>): *Promise*<[*QueryResult*](../interfaces/core.queryresult.md)\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |
`where` | *any* |
`ctx?` | [*Transaction*](../interfaces/knex.knex.transaction.md)<*any*, *any*\> |

**Returns:** *Promise*<[*QueryResult*](../interfaces/core.queryresult.md)\>

Overrides: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/knex/src/AbstractSqlDriver.ts:336](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L336)

___

### nativeInsert

▸ **nativeInsert**<T\>(`entityName`: *string*, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `ctx?`: [*Transaction*](../interfaces/knex.knex.transaction.md)<*any*, *any*\>, `convertCustomTypes?`: *boolean*): *Promise*<[*QueryResult*](../interfaces/core.queryresult.md)\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | *string* | - |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> | - |
`ctx?` | [*Transaction*](../interfaces/knex.knex.transaction.md)<*any*, *any*\> | - |
`convertCustomTypes` | *boolean* | true |

**Returns:** *Promise*<[*QueryResult*](../interfaces/core.queryresult.md)\>

Overrides: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/knex/src/AbstractSqlDriver.ts:184](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L184)

___

### nativeInsertMany

▸ **nativeInsertMany**<T\>(`entityName`: *string*, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>[], `ctx?`: [*Transaction*](../interfaces/knex.knex.transaction.md)<*any*, *any*\>, `processCollections?`: *boolean*, `convertCustomTypes?`: *boolean*): *Promise*<[*QueryResult*](../interfaces/core.queryresult.md)\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | *string* | - |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\>[] | - |
`ctx?` | [*Transaction*](../interfaces/knex.knex.transaction.md)<*any*, *any*\> | - |
`processCollections` | *boolean* | true |
`convertCustomTypes` | *boolean* | true |

**Returns:** *Promise*<[*QueryResult*](../interfaces/core.queryresult.md)\>

Overrides: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/knex/src/AbstractSqlDriver.ts:206](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L206)

___

### nativeUpdate

▸ **nativeUpdate**<T\>(`entityName`: *string*, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `ctx?`: [*Transaction*](../interfaces/knex.knex.transaction.md)<*any*, *any*\>, `convertCustomTypes?`: *boolean*): *Promise*<[*QueryResult*](../interfaces/core.queryresult.md)\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | *string* | - |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> | - |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> | - |
`ctx?` | [*Transaction*](../interfaces/knex.knex.transaction.md)<*any*, *any*\> | - |
`convertCustomTypes` | *boolean* | true |

**Returns:** *Promise*<[*QueryResult*](../interfaces/core.queryresult.md)\>

Overrides: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/knex/src/AbstractSqlDriver.ts:262](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L262)

___

### nativeUpdateMany

▸ **nativeUpdateMany**<T\>(`entityName`: *string*, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>[], `data`: [*EntityData*](../modules/core.md#entitydata)<T\>[], `ctx?`: [*Transaction*](../interfaces/knex.knex.transaction.md)<*any*, *any*\>, `processCollections?`: *boolean*, `convertCustomTypes?`: *boolean*): *Promise*<[*QueryResult*](../interfaces/core.queryresult.md)\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | *string* | - |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\>[] | - |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\>[] | - |
`ctx?` | [*Transaction*](../interfaces/knex.knex.transaction.md)<*any*, *any*\> | - |
`processCollections` | *boolean* | true |
`convertCustomTypes` | *boolean* | true |

**Returns:** *Promise*<[*QueryResult*](../interfaces/core.queryresult.md)\>

Overrides: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/knex/src/AbstractSqlDriver.ts:286](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L286)

___

### processManyToMany

▸ `Protected`**processManyToMany**<T\>(`meta`: *undefined* \| [*EntityMetadata*](core.entitymetadata.md)<T\>, `pks`: [*Primary*](../modules/core.md#primary)<T\>[], `collections`: [*EntityData*](../modules/core.md#entitydata)<T\>, `clear`: *boolean*, `ctx?`: [*Transaction*](../interfaces/knex.knex.transaction.md)<*any*, *any*\>): *Promise*<*void*\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | *undefined* \| [*EntityMetadata*](core.entitymetadata.md)<T\> |
`pks` | [*Primary*](../modules/core.md#primary)<T\>[] |
`collections` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`clear` | *boolean* |
`ctx?` | [*Transaction*](../interfaces/knex.knex.transaction.md)<*any*, *any*\> |

**Returns:** *Promise*<*void*\>

Defined in: [packages/knex/src/AbstractSqlDriver.ts:527](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L527)

___

### reconnect

▸ **reconnect**(): *Promise*<C\>

**Returns:** *Promise*<C\>

Inherited from: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:78](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L78)

___

### rethrow

▸ `Protected`**rethrow**<T\>(`promise`: *Promise*<T\>): *Promise*<T\>

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`promise` | *Promise*<T\> |

**Returns:** *Promise*<T\>

Inherited from: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:252](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L252)

___

### setMetadata

▸ **setMetadata**(`metadata`: [*MetadataStorage*](core.metadatastorage.md)): *void*

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |

**Returns:** *void*

Inherited from: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:102](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L102)

___

### shouldHaveColumn

▸ **shouldHaveColumn**<T\>(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>, `populate`: [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[], `includeFormulas?`: *boolean*): *boolean*

**`internal`** 

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> | - |
`populate` | [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[] | - |
`includeFormulas` | *boolean* | true |

**Returns:** *boolean*

Inherited from: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:225](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L225)

___

### syncCollection

▸ **syncCollection**<T, O\>(`coll`: [*Collection*](core.collection.md)<T, O\>, `ctx?`: *any*): *Promise*<*void*\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |
`O` | [*AnyEntity*](../modules/core.md#anyentity)<O\> |

#### Parameters:

Name | Type |
------ | ------ |
`coll` | [*Collection*](core.collection.md)<T, O\> |
`ctx?` | *any* |

**Returns:** *Promise*<*void*\>

Overrides: [DatabaseDriver](core.databasedriver.md)

Defined in: [packages/knex/src/AbstractSqlDriver.ts:348](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L348)

___

### updateCollectionDiff

▸ `Protected`**updateCollectionDiff**<T, O\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<O\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>, `pks`: [*Primary*](../modules/core.md#primary)<O\>[], `deleteDiff`: *boolean* \| [*Primary*](../modules/core.md#primary)<T\>[][], `insertDiff`: [*Primary*](../modules/core.md#primary)<T\>[][], `ctx?`: *any*): *Promise*<*void*\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |
`O` | [*AnyEntity*](../modules/core.md#anyentity)<O\> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<O\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |
`pks` | [*Primary*](../modules/core.md#primary)<O\>[] |
`deleteDiff` | *boolean* \| [*Primary*](../modules/core.md#primary)<T\>[][] |
`insertDiff` | [*Primary*](../modules/core.md#primary)<T\>[][] |
`ctx?` | *any* |

**Returns:** *Promise*<*void*\>

Defined in: [packages/knex/src/AbstractSqlDriver.ts:539](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlDriver.ts#L539)
