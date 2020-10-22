---
id: "configuration"
title: "Class: Configuration<D>"
sidebar_label: "Configuration"
---

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`D` | [IDatabaseDriver](../interfaces/idatabasedriver.md) | IDatabaseDriver |

## Hierarchy

* **Configuration**

## Constructors

### constructor

\+ **new Configuration**(`options`: [Options](../index.md#options), `validate?`: boolean): [Configuration](configuration.md)

*Defined in [packages/core/src/utils/Configuration.ts:95](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/Configuration.ts#L95)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`options` | [Options](../index.md#options) | - |
`validate` | boolean | true |

**Returns:** [Configuration](configuration.md)

## Properties

### cache

• `Private` `Readonly` **cache**: [Dictionary](../index.md#dictionary)

*Defined in [packages/core/src/utils/Configuration.ts:95](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/Configuration.ts#L95)*

___

### driver

• `Private` `Readonly` **driver**: D

*Defined in [packages/core/src/utils/Configuration.ts:93](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/Configuration.ts#L93)*

___

### logger

• `Private` `Readonly` **logger**: [Logger](logger.md)

*Defined in [packages/core/src/utils/Configuration.ts:92](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/Configuration.ts#L92)*

___

### options

• `Private` `Readonly` **options**: [MikroORMOptions](../interfaces/mikroormoptions.md)&#60;D>

*Defined in [packages/core/src/utils/Configuration.ts:91](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/Configuration.ts#L91)*

___

### platform

• `Private` `Readonly` **platform**: [Platform](platform.md)

*Defined in [packages/core/src/utils/Configuration.ts:94](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/Configuration.ts#L94)*

## Methods

### cached

▸ `Private`**cached**&#60;T>(`cls`: T, ...`args`: ConstructorParameters&#60;T>): InstanceType&#60;T>

*Defined in [packages/core/src/utils/Configuration.ts:262](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/Configuration.ts#L262)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | { constructor: (...args: any[]) => InstanceType&#60;T>  } |

#### Parameters:

Name | Type |
------ | ------ |
`cls` | T |
`...args` | ConstructorParameters&#60;T> |

**Returns:** InstanceType&#60;T>

___

### get

▸ **get**&#60;T, U>(`key`: T, `defaultValue?`: U): U

*Defined in [packages/core/src/utils/Configuration.ts:115](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/Configuration.ts#L115)*

Gets specific configuration option. Falls back to specified `defaultValue` if provided.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | keyof [MikroORMOptions](../interfaces/mikroormoptions.md)&#60;D> |
`U` | MikroORMOptions&#60;D>[T] |

#### Parameters:

Name | Type |
------ | ------ |
`key` | T |
`defaultValue?` | U |

**Returns:** U

___

### getCacheAdapter

▸ **getCacheAdapter**(): [CacheAdapter](../interfaces/cacheadapter.md)

*Defined in [packages/core/src/utils/Configuration.ts:182](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/Configuration.ts#L182)*

Gets instance of CacheAdapter. (cached)

**Returns:** [CacheAdapter](../interfaces/cacheadapter.md)

___

### getClientUrl

▸ **getClientUrl**(`hidePassword?`: boolean): string

*Defined in [packages/core/src/utils/Configuration.ts:143](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/Configuration.ts#L143)*

Gets current client URL (connection string).

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`hidePassword` | boolean | false |

**Returns:** string

___

### getDriver

▸ **getDriver**(): D

*Defined in [packages/core/src/utils/Configuration.ts:154](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/Configuration.ts#L154)*

Gets current database driver instance.

**Returns:** D

___

### getHydrator

▸ **getHydrator**(`metadata`: [MetadataStorage](metadatastorage.md)): [IHydrator](../interfaces/ihydrator.md)

*Defined in [packages/core/src/utils/Configuration.ts:168](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/Configuration.ts#L168)*

Gets instance of Hydrator.

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | [MetadataStorage](metadatastorage.md) |

**Returns:** [IHydrator](../interfaces/ihydrator.md)

___

### getLogger

▸ **getLogger**(): [Logger](logger.md)

*Defined in [packages/core/src/utils/Configuration.ts:136](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/Configuration.ts#L136)*

Gets Logger instance.

**Returns:** [Logger](logger.md)

___

### getMetadataProvider

▸ **getMetadataProvider**(): [MetadataProvider](metadataprovider.md)

*Defined in [packages/core/src/utils/Configuration.ts:175](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/Configuration.ts#L175)*

Gets instance of MetadataProvider. (cached)

**Returns:** [MetadataProvider](metadataprovider.md)

___

### getNamingStrategy

▸ **getNamingStrategy**(): [NamingStrategy](../interfaces/namingstrategy.md)

*Defined in [packages/core/src/utils/Configuration.ts:161](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/Configuration.ts#L161)*

Gets instance of NamingStrategy. (cached)

**Returns:** [NamingStrategy](../interfaces/namingstrategy.md)

___

### getRepositoryClass

▸ **getRepositoryClass**(`customRepository`: EntityOptions&#60;any>[&#34;customRepository&#34;]): MikroORMOptions&#60;D>[&#34;entityRepository&#34;]

*Defined in [packages/core/src/utils/Configuration.ts:196](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/Configuration.ts#L196)*

Gets EntityRepository class to be instantiated.

#### Parameters:

Name | Type |
------ | ------ |
`customRepository` | EntityOptions&#60;any>[&#34;customRepository&#34;] |

**Returns:** MikroORMOptions&#60;D>[&#34;entityRepository&#34;]

___

### getResultCacheAdapter

▸ **getResultCacheAdapter**(): [CacheAdapter](../interfaces/cacheadapter.md)

*Defined in [packages/core/src/utils/Configuration.ts:189](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/Configuration.ts#L189)*

Gets instance of CacheAdapter for result cache. (cached)

**Returns:** [CacheAdapter](../interfaces/cacheadapter.md)

___

### init

▸ `Private`**init**(): void

*Defined in [packages/core/src/utils/Configuration.ts:208](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/Configuration.ts#L208)*

**Returns:** void

___

### initDriver

▸ `Private`**initDriver**(): D

*Defined in [packages/core/src/utils/Configuration.ts:253](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/Configuration.ts#L253)*

**Returns:** D

___

### reset

▸ **reset**&#60;T, U>(`key`: T): void

*Defined in [packages/core/src/utils/Configuration.ts:129](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/Configuration.ts#L129)*

Resets the configuration to its default value

#### Type parameters:

Name | Type |
------ | ------ |
`T` | keyof [MikroORMOptions](../interfaces/mikroormoptions.md)&#60;D> |
`U` | MikroORMOptions&#60;D>[T] |

#### Parameters:

Name | Type |
------ | ------ |
`key` | T |

**Returns:** void

___

### set

▸ **set**&#60;T, U>(`key`: T, `value`: U): void

*Defined in [packages/core/src/utils/Configuration.ts:122](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/Configuration.ts#L122)*

Overrides specified configuration value.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | keyof [MikroORMOptions](../interfaces/mikroormoptions.md)&#60;D> |
`U` | MikroORMOptions&#60;D>[T] |

#### Parameters:

Name | Type |
------ | ------ |
`key` | T |
`value` | U |

**Returns:** void

___

### validateOptions

▸ `Private`**validateOptions**(): void

*Defined in [packages/core/src/utils/Configuration.ts:239](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/Configuration.ts#L239)*

**Returns:** void

## Object literals

### DEFAULTS

▪ `Static` `Readonly` **DEFAULTS**: object

*Defined in [packages/core/src/utils/Configuration.ts:27](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/Configuration.ts#L27)*

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`autoJoinOneToOneOwner` | boolean | true |
`baseDir` | string | process.cwd() |
`batchSize` | number | 300 |
`debug` | boolean | false |
`driverOptions` | object | {} |
`ensureIndexes` | boolean | false |
`entities` | undefined[] | [] |
`entitiesTs` | undefined[] | [] |
`filters` | object | {} |
`forceUtcTimezone` | boolean | false |
`highlighter` | [NullHighlighter](nullhighlighter.md) | new NullHighlighter() |
`hydrator` | [ObjectHydrator](objecthydrator.md) | ObjectHydrator |
`loadStrategy` | [LoadStrategy](../enums/loadstrategy.md) | LoadStrategy.SELECT\_IN |
`logger` | any | console.log.bind(console) |
`metadataProvider` | [ReflectMetadataProvider](reflectmetadataprovider.md) | ReflectMetadataProvider |
`pool` | object | {} |
`populateAfterFlush` | boolean | false |
`propagateToOneOwner` | boolean | true |
`strict` | boolean | false |
`subscribers` | undefined[] | [] |
`validate` | boolean | false |
`verbose` | boolean | false |
`context` | function | () => [EntityManager](entitymanager.md)&#60;[IDatabaseDriver](../interfaces/idatabasedriver.md)&#60;[Connection](connection.md)>> |
`findOneOrFailHandler` | function | (entityName: string, where: [Dictionary](../index.md#dictionary) \| [IPrimaryKey](../index.md#iprimarykey)) => [NotFoundError](notfounderror.md)&#60;[AnyEntity](../index.md#anyentity)&#60;any>> |
`cache` | object | { adapter: [FileCacheAdapter](filecacheadapter.md) = FileCacheAdapter; pretty: boolean = false; options: { cacheDir: string = process.cwd() + '/temp' }  } |
`discovery` | object | { alwaysAnalyseProperties: boolean = true; disableDynamicFileAccess: boolean = false; requireEntitiesArray: boolean = false; warnWhenNoEntities: boolean = true } |
`migrations` | object | { allOrNothing: boolean = true; disableForeignKeys: boolean = true; dropTables: boolean = true; emit: string = "ts"; path: string = "./migrations"; pattern: RegExp = /^[\w-]+\d+\.ts$/; safe: boolean = false; tableName: string = "mikro\_orm\_migrations"; transactional: boolean = true; fileName: (timestamp: string) => string  } |
`resultCache` | object | { adapter: [MemoryCacheAdapter](memorycacheadapter.md) = MemoryCacheAdapter; expiration: number = 1000; options: {}  } |

___

### PLATFORMS

▪ `Static` `Readonly` **PLATFORMS**: object

*Defined in [packages/core/src/utils/Configuration.ts:83](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/utils/Configuration.ts#L83)*

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`mariadb` | object | { className: string = "MariaDbDriver"; module: () => any  } |
`mongo` | object | { className: string = "MongoDriver"; module: () => any  } |
`mysql` | object | { className: string = "MySqlDriver"; module: () => any  } |
`postgresql` | object | { className: string = "PostgreSqlDriver"; module: () => any  } |
`sqlite` | object | { className: string = "SqliteDriver"; module: () => any  } |
