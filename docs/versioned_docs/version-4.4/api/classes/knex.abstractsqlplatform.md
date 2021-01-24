---
id: "knex.abstractsqlplatform"
title: "Class: AbstractSqlPlatform"
sidebar_label: "AbstractSqlPlatform"
hide_title: true
---

# Class: AbstractSqlPlatform

[knex](../modules/knex.md).AbstractSqlPlatform

## Hierarchy

* [*Platform*](core.platform.md)

  ↳ **AbstractSqlPlatform**

## Constructors

### constructor

\+ **new AbstractSqlPlatform**(): [*AbstractSqlPlatform*](knex.abstractsqlplatform.md)

**Returns:** [*AbstractSqlPlatform*](knex.abstractsqlplatform.md)

Inherited from: [Platform](core.platform.md)

## Properties

### config

• `Protected` **config**: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

Inherited from: [Platform](core.platform.md).[config](core.platform.md#config)

Defined in: [packages/core/src/platforms/Platform.ts:11](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L11)

___

### exceptionConverter

• `Protected` `Readonly` **exceptionConverter**: [*ExceptionConverter*](core.exceptionconverter.md)

Inherited from: [Platform](core.platform.md).[exceptionConverter](core.platform.md#exceptionconverter)

Defined in: [packages/core/src/platforms/Platform.ts:10](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L10)

___

### schemaHelper

• `Protected` `Optional` `Readonly` **schemaHelper**: *undefined* \| [*SchemaHelper*](knex.schemahelper.md)

Defined in: [packages/knex/src/AbstractSqlPlatform.ts:8](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlPlatform.ts#L8)

___

### timezone

• `Protected` `Optional` **timezone**: *undefined* \| *string*

Inherited from: [Platform](core.platform.md).[timezone](core.platform.md#timezone)

Defined in: [packages/core/src/platforms/Platform.ts:12](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L12)

## Methods

### allowsComparingTuples

▸ **allowsComparingTuples**(): *boolean*

**Returns:** *boolean*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:120](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L120)

___

### allowsMultiInsert

▸ **allowsMultiInsert**(): *boolean*

**Returns:** *boolean*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:46](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L46)

___

### allowsUniqueBatchUpdates

▸ **allowsUniqueBatchUpdates**(): *boolean*

**Returns:** *boolean*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:124](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L124)

___

### convertsJsonAutomatically

▸ **convertsJsonAutomatically**(`marshall?`: *boolean*): *boolean*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`marshall` | *boolean* | false |

**Returns:** *boolean*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:168](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L168)

___

### denormalizePrimaryKey

▸ **denormalizePrimaryKey**(`data`: IPrimaryKeyValue): IPrimaryKeyValue

Converts scalar primary key representation to native driver wrapper (e.g. string to mongodb's ObjectId)

#### Parameters:

Name | Type |
------ | ------ |
`data` | IPrimaryKeyValue |

**Returns:** IPrimaryKeyValue

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:78](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L78)

___

### formatQuery

▸ **formatQuery**(`sql`: *string*, `params`: readonly *any*[]): *string*

#### Parameters:

Name | Type |
------ | ------ |
`sql` | *string* |
`params` | readonly *any*[] |

**Returns:** *string*

Defined in: [packages/knex/src/AbstractSqlPlatform.ts:36](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlPlatform.ts#L36)

___

### getArrayDeclarationSQL

▸ **getArrayDeclarationSQL**(): *string*

**Returns:** *string*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:140](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L140)

___

### getBigIntTypeDeclarationSQL

▸ **getBigIntTypeDeclarationSQL**(): *string*

**Returns:** *string*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:136](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L136)

___

### getBlobDeclarationSQL

▸ **getBlobDeclarationSQL**(): *string*

**Returns:** *string*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:156](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L156)

___

### getCurrentTimestampSQL

▸ **getCurrentTimestampSQL**(`length`: *number*): *string*

Returns the SQL specific for the platform to get the current timestamp

#### Parameters:

Name | Type |
------ | ------ |
`length` | *number* |

**Returns:** *string*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:96](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L96)

___

### getDateTypeDeclarationSQL

▸ **getDateTypeDeclarationSQL**(`length`: *number*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`length` | *number* |

**Returns:** *string*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:100](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L100)

___

### getDefaultCharset

▸ **getDefaultCharset**(): *string*

**Returns:** *string*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:176](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L176)

___

### getExceptionConverter

▸ **getExceptionConverter**(): [*ExceptionConverter*](core.exceptionconverter.md)

**Returns:** [*ExceptionConverter*](core.exceptionconverter.md)

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:180](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L180)

___

### getJsonDeclarationSQL

▸ **getJsonDeclarationSQL**(): *string*

**Returns:** *string*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:160](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L160)

___

### getNamingStrategy

▸ **getNamingStrategy**(): *function*

**Returns:** *function*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:26](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L26)

___

### getRegExpOperator

▸ **getRegExpOperator**(): *string*

**Returns:** *string*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:108](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L108)

___

### getRepositoryClass

▸ **getRepositoryClass**<T\>(): [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](core.entityrepository.md)<T\>\>

#### Type parameters:

Name |
------ |
`T` |

**Returns:** [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](core.entityrepository.md)<T\>\>

Overrides: [Platform](core.platform.md)

