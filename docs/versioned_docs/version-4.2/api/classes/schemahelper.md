---
id: "schemahelper"
title: "Class: SchemaHelper"
sidebar_label: "SchemaHelper"
---

## Hierarchy

* **SchemaHelper**

## Methods

### databaseExists

▸ **databaseExists**(`connection`: Connection, `name`: string): Promise&#60;boolean>

*Defined in [packages/knex/src/schema/SchemaHelper.ts:178](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L178)*

#### Parameters:

Name | Type |
------ | ------ |
`connection` | Connection |
`name` | string |

**Returns:** Promise&#60;boolean>

___

### finalizeTable

▸ **finalizeTable**(`table`: TableBuilder, `charset`: string): void

*Defined in [packages/knex/src/schema/SchemaHelper.ts:16](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L16)*

#### Parameters:

Name | Type |
------ | ------ |
`table` | TableBuilder |
`charset` | string |

**Returns:** void

___

### getColumns

▸ **getColumns**(`connection`: [AbstractSqlConnection](abstractsqlconnection.md), `tableName`: string, `schemaName?`: string): Promise&#60;any[]>

*Defined in [packages/knex/src/schema/SchemaHelper.ts:93](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L93)*

#### Parameters:

Name | Type |
------ | ------ |
`connection` | [AbstractSqlConnection](abstractsqlconnection.md) |
`tableName` | string |
`schemaName?` | string |

**Returns:** Promise&#60;any[]>

___

### getCreateDatabaseSQL

▸ **getCreateDatabaseSQL**(`name`: string): string

*Defined in [packages/knex/src/schema/SchemaHelper.ts:154](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L154)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** string

___

### getDatabaseExistsSQL

▸ **getDatabaseExistsSQL**(`name`: string): string

*Defined in [packages/knex/src/schema/SchemaHelper.ts:162](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L162)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** string

___

### getDatabaseNotExistsError

▸ **getDatabaseNotExistsError**(`dbName`: string): string

*Defined in [packages/knex/src/schema/SchemaHelper.ts:166](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L166)*

#### Parameters:

Name | Type |
------ | ------ |
`dbName` | string |

**Returns:** string

___

### getDefaultEmptyString

▸ **getDefaultEmptyString**(): string

*Defined in [packages/knex/src/schema/SchemaHelper.ts:174](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L174)*

**Returns:** string

___

### getDropDatabaseSQL

▸ **getDropDatabaseSQL**(`name`: string): string

*Defined in [packages/knex/src/schema/SchemaHelper.ts:158](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L158)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** string

___

### getEnumDefinitions

▸ **getEnumDefinitions**(`connection`: [AbstractSqlConnection](abstractsqlconnection.md), `tableName`: string, `schemaName?`: string): Promise&#60;[Dictionary](../index.md#dictionary)>

*Defined in [packages/knex/src/schema/SchemaHelper.ts:81](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L81)*

#### Parameters:

Name | Type |
------ | ------ |
`connection` | [AbstractSqlConnection](abstractsqlconnection.md) |
`tableName` | string |
`schemaName?` | string |

**Returns:** Promise&#60;[Dictionary](../index.md#dictionary)>

___

### getForeignKeys

▸ **getForeignKeys**(`connection`: [AbstractSqlConnection](abstractsqlconnection.md), `tableName`: string, `schemaName?`: string): Promise&#60;[Dictionary](../index.md#dictionary)>

*Defined in [packages/knex/src/schema/SchemaHelper.ts:76](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L76)*

#### Parameters:

Name | Type |
------ | ------ |
`connection` | [AbstractSqlConnection](abstractsqlconnection.md) |
`tableName` | string |
`schemaName?` | string |

**Returns:** Promise&#60;[Dictionary](../index.md#dictionary)>

___

### getForeignKeysSQL

▸ **getForeignKeysSQL**(`tableName`: string, `schemaName?`: string): string

*Defined in [packages/knex/src/schema/SchemaHelper.ts:101](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L101)*

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | string |
`schemaName?` | string |

**Returns:** string

___

### getIndexName

