---
id: "core.configuration"
title: "Class: Configuration<D>"
sidebar_label: "Configuration"
custom_edit_url: null
hide_title: true
---

# Class: Configuration<D\>

[core](../modules/core.md).Configuration

## Type parameters

Name | Type | Default |
:------ | :------ | :------ |
`D` | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md) | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md) |

## Constructors

### constructor

\+ **new Configuration**<D\>(`options`: [*Options*](../modules/core.md#options)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>, `validate?`: *boolean*): [*Configuration*](core.configuration.md)<D\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`D` | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md), D\> | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\> |

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`options` | [*Options*](../modules/core.md#options)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> | - |
`validate` | *boolean* | true |

**Returns:** [*Configuration*](core.configuration.md)<D\>

Defined in: [packages/core/src/utils/Configuration.ts:98](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L98)

## Properties

### cache

• `Private` `Readonly` **cache**: [*Dictionary*](../modules/core.md#dictionary)<any\>

Defined in: [packages/core/src/utils/Configuration.ts:98](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L98)

___

### driver

• `Private` `Readonly` **driver**: D

Defined in: [packages/core/src/utils/Configuration.ts:96](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L96)

___

### logger

• `Private` `Readonly` **logger**: [*Logger*](core.logger.md)

Defined in: [packages/core/src/utils/Configuration.ts:95](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L95)

___

### options

• `Private` `Readonly` **options**: [*MikroORMOptions*](../interfaces/core.mikroormoptions.md)<D\>

Defined in: [packages/core/src/utils/Configuration.ts:94](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L94)

___

### platform

• `Private` `Readonly` **platform**: [*Platform*](core.platform.md)

Defined in: [packages/core/src/utils/Configuration.ts:97](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L97)

___

### DEFAULTS

▪ `Readonly` `Static` **DEFAULTS**: *object*

#### Type declaration:

Name | Type |
:------ | :------ |
`autoJoinOneToOneOwner` | *boolean* |
`baseDir` | *string* |
`batchSize` | *number* |
`cache` | *object* |
`cache.adapter` | *typeof* [*FileCacheAdapter*](core.filecacheadapter.md) |
`cache.options` | *object* |
`cache.options.cacheDir` | *string* |
`cache.pretty` | *boolean* |
`context` | (`name`: *string*) => *undefined* \| [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |
`contextName` | *string* |
`debug` | *boolean* |
`discovery` | *object* |
`discovery.alwaysAnalyseProperties` | *boolean* |
`discovery.disableDynamicFileAccess` | *boolean* |
`discovery.requireEntitiesArray` | *boolean* |
`discovery.warnWhenNoEntities` | *boolean* |
`driverOptions` | *object* |
`ensureIndexes` | *boolean* |
`entities` | *never*[] |
`entitiesTs` | *never*[] |
`filters` | *object* |
`findOneOrFailHandler` | (`entityName`: *string*, `where`: IPrimaryKeyValue \| [*Dictionary*](../modules/core.md#dictionary)<any\>) => [*NotFoundError*](core.notfounderror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> |
`forceEntityConstructor` | *boolean* |
`forceUndefined` | *boolean* |
`forceUtcTimezone` | *boolean* |
`highlighter` | [*NullHighlighter*](core.nullhighlighter.md) |
`hydrator` | *typeof* [*ObjectHydrator*](core.objecthydrator.md) |
`loadStrategy` | [*LoadStrategy*](../enums/core.loadstrategy.md) |
`logger` | (...`data`: *any*[]) => *void*(`message?`: *any*, ...`optionalParams`: *any*[]) => *void* |
`metadataProvider` | *typeof* [*ReflectMetadataProvider*](core.reflectmetadataprovider.md) |
`migrations` | *object* |
`migrations.allOrNothing` | *boolean* |
`migrations.disableForeignKeys` | *boolean* |
`migrations.dropTables` | *boolean* |
`migrations.emit` | *string* |
`migrations.fileName` | (`timestamp`: *string*) => *string* |
`migrations.path` | *string* |
`migrations.pattern` | *RegExp* |
`migrations.safe` | *boolean* |
`migrations.tableName` | *string* |
`migrations.transactional` | *boolean* |
`pool` | *object* |
`populateAfterFlush` | *boolean* |
`propagateToOneOwner` | *boolean* |
`resultCache` | *object* |
`resultCache.adapter` | *typeof* [*MemoryCacheAdapter*](core.memorycacheadapter.md) |
`resultCache.expiration` | *number* |
`resultCache.options` | *object* |
`strict` | *boolean* |
`subscribers` | *never*[] |
`validate` | *boolean* |
`verbose` | *boolean* |

Defined in: [packages/core/src/utils/Configuration.ts:27](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L27)

___

### PLATFORMS

▪ `Readonly` `Static` **PLATFORMS**: *object*

#### Type declaration:

Name | Type |
:------ | :------ |
`mariadb` | *object* |
`mariadb.className` | *string* |
`mariadb.module` | () => *any* |
`mongo` | *object* |
`mongo.className` | *string* |
`mongo.module` | () => *any* |
`mysql` | *object* |
`mysql.className` | *string* |
`mysql.module` | () => *any* |
`postgresql` | *object* |
`postgresql.className` | *string* |
`postgresql.module` | () => *any* |
`sqlite` | *object* |
`sqlite.className` | *string* |
`sqlite.module` | () => *any* |

Defined in: [packages/core/src/utils/Configuration.ts:86](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L86)

## Methods

### cached

▸ `Private`**cached**<T\>(`cls`: T, ...`args`: *ConstructorParameters*<T\>): *InstanceType*<T\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | (...`args`: *any*[]) => *InstanceType*<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`cls` | T |
`...args` | *ConstructorParameters*<T\> |

**Returns:** *InstanceType*<T\>

Defined in: [packages/core/src/utils/Configuration.ts:277](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L277)

___

### get

▸ **get**<T, U\>(`key`: T, `defaultValue?`: U): U

Gets specific configuration option. Falls back to specified `defaultValue` if provided.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | keyof [*MikroORMOptions*](../interfaces/core.mikroormoptions.md)<D\> |
`U` | *undefined* \| *string* \| *number* \| *boolean* \| [*Dictionary*](../modules/core.md#dictionary)<any\> \| [*Highlighter*](../interfaces/core.highlighter.md) \| () => [*NamingStrategy*](../interfaces/core.namingstrategy.md) \| [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](core.entityrepository.md)<any\>\> \| *Partial*<[*ConnectionOptions*](../interfaces/core.connectionoptions.md)\>[] \| (*string* \| *EntityClass*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> \| *EntityClassGroup*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> \| [*EntitySchema*](core.entityschema.md)<any, undefined\>)[] \| [*EventSubscriber*](../interfaces/core.eventsubscriber.md)<any\>[] \| [*Dictionary*](../modules/core.md#dictionary)<{ `name?`: *string*  } & *Omit*<FilterDef<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>, *name*\>\> \| { `alwaysAnalyseProperties?`: *boolean* ; `disableDynamicFileAccess?`: *boolean* ; `requireEntitiesArray?`: *boolean* ; `warnWhenNoEntities?`: *boolean*  } \| (`config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>) => D \| (*string* \| [*Constructor*](../modules/core.md#constructor)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>)[] \| HydratorConstructor \| (`name`: *string*) => *undefined* \| [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> \| (`message`: *string*) => *void* \| (`entityName`: *string*, `where`: IPrimaryKeyValue \| [*Dictionary*](../modules/core.md#dictionary)<any\>) => Error \| [*LoggerNamespace*](../modules/core.md#loggernamespace)[] \| [*MigrationsOptions*](../modules/core.md#migrationsoptions) \| { `adapter?`: (...`params`: *any*[]) => [*CacheAdapter*](../interfaces/core.cacheadapter.md) ; `enabled?`: *boolean* ; `options?`: [*Dictionary*](../modules/core.md#dictionary)<any\> ; `pretty?`: *boolean*  } \| { `adapter?`: (...`params`: *any*[]) => [*CacheAdapter*](../interfaces/core.cacheadapter.md) ; `expiration?`: *number* ; `options?`: [*Dictionary*](../modules/core.md#dictionary)<any\>  } \| (`config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>) => [*MetadataProvider*](core.metadataprovider.md) \| [*PoolConfig*](../interfaces/core.poolconfig.md) |

#### Parameters:

Name | Type |
:------ | :------ |
`key` | T |
`defaultValue?` | U |

**Returns:** U

Defined in: [packages/core/src/utils/Configuration.ts:118](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L118)

___

### getAll

▸ **getAll**(): [*MikroORMOptions*](../interfaces/core.mikroormoptions.md)<D\>

**Returns:** [*MikroORMOptions*](../interfaces/core.mikroormoptions.md)<D\>

Defined in: [packages/core/src/utils/Configuration.ts:122](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L122)

___

### getCacheAdapter

▸ **getCacheAdapter**(): [*CacheAdapter*](../interfaces/core.cacheadapter.md)

Gets instance of CacheAdapter. (cached)

**Returns:** [*CacheAdapter*](../interfaces/core.cacheadapter.md)

Defined in: [packages/core/src/utils/Configuration.ts:189](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L189)

___

### getClientUrl

▸ **getClientUrl**(`hidePassword?`: *boolean*): *string*

Gets current client URL (connection string).

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`hidePassword` | *boolean* | false |

**Returns:** *string*

Defined in: [packages/core/src/utils/Configuration.ts:150](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L150)

___

### getDriver

▸ **getDriver**(): D

Gets current database driver instance.

**Returns:** D

Defined in: [packages/core/src/utils/Configuration.ts:161](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L161)

___

### getHydrator

▸ **getHydrator**(`metadata`: [*MetadataStorage*](core.metadatastorage.md)): IHydrator

Gets instance of Hydrator.

#### Parameters:

Name | Type |
:------ | :------ |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |

**Returns:** IHydrator

Defined in: [packages/core/src/utils/Configuration.ts:175](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L175)

___

### getLogger

▸ **getLogger**(): [*Logger*](core.logger.md)

Gets Logger instance.

**Returns:** [*Logger*](core.logger.md)

Defined in: [packages/core/src/utils/Configuration.ts:143](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L143)

___

### getMetadataProvider

▸ **getMetadataProvider**(): [*MetadataProvider*](core.metadataprovider.md)

Gets instance of MetadataProvider. (cached)

**Returns:** [*MetadataProvider*](core.metadataprovider.md)

Defined in: [packages/core/src/utils/Configuration.ts:182](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L182)

___

### getNamingStrategy

▸ **getNamingStrategy**(): [*NamingStrategy*](../interfaces/core.namingstrategy.md)

Gets instance of NamingStrategy. (cached)

**Returns:** [*NamingStrategy*](../interfaces/core.namingstrategy.md)

Defined in: [packages/core/src/utils/Configuration.ts:168](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L168)

___

### getRepositoryClass

▸ **getRepositoryClass**(`customRepository`: *undefined* \| () => [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](core.entityrepository.md)<any\>\>): *undefined* \| [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](core.entityrepository.md)<any\>\>

Gets EntityRepository class to be instantiated.

#### Parameters:

Name | Type |
:------ | :------ |
`customRepository` | *undefined* \| () => [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](core.entityrepository.md)<any\>\> |

**Returns:** *undefined* \| [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](core.entityrepository.md)<any\>\>

Defined in: [packages/core/src/utils/Configuration.ts:203](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L203)

___

### getResultCacheAdapter

▸ **getResultCacheAdapter**(): [*CacheAdapter*](../interfaces/core.cacheadapter.md)

Gets instance of CacheAdapter for result cache. (cached)

**Returns:** [*CacheAdapter*](../interfaces/core.cacheadapter.md)

Defined in: [packages/core/src/utils/Configuration.ts:196](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L196)

___

### init

▸ `Private`**init**(): *void*

**Returns:** *void*

Defined in: [packages/core/src/utils/Configuration.ts:215](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L215)

___

### initDriver

▸ `Private`**initDriver**(): D

**Returns:** D

Defined in: [packages/core/src/utils/Configuration.ts:268](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L268)

___

### reset

▸ **reset**<T, U\>(`key`: T): *void*

Resets the configuration to its default value

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | keyof [*MikroORMOptions*](../interfaces/core.mikroormoptions.md)<D\> |
`U` | *undefined* \| *string* \| *number* \| *boolean* \| [*Dictionary*](../modules/core.md#dictionary)<any\> \| [*Highlighter*](../interfaces/core.highlighter.md) \| () => [*NamingStrategy*](../interfaces/core.namingstrategy.md) \| [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](core.entityrepository.md)<any\>\> \| *Partial*<[*ConnectionOptions*](../interfaces/core.connectionoptions.md)\>[] \| (*string* \| *EntityClass*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> \| *EntityClassGroup*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> \| [*EntitySchema*](core.entityschema.md)<any, undefined\>)[] \| [*EventSubscriber*](../interfaces/core.eventsubscriber.md)<any\>[] \| [*Dictionary*](../modules/core.md#dictionary)<{ `name?`: *string*  } & *Omit*<FilterDef<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>, *name*\>\> \| { `alwaysAnalyseProperties?`: *boolean* ; `disableDynamicFileAccess?`: *boolean* ; `requireEntitiesArray?`: *boolean* ; `warnWhenNoEntities?`: *boolean*  } \| (`config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>) => D \| (*string* \| [*Constructor*](../modules/core.md#constructor)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>)[] \| HydratorConstructor \| (`name`: *string*) => *undefined* \| [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> \| (`message`: *string*) => *void* \| (`entityName`: *string*, `where`: IPrimaryKeyValue \| [*Dictionary*](../modules/core.md#dictionary)<any\>) => Error \| [*LoggerNamespace*](../modules/core.md#loggernamespace)[] \| [*MigrationsOptions*](../modules/core.md#migrationsoptions) \| { `adapter?`: (...`params`: *any*[]) => [*CacheAdapter*](../interfaces/core.cacheadapter.md) ; `enabled?`: *boolean* ; `options?`: [*Dictionary*](../modules/core.md#dictionary)<any\> ; `pretty?`: *boolean*  } \| { `adapter?`: (...`params`: *any*[]) => [*CacheAdapter*](../interfaces/core.cacheadapter.md) ; `expiration?`: *number* ; `options?`: [*Dictionary*](../modules/core.md#dictionary)<any\>  } \| (`config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>) => [*MetadataProvider*](core.metadataprovider.md) \| [*PoolConfig*](../interfaces/core.poolconfig.md) |

#### Parameters:

Name | Type |
:------ | :------ |
`key` | T |

**Returns:** *void*

Defined in: [packages/core/src/utils/Configuration.ts:136](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L136)

___

### set

▸ **set**<T, U\>(`key`: T, `value`: U): *void*

Overrides specified configuration value.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | keyof [*MikroORMOptions*](../interfaces/core.mikroormoptions.md)<D\> |
`U` | *undefined* \| *string* \| *number* \| *boolean* \| [*Dictionary*](../modules/core.md#dictionary)<any\> \| [*Highlighter*](../interfaces/core.highlighter.md) \| () => [*NamingStrategy*](../interfaces/core.namingstrategy.md) \| [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](core.entityrepository.md)<any\>\> \| *Partial*<[*ConnectionOptions*](../interfaces/core.connectionoptions.md)\>[] \| (*string* \| *EntityClass*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> \| *EntityClassGroup*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> \| [*EntitySchema*](core.entityschema.md)<any, undefined\>)[] \| [*EventSubscriber*](../interfaces/core.eventsubscriber.md)<any\>[] \| [*Dictionary*](../modules/core.md#dictionary)<{ `name?`: *string*  } & *Omit*<FilterDef<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>, *name*\>\> \| { `alwaysAnalyseProperties?`: *boolean* ; `disableDynamicFileAccess?`: *boolean* ; `requireEntitiesArray?`: *boolean* ; `warnWhenNoEntities?`: *boolean*  } \| (`config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>) => D \| (*string* \| [*Constructor*](../modules/core.md#constructor)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>)[] \| HydratorConstructor \| (`name`: *string*) => *undefined* \| [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> \| (`message`: *string*) => *void* \| (`entityName`: *string*, `where`: IPrimaryKeyValue \| [*Dictionary*](../modules/core.md#dictionary)<any\>) => Error \| [*LoggerNamespace*](../modules/core.md#loggernamespace)[] \| [*MigrationsOptions*](../modules/core.md#migrationsoptions) \| { `adapter?`: (...`params`: *any*[]) => [*CacheAdapter*](../interfaces/core.cacheadapter.md) ; `enabled?`: *boolean* ; `options?`: [*Dictionary*](../modules/core.md#dictionary)<any\> ; `pretty?`: *boolean*  } \| { `adapter?`: (...`params`: *any*[]) => [*CacheAdapter*](../interfaces/core.cacheadapter.md) ; `expiration?`: *number* ; `options?`: [*Dictionary*](../modules/core.md#dictionary)<any\>  } \| (`config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>) => [*MetadataProvider*](core.metadataprovider.md) \| [*PoolConfig*](../interfaces/core.poolconfig.md) |

#### Parameters:

Name | Type |
:------ | :------ |
`key` | T |
`value` | U |

**Returns:** *void*

Defined in: [packages/core/src/utils/Configuration.ts:129](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L129)

___

### validateOptions

▸ `Private`**validateOptions**(): *void*

**Returns:** *void*

Defined in: [packages/core/src/utils/Configuration.ts:250](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L250)