Defined in: [packages/knex/src/AbstractSqlPlatform.ts:14](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlPlatform.ts#L14)

___

### getSchemaGenerator

▸ **getSchemaGenerator**(`em`: [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>): [*SchemaGenerator*](knex.schemagenerator.md)

#### Parameters:

Name | Type |
------ | ------ |
`em` | [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |

**Returns:** [*SchemaGenerator*](knex.schemagenerator.md)

Overrides: [Platform](core.platform.md)

Defined in: [packages/knex/src/AbstractSqlPlatform.ts:22](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlPlatform.ts#L22)

___

### getSchemaHelper

▸ **getSchemaHelper**(): *undefined* \| [*SchemaHelper*](knex.schemahelper.md)

**Returns:** *undefined* \| [*SchemaHelper*](knex.schemahelper.md)

Overrides: [Platform](core.platform.md)

Defined in: [packages/knex/src/AbstractSqlPlatform.ts:18](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlPlatform.ts#L18)

___

### getSearchJsonPropertySQL

▸ **getSearchJsonPropertySQL**(`path`: *string*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`path` | *string* |

**Returns:** *string*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:164](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L164)

___

### getSerializedPrimaryKeyField

▸ **getSerializedPrimaryKeyField**(`field`: *string*): *string*

Used when serializing via toObject and toJSON methods, allows to use different PK field name (like `id` instead of `_id`)

#### Parameters:

Name | Type |
------ | ------ |
`field` | *string* |

**Returns:** *string*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:85](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L85)

___

### getTimeTypeDeclarationSQL

▸ **getTimeTypeDeclarationSQL**(`length`: *number*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`length` | *number* |

**Returns:** *string*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:104](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L104)

___

### isBigIntProperty

▸ **isBigIntProperty**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** *boolean*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:128](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L128)

___

### isRaw

▸ **isRaw**(`value`: *any*): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`value` | *any* |

**Returns:** *boolean*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:132](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L132)

___

### marshallArray

▸ **marshallArray**(`values`: *string*[]): *string*

#### Parameters:

Name | Type |
------ | ------ |
`values` | *string*[] |

**Returns:** *string*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:144](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L144)

___

### normalizePrimaryKey

▸ **normalizePrimaryKey**<T\>(`data`: *string* \| *number* \| *bigint* \| Date \| { `toHexString`: () => *string*  } \| [*Primary*](../modules/core.md#primary)<T\>): T

Normalizes primary key wrapper to scalar value (e.g. mongodb's ObjectId to string)

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | *string* \| *number* | *string* \\| *number* |

#### Parameters:

Name | Type |
------ | ------ |
`data` | *string* \| *number* \| *bigint* \| Date \| { `toHexString`: () => *string*  } \| [*Primary*](../modules/core.md#primary)<T\> |

**Returns:** T

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:71](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L71)

___

### processDateProperty

▸ **processDateProperty**(`value`: *unknown*): *string* \| *number* \| Date

#### Parameters:

Name | Type |
------ | ------ |
`value` | *unknown* |

**Returns:** *string* \| *number* \| Date

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:188](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L188)

___

### quoteIdentifier

▸ **quoteIdentifier**(`id`: *string*, `quote?`: *string*): *string*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`id` | *string* | - |
`quote` | *string* | '\`' |

**Returns:** *string*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:192](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L192)

___

### quoteValue

▸ **quoteValue**(`value`: *any*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`value` | *any* |

**Returns:** *string*

Defined in: [packages/knex/src/AbstractSqlPlatform.ts:26](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlPlatform.ts#L26)

___

### quoteVersionValue

▸ **quoteVersionValue**(`value`: *number* \| Date, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): *string* \| *number* \| Date

#### Parameters:

Name | Type |
------ | ------ |
`value` | *number* \| Date |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** *string* \| *number* \| Date

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:112](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L112)

___

### requiresNullableForAlteringColumn

▸ **requiresNullableForAlteringColumn**(): *boolean*

**Returns:** *boolean*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:42](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L42)

___

### requiresValuesKeyword

▸ **requiresValuesKeyword**(): *boolean*

**Returns:** *boolean*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:116](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L116)

___

### setConfig

▸ **setConfig**(`config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`config` | [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |

**Returns:** *void*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:196](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L196)

___

### supportsTransactions

▸ **supportsTransactions**(): *boolean*

**Returns:** *boolean*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:18](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L18)

___

### unmarshallArray

▸ **unmarshallArray**(`value`: *string*): *string*[]

#### Parameters:

Name | Type |
------ | ------ |
`value` | *string* |

**Returns:** *string*[]

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:148](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L148)

___

### usesBatchInserts

▸ **usesBatchInserts**(): *boolean*

Whether or not the driver supports retuning list of created PKs back when multi-inserting

**Returns:** *boolean*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:53](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L53)

___

### usesBatchUpdates

▸ **usesBatchUpdates**(): *boolean*

Whether or not the driver supports updating many records at once

**Returns:** *boolean*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:60](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L60)

___

### usesCascadeStatement

▸ **usesCascadeStatement**(): *boolean*

**Returns:** *boolean*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:34](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L34)

___

### usesDefaultKeyword

▸ **usesDefaultKeyword**(): *boolean*

**Returns:** *boolean*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:64](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L64)

___

### usesDifferentSerializedPrimaryKey

▸ **usesDifferentSerializedPrimaryKey**(): *boolean*

**Returns:** *boolean*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:89](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L89)

___

### usesImplicitTransactions

▸ **usesImplicitTransactions**(): *boolean*

**Returns:** *boolean*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:22](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L22)

___

### usesPivotTable

▸ **usesPivotTable**(): *boolean*

**Returns:** *boolean*

Overrides: [Platform](core.platform.md)

Defined in: [packages/knex/src/AbstractSqlPlatform.ts:10](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/AbstractSqlPlatform.ts#L10)

___

### usesReturningStatement

▸ **usesReturningStatement**(): *boolean*

**Returns:** *boolean*

Inherited from: [Platform](core.platform.md)

Defined in: [packages/core/src/platforms/Platform.ts:30](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/platforms/Platform.ts#L30)
