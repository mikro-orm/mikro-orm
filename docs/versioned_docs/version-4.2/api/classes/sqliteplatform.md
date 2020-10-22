---
id: "sqliteplatform"
title: "Class: SqlitePlatform"
sidebar_label: "SqlitePlatform"
---

## Hierarchy

* AbstractSqlPlatform

  ↳ **SqlitePlatform**

## Properties

### config

• `Protected` **config**: Configuration

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[config](abstractsqlplatform.md#config)*

*Defined in packages/core/dist/platforms/Platform.d.ts:9*

___

### exceptionConverter

• `Protected` `Readonly` **exceptionConverter**: [SqliteExceptionConverter](sqliteexceptionconverter.md) = new SqliteExceptionConverter()

*Overrides [AbstractSqlPlatform](abstractsqlplatform.md).[exceptionConverter](abstractsqlplatform.md#exceptionconverter)*

*Defined in [packages/sqlite/src/SqlitePlatform.ts:11](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/sqlite/src/SqlitePlatform.ts#L11)*

___

### schemaHelper

• `Protected` `Readonly` **schemaHelper**: [SqliteSchemaHelper](sqliteschemahelper.md) = new SqliteSchemaHelper()

*Overrides void*

*Defined in [packages/sqlite/src/SqlitePlatform.ts:10](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/sqlite/src/SqlitePlatform.ts#L10)*

___

### timezone

• `Protected` `Optional` **timezone**: string

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[timezone](abstractsqlplatform.md#timezone)*

*Defined in packages/core/dist/platforms/Platform.d.ts:10*

## Methods

### allowsMultiInsert

▸ **allowsMultiInsert**(): boolean

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[allowsMultiInsert](abstractsqlplatform.md#allowsmultiinsert)*

*Defined in packages/core/dist/platforms/Platform.d.ts:23*

**Returns:** boolean

___

### convertsJsonAutomatically

▸ **convertsJsonAutomatically**(): boolean

*Overrides [AbstractSqlPlatform](abstractsqlplatform.md).[convertsJsonAutomatically](abstractsqlplatform.md#convertsjsonautomatically)*

*Defined in [packages/sqlite/src/SqlitePlatform.ts:25](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/sqlite/src/SqlitePlatform.ts#L25)*

**Returns:** boolean

___

### denormalizePrimaryKey

▸ **denormalizePrimaryKey**(`data`: [IPrimaryKey](../index.md#iprimarykey)): [IPrimaryKey](../index.md#iprimarykey)

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[denormalizePrimaryKey](abstractsqlplatform.md#denormalizeprimarykey)*

*Defined in packages/core/dist/platforms/Platform.d.ts:40*

Converts scalar primary key representation to native driver wrapper (e.g. string to mongodb's ObjectId)

#### Parameters:

Name | Type |
------ | ------ |
`data` | [IPrimaryKey](../index.md#iprimarykey) |

**Returns:** [IPrimaryKey](../index.md#iprimarykey)

___

### formatQuery

▸ **formatQuery**(`sql`: string, `params`: any[]): string

*Inherited from [MySqlPlatform](mysqlplatform.md).[formatQuery](mysqlplatform.md#formatquery)*

*Defined in packages/knex/dist/AbstractSqlPlatform.d.ts:10*

#### Parameters:

Name | Type |
------ | ------ |
`sql` | string |
`params` | any[] |

**Returns:** string

___

### getArrayDeclarationSQL

▸ **getArrayDeclarationSQL**(): string

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[getArrayDeclarationSQL](abstractsqlplatform.md#getarraydeclarationsql)*

*Defined in packages/core/dist/platforms/Platform.d.ts:57*

**Returns:** string

___

### getBigIntTypeDeclarationSQL

▸ **getBigIntTypeDeclarationSQL**(): string

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[getBigIntTypeDeclarationSQL](abstractsqlplatform.md#getbiginttypedeclarationsql)*

*Defined in packages/core/dist/platforms/Platform.d.ts:56*

**Returns:** string

___

### getBlobDeclarationSQL

▸ **getBlobDeclarationSQL**(): string

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[getBlobDeclarationSQL](abstractsqlplatform.md#getblobdeclarationsql)*

*Defined in packages/core/dist/platforms/Platform.d.ts:60*

**Returns:** string

___

### getCurrentTimestampSQL

▸ **getCurrentTimestampSQL**(`length`: number): string

*Overrides [AbstractSqlPlatform](abstractsqlplatform.md).[getCurrentTimestampSQL](abstractsqlplatform.md#getcurrenttimestampsql)*

*Defined in [packages/sqlite/src/SqlitePlatform.ts:21](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/sqlite/src/SqlitePlatform.ts#L21)*

#### Parameters:

Name | Type |
------ | ------ |
`length` | number |

**Returns:** string

___

### getDateTypeDeclarationSQL

▸ **getDateTypeDeclarationSQL**(`length`: number): string

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[getDateTypeDeclarationSQL](abstractsqlplatform.md#getdatetypedeclarationsql)*

*Defined in packages/core/dist/platforms/Platform.d.ts:50*

#### Parameters:

Name | Type |
------ | ------ |
`length` | number |

**Returns:** string

___

### getDefaultCharset

▸ **getDefaultCharset**(): string

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[getDefaultCharset](abstractsqlplatform.md#getdefaultcharset)*

*Defined in packages/core/dist/platforms/Platform.d.ts:65*

**Returns:** string

___

### getExceptionConverter

▸ **getExceptionConverter**(): ExceptionConverter

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[getExceptionConverter](abstractsqlplatform.md#getexceptionconverter)*

*Defined in packages/core/dist/platforms/Platform.d.ts:66*

**Returns:** ExceptionConverter

___

### getJsonDeclarationSQL

▸ **getJsonDeclarationSQL**(): string

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[getJsonDeclarationSQL](abstractsqlplatform.md#getjsondeclarationsql)*

*Defined in packages/core/dist/platforms/Platform.d.ts:61*

**Returns:** string

___

### getNamingStrategy

▸ **getNamingStrategy**(): object

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[getNamingStrategy](abstractsqlplatform.md#getnamingstrategy)*

*Defined in packages/core/dist/platforms/Platform.d.ts:14*

**Returns:** object

Name | Type |
------ | ------ |
`constructor` | () => NamingStrategy |

___

### getRegExpOperator

▸ **getRegExpOperator**(): string

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[getRegExpOperator](abstractsqlplatform.md#getregexpoperator)*

*Defined in packages/core/dist/platforms/Platform.d.ts:52*

**Returns:** string

___

### getRepositoryClass

▸ **getRepositoryClass**&#60;T>(): [Constructor](../index.md#constructor)&#60;EntityRepository&#60;T>>

*Inherited from [MySqlPlatform](mysqlplatform.md).[getRepositoryClass](mysqlplatform.md#getrepositoryclass)*

*Overrides void*

*Defined in packages/knex/dist/AbstractSqlPlatform.d.ts:6*

#### Type parameters:

Name |
------ |
`T` |

**Returns:** [Constructor](../index.md#constructor)&#60;EntityRepository&#60;T>>

___

### getSchemaGenerator

▸ **getSchemaGenerator**(`em`: EntityManager): SchemaGenerator

*Inherited from [MySqlPlatform](mysqlplatform.md).[getSchemaGenerator](mysqlplatform.md#getschemagenerator)*

*Overrides [MongoPlatform](mongoplatform.md).[getSchemaGenerator](mongoplatform.md#getschemagenerator)*

*Defined in packages/knex/dist/AbstractSqlPlatform.d.ts:8*

#### Parameters:

Name | Type |
------ | ------ |
`em` | EntityManager |

**Returns:** SchemaGenerator

___

### getSchemaHelper

▸ **getSchemaHelper**(): SchemaHelper \| undefined

*Inherited from [MySqlPlatform](mysqlplatform.md).[getSchemaHelper](mysqlplatform.md#getschemahelper)*

*Overrides [MongoPlatform](mongoplatform.md).[getSchemaHelper](mongoplatform.md#getschemahelper)*

*Defined in packages/knex/dist/AbstractSqlPlatform.d.ts:7*

**Returns:** SchemaHelper \| undefined

___

### getSearchJsonPropertySQL

▸ **getSearchJsonPropertySQL**(`path`: string): string

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[getSearchJsonPropertySQL](abstractsqlplatform.md#getsearchjsonpropertysql)*

*Defined in packages/core/dist/platforms/Platform.d.ts:62*

#### Parameters:

Name | Type |
------ | ------ |
`path` | string |

**Returns:** string

___

### getSerializedPrimaryKeyField

▸ **getSerializedPrimaryKeyField**(`field`: string): string

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[getSerializedPrimaryKeyField](abstractsqlplatform.md#getserializedprimarykeyfield)*

*Defined in packages/core/dist/platforms/Platform.d.ts:44*

Used when serializing via toObject and toJSON methods, allows to use different PK field name (like `id` instead of `_id`)

#### Parameters:

Name | Type |
------ | ------ |
`field` | string |

**Returns:** string

___

### getTimeTypeDeclarationSQL

▸ **getTimeTypeDeclarationSQL**(`length`: number): string

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[getTimeTypeDeclarationSQL](abstractsqlplatform.md#gettimetypedeclarationsql)*

*Defined in packages/core/dist/platforms/Platform.d.ts:51*

#### Parameters:

Name | Type |
------ | ------ |
`length` | number |

**Returns:** string

___

### isBigIntProperty

▸ **isBigIntProperty**(`prop`: EntityProperty): boolean

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[isBigIntProperty](abstractsqlplatform.md#isbigintproperty)*

*Defined in packages/core/dist/platforms/Platform.d.ts:55*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | EntityProperty |

**Returns:** boolean

___

### marshallArray

▸ **marshallArray**(`values`: string[]): string

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[marshallArray](abstractsqlplatform.md#marshallarray)*

*Defined in packages/core/dist/platforms/Platform.d.ts:58*

#### Parameters:

Name | Type |
------ | ------ |
`values` | string[] |

**Returns:** string

___

### normalizePrimaryKey

▸ **normalizePrimaryKey**&#60;T>(`data`: [Primary](../index.md#primary)&#60;T> \| [IPrimaryKey](../index.md#iprimarykey)): T

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[normalizePrimaryKey](abstractsqlplatform.md#normalizeprimarykey)*

*Defined in packages/core/dist/platforms/Platform.d.ts:36*

Normalizes primary key wrapper to scalar value (e.g. mongodb's ObjectId to string)

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | number \| string | number \\| string |

#### Parameters:

Name | Type |
------ | ------ |
`data` | [Primary](../index.md#primary)&#60;T> \| [IPrimaryKey](../index.md#iprimarykey) |

**Returns:** T

___

### processDateProperty

▸ **processDateProperty**(`value`: unknown): string \| number \| Date

*Overrides [AbstractSqlPlatform](abstractsqlplatform.md).[processDateProperty](abstractsqlplatform.md#processdateproperty)*

*Defined in [packages/sqlite/src/SqlitePlatform.ts:35](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/sqlite/src/SqlitePlatform.ts#L35)*

This is used to narrow the value of Date properties as they will be stored as timestamps in sqlite.
We use this method to convert Dates to timestamps when computing the changeset, so we have the right
data type in the payload as well as in original entity data. Without that, we would end up with diffs
including all Date properties, as we would be comparing Date object with timestamp.

#### Parameters:

Name | Type |
------ | ------ |
`value` | unknown |

**Returns:** string \| number \| Date

___

### quoteIdentifier

▸ **quoteIdentifier**(`id`: string, `quote?`: string): string

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[quoteIdentifier](abstractsqlplatform.md#quoteidentifier)*

*Defined in packages/core/dist/platforms/Platform.d.ts:69*

#### Parameters:

Name | Type |
------ | ------ |
`id` | string |
`quote?` | string |

**Returns:** string

___

### quoteValue

▸ **quoteValue**(`value`: any): string

*Overrides [MySqlPlatform](mysqlplatform.md).[quoteValue](mysqlplatform.md#quotevalue)*

*Defined in [packages/sqlite/src/SqlitePlatform.ts:55](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/sqlite/src/SqlitePlatform.ts#L55)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | any |

**Returns:** string

___

### quoteVersionValue

▸ **quoteVersionValue**(`value`: Date \| number, `prop`: EntityProperty): Date \| string \| number

*Overrides [AbstractSqlPlatform](abstractsqlplatform.md).[quoteVersionValue](abstractsqlplatform.md#quoteversionvalue)*

*Defined in [packages/sqlite/src/SqlitePlatform.ts:43](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/sqlite/src/SqlitePlatform.ts#L43)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | Date \| number |
`prop` | EntityProperty |

**Returns:** Date \| string \| number

___

### requiresNullableForAlteringColumn

▸ **requiresNullableForAlteringColumn**(): boolean

*Overrides [AbstractSqlPlatform](abstractsqlplatform.md).[requiresNullableForAlteringColumn](abstractsqlplatform.md#requiresnullableforalteringcolumn)*

*Defined in [packages/sqlite/src/SqlitePlatform.ts:13](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/sqlite/src/SqlitePlatform.ts#L13)*

**Returns:** boolean

___

### requiresValuesKeyword

▸ **requiresValuesKeyword**(): boolean

*Overrides [AbstractSqlPlatform](abstractsqlplatform.md).[requiresValuesKeyword](abstractsqlplatform.md#requiresvalueskeyword)*

*Defined in [packages/sqlite/src/SqlitePlatform.ts:51](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/sqlite/src/SqlitePlatform.ts#L51)*

**Returns:** boolean

___

### setConfig

▸ **setConfig**(`config`: Configuration): void

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[setConfig](abstractsqlplatform.md#setconfig)*

*Defined in packages/core/dist/platforms/Platform.d.ts:70*

#### Parameters:

Name | Type |
------ | ------ |
`config` | Configuration |

**Returns:** void

___

### supportsTransactions

▸ **supportsTransactions**(): boolean

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[supportsTransactions](abstractsqlplatform.md#supportstransactions)*

*Defined in packages/core/dist/platforms/Platform.d.ts:12*

**Returns:** boolean

___

### unmarshallArray

▸ **unmarshallArray**(`value`: string): string[]

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[unmarshallArray](abstractsqlplatform.md#unmarshallarray)*

*Defined in packages/core/dist/platforms/Platform.d.ts:59*

#### Parameters:

Name | Type |
------ | ------ |
`value` | string |

**Returns:** string[]

___

### usesBatchInserts

▸ **usesBatchInserts**(): boolean

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[usesBatchInserts](abstractsqlplatform.md#usesbatchinserts)*

*Defined in packages/core/dist/platforms/Platform.d.ts:27*

Whether or not the driver supports retuning list of created PKs back when multi-inserting

**Returns:** boolean

___

### usesBatchUpdates

▸ **usesBatchUpdates**(): boolean

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[usesBatchUpdates](abstractsqlplatform.md#usesbatchupdates)*

*Defined in packages/core/dist/platforms/Platform.d.ts:31*

Whether or not the driver supports updating many records at once

**Returns:** boolean

___

### usesCascadeStatement

▸ **usesCascadeStatement**(): boolean

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[usesCascadeStatement](abstractsqlplatform.md#usescascadestatement)*

*Defined in packages/core/dist/platforms/Platform.d.ts:18*

**Returns:** boolean

___

### usesDefaultKeyword

▸ **usesDefaultKeyword**(): boolean

*Overrides [AbstractSqlPlatform](abstractsqlplatform.md).[usesDefaultKeyword](abstractsqlplatform.md#usesdefaultkeyword)*

*Defined in [packages/sqlite/src/SqlitePlatform.ts:17](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/sqlite/src/SqlitePlatform.ts#L17)*

**Returns:** boolean

___

### usesDifferentSerializedPrimaryKey

▸ **usesDifferentSerializedPrimaryKey**(): boolean

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[usesDifferentSerializedPrimaryKey](abstractsqlplatform.md#usesdifferentserializedprimarykey)*

*Defined in packages/core/dist/platforms/Platform.d.ts:45*

**Returns:** boolean

___

### usesImplicitTransactions

▸ **usesImplicitTransactions**(): boolean

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[usesImplicitTransactions](abstractsqlplatform.md#usesimplicittransactions)*

*Defined in packages/core/dist/platforms/Platform.d.ts:13*

**Returns:** boolean

___

### usesPivotTable

▸ **usesPivotTable**(): boolean

*Inherited from [MySqlPlatform](mysqlplatform.md).[usesPivotTable](mysqlplatform.md#usespivottable)*

*Overrides [MongoPlatform](mongoplatform.md).[usesPivotTable](mongoplatform.md#usespivottable)*

*Defined in packages/knex/dist/AbstractSqlPlatform.d.ts:5*

**Returns:** boolean

___

### usesReturningStatement

▸ **usesReturningStatement**(): boolean

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[usesReturningStatement](abstractsqlplatform.md#usesreturningstatement)*

*Defined in packages/core/dist/platforms/Platform.d.ts:17*

**Returns:** boolean
