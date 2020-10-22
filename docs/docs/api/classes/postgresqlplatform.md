---
id: "postgresqlplatform"
title: "Class: PostgreSqlPlatform"
sidebar_label: "PostgreSqlPlatform"
---

## Hierarchy

* AbstractSqlPlatform

  ↳ **PostgreSqlPlatform**

## Properties

### config

• `Protected` **config**: Configuration

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[config](abstractsqlplatform.md#config)*

*Defined in packages/core/dist/platforms/Platform.d.ts:9*

___

### exceptionConverter

• `Protected` `Readonly` **exceptionConverter**: [PostgreSqlExceptionConverter](postgresqlexceptionconverter.md) = new PostgreSqlExceptionConverter()

*Overrides [AbstractSqlPlatform](abstractsqlplatform.md).[exceptionConverter](abstractsqlplatform.md#exceptionconverter)*

*Defined in [packages/postgresql/src/PostgreSqlPlatform.ts:10](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlPlatform.ts#L10)*

___

### schemaHelper

• `Protected` `Readonly` **schemaHelper**: [PostgreSqlSchemaHelper](postgresqlschemahelper.md) = new PostgreSqlSchemaHelper()

*Overrides void*

*Defined in [packages/postgresql/src/PostgreSqlPlatform.ts:9](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlPlatform.ts#L9)*

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

▸ **convertsJsonAutomatically**(`marshall?`: boolean): boolean

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[convertsJsonAutomatically](abstractsqlplatform.md#convertsjsonautomatically)*

*Defined in packages/core/dist/platforms/Platform.d.ts:63*

#### Parameters:

Name | Type |
------ | ------ |
`marshall?` | boolean |

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

*Overrides [AbstractSqlPlatform](abstractsqlplatform.md).[getArrayDeclarationSQL](abstractsqlplatform.md#getarraydeclarationsql)*

*Defined in [packages/postgresql/src/PostgreSqlPlatform.ts:36](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlPlatform.ts#L36)*

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

*Overrides [AbstractSqlPlatform](abstractsqlplatform.md).[getBlobDeclarationSQL](abstractsqlplatform.md#getblobdeclarationsql)*

*Defined in [packages/postgresql/src/PostgreSqlPlatform.ts:44](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlPlatform.ts#L44)*

**Returns:** string

___

### getCurrentTimestampSQL

▸ **getCurrentTimestampSQL**(`length`: number): string

*Overrides [AbstractSqlPlatform](abstractsqlplatform.md).[getCurrentTimestampSQL](abstractsqlplatform.md#getcurrenttimestampsql)*

*Defined in [packages/postgresql/src/PostgreSqlPlatform.ts:20](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlPlatform.ts#L20)*

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

*Overrides [AbstractSqlPlatform](abstractsqlplatform.md).[getJsonDeclarationSQL](abstractsqlplatform.md#getjsondeclarationsql)*

*Defined in [packages/postgresql/src/PostgreSqlPlatform.ts:48](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlPlatform.ts#L48)*

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

*Overrides [AbstractSqlPlatform](abstractsqlplatform.md).[getRegExpOperator](abstractsqlplatform.md#getregexpoperator)*

*Defined in [packages/postgresql/src/PostgreSqlPlatform.ts:28](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlPlatform.ts#L28)*

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

▸ **getTimeTypeDeclarationSQL**(): string

*Overrides [AbstractSqlPlatform](abstractsqlplatform.md).[getTimeTypeDeclarationSQL](abstractsqlplatform.md#gettimetypedeclarationsql)*

*Defined in [packages/postgresql/src/PostgreSqlPlatform.ts:24](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlPlatform.ts#L24)*

**Returns:** string

___

### isBigIntProperty

▸ **isBigIntProperty**(`prop`: EntityProperty): boolean

*Overrides [AbstractSqlPlatform](abstractsqlplatform.md).[isBigIntProperty](abstractsqlplatform.md#isbigintproperty)*

*Defined in [packages/postgresql/src/PostgreSqlPlatform.ts:32](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlPlatform.ts#L32)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | EntityProperty |

**Returns:** boolean

___

### marshallArray

▸ **marshallArray**(`values`: string[]): string

*Overrides [AbstractSqlPlatform](abstractsqlplatform.md).[marshallArray](abstractsqlplatform.md#marshallarray)*

*Defined in [packages/postgresql/src/PostgreSqlPlatform.ts:40](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlPlatform.ts#L40)*

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

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[processDateProperty](abstractsqlplatform.md#processdateproperty)*

*Defined in packages/core/dist/platforms/Platform.d.ts:68*

#### Parameters:

Name | Type |
------ | ------ |
`value` | unknown |

**Returns:** string \| number \| Date

___

### quoteIdentifier

▸ **quoteIdentifier**(`id`: string, `quote?`: string): string

*Overrides [AbstractSqlPlatform](abstractsqlplatform.md).[quoteIdentifier](abstractsqlplatform.md#quoteidentifier)*

*Defined in [packages/postgresql/src/PostgreSqlPlatform.ts:52](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlPlatform.ts#L52)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`id` | string | - |
`quote` | string | """ |

**Returns:** string

___

### quoteValue

▸ **quoteValue**(`value`: any): string

*Overrides [MySqlPlatform](mysqlplatform.md).[quoteValue](mysqlplatform.md#quotevalue)*

*Defined in [packages/postgresql/src/PostgreSqlPlatform.ts:56](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlPlatform.ts#L56)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | any |

**Returns:** string

___

### quoteVersionValue

▸ **quoteVersionValue**(`value`: Date \| number, `prop`: EntityProperty): Date \| string \| number

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[quoteVersionValue](abstractsqlplatform.md#quoteversionvalue)*

*Defined in packages/core/dist/platforms/Platform.d.ts:53*

#### Parameters:

Name | Type |
------ | ------ |
`value` | Date \| number |
`prop` | EntityProperty |

**Returns:** Date \| string \| number

___

### requiresNullableForAlteringColumn

▸ **requiresNullableForAlteringColumn**(): boolean

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[requiresNullableForAlteringColumn](abstractsqlplatform.md#requiresnullableforalteringcolumn)*

*Defined in packages/core/dist/platforms/Platform.d.ts:22*

**Returns:** boolean

___

### requiresValuesKeyword

▸ **requiresValuesKeyword**(): boolean

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[requiresValuesKeyword](abstractsqlplatform.md#requiresvalueskeyword)*

*Defined in packages/core/dist/platforms/Platform.d.ts:54*

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

*Overrides [AbstractSqlPlatform](abstractsqlplatform.md).[usesCascadeStatement](abstractsqlplatform.md#usescascadestatement)*

*Defined in [packages/postgresql/src/PostgreSqlPlatform.ts:16](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlPlatform.ts#L16)*

**Returns:** boolean

___

### usesDefaultKeyword

▸ **usesDefaultKeyword**(): boolean

*Inherited from [AbstractSqlPlatform](abstractsqlplatform.md).[usesDefaultKeyword](abstractsqlplatform.md#usesdefaultkeyword)*

*Defined in packages/core/dist/platforms/Platform.d.ts:32*

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

*Overrides [AbstractSqlPlatform](abstractsqlplatform.md).[usesReturningStatement](abstractsqlplatform.md#usesreturningstatement)*

*Defined in [packages/postgresql/src/PostgreSqlPlatform.ts:12](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlPlatform.ts#L12)*

**Returns:** boolean
