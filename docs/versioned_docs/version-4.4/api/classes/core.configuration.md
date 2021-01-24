---
id: "core.configuration"
title: "Class: Configuration<D>"
sidebar_label: "Configuration"
hide_title: true
---

# Class: Configuration<D\>

[core](../modules/core.md).Configuration

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`D` | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md) | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md) |

## Hierarchy

* **Configuration**

## Constructors

### constructor

\+ **new Configuration**<D\>(`options`: [*Options*](../modules/core.md#options)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>, `validate?`: *boolean*): [*Configuration*](core.configuration.md)<D\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`D` | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md), D\> | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\\> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`options` | [*Options*](../modules/core.md#options)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> | - |
`validate` | *boolean* | true |

**Returns:** [*Configuration*](core.configuration.md)<D\>

Defined in: [packages/core/src/utils/Configuration.ts:98](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L98)

## Properties

### cache

• `Private` `Readonly` **cache**: [*Dictionary*](../modules/core.md#dictionary)<*any*\>

Defined in: [packages/core/src/utils/Configuration.ts:98](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L98)

___

### driver

• `Private` `Readonly` **driver**: D

Defined in: [packages/core/src/utils/Configuration.ts:96](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L96)

___

### logger

• `Private` `Readonly` **logger**: [*Logger*](core.logger.md)

Defined in: [packages/core/src/utils/Configuration.ts:95](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L95)

___

### options

• `Private` `Readonly` **options**: [*MikroORMOptions*](../interfaces/core.mikroormoptions.md)<D\>

Defined in: [packages/core/src/utils/Configuration.ts:94](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L94)

___

### platform

• `Private` `Readonly` **platform**: [*Platform*](core.platform.md)

Defined in: [packages/core/src/utils/Configuration.ts:97](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L97)

___

### DEFAULTS

▪ `Readonly` `Static` **DEFAULTS**: { `autoJoinOneToOneOwner`: *boolean* = true; `baseDir`: *string* ; `batchSize`: *number* = 300; `cache`: { `adapter`: *typeof* [*FileCacheAdapter*](core.filecacheadapter.md) ; `options`: { `cacheDir`: *string*  } ; `pretty`: *boolean* = false } ; `context`: (`name`: *string*) => *undefined* \| [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> ; `contextName`: *string* = 'default'; `debug`: *boolean* = false; `discovery`: { `alwaysAnalyseProperties`: *boolean* = true; `disableDynamicFileAccess`: *boolean* = false; `requireEntitiesArray`: *boolean* = false; `warnWhenNoEntities`: *boolean* = true } ; `driverOptions`: {} ; `ensureIndexes`: *boolean* = false; `entities`: *never*[] ; `entitiesTs`: *never*[] ; `filters`: {} ; `findOneOrFailHandler`: (`entityName`: *string*, `where`: *string* \| *number* \| *bigint* \| Date \| { `toHexString`: () => *string*  } \| [*Dictionary*](../modules/core.md#dictionary)<*any*\>) => [*NotFoundError*](core.notfounderror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\> ; `forceEntityConstructor`: *boolean* = false; `forceUndefined`: *boolean* = false; `forceUtcTimezone`: *boolean* = false; `highlighter`: [*NullHighlighter*](core.nullhighlighter.md) ; `hydrator`: *typeof* [*ObjectHydrator*](core.objecthydrator.md) ; `loadStrategy`: [*LoadStrategy*](../enums/core.loadstrategy.md) ; `logger`: (...`data`: *any*[]) => *void*(`message?`: *any*, ...`optionalParams`: *any*[]) => *void* ; `metadataProvider`: *typeof* [*ReflectMetadataProvider*](core.reflectmetadataprovider.md) ; `migrations`: { `allOrNothing`: *boolean* = true; `disableForeignKeys`: *boolean* = true; `dropTables`: *boolean* = true; `emit`: *string* = 'ts'; `fileName`: (`timestamp`: *string*) => *string* ; `path`: *string* = './migrations'; `pattern`: *RegExp* ; `safe`: *boolean* = false; `tableName`: *string* = 'mikro\_orm\_migrations'; `transactional`: *boolean* = true } ; `pool`: {} ; `populateAfterFlush`: *boolean* = false; `propagateToOneOwner`: *boolean* = true; `resultCache`: { `adapter`: *typeof* [*MemoryCacheAdapter*](core.memorycacheadapter.md) ; `expiration`: *number* = 1000; `options`: {}  } ; `strict`: *boolean* = false; `subscribers`: *never*[] ; `validate`: *boolean* = false; `verbose`: *boolean* = false }

#### Type declaration:

Name | Type |
------ | ------ |
`autoJoinOneToOneOwner` | *boolean* |
`baseDir` | *string* |
`batchSize` | *number* |
`cache` | { `adapter`: *typeof* [*FileCacheAdapter*](core.filecacheadapter.md) ; `options`: { `cacheDir`: *string*  } ; `pretty`: *boolean* = false } |
`context` | (`name`: *string*) => *undefined* \| [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |
`contextName` | *string* |
`debug` | *boolean* |
`discovery` | { `alwaysAnalyseProperties`: *boolean* = true; `disableDynamicFileAccess`: *boolean* = false; `requireEntitiesArray`: *boolean* = false; `warnWhenNoEntities`: *boolean* = true } |
`driverOptions` | {} |
`ensureIndexes` | *boolean* |
`entities` | *never*[] |
`entitiesTs` | *never*[] |
`filters` | {} |
`findOneOrFailHandler` | (`entityName`: *string*, `where`: *string* \| *number* \| *bigint* \| Date \| { `toHexString`: () => *string*  } \| [*Dictionary*](../modules/core.md#dictionary)<*any*\>) => [*NotFoundError*](core.notfounderror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\> |
`forceEntityConstructor` | *boolean* |
`forceUndefined` | *boolean* |
`forceUtcTimezone` | *boolean* |
`highlighter` | [*NullHighlighter*](core.nullhighlighter.md) |
`hydrator` | *typeof* [*ObjectHydrator*](core.objecthydrator.md) |
`loadStrategy` | [*LoadStrategy*](../enums/core.loadstrategy.md) |
`logger` | (...`data`: *any*[]) => *void*(`message?`: *any*, ...`optionalParams`: *any*[]) => *void* |
`metadataProvider` | *typeof* [*ReflectMetadataProvider*](core.reflectmetadataprovider.md) |
`migrations` | { `allOrNothing`: *boolean* = true; `disableForeignKeys`: *boolean* = true; `dropTables`: *boolean* = true; `emit`: *string* = 'ts'; `fileName`: (`timestamp`: *string*) => *string* ; `path`: *string* = './migrations'; `pattern`: *RegExp* ; `safe`: *boolean* = false; `tableName`: *string* = 'mikro\_orm\_migrations'; `transactional`: *boolean* = true } |
`pool` | {} |
`populateAfterFlush` | *boolean* |
`propagateToOneOwner` | *boolean* |
`resultCache` | { `adapter`: *typeof* [*MemoryCacheAdapter*](core.memorycacheadapter.md) ; `expiration`: *number* = 1000; `options`: {}  } |
`strict` | *boolean* |
`subscribers` | *never*[] |
`validate` | *boolean* |
`verbose` | *boolean* |

Defined in: [packages/core/src/utils/Configuration.ts:27](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L27)

___

### PLATFORMS

▪ `Readonly` `Static` **PLATFORMS**: { `mariadb`: { `className`: *string* = 'MariaDbDriver'; `module`: () => *any*  } ; `mongo`: { `className`: *string* = 'MongoDriver'; `module`: () => *any*  } ; `mysql`: { `className`: *string* = 'MySqlDriver'; `module`: () => *any*  } ; `postgresql`: { `className`: *string* = 'PostgreSqlDriver'; `module`: () => *any*  } ; `sqlite`: { `className`: *string* = 'SqliteDriver'; `module`: () => *any*  }  }

#### Type declaration:

Name | Type |
------ | ------ |
`mariadb` | { `className`: *string* = 'MariaDbDriver'; `module`: () => *any*  } |
`mongo` | { `className`: *string* = 'MongoDriver'; `module`: () => *any*  } |
`mysql` | { `className`: *string* = 'MySqlDriver'; `module`: () => *any*  } |
`postgresql` | { `className`: *string* = 'PostgreSqlDriver'; `module`: () => *any*  } |
`sqlite` | { `className`: *string* = 'SqliteDriver'; `module`: () => *any*  } |

Defined in: [packages/core/src/utils/Configuration.ts:86](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L86)

## Methods

### cached

▸ `Private`**cached**<T\>(`cls`: T, ...`args`: *ConstructorParameters*<T\>): *InstanceType*<T\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | (...`args`: *any*[]) => *InstanceType*<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`cls` | T |
`...args` | *ConstructorParameters*<T\> |

**Returns:** *InstanceType*<T\>

Defined in: [packages/core/src/utils/Configuration.ts:269](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L269)

___

### get

▸ **get**<T, U\>(`key`: T, `defaultValue?`: U): U

Gets specific configuration option. Falls back to specified `defaultValue` if provided.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | *name* \| *type* \| *entities* \| *entitiesTs* \| *subscribers* \| *filters* \| *discovery* \| *driver* \| *driverOptions* \| *namingStrategy* \| *implicitTransactions* \| *autoJoinOneToOneOwner* \| *propagateToOneOwner* \| *populateAfterFlush* \| *forceEntityConstructor* \| *forceUndefined* \| *forceUtcTimezone* \| *timezone* \| *ensureIndexes* \| *useBatchInserts* \| *useBatchUpdates* \| *batchSize* \| *hydrator* \| *loadStrategy* \| *entityRepository* \| *replicas* \| *strict* \| *validate* \| *context* \| *contextName* \| *logger* \| *findOneOrFailHandler* \| *debug* \| *highlighter* \| *tsNode* \| *baseDir* \| *migrations* \| *cache* \| *resultCache* \| *metadataProvider* \| *dbName* \| *clientUrl* \| *host* \| *port* \| *user* \| *password* \| *charset* \| *collate* \| *multipleStatements* \| *pool* |
`U` | *undefined* \| *string* \| *number* \| *boolean* \| [*Dictionary*](../modules/core.md#dictionary)<*any*\> \| [*Highlighter*](../interfaces/core.highlighter.md) \| () => [*NamingStrategy*](../interfaces/core.namingstrategy.md) \| [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](core.entityrepository.md)<*any*\>\> \| *Partial*<[*ConnectionOptions*](../interfaces/core.connectionoptions.md)\>[] \| (*string* \| *EntityClass*<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\> \| *EntityClassGroup*<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\> \| [*EntitySchema*](core.entityschema.md)<*any*, *undefined*\>)[] \| [*EventSubscriber*](../interfaces/core.eventsubscriber.md)<*any*\>[] \| [*Dictionary*](../modules/core.md#dictionary)<{ `name?`: *undefined* \| *string*  } & *Pick*<*FilterDef*<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>, *default* \| *entity* \| *cond* \| *args*\>\> \| { `alwaysAnalyseProperties?`: *undefined* \| *boolean* ; `disableDynamicFileAccess?`: *undefined* \| *boolean* ; `requireEntitiesArray?`: *undefined* \| *boolean* ; `warnWhenNoEntities?`: *undefined* \| *boolean*  } \| (`config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>) => D \| (*string* \| [*Constructor*](../modules/core.md#constructor)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>)[] \| HydratorConstructor \| (`name`: *string*) => *undefined* \| [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> \| (`message`: *string*) => *void* \| (`entityName`: *string*, `where`: *string* \| *number* \| *bigint* \| Date \| { `toHexString`: () => *string*  } \| [*Dictionary*](../modules/core.md#dictionary)<*any*\>) => Error \| [*LoggerNamespace*](../modules/core.md#loggernamespace)[] \| [*MigrationsOptions*](../modules/core.md#migrationsoptions) \| { `adapter?`: *undefined* \| (...`params`: *any*[]) => [*CacheAdapter*](../interfaces/core.cacheadapter.md) ; `enabled?`: *undefined* \| *boolean* ; `options?`: *undefined* \| [*Dictionary*](../modules/core.md#dictionary)<*any*\> ; `pretty?`: *undefined* \| *boolean*  } \| { `adapter?`: *undefined* \| (...`params`: *any*[]) => [*CacheAdapter*](../interfaces/core.cacheadapter.md) ; `expiration?`: *undefined* \| *number* ; `options?`: *undefined* \| [*Dictionary*](../modules/core.md#dictionary)<*any*\>  } \| (`config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>) => [*MetadataProvider*](core.metadataprovider.md) \| [*PoolConfig*](../interfaces/core.poolconfig.md) |

#### Parameters:

Name | Type |
------ | ------ |
`key` | T |
`defaultValue?` | U |

**Returns:** U

Defined in: [packages/core/src/utils/Configuration.ts:118](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L118)

___

### getCacheAdapter

▸ **getCacheAdapter**(): [*CacheAdapter*](../interfaces/core.cacheadapter.md)

Gets instance of CacheAdapter. (cached)

**Returns:** [*CacheAdapter*](../interfaces/core.cacheadapter.md)

Defined in: [packages/core/src/utils/Configuration.ts:185](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L185)

___

### getClientUrl

▸ **getClientUrl**(`hidePassword?`: *boolean*): *string*

Gets current client URL (connection string).

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`hidePassword` | *boolean* | false |

**Returns:** *string*

Defined in: [packages/core/src/utils/Configuration.ts:146](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L146)

___

### getDriver

▸ **getDriver**(): D

Gets current database driver instance.

**Returns:** D

Defined in: [packages/core/src/utils/Configuration.ts:157](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L157)

___

### getHydrator

▸ **getHydrator**(`metadata`: [*MetadataStorage*](core.metadatastorage.md)): IHydrator

Gets instance of Hydrator.

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |

**Returns:** IHydrator

Defined in: [packages/core/src/utils/Configuration.ts:171](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L171)

___

### getLogger

▸ **getLogger**(): [*Logger*](core.logger.md)

Gets Logger instance.

**Returns:** [*Logger*](core.logger.md)

Defined in: [packages/core/src/utils/Configuration.ts:139](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L139)

___

### getMetadataProvider

▸ **getMetadataProvider**(): [*MetadataProvider*](core.metadataprovider.md)

Gets instance of MetadataProvider. (cached)

**Returns:** [*MetadataProvider*](core.metadataprovider.md)

Defined in: [packages/core/src/utils/Configuration.ts:178](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L178)

___

### getNamingStrategy

▸ **getNamingStrategy**(): [*NamingStrategy*](../interfaces/core.namingstrategy.md)

Gets instance of NamingStrategy. (cached)

**Returns:** [*NamingStrategy*](../interfaces/core.namingstrategy.md)

Defined in: [packages/core/src/utils/Configuration.ts:164](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L164)

___

### getRepositoryClass

▸ **getRepositoryClass**(`customRepository`: *undefined* \| () => [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](core.entityrepository.md)<*any*\>\>): *undefined* \| [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](core.entityrepository.md)<*any*\>\>

Gets EntityRepository class to be instantiated.

#### Parameters:

Name | Type |
------ | ------ |
`customRepository` | *undefined* \| () => [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](core.entityrepository.md)<*any*\>\> |

**Returns:** *undefined* \| [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](core.entityrepository.md)<*any*\>\>

Defined in: [packages/core/src/utils/Configuration.ts:199](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L199)

___

### getResultCacheAdapter

▸ **getResultCacheAdapter**(): [*CacheAdapter*](../interfaces/core.cacheadapter.md)

Gets instance of CacheAdapter for result cache. (cached)

**Returns:** [*CacheAdapter*](../interfaces/core.cacheadapter.md)

Defined in: [packages/core/src/utils/Configuration.ts:192](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L192)

___

### init

▸ `Private`**init**(): *void*

**Returns:** *void*

Defined in: [packages/core/src/utils/Configuration.ts:211](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L211)

___

### initDriver

▸ `Private`**initDriver**(): D

**Returns:** D

Defined in: [packages/core/src/utils/Configuration.ts:260](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L260)

___

### reset

▸ **reset**<T, U\>(`key`: T): *void*

Resets the configuration to its default value

#### Type parameters:

Name | Type |
------ | ------ |
`T` | *name* \| *type* \| *entities* \| *entitiesTs* \| *subscribers* \| *filters* \| *discovery* \| *driver* \| *driverOptions* \| *namingStrategy* \| *implicitTransactions* \| *autoJoinOneToOneOwner* \| *propagateToOneOwner* \| *populateAfterFlush* \| *forceEntityConstructor* \| *forceUndefined* \| *forceUtcTimezone* \| *timezone* \| *ensureIndexes* \| *useBatchInserts* \| *useBatchUpdates* \| *batchSize* \| *hydrator* \| *loadStrategy* \| *entityRepository* \| *replicas* \| *strict* \| *validate* \| *context* \| *contextName* \| *logger* \| *findOneOrFailHandler* \| *debug* \| *highlighter* \| *tsNode* \| *baseDir* \| *migrations* \| *cache* \| *resultCache* \| *metadataProvider* \| *dbName* \| *clientUrl* \| *host* \| *port* \| *user* \| *password* \| *charset* \| *collate* \| *multipleStatements* \| *pool* |
`U` | *undefined* \| *string* \| *number* \| *boolean* \| [*Dictionary*](../modules/core.md#dictionary)<*any*\> \| [*Highlighter*](../interfaces/core.highlighter.md) \| () => [*NamingStrategy*](../interfaces/core.namingstrategy.md) \| [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](core.entityrepository.md)<*any*\>\> \| *Partial*<[*ConnectionOptions*](../interfaces/core.connectionoptions.md)\>[] \| (*string* \| *EntityClass*<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\> \| *EntityClassGroup*<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\> \| [*EntitySchema*](core.entityschema.md)<*any*, *undefined*\>)[] \| [*EventSubscriber*](../interfaces/core.eventsubscriber.md)<*any*\>[] \| [*Dictionary*](../modules/core.md#dictionary)<{ `name?`: *undefined* \| *string*  } & *Pick*<*FilterDef*<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>, *default* \| *entity* \| *cond* \| *args*\>\> \| { `alwaysAnalyseProperties?`: *undefined* \| *boolean* ; `disableDynamicFileAccess?`: *undefined* \| *boolean* ; `requireEntitiesArray?`: *undefined* \| *boolean* ; `warnWhenNoEntities?`: *undefined* \| *boolean*  } \| (`config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>) => D \| (*string* \| [*Constructor*](../modules/core.md#constructor)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>)[] \| HydratorConstructor \| (`name`: *string*) => *undefined* \| [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> \| (`message`: *string*) => *void* \| (`entityName`: *string*, `where`: *string* \| *number* \| *bigint* \| Date \| { `toHexString`: () => *string*  } \| [*Dictionary*](../modules/core.md#dictionary)<*any*\>) => Error \| [*LoggerNamespace*](../modules/core.md#loggernamespace)[] \| [*MigrationsOptions*](../modules/core.md#migrationsoptions) \| { `adapter?`: *undefined* \| (...`params`: *any*[]) => [*CacheAdapter*](../interfaces/core.cacheadapter.md) ; `enabled?`: *undefined* \| *boolean* ; `options?`: *undefined* \| [*Dictionary*](../modules/core.md#dictionary)<*any*\> ; `pretty?`: *undefined* \| *boolean*  } \| { `adapter?`: *undefined* \| (...`params`: *any*[]) => [*CacheAdapter*](../interfaces/core.cacheadapter.md) ; `expiration?`: *undefined* \| *number* ; `options?`: *undefined* \| [*Dictionary*](../modules/core.md#dictionary)<*any*\>  } \| (`config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>) => [*MetadataProvider*](core.metadataprovider.md) \| [*PoolConfig*](../interfaces/core.poolconfig.md) |

#### Parameters:

Name | Type |
------ | ------ |
`key` | T |

**Returns:** *void*

Defined in: [packages/core/src/utils/Configuration.ts:132](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L132)

___

### set

▸ **set**<T, U\>(`key`: T, `value`: U): *void*

Overrides specified configuration value.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | *name* \| *type* \| *entities* \| *entitiesTs* \| *subscribers* \| *filters* \| *discovery* \| *driver* \| *driverOptions* \| *namingStrategy* \| *implicitTransactions* \| *autoJoinOneToOneOwner* \| *propagateToOneOwner* \| *populateAfterFlush* \| *forceEntityConstructor* \| *forceUndefined* \| *forceUtcTimezone* \| *timezone* \| *ensureIndexes* \| *useBatchInserts* \| *useBatchUpdates* \| *batchSize* \| *hydrator* \| *loadStrategy* \| *entityRepository* \| *replicas* \| *strict* \| *validate* \| *context* \| *contextName* \| *logger* \| *findOneOrFailHandler* \| *debug* \| *highlighter* \| *tsNode* \| *baseDir* \| *migrations* \| *cache* \| *resultCache* \| *metadataProvider* \| *dbName* \| *clientUrl* \| *host* \| *port* \| *user* \| *password* \| *charset* \| *collate* \| *multipleStatements* \| *pool* |
`U` | *undefined* \| *string* \| *number* \| *boolean* \| [*Dictionary*](../modules/core.md#dictionary)<*any*\> \| [*Highlighter*](../interfaces/core.highlighter.md) \| () => [*NamingStrategy*](../interfaces/core.namingstrategy.md) \| [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](core.entityrepository.md)<*any*\>\> \| *Partial*<[*ConnectionOptions*](../interfaces/core.connectionoptions.md)\>[] \| (*string* \| *EntityClass*<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\> \| *EntityClassGroup*<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\> \| [*EntitySchema*](core.entityschema.md)<*any*, *undefined*\>)[] \| [*EventSubscriber*](../interfaces/core.eventsubscriber.md)<*any*\>[] \| [*Dictionary*](../modules/core.md#dictionary)<{ `name?`: *undefined* \| *string*  } & *Pick*<*FilterDef*<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>, *default* \| *entity* \| *cond* \| *args*\>\> \| { `alwaysAnalyseProperties?`: *undefined* \| *boolean* ; `disableDynamicFileAccess?`: *undefined* \| *boolean* ; `requireEntitiesArray?`: *undefined* \| *boolean* ; `warnWhenNoEntities?`: *undefined* \| *boolean*  } \| (`config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>) => D \| (*string* \| [*Constructor*](../modules/core.md#constructor)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>)[] \| HydratorConstructor \| (`name`: *string*) => *undefined* \| [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> \| (`message`: *string*) => *void* \| (`entityName`: *string*, `where`: *string* \| *number* \| *bigint* \| Date \| { `toHexString`: () => *string*  } \| [*Dictionary*](../modules/core.md#dictionary)<*any*\>) => Error \| [*LoggerNamespace*](../modules/core.md#loggernamespace)[] \| [*MigrationsOptions*](../modules/core.md#migrationsoptions) \| { `adapter?`: *undefined* \| (...`params`: *any*[]) => [*CacheAdapter*](../interfaces/core.cacheadapter.md) ; `enabled?`: *undefined* \| *boolean* ; `options?`: *undefined* \| [*Dictionary*](../modules/core.md#dictionary)<*any*\> ; `pretty?`: *undefined* \| *boolean*  } \| { `adapter?`: *undefined* \| (...`params`: *any*[]) => [*CacheAdapter*](../interfaces/core.cacheadapter.md) ; `expiration?`: *undefined* \| *number* ; `options?`: *undefined* \| [*Dictionary*](../modules/core.md#dictionary)<*any*\>  } \| (`config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>) => [*MetadataProvider*](core.metadataprovider.md) \| [*PoolConfig*](../interfaces/core.poolconfig.md) |

#### Parameters:

Name | Type |
------ | ------ |
`key` | T |
`value` | U |

**Returns:** *void*

Defined in: [packages/core/src/utils/Configuration.ts:125](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L125)

___

### validateOptions

▸ `Private`**validateOptions**(): *void*

**Returns:** *void*

Defined in: [packages/core/src/utils/Configuration.ts:246](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L246)
