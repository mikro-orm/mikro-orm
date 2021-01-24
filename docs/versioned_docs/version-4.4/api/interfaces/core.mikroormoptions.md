---
id: "core.mikroormoptions"
title: "Interface: MikroORMOptions<D>"
sidebar_label: "MikroORMOptions"
hide_title: true
---

# Interface: MikroORMOptions<D\>

[core](../modules/core.md).MikroORMOptions

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`D` | [*IDatabaseDriver*](core.idatabasedriver.md) | [*IDatabaseDriver*](core.idatabasedriver.md) |

## Hierarchy

* [*ConnectionOptions*](core.connectionoptions.md)

  ↳ **MikroORMOptions**

## Properties

### autoJoinOneToOneOwner

• **autoJoinOneToOneOwner**: *boolean*

Defined in: [packages/core/src/utils/Configuration.ts:348](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L348)

___

### baseDir

• **baseDir**: *string*

Defined in: [packages/core/src/utils/Configuration.ts:372](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L372)

___

### batchSize

• **batchSize**: *number*

Defined in: [packages/core/src/utils/Configuration.ts:358](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L358)

___

### cache

• **cache**: { `adapter?`: *undefined* \| (...`params`: *any*[]) => [*CacheAdapter*](core.cacheadapter.md) ; `enabled?`: *undefined* \| *boolean* ; `options?`: *undefined* \| [*Dictionary*](../modules/core.md#dictionary)<*any*\> ; `pretty?`: *undefined* \| *boolean*  }

#### Type declaration:

Name | Type |
------ | ------ |
`adapter?` | *undefined* \| (...`params`: *any*[]) => [*CacheAdapter*](core.cacheadapter.md) |
`enabled?` | *undefined* \| *boolean* |
`options?` | *undefined* \| [*Dictionary*](../modules/core.md#dictionary)<*any*\> |
`pretty?` | *undefined* \| *boolean* |

Defined in: [packages/core/src/utils/Configuration.ts:374](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L374)

___

### charset

• `Optional` **charset**: *undefined* \| *string*

Inherited from: [ConnectionOptions](core.connectionoptions.md).[charset](core.connectionoptions.md#charset)

Defined in: [packages/core/src/utils/Configuration.ts:288](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L288)

___

### clientUrl

• `Optional` **clientUrl**: *undefined* \| *string*

Inherited from: [ConnectionOptions](core.connectionoptions.md).[clientUrl](core.connectionoptions.md#clienturl)

Defined in: [packages/core/src/utils/Configuration.ts:283](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L283)

___

### collate

• `Optional` **collate**: *undefined* \| *string*

Inherited from: [ConnectionOptions](core.connectionoptions.md).[collate](core.connectionoptions.md#collate)

Defined in: [packages/core/src/utils/Configuration.ts:289](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L289)

___

### context

• **context**: (`name`: *string*) => *undefined* \| [*EntityManager*](../classes/core.entitymanager.md)<[*IDatabaseDriver*](core.idatabasedriver.md)<[*Connection*](../classes/core.connection.md)\>\>

Defined in: [packages/core/src/utils/Configuration.ts:365](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L365)

___

### contextName

• **contextName**: *string*

Defined in: [packages/core/src/utils/Configuration.ts:366](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L366)

___

### dbName

• `Optional` **dbName**: *undefined* \| *string*

Inherited from: [ConnectionOptions](core.connectionoptions.md).[dbName](core.connectionoptions.md#dbname)

Defined in: [packages/core/src/utils/Configuration.ts:281](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L281)

___

### debug

• **debug**: *boolean* \| [*LoggerNamespace*](../modules/core.md#loggernamespace)[]

Defined in: [packages/core/src/utils/Configuration.ts:369](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L369)

___

### discovery

• **discovery**: { `alwaysAnalyseProperties?`: *undefined* \| *boolean* ; `disableDynamicFileAccess?`: *undefined* \| *boolean* ; `requireEntitiesArray?`: *undefined* \| *boolean* ; `warnWhenNoEntities?`: *undefined* \| *boolean*  }

#### Type declaration:

Name | Type |
------ | ------ |
`alwaysAnalyseProperties?` | *undefined* \| *boolean* |
`disableDynamicFileAccess?` | *undefined* \| *boolean* |
`requireEntitiesArray?` | *undefined* \| *boolean* |
`warnWhenNoEntities?` | *undefined* \| *boolean* |

Defined in: [packages/core/src/utils/Configuration.ts:337](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L337)

___

### driver

• `Optional` **driver**: *undefined* \| (`config`: [*Configuration*](../classes/core.configuration.md)<[*IDatabaseDriver*](core.idatabasedriver.md)<[*Connection*](../classes/core.connection.md)\>\>) => D

Defined in: [packages/core/src/utils/Configuration.ts:344](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L344)

___

### driverOptions

• **driverOptions**: [*Dictionary*](../modules/core.md#dictionary)<*any*\>

Defined in: [packages/core/src/utils/Configuration.ts:345](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L345)

___

### ensureIndexes

• **ensureIndexes**: *boolean*

Defined in: [packages/core/src/utils/Configuration.ts:355](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L355)

___

### entities

• **entities**: (*string* \| *EntityClass*<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\> \| *EntityClassGroup*<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\> \| [*EntitySchema*](../classes/core.entityschema.md)<*any*, *undefined*\>)[]

Defined in: [packages/core/src/utils/Configuration.ts:333](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L333)

___

### entitiesTs

• **entitiesTs**: (*string* \| *EntityClass*<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\> \| *EntityClassGroup*<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\> \| [*EntitySchema*](../classes/core.entityschema.md)<*any*, *undefined*\>)[]

Defined in: [packages/core/src/utils/Configuration.ts:334](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L334)

___

### entityRepository

• `Optional` **entityRepository**: *undefined* \| [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](../classes/core.entityrepository.md)<*any*\>\>

Defined in: [packages/core/src/utils/Configuration.ts:361](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L361)

___

### filters

• **filters**: [*Dictionary*](../modules/core.md#dictionary)<{ `name?`: *undefined* \| *string*  } & *Pick*<*FilterDef*<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>, *default* \| *entity* \| *cond* \| *args*\>\>

Defined in: [packages/core/src/utils/Configuration.ts:336](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L336)

___

### findOneOrFailHandler

• **findOneOrFailHandler**: (`entityName`: *string*, `where`: *string* \| *number* \| *bigint* \| Date \| { `toHexString`: () => *string*  } \| [*Dictionary*](../modules/core.md#dictionary)<*any*\>) => Error

Defined in: [packages/core/src/utils/Configuration.ts:368](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L368)

___

### forceEntityConstructor

• **forceEntityConstructor**: *boolean* \| (*string* \| [*Constructor*](../modules/core.md#constructor)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>)[]

Defined in: [packages/core/src/utils/Configuration.ts:351](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L351)

___

### forceUndefined

• **forceUndefined**: *boolean*

Defined in: [packages/core/src/utils/Configuration.ts:352](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L352)

___

### forceUtcTimezone

• **forceUtcTimezone**: *boolean*

Defined in: [packages/core/src/utils/Configuration.ts:353](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L353)

___

### highlighter

• **highlighter**: [*Highlighter*](core.highlighter.md)

Defined in: [packages/core/src/utils/Configuration.ts:370](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L370)

___

### host

• `Optional` **host**: *undefined* \| *string*

Inherited from: [ConnectionOptions](core.connectionoptions.md).[host](core.connectionoptions.md#host)

Defined in: [packages/core/src/utils/Configuration.ts:284](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L284)

___

### hydrator

• **hydrator**: HydratorConstructor

Defined in: [packages/core/src/utils/Configuration.ts:359](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L359)

___

### implicitTransactions

• `Optional` **implicitTransactions**: *undefined* \| *boolean*

Defined in: [packages/core/src/utils/Configuration.ts:347](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L347)

___

### loadStrategy

• **loadStrategy**: [*LoadStrategy*](../enums/core.loadstrategy.md)

Defined in: [packages/core/src/utils/Configuration.ts:360](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L360)

___

### logger

• **logger**: (`message`: *string*) => *void*

Defined in: [packages/core/src/utils/Configuration.ts:367](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L367)

___

### metadataProvider

• **metadataProvider**: (`config`: [*Configuration*](../classes/core.configuration.md)<[*IDatabaseDriver*](core.idatabasedriver.md)<[*Connection*](../classes/core.connection.md)\>\>) => [*MetadataProvider*](../classes/core.metadataprovider.md)

Defined in: [packages/core/src/utils/Configuration.ts:385](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L385)

___

### migrations

• **migrations**: [*MigrationsOptions*](../modules/core.md#migrationsoptions)

Defined in: [packages/core/src/utils/Configuration.ts:373](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L373)

___

### multipleStatements

• `Optional` **multipleStatements**: *undefined* \| *boolean*

Inherited from: [ConnectionOptions](core.connectionoptions.md).[multipleStatements](core.connectionoptions.md#multiplestatements)

Defined in: [packages/core/src/utils/Configuration.ts:290](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L290)

___

### name

• `Optional` **name**: *undefined* \| *string*

Inherited from: [ConnectionOptions](core.connectionoptions.md).[name](core.connectionoptions.md#name)

Defined in: [packages/core/src/utils/Configuration.ts:282](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L282)

___

### namingStrategy

• `Optional` **namingStrategy**: *undefined* \| () => [*NamingStrategy*](core.namingstrategy.md)

Defined in: [packages/core/src/utils/Configuration.ts:346](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L346)

___

### password

• `Optional` **password**: *undefined* \| *string*

Inherited from: [ConnectionOptions](core.connectionoptions.md).[password](core.connectionoptions.md#password)

Defined in: [packages/core/src/utils/Configuration.ts:287](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L287)

___

### pool

• `Optional` **pool**: *undefined* \| [*PoolConfig*](core.poolconfig.md)

Inherited from: [ConnectionOptions](core.connectionoptions.md).[pool](core.connectionoptions.md#pool)

Defined in: [packages/core/src/utils/Configuration.ts:291](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L291)

___

### populateAfterFlush

• **populateAfterFlush**: *boolean*

Defined in: [packages/core/src/utils/Configuration.ts:350](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L350)

___

### port

• `Optional` **port**: *undefined* \| *number*

Inherited from: [ConnectionOptions](core.connectionoptions.md).[port](core.connectionoptions.md#port)

Defined in: [packages/core/src/utils/Configuration.ts:285](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L285)

___

### propagateToOneOwner

• **propagateToOneOwner**: *boolean*

Defined in: [packages/core/src/utils/Configuration.ts:349](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L349)

___

### replicas

• `Optional` **replicas**: *undefined* \| *Partial*<[*ConnectionOptions*](core.connectionoptions.md)\>[]

Defined in: [packages/core/src/utils/Configuration.ts:362](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L362)

___

### resultCache

• **resultCache**: { `adapter?`: *undefined* \| (...`params`: *any*[]) => [*CacheAdapter*](core.cacheadapter.md) ; `expiration?`: *undefined* \| *number* ; `options?`: *undefined* \| [*Dictionary*](../modules/core.md#dictionary)<*any*\>  }

#### Type declaration:

Name | Type |
------ | ------ |
`adapter?` | *undefined* \| (...`params`: *any*[]) => [*CacheAdapter*](core.cacheadapter.md) |
`expiration?` | *undefined* \| *number* |
`options?` | *undefined* \| [*Dictionary*](../modules/core.md#dictionary)<*any*\> |

Defined in: [packages/core/src/utils/Configuration.ts:380](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L380)

___

### strict

• **strict**: *boolean*

Defined in: [packages/core/src/utils/Configuration.ts:363](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L363)

___

### subscribers

• **subscribers**: [*EventSubscriber*](core.eventsubscriber.md)<*any*\>[]

Defined in: [packages/core/src/utils/Configuration.ts:335](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L335)

___

### timezone

• `Optional` **timezone**: *undefined* \| *string*

Defined in: [packages/core/src/utils/Configuration.ts:354](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L354)

___

### tsNode

• `Optional` **tsNode**: *undefined* \| *boolean*

Defined in: [packages/core/src/utils/Configuration.ts:371](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L371)

___

### type

• `Optional` **type**: *undefined* \| *mongo* \| *mysql* \| *mariadb* \| *postgresql* \| *sqlite*

Defined in: [packages/core/src/utils/Configuration.ts:343](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L343)

___

### useBatchInserts

• `Optional` **useBatchInserts**: *undefined* \| *boolean*

Defined in: [packages/core/src/utils/Configuration.ts:356](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L356)

___

### useBatchUpdates

• `Optional` **useBatchUpdates**: *undefined* \| *boolean*

Defined in: [packages/core/src/utils/Configuration.ts:357](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L357)

___

### user

• `Optional` **user**: *undefined* \| *string*

Inherited from: [ConnectionOptions](core.connectionoptions.md).[user](core.connectionoptions.md#user)

Defined in: [packages/core/src/utils/Configuration.ts:286](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L286)

___

### validate

• **validate**: *boolean*

Defined in: [packages/core/src/utils/Configuration.ts:364](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Configuration.ts#L364)
