---
id: "core.mikroormoptions"
title: "Interface: MikroORMOptions<D>"
sidebar_label: "MikroORMOptions"
custom_edit_url: null
hide_title: true
---

# Interface: MikroORMOptions<D\>

[core](../modules/core.md).MikroORMOptions

## Type parameters

Name | Type | Default |
:------ | :------ | :------ |
`D` | [*IDatabaseDriver*](core.idatabasedriver.md) | [*IDatabaseDriver*](core.idatabasedriver.md) |

## Hierarchy

* [*ConnectionOptions*](core.connectionoptions.md)

  ↳ **MikroORMOptions**

## Properties

### autoJoinOneToOneOwner

• **autoJoinOneToOneOwner**: *boolean*

Defined in: [packages/core/src/utils/Configuration.ts:356](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L356)

___

### baseDir

• **baseDir**: *string*

Defined in: [packages/core/src/utils/Configuration.ts:380](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L380)

___

### batchSize

• **batchSize**: *number*

Defined in: [packages/core/src/utils/Configuration.ts:366](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L366)

___

### cache

• **cache**: *object*

#### Type declaration:

Name | Type |
:------ | :------ |
`adapter`? | (...`params`: *any*[]) => [*CacheAdapter*](core.cacheadapter.md) |
`enabled`? | *boolean* |
`options`? | [*Dictionary*](../modules/core.md#dictionary)<any\> |
`pretty`? | *boolean* |

Defined in: [packages/core/src/utils/Configuration.ts:382](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L382)

___

### charset

• `Optional` **charset**: *string*

Inherited from: [ConnectionOptions](core.connectionoptions.md).[charset](core.connectionoptions.md#charset)

Defined in: [packages/core/src/utils/Configuration.ts:296](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L296)

___

### clientUrl

• `Optional` **clientUrl**: *string*

Inherited from: [ConnectionOptions](core.connectionoptions.md).[clientUrl](core.connectionoptions.md#clienturl)

Defined in: [packages/core/src/utils/Configuration.ts:291](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L291)

___

### collate

• `Optional` **collate**: *string*

Inherited from: [ConnectionOptions](core.connectionoptions.md).[collate](core.connectionoptions.md#collate)

Defined in: [packages/core/src/utils/Configuration.ts:297](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L297)

___

### context

• **context**: (`name`: *string*) => *undefined* \| [*EntityManager*](../classes/core.entitymanager.md)<[*IDatabaseDriver*](core.idatabasedriver.md)<[*Connection*](../classes/core.connection.md)\>\>

#### Type declaration:

▸ (`name`: *string*): *undefined* \| [*EntityManager*](../classes/core.entitymanager.md)<[*IDatabaseDriver*](core.idatabasedriver.md)<[*Connection*](../classes/core.connection.md)\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* |

**Returns:** *undefined* \| [*EntityManager*](../classes/core.entitymanager.md)<[*IDatabaseDriver*](core.idatabasedriver.md)<[*Connection*](../classes/core.connection.md)\>\>

Defined in: [packages/core/src/utils/Configuration.ts:373](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L373)

Defined in: [packages/core/src/utils/Configuration.ts:373](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L373)

___

### contextName

• **contextName**: *string*

Defined in: [packages/core/src/utils/Configuration.ts:374](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L374)

___

### dbName

• `Optional` **dbName**: *string*

Inherited from: [ConnectionOptions](core.connectionoptions.md).[dbName](core.connectionoptions.md#dbname)

Defined in: [packages/core/src/utils/Configuration.ts:289](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L289)

___

### debug

• **debug**: *boolean* \| [*LoggerNamespace*](../modules/core.md#loggernamespace)[]

Defined in: [packages/core/src/utils/Configuration.ts:377](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L377)

___

### discovery

• **discovery**: *object*

#### Type declaration:

Name | Type |
:------ | :------ |
`alwaysAnalyseProperties`? | *boolean* |
`disableDynamicFileAccess`? | *boolean* |
`requireEntitiesArray`? | *boolean* |
`warnWhenNoEntities`? | *boolean* |

Defined in: [packages/core/src/utils/Configuration.ts:345](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L345)

___

### driver

• `Optional` **driver**: (`config`: [*Configuration*](../classes/core.configuration.md)<[*IDatabaseDriver*](core.idatabasedriver.md)<[*Connection*](../classes/core.connection.md)\>\>) => D

#### Type declaration:

\+ **new MikroORMOptions**(`config`: [*Configuration*](../classes/core.configuration.md)<[*IDatabaseDriver*](core.idatabasedriver.md)<[*Connection*](../classes/core.connection.md)\>\>): D

#### Parameters:

Name | Type |
:------ | :------ |
`config` | [*Configuration*](../classes/core.configuration.md)<[*IDatabaseDriver*](core.idatabasedriver.md)<[*Connection*](../classes/core.connection.md)\>\> |

**Returns:** D

Inherited from: void

Defined in: [packages/core/src/utils/Configuration.ts:352](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L352)

Defined in: [packages/core/src/utils/Configuration.ts:352](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L352)

___

### driverOptions

• **driverOptions**: [*Dictionary*](../modules/core.md#dictionary)<any\>

Defined in: [packages/core/src/utils/Configuration.ts:353](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L353)

___

### ensureIndexes

• **ensureIndexes**: *boolean*

Defined in: [packages/core/src/utils/Configuration.ts:363](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L363)

___

### entities

• **entities**: (*string* \| *EntityClass*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> \| *EntityClassGroup*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> \| [*EntitySchema*](../classes/core.entityschema.md)<any, undefined\>)[]

Defined in: [packages/core/src/utils/Configuration.ts:341](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L341)

___

### entitiesTs

• **entitiesTs**: (*string* \| *EntityClass*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> \| *EntityClassGroup*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> \| [*EntitySchema*](../classes/core.entityschema.md)<any, undefined\>)[]

Defined in: [packages/core/src/utils/Configuration.ts:342](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L342)

___

### entityRepository

• `Optional` **entityRepository**: [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](../classes/core.entityrepository.md)<any\>\>

Defined in: [packages/core/src/utils/Configuration.ts:369](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L369)

___

### filters

• **filters**: [*Dictionary*](../modules/core.md#dictionary)<{ `name?`: *string*  } & *Omit*<FilterDef<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>, *name*\>\>

Defined in: [packages/core/src/utils/Configuration.ts:344](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L344)

___

### findOneOrFailHandler

• **findOneOrFailHandler**: (`entityName`: *string*, `where`: IPrimaryKeyValue \| [*Dictionary*](../modules/core.md#dictionary)<any\>) => Error

#### Type declaration:

▸ (`entityName`: *string*, `where`: IPrimaryKeyValue \| [*Dictionary*](../modules/core.md#dictionary)<any\>): Error

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`where` | IPrimaryKeyValue \| [*Dictionary*](../modules/core.md#dictionary)<any\> |

**Returns:** Error

Defined in: [packages/core/src/utils/Configuration.ts:376](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L376)

Defined in: [packages/core/src/utils/Configuration.ts:376](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L376)

___

### forceEntityConstructor

• **forceEntityConstructor**: *boolean* \| (*string* \| [*Constructor*](../modules/core.md#constructor)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>)[]

Defined in: [packages/core/src/utils/Configuration.ts:359](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L359)

___

### forceUndefined

• **forceUndefined**: *boolean*

Defined in: [packages/core/src/utils/Configuration.ts:360](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L360)

___

### forceUtcTimezone

• **forceUtcTimezone**: *boolean*

Defined in: [packages/core/src/utils/Configuration.ts:361](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L361)

___

### highlighter

• **highlighter**: [*Highlighter*](core.highlighter.md)

Defined in: [packages/core/src/utils/Configuration.ts:378](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L378)

___

### host

• `Optional` **host**: *string*

Inherited from: [ConnectionOptions](core.connectionoptions.md).[host](core.connectionoptions.md#host)

Defined in: [packages/core/src/utils/Configuration.ts:292](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L292)

___

### hydrator

• **hydrator**: HydratorConstructor

Defined in: [packages/core/src/utils/Configuration.ts:367](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L367)

___

### implicitTransactions

• `Optional` **implicitTransactions**: *boolean*

Defined in: [packages/core/src/utils/Configuration.ts:355](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L355)

___

### loadStrategy

• **loadStrategy**: [*LoadStrategy*](../enums/core.loadstrategy.md)

Defined in: [packages/core/src/utils/Configuration.ts:368](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L368)

___

### logger

• **logger**: (`message`: *string*) => *void*

#### Type declaration:

▸ (`message`: *string*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`message` | *string* |

**Returns:** *void*

Defined in: [packages/core/src/utils/Configuration.ts:375](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L375)

Defined in: [packages/core/src/utils/Configuration.ts:375](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L375)

___

### metadataProvider

• **metadataProvider**: (`config`: [*Configuration*](../classes/core.configuration.md)<[*IDatabaseDriver*](core.idatabasedriver.md)<[*Connection*](../classes/core.connection.md)\>\>) => [*MetadataProvider*](../classes/core.metadataprovider.md)

#### Type declaration:

\+ **new MikroORMOptions**(`config`: [*Configuration*](../classes/core.configuration.md)<[*IDatabaseDriver*](core.idatabasedriver.md)<[*Connection*](../classes/core.connection.md)\>\>): [*MetadataProvider*](../classes/core.metadataprovider.md)

#### Parameters:

Name | Type |
:------ | :------ |
`config` | [*Configuration*](../classes/core.configuration.md)<[*IDatabaseDriver*](core.idatabasedriver.md)<[*Connection*](../classes/core.connection.md)\>\> |

**Returns:** [*MetadataProvider*](../classes/core.metadataprovider.md)

Inherited from: void

Defined in: [packages/core/src/utils/Configuration.ts:393](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L393)

Defined in: [packages/core/src/utils/Configuration.ts:393](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L393)

___

### migrations

• **migrations**: [*MigrationsOptions*](../modules/core.md#migrationsoptions)

Defined in: [packages/core/src/utils/Configuration.ts:381](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L381)

___

### multipleStatements

• `Optional` **multipleStatements**: *boolean*

Inherited from: [ConnectionOptions](core.connectionoptions.md).[multipleStatements](core.connectionoptions.md#multiplestatements)

Defined in: [packages/core/src/utils/Configuration.ts:298](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L298)

___

### name

• `Optional` **name**: *string*

Inherited from: [ConnectionOptions](core.connectionoptions.md).[name](core.connectionoptions.md#name)

Defined in: [packages/core/src/utils/Configuration.ts:290](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L290)

___

### namingStrategy

• `Optional` **namingStrategy**: () => [*NamingStrategy*](core.namingstrategy.md)

#### Type declaration:

\+ **new MikroORMOptions**(): [*NamingStrategy*](core.namingstrategy.md)

**Returns:** [*NamingStrategy*](core.namingstrategy.md)

Inherited from: void

Defined in: [packages/core/src/utils/Configuration.ts:354](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L354)

Defined in: [packages/core/src/utils/Configuration.ts:354](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L354)

___

### password

• `Optional` **password**: *string*

Inherited from: [ConnectionOptions](core.connectionoptions.md).[password](core.connectionoptions.md#password)

Defined in: [packages/core/src/utils/Configuration.ts:295](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L295)

___

### pool

• `Optional` **pool**: [*PoolConfig*](core.poolconfig.md)

Inherited from: [ConnectionOptions](core.connectionoptions.md).[pool](core.connectionoptions.md#pool)

Defined in: [packages/core/src/utils/Configuration.ts:299](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L299)

___

### populateAfterFlush

• **populateAfterFlush**: *boolean*

Defined in: [packages/core/src/utils/Configuration.ts:358](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L358)

___

### port

• `Optional` **port**: *number*

Inherited from: [ConnectionOptions](core.connectionoptions.md).[port](core.connectionoptions.md#port)

Defined in: [packages/core/src/utils/Configuration.ts:293](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L293)

___

### propagateToOneOwner

• **propagateToOneOwner**: *boolean*

Defined in: [packages/core/src/utils/Configuration.ts:357](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L357)

___

### replicas

• `Optional` **replicas**: *Partial*<[*ConnectionOptions*](core.connectionoptions.md)\>[]

Defined in: [packages/core/src/utils/Configuration.ts:370](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L370)

___

### resultCache

• **resultCache**: *object*

#### Type declaration:

Name | Type |
:------ | :------ |
`adapter`? | (...`params`: *any*[]) => [*CacheAdapter*](core.cacheadapter.md) |
`expiration`? | *number* |
`options`? | [*Dictionary*](../modules/core.md#dictionary)<any\> |

Defined in: [packages/core/src/utils/Configuration.ts:388](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L388)

___

### strict

• **strict**: *boolean*

Defined in: [packages/core/src/utils/Configuration.ts:371](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L371)

___

### subscribers

• **subscribers**: [*EventSubscriber*](core.eventsubscriber.md)<any\>[]

Defined in: [packages/core/src/utils/Configuration.ts:343](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L343)

___

### timezone

• `Optional` **timezone**: *string*

Defined in: [packages/core/src/utils/Configuration.ts:362](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L362)

___

### tsNode

• `Optional` **tsNode**: *boolean*

Defined in: [packages/core/src/utils/Configuration.ts:379](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L379)

___

### type

• `Optional` **type**: *mongo* \| *mysql* \| *mariadb* \| *postgresql* \| *sqlite*

Defined in: [packages/core/src/utils/Configuration.ts:351](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L351)

___

### useBatchInserts

• `Optional` **useBatchInserts**: *boolean*

Defined in: [packages/core/src/utils/Configuration.ts:364](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L364)

___

### useBatchUpdates

• `Optional` **useBatchUpdates**: *boolean*

Defined in: [packages/core/src/utils/Configuration.ts:365](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L365)

___

### user

• `Optional` **user**: *string*

Inherited from: [ConnectionOptions](core.connectionoptions.md).[user](core.connectionoptions.md#user)

Defined in: [packages/core/src/utils/Configuration.ts:294](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L294)

___

### validate

• **validate**: *boolean*

Defined in: [packages/core/src/utils/Configuration.ts:372](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L372)
