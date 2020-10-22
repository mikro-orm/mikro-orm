---
id: "platform"
title: "Class: Platform"
sidebar_label: "Platform"
---

## Hierarchy

* **Platform**

## Properties

### config

• `Protected` **config**: [Configuration](configuration.md)

*Defined in [packages/core/src/platforms/Platform.ts:11](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L11)*

___

### exceptionConverter

• `Protected` `Readonly` **exceptionConverter**: [ExceptionConverter](exceptionconverter.md) = new ExceptionConverter()

*Defined in [packages/core/src/platforms/Platform.ts:10](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L10)*

___

### timezone

• `Protected` `Optional` **timezone**: string

*Defined in [packages/core/src/platforms/Platform.ts:12](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L12)*

## Methods

### allowsMultiInsert

▸ **allowsMultiInsert**(): boolean

*Defined in [packages/core/src/platforms/Platform.ts:46](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L46)*

**Returns:** boolean

___

### convertsJsonAutomatically

▸ **convertsJsonAutomatically**(`marshall?`: boolean): boolean

*Defined in [packages/core/src/platforms/Platform.ts:152](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L152)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`marshall` | boolean | false |

**Returns:** boolean

___

### denormalizePrimaryKey

▸ **denormalizePrimaryKey**(`data`: [IPrimaryKey](../index.md#iprimarykey)): [IPrimaryKey](../index.md#iprimarykey)

*Defined in [packages/core/src/platforms/Platform.ts:78](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L78)*

Converts scalar primary key representation to native driver wrapper (e.g. string to mongodb's ObjectId)

#### Parameters:

Name | Type |
------ | ------ |
`data` | [IPrimaryKey](../index.md#iprimarykey) |

**Returns:** [IPrimaryKey](../index.md#iprimarykey)

___

### getArrayDeclarationSQL

▸ **getArrayDeclarationSQL**(): string

*Defined in [packages/core/src/platforms/Platform.ts:128](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L128)*

**Returns:** string

___

### getBigIntTypeDeclarationSQL

▸ **getBigIntTypeDeclarationSQL**(): string

*Defined in [packages/core/src/platforms/Platform.ts:124](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L124)*

**Returns:** string

___

### getBlobDeclarationSQL

▸ **getBlobDeclarationSQL**(): string

*Defined in [packages/core/src/platforms/Platform.ts:140](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L140)*

**Returns:** string

___

### getCurrentTimestampSQL

▸ **getCurrentTimestampSQL**(`length`: number): string

*Defined in [packages/core/src/platforms/Platform.ts:96](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L96)*

Returns the SQL specific for the platform to get the current timestamp

#### Parameters:

Name | Type |
------ | ------ |
`length` | number |

**Returns:** string

___

### getDateTypeDeclarationSQL

▸ **getDateTypeDeclarationSQL**(`length`: number): string

*Defined in [packages/core/src/platforms/Platform.ts:100](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L100)*

#### Parameters:

Name | Type |
------ | ------ |
`length` | number |

**Returns:** string

___

### getDefaultCharset

▸ **getDefaultCharset**(): string

*Defined in [packages/core/src/platforms/Platform.ts:160](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L160)*

**Returns:** string

___

### getExceptionConverter

▸ **getExceptionConverter**(): [ExceptionConverter](exceptionconverter.md)

*Defined in [packages/core/src/platforms/Platform.ts:164](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L164)*

**Returns:** [ExceptionConverter](exceptionconverter.md)

___

### getJsonDeclarationSQL

▸ **getJsonDeclarationSQL**(): string

*Defined in [packages/core/src/platforms/Platform.ts:144](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L144)*

**Returns:** string

___

### getNamingStrategy

▸ **getNamingStrategy**(): object

*Defined in [packages/core/src/platforms/Platform.ts:26](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L26)*

**Returns:** object

Name | Type |
------ | ------ |
`constructor` | () => [NamingStrategy](../interfaces/namingstrategy.md) |

___

### getRegExpOperator

▸ **getRegExpOperator**(): string

*Defined in [packages/core/src/platforms/Platform.ts:108](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L108)*

**Returns:** string

___

### getRepositoryClass

▸ **getRepositoryClass**&#60;T>(): [Constructor](../index.md#constructor)&#60;[EntityRepository](entityrepository.md)&#60;T>>

*Defined in [packages/core/src/platforms/Platform.ts:156](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L156)*

#### Type parameters:

Name |
------ |
`T` |

**Returns:** [Constructor](../index.md#constructor)&#60;[EntityRepository](entityrepository.md)&#60;T>>

___

### getSchemaGenerator

▸ **getSchemaGenerator**(`em`: [EntityManager](entitymanager.md)): [ISchemaGenerator](../interfaces/ischemagenerator.md)

*Defined in [packages/core/src/platforms/Platform.ts:168](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L168)*

#### Parameters:

Name | Type |
------ | ------ |
`em` | [EntityManager](entitymanager.md) |

**Returns:** [ISchemaGenerator](../interfaces/ischemagenerator.md)

___

### getSchemaHelper

▸ **getSchemaHelper**(): { getTypeDefinition: (prop: [EntityProperty](../interfaces/entityproperty.md), types?: [Dictionary](../index.md#dictionary)&#60;string[]>, lengths?: [Dictionary](../index.md#dictionary)&#60;number>, allowZero?: boolean) => string  } \| undefined

*Defined in [packages/core/src/platforms/Platform.ts:38](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L38)*

**Returns:** { getTypeDefinition: (prop: [EntityProperty](../interfaces/entityproperty.md), types?: [Dictionary](../index.md#dictionary)&#60;string[]>, lengths?: [Dictionary](../index.md#dictionary)&#60;number>, allowZero?: boolean) => string  } \| undefined

___

### getSearchJsonPropertySQL

▸ **getSearchJsonPropertySQL**(`path`: string): string

*Defined in [packages/core/src/platforms/Platform.ts:148](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L148)*

#### Parameters:

Name | Type |
------ | ------ |
`path` | string |

**Returns:** string

___

### getSerializedPrimaryKeyField

▸ **getSerializedPrimaryKeyField**(`field`: string): string

*Defined in [packages/core/src/platforms/Platform.ts:85](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L85)*

Used when serializing via toObject and toJSON methods, allows to use different PK field name (like `id` instead of `_id`)

#### Parameters:

Name | Type |
------ | ------ |
`field` | string |

**Returns:** string

___

### getTimeTypeDeclarationSQL

▸ **getTimeTypeDeclarationSQL**(`length`: number): string

*Defined in [packages/core/src/platforms/Platform.ts:104](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L104)*

#### Parameters:

Name | Type |
------ | ------ |
`length` | number |

**Returns:** string

___

### isBigIntProperty

▸ **isBigIntProperty**(`prop`: [EntityProperty](../interfaces/entityproperty.md)): boolean

*Defined in [packages/core/src/platforms/Platform.ts:120](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L120)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** boolean

___

### marshallArray

▸ **marshallArray**(`values`: string[]): string

*Defined in [packages/core/src/platforms/Platform.ts:132](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L132)*

#### Parameters:

Name | Type |
------ | ------ |
`values` | string[] |

**Returns:** string

___

### normalizePrimaryKey

▸ **normalizePrimaryKey**&#60;T>(`data`: [Primary](../index.md#primary)&#60;T> \| [IPrimaryKey](../index.md#iprimarykey)): T

*Defined in [packages/core/src/platforms/Platform.ts:71](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L71)*

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

*Defined in [packages/core/src/platforms/Platform.ts:172](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L172)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | unknown |

**Returns:** string \| number \| Date

___

### quoteIdentifier

▸ **quoteIdentifier**(`id`: string, `quote?`: string): string

*Defined in [packages/core/src/platforms/Platform.ts:176](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L176)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`id` | string | - |
`quote` | string | "\`" |

**Returns:** string

___

### quoteVersionValue

▸ **quoteVersionValue**(`value`: Date \| number, `prop`: [EntityProperty](../interfaces/entityproperty.md)): Date \| string \| number

*Defined in [packages/core/src/platforms/Platform.ts:112](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L112)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | Date \| number |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** Date \| string \| number

___

### requiresNullableForAlteringColumn

▸ **requiresNullableForAlteringColumn**(): boolean

*Defined in [packages/core/src/platforms/Platform.ts:42](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L42)*

**Returns:** boolean

___

### requiresValuesKeyword

▸ **requiresValuesKeyword**(): boolean

*Defined in [packages/core/src/platforms/Platform.ts:116](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L116)*

**Returns:** boolean

___

### setConfig

▸ **setConfig**(`config`: [Configuration](configuration.md)): void

*Defined in [packages/core/src/platforms/Platform.ts:180](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L180)*

#### Parameters:

Name | Type |
------ | ------ |
`config` | [Configuration](configuration.md) |

**Returns:** void

___

### supportsTransactions

▸ **supportsTransactions**(): boolean

*Defined in [packages/core/src/platforms/Platform.ts:18](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L18)*

**Returns:** boolean

___

### unmarshallArray

▸ **unmarshallArray**(`value`: string): string[]

*Defined in [packages/core/src/platforms/Platform.ts:136](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L136)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | string |

**Returns:** string[]

___

### usesBatchInserts

▸ **usesBatchInserts**(): boolean

*Defined in [packages/core/src/platforms/Platform.ts:53](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L53)*

Whether or not the driver supports retuning list of created PKs back when multi-inserting

**Returns:** boolean

___

### usesBatchUpdates

▸ **usesBatchUpdates**(): boolean

*Defined in [packages/core/src/platforms/Platform.ts:60](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L60)*

Whether or not the driver supports updating many records at once

**Returns:** boolean

___

### usesCascadeStatement

▸ **usesCascadeStatement**(): boolean

*Defined in [packages/core/src/platforms/Platform.ts:34](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L34)*

**Returns:** boolean

___

### usesDefaultKeyword

▸ **usesDefaultKeyword**(): boolean

*Defined in [packages/core/src/platforms/Platform.ts:64](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L64)*

**Returns:** boolean

___

### usesDifferentSerializedPrimaryKey

▸ **usesDifferentSerializedPrimaryKey**(): boolean

*Defined in [packages/core/src/platforms/Platform.ts:89](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L89)*

**Returns:** boolean

___

### usesImplicitTransactions

▸ **usesImplicitTransactions**(): boolean

*Defined in [packages/core/src/platforms/Platform.ts:22](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L22)*

**Returns:** boolean

___

### usesPivotTable

▸ **usesPivotTable**(): boolean

*Defined in [packages/core/src/platforms/Platform.ts:14](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L14)*

**Returns:** boolean

___

### usesReturningStatement

▸ **usesReturningStatement**(): boolean

*Defined in [packages/core/src/platforms/Platform.ts:30](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/platforms/Platform.ts#L30)*

**Returns:** boolean
