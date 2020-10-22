---
id: "mikroormoptions"
title: "Interface: MikroORMOptions<D>"
sidebar_label: "MikroORMOptions"
---

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`D` | [IDatabaseDriver](idatabasedriver.md) | IDatabaseDriver |

## Hierarchy

* [ConnectionOptions](connectionoptions.md)

  ↳ **MikroORMOptions**

## Properties

### autoJoinOneToOneOwner

•  **autoJoinOneToOneOwner**: boolean

*Defined in [packages/core/src/utils/Configuration.ts:340](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L340)*

___

### baseDir

•  **baseDir**: string

*Defined in [packages/core/src/utils/Configuration.ts:361](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L361)*

___

### batchSize

•  **batchSize**: number

*Defined in [packages/core/src/utils/Configuration.ts:348](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L348)*

___

### cache

•  **cache**: { adapter?: { constructor: (...params: any[]) => [CacheAdapter](cacheadapter.md)  } ; enabled?: boolean ; options?: [Dictionary](../index.md#dictionary) ; pretty?: boolean  }

*Defined in [packages/core/src/utils/Configuration.ts:363](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L363)*

#### Type declaration:

Name | Type |
------ | ------ |
`adapter?` | { constructor: (...params: any[]) => [CacheAdapter](cacheadapter.md)  } |
`enabled?` | boolean |
`options?` | [Dictionary](../index.md#dictionary) |
`pretty?` | boolean |

___

### charset

• `Optional` **charset**: string

*Inherited from [ConnectionOptions](connectionoptions.md).[charset](connectionoptions.md#charset)*

*Defined in [packages/core/src/utils/Configuration.ts:281](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L281)*

___

### clientUrl

• `Optional` **clientUrl**: string

*Inherited from [ConnectionOptions](connectionoptions.md).[clientUrl](connectionoptions.md#clienturl)*

*Defined in [packages/core/src/utils/Configuration.ts:276](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L276)*

___

### context

•  **context**: () => [EntityManager](../classes/entitymanager.md) \| undefined

*Defined in [packages/core/src/utils/Configuration.ts:355](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L355)*

___

### dbName

• `Optional` **dbName**: string

*Inherited from [ConnectionOptions](connectionoptions.md).[dbName](connectionoptions.md#dbname)*

*Defined in [packages/core/src/utils/Configuration.ts:274](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L274)*

___

### debug

•  **debug**: boolean \| [LoggerNamespace](../index.md#loggernamespace)[]

*Defined in [packages/core/src/utils/Configuration.ts:358](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L358)*

___

### discovery

•  **discovery**: { alwaysAnalyseProperties?: boolean ; disableDynamicFileAccess?: boolean ; requireEntitiesArray?: boolean ; warnWhenNoEntities?: boolean  }

*Defined in [packages/core/src/utils/Configuration.ts:329](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L329)*

#### Type declaration:

Name | Type |
------ | ------ |
`alwaysAnalyseProperties?` | boolean |
`disableDynamicFileAccess?` | boolean |
`requireEntitiesArray?` | boolean |
`warnWhenNoEntities?` | boolean |

___

### driver

• `Optional` **driver**: { constructor: (config: [Configuration](../classes/configuration.md)) => D  }

*Defined in [packages/core/src/utils/Configuration.ts:336](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L336)*

#### Type declaration:

Name | Type |
------ | ------ |
`constructor` | (config: [Configuration](../classes/configuration.md)) => D |

___

### driverOptions

•  **driverOptions**: [Dictionary](../index.md#dictionary)

*Defined in [packages/core/src/utils/Configuration.ts:337](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L337)*

___

### ensureIndexes

•  **ensureIndexes**: boolean

*Defined in [packages/core/src/utils/Configuration.ts:345](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L345)*

___

### entities

•  **entities**: (string \| [EntityClass](../index.md#entityclass)&#60;[AnyEntity](../index.md#anyentity)> \| [EntityClassGroup](../index.md#entityclassgroup)&#60;[AnyEntity](../index.md#anyentity)> \| [EntitySchema](../classes/entityschema.md)&#60;any>)[]

*Defined in [packages/core/src/utils/Configuration.ts:325](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L325)*

___

### entitiesTs

•  **entitiesTs**: (string \| [EntityClass](../index.md#entityclass)&#60;[AnyEntity](../index.md#anyentity)> \| [EntityClassGroup](../index.md#entityclassgroup)&#60;[AnyEntity](../index.md#anyentity)> \| [EntitySchema](../classes/entityschema.md)&#60;any>)[]

*Defined in [packages/core/src/utils/Configuration.ts:326](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L326)*

___

### entityRepository

• `Optional` **entityRepository**: [Constructor](../index.md#constructor)&#60;[EntityRepository](../classes/entityrepository.md)&#60;any>>

*Defined in [packages/core/src/utils/Configuration.ts:351](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L351)*

___

### filters

•  **filters**: [Dictionary](../index.md#dictionary)&#60;{ name?: string  } & Omit&#60;[FilterDef](../index.md#filterdef)&#60;[AnyEntity](../index.md#anyentity)>, &#34;name&#34;>>

*Defined in [packages/core/src/utils/Configuration.ts:328](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L328)*

___

### findOneOrFailHandler

•  **findOneOrFailHandler**: (entityName: string, where: [Dictionary](../index.md#dictionary) \| [IPrimaryKey](../index.md#iprimarykey)) => [Error](../classes/driverexception.md#error)

*Defined in [packages/core/src/utils/Configuration.ts:357](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L357)*

___

### forceUtcTimezone

•  **forceUtcTimezone**: boolean

*Defined in [packages/core/src/utils/Configuration.ts:343](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L343)*

___

### highlighter

•  **highlighter**: [Highlighter](highlighter.md)

*Defined in [packages/core/src/utils/Configuration.ts:359](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L359)*

___

### host

• `Optional` **host**: string

*Inherited from [ConnectionOptions](connectionoptions.md).[host](connectionoptions.md#host)*

*Defined in [packages/core/src/utils/Configuration.ts:277](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L277)*

___

### hydrator

•  **hydrator**: [HydratorConstructor](hydratorconstructor.md)

*Defined in [packages/core/src/utils/Configuration.ts:349](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L349)*

___

### implicitTransactions

• `Optional` **implicitTransactions**: boolean

*Defined in [packages/core/src/utils/Configuration.ts:339](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L339)*

___

### loadStrategy

•  **loadStrategy**: [LoadStrategy](../enums/loadstrategy.md)

*Defined in [packages/core/src/utils/Configuration.ts:350](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L350)*

___

### logger

•  **logger**: (message: string) => void

*Defined in [packages/core/src/utils/Configuration.ts:356](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L356)*

___

### metadataProvider

•  **metadataProvider**: { constructor: (config: [Configuration](../classes/configuration.md)) => [MetadataProvider](../classes/metadataprovider.md)  }

*Defined in [packages/core/src/utils/Configuration.ts:374](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L374)*

#### Type declaration:

Name | Type |
------ | ------ |
`constructor` | (config: [Configuration](../classes/configuration.md)) => [MetadataProvider](../classes/metadataprovider.md) |

___

### migrations

•  **migrations**: [MigrationsOptions](../index.md#migrationsoptions)

*Defined in [packages/core/src/utils/Configuration.ts:362](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L362)*

___

### multipleStatements

• `Optional` **multipleStatements**: boolean

*Inherited from [ConnectionOptions](connectionoptions.md).[multipleStatements](connectionoptions.md#multiplestatements)*

*Defined in [packages/core/src/utils/Configuration.ts:282](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L282)*

___

### name

• `Optional` **name**: string

*Inherited from [ConnectionOptions](connectionoptions.md).[name](connectionoptions.md#name)*

*Defined in [packages/core/src/utils/Configuration.ts:275](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L275)*

___

### namingStrategy

• `Optional` **namingStrategy**: { constructor: () => [NamingStrategy](namingstrategy.md)  }

*Defined in [packages/core/src/utils/Configuration.ts:338](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L338)*

#### Type declaration:

Name | Type |
------ | ------ |
`constructor` | () => [NamingStrategy](namingstrategy.md) |

___

### password

• `Optional` **password**: string

*Inherited from [ConnectionOptions](connectionoptions.md).[password](connectionoptions.md#password)*

*Defined in [packages/core/src/utils/Configuration.ts:280](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L280)*

___

### pool

• `Optional` **pool**: [PoolConfig](poolconfig.md)

*Inherited from [ConnectionOptions](connectionoptions.md).[pool](connectionoptions.md#pool)*

*Defined in [packages/core/src/utils/Configuration.ts:283](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L283)*

___

### populateAfterFlush

•  **populateAfterFlush**: boolean

*Defined in [packages/core/src/utils/Configuration.ts:342](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L342)*

___

### port

• `Optional` **port**: number

*Inherited from [ConnectionOptions](connectionoptions.md).[port](connectionoptions.md#port)*

*Defined in [packages/core/src/utils/Configuration.ts:278](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L278)*

___

### propagateToOneOwner

•  **propagateToOneOwner**: boolean

*Defined in [packages/core/src/utils/Configuration.ts:341](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L341)*

___

### replicas

• `Optional` **replicas**: Partial&#60;[ConnectionOptions](connectionoptions.md)>[]

*Defined in [packages/core/src/utils/Configuration.ts:352](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L352)*

___

### resultCache

•  **resultCache**: { adapter?: { constructor: (...params: any[]) => [CacheAdapter](cacheadapter.md)  } ; expiration?: number ; options?: [Dictionary](../index.md#dictionary)  }

*Defined in [packages/core/src/utils/Configuration.ts:369](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L369)*

#### Type declaration:

Name | Type |
------ | ------ |
`adapter?` | { constructor: (...params: any[]) => [CacheAdapter](cacheadapter.md)  } |
`expiration?` | number |
`options?` | [Dictionary](../index.md#dictionary) |

___

### strict

•  **strict**: boolean

*Defined in [packages/core/src/utils/Configuration.ts:353](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L353)*

___

### subscribers

•  **subscribers**: [EventSubscriber](eventsubscriber.md)[]

*Defined in [packages/core/src/utils/Configuration.ts:327](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L327)*

___

### timezone

• `Optional` **timezone**: string

*Defined in [packages/core/src/utils/Configuration.ts:344](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L344)*

___

### tsNode

• `Optional` **tsNode**: boolean

*Defined in [packages/core/src/utils/Configuration.ts:360](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L360)*

___

### type

• `Optional` **type**: keyof *typeof* [PLATFORMS](../classes/configuration.md#platforms)

*Defined in [packages/core/src/utils/Configuration.ts:335](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L335)*

___

### useBatchInserts

• `Optional` **useBatchInserts**: boolean

*Defined in [packages/core/src/utils/Configuration.ts:346](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L346)*

___

### useBatchUpdates

• `Optional` **useBatchUpdates**: boolean

*Defined in [packages/core/src/utils/Configuration.ts:347](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L347)*

___

### user

• `Optional` **user**: string

*Inherited from [ConnectionOptions](connectionoptions.md).[user](connectionoptions.md#user)*

*Defined in [packages/core/src/utils/Configuration.ts:279](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L279)*

___

### validate

•  **validate**: boolean

*Defined in [packages/core/src/utils/Configuration.ts:354](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Configuration.ts#L354)*