▸ **getIndexName**(`tableName`: string, `columns`: string[], `type`: &#34;index&#34; \| &#34;unique&#34; \| &#34;foreign&#34;): string

*Defined in [packages/knex/src/schema/SchemaHelper.ts:108](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L108)*

Returns the default name of index for the given columns

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | string |
`columns` | string[] |
`type` | &#34;index&#34; \| &#34;unique&#34; \| &#34;foreign&#34; |

**Returns:** string

___

### getIndexes

▸ **getIndexes**(`connection`: [AbstractSqlConnection](abstractsqlconnection.md), `tableName`: string, `schemaName?`: string): Promise&#60;[Index](../interfaces/index.md)[]>

*Defined in [packages/knex/src/schema/SchemaHelper.ts:97](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L97)*

#### Parameters:

Name | Type |
------ | ------ |
`connection` | [AbstractSqlConnection](abstractsqlconnection.md) |
`tableName` | string |
`schemaName?` | string |

**Returns:** Promise&#60;[Index](../interfaces/index.md)[]>

___

### getListTablesSQL

▸ **getListTablesSQL**(): string

*Defined in [packages/knex/src/schema/SchemaHelper.ts:85](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L85)*

**Returns:** string

___

### getManagementDbName

▸ **getManagementDbName**(): string

*Defined in [packages/knex/src/schema/SchemaHelper.ts:170](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L170)*

**Returns:** string

___

### getPrimaryKeys

▸ **getPrimaryKeys**(`connection`: [AbstractSqlConnection](abstractsqlconnection.md), `indexes`: [Index](../interfaces/index.md)[], `tableName`: string, `schemaName?`: string): Promise&#60;string[]>

*Defined in [packages/knex/src/schema/SchemaHelper.ts:72](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L72)*

#### Parameters:

Name | Type |
------ | ------ |
`connection` | [AbstractSqlConnection](abstractsqlconnection.md) |
`indexes` | [Index](../interfaces/index.md)[] |
`tableName` | string |
`schemaName?` | string |

**Returns:** Promise&#60;string[]>

___

### getRenameColumnSQL

▸ **getRenameColumnSQL**(`tableName`: string, `from`: [Column](../interfaces/column.md), `to`: EntityProperty, `idx?`: number, `quote?`: string): string

*Defined in [packages/knex/src/schema/SchemaHelper.ts:89](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L89)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`tableName` | string | - |
`from` | [Column](../interfaces/column.md) | - |
`to` | EntityProperty | - |
`idx` | number | 0 |
`quote` | string | """ |

**Returns:** string

___

### getSchemaBeginning

▸ **getSchemaBeginning**(`charset`: string): string

*Defined in [packages/knex/src/schema/SchemaHelper.ts:8](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L8)*

#### Parameters:

Name | Type |
------ | ------ |
`charset` | string |

**Returns:** string

___

### getSchemaEnd

▸ **getSchemaEnd**(): string

*Defined in [packages/knex/src/schema/SchemaHelper.ts:12](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L12)*

**Returns:** string

___

### getTypeDefinition

▸ **getTypeDefinition**(`prop`: EntityProperty, `types?`: [Dictionary](../index.md#dictionary)&#60;string[]>, `lengths?`: [Dictionary](../index.md#dictionary)&#60;number>, `allowZero?`: boolean): string

*Defined in [packages/knex/src/schema/SchemaHelper.ts:20](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L20)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`prop` | EntityProperty | - |
`types` | [Dictionary](../index.md#dictionary)&#60;string[]> | {} |
`lengths` | [Dictionary](../index.md#dictionary)&#60;number> | {} |
`allowZero` | boolean | false |

**Returns:** string

___

### getTypeFromDefinition

▸ **getTypeFromDefinition**(`type`: string, `defaultType`: string, `types?`: [Dictionary](../index.md#dictionary)&#60;string[]>): string

*Defined in [packages/knex/src/schema/SchemaHelper.ts:62](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L62)*

#### Parameters:

Name | Type |
------ | ------ |
`type` | string |
`defaultType` | string |
`types?` | [Dictionary](../index.md#dictionary)&#60;string[]> |

**Returns:** string

___

### hasSameDefaultValue

▸ `Private`**hasSameDefaultValue**(`info`: [Column](../interfaces/column.md), `prop`: EntityProperty, `defaultValues`: [Dictionary](../index.md#dictionary)&#60;string[]>): boolean

*Defined in [packages/knex/src/schema/SchemaHelper.ts:210](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L210)*

#### Parameters:

Name | Type |
------ | ------ |
`info` | [Column](../interfaces/column.md) |
`prop` | EntityProperty |
`defaultValues` | [Dictionary](../index.md#dictionary)&#60;string[]> |

**Returns:** boolean

___

### hasSameEnumDefinition

▸ `Private`**hasSameEnumDefinition**(`prop`: EntityProperty, `column`: [Column](../interfaces/column.md)): boolean

*Defined in [packages/knex/src/schema/SchemaHelper.ts:247](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L247)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | EntityProperty |
`column` | [Column](../interfaces/column.md) |

**Returns:** boolean

___

### hasSameIndex

▸ `Private`**hasSameIndex**(`prop`: EntityProperty, `column`: [Column](../interfaces/column.md)): boolean

*Defined in [packages/knex/src/schema/SchemaHelper.ts:237](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L237)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | EntityProperty |
`column` | [Column](../interfaces/column.md) |

**Returns:** boolean

___

### hasSameType

▸ `Private`**hasSameType**(`columnType`: string, `infoType`: string, `types`: [Dictionary](../index.md#dictionary)&#60;string[]>): boolean

*Defined in [packages/knex/src/schema/SchemaHelper.ts:191](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L191)*

#### Parameters:

Name | Type |
------ | ------ |
`columnType` | string |
`infoType` | string |
`types` | [Dictionary](../index.md#dictionary)&#60;string[]> |

**Returns:** boolean

___

### indexForeignKeys

▸ **indexForeignKeys**(): boolean

*Defined in [packages/knex/src/schema/SchemaHelper.ts:51](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L51)*

**Returns:** boolean

___

### isImplicitIndex

▸ **isImplicitIndex**(`name`: string): boolean

*Defined in [packages/knex/src/schema/SchemaHelper.ts:58](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L58)*

Implicit indexes will be ignored when diffing

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** boolean

___

### isSame

▸ **isSame**(`prop`: EntityProperty, `column`: [Column](../interfaces/column.md), `idx?`: number, `types?`: [Dictionary](../index.md#dictionary)&#60;string[]>, `defaultValues?`: [Dictionary](../index.md#dictionary)&#60;string[]>): [IsSame](../interfaces/issame.md)

*Defined in [packages/knex/src/schema/SchemaHelper.ts:36](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L36)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`prop` | EntityProperty | - |
`column` | [Column](../interfaces/column.md) | - |
`idx` | number | 0 |
`types` | [Dictionary](../index.md#dictionary)&#60;string[]> | {} |
`defaultValues` | [Dictionary](../index.md#dictionary)&#60;string[]> | {} |

**Returns:** [IsSame](../interfaces/issame.md)

___

### mapForeignKeys

▸ **mapForeignKeys**(`fks`: any[]): [Dictionary](../index.md#dictionary)

*Defined in [packages/knex/src/schema/SchemaHelper.ts:112](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L112)*

#### Parameters:

Name | Type |
------ | ------ |
`fks` | any[] |

**Returns:** [Dictionary](../index.md#dictionary)

___

### normalizeDefaultValue

▸ **normalizeDefaultValue**(`defaultValue`: string, `length`: number, `defaultValues?`: [Dictionary](../index.md#dictionary)&#60;string[]>): string \| number

*Defined in [packages/knex/src/schema/SchemaHelper.ts:143](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L143)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`defaultValue` | string | - |
`length` | number | - |
`defaultValues` | [Dictionary](../index.md#dictionary)&#60;string[]> | {} |

**Returns:** string \| number

___

### processTypeWildCard

▸ `Private`**processTypeWildCard**(`prop`: EntityProperty, `lengths`: [Dictionary](../index.md#dictionary)&#60;number>, `propType`: string, `allowZero`: boolean, `type`: string): string

*Defined in [packages/knex/src/schema/SchemaHelper.ts:127](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L127)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | EntityProperty |
`lengths` | [Dictionary](../index.md#dictionary)&#60;number> |
`propType` | string |
`allowZero` | boolean |
`type` | string |

**Returns:** string

___

### supportsColumnAlter

▸ **supportsColumnAlter**(): boolean

*Defined in [packages/knex/src/schema/SchemaHelper.ts:139](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L139)*

**Returns:** boolean

___

### supportsSchemaConstraints

▸ **supportsSchemaConstraints**(): boolean

*Defined in [packages/knex/src/schema/SchemaHelper.ts:47](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/schema/SchemaHelper.ts#L47)*

**Returns:** boolean
