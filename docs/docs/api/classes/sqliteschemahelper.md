---
id: "sqliteschemahelper"
title: "Class: SqliteSchemaHelper"
sidebar_label: "SqliteSchemaHelper"
---

## Hierarchy

* SchemaHelper

  ↳ **SqliteSchemaHelper**

## Methods

### databaseExists

▸ **databaseExists**(`connection`: Connection, `name`: string): Promise&#60;boolean>

*Overrides [MySqlSchemaHelper](mysqlschemahelper.md).[databaseExists](mysqlschemahelper.md#databaseexists)*

*Defined in [packages/sqlite/src/SqliteSchemaHelper.ts:110](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/sqlite/src/SqliteSchemaHelper.ts#L110)*

#### Parameters:

Name | Type |
------ | ------ |
`connection` | Connection |
`name` | string |

**Returns:** Promise&#60;boolean>

___

### finalizeTable

▸ **finalizeTable**(`table`: TableBuilder, `charset`: string): void

*Inherited from [PostgreSqlSchemaHelper](postgresqlschemahelper.md).[finalizeTable](postgresqlschemahelper.md#finalizetable)*

*Defined in packages/knex/dist/schema/SchemaHelper.d.ts:8*

#### Parameters:

Name | Type |
------ | ------ |
`table` | TableBuilder |
`charset` | string |

**Returns:** void

___

### getColumns

▸ **getColumns**(`connection`: AbstractSqlConnection, `tableName`: string, `schemaName?`: string): Promise&#60;any[]>

*Overrides void*

*Defined in [packages/sqlite/src/SqliteSchemaHelper.ts:49](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/sqlite/src/SqliteSchemaHelper.ts#L49)*

#### Parameters:

Name | Type |
------ | ------ |
`connection` | AbstractSqlConnection |
`tableName` | string |
`schemaName?` | string |

**Returns:** Promise&#60;any[]>

___

### getCreateDatabaseSQL

▸ **getCreateDatabaseSQL**(`name`: string): string

*Inherited from [MySqlSchemaHelper](mysqlschemahelper.md).[getCreateDatabaseSQL](mysqlschemahelper.md#getcreatedatabasesql)*

*Defined in packages/knex/dist/schema/SchemaHelper.d.ts:34*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** string

___

### getDatabaseExistsSQL

▸ **getDatabaseExistsSQL**(`name`: string): string

*Inherited from [MySqlSchemaHelper](mysqlschemahelper.md).[getDatabaseExistsSQL](mysqlschemahelper.md#getdatabaseexistssql)*

*Defined in packages/knex/dist/schema/SchemaHelper.d.ts:36*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** string

___

### getDatabaseNotExistsError

▸ **getDatabaseNotExistsError**(`dbName`: string): string

*Inherited from [MySqlSchemaHelper](mysqlschemahelper.md).[getDatabaseNotExistsError](mysqlschemahelper.md#getdatabasenotexistserror)*

*Defined in packages/knex/dist/schema/SchemaHelper.d.ts:37*

#### Parameters:

Name | Type |
------ | ------ |
`dbName` | string |

**Returns:** string

___

### getDefaultEmptyString

▸ **getDefaultEmptyString**(): string

*Inherited from [MySqlSchemaHelper](mysqlschemahelper.md).[getDefaultEmptyString](mysqlschemahelper.md#getdefaultemptystring)*

*Defined in packages/knex/dist/schema/SchemaHelper.d.ts:39*

**Returns:** string

___

### getDropDatabaseSQL

▸ **getDropDatabaseSQL**(`name`: string): string

*Inherited from [MySqlSchemaHelper](mysqlschemahelper.md).[getDropDatabaseSQL](mysqlschemahelper.md#getdropdatabasesql)*

*Defined in packages/knex/dist/schema/SchemaHelper.d.ts:35*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** string

___

### getEnumDefinitions

▸ **getEnumDefinitions**(`connection`: AbstractSqlConnection, `tableName`: string, `schemaName?`: string): Promise&#60;[Dictionary](../index.md#dictionary)>

*Inherited from [SqliteSchemaHelper](sqliteschemahelper.md).[getEnumDefinitions](sqliteschemahelper.md#getenumdefinitions)*

*Defined in packages/knex/dist/schema/SchemaHelper.d.ts:20*

#### Parameters:

Name | Type |
------ | ------ |
`connection` | AbstractSqlConnection |
`tableName` | string |
`schemaName?` | string |

**Returns:** Promise&#60;[Dictionary](../index.md#dictionary)>

___

### getForeignKeys

▸ **getForeignKeys**(`connection`: AbstractSqlConnection, `tableName`: string, `schemaName?`: string): Promise&#60;[Dictionary](../index.md#dictionary)>

*Inherited from [MySqlSchemaHelper](mysqlschemahelper.md).[getForeignKeys](mysqlschemahelper.md#getforeignkeys)*

*Defined in packages/knex/dist/schema/SchemaHelper.d.ts:19*

#### Parameters:

Name | Type |
------ | ------ |
`connection` | AbstractSqlConnection |
`tableName` | string |
`schemaName?` | string |

**Returns:** Promise&#60;[Dictionary](../index.md#dictionary)>

___

### getForeignKeysSQL

▸ **getForeignKeysSQL**(`tableName`: string): string

*Overrides void*

*Defined in [packages/sqlite/src/SqliteSchemaHelper.ts:88](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/sqlite/src/SqliteSchemaHelper.ts#L88)*

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | string |

**Returns:** string

___

### getIndexName

▸ **getIndexName**(`tableName`: string, `columns`: string[], `type`: &#34;index&#34; \| &#34;unique&#34; \| &#34;foreign&#34;): string

*Inherited from [MySqlSchemaHelper](mysqlschemahelper.md).[getIndexName](mysqlschemahelper.md#getindexname)*

*Defined in packages/knex/dist/schema/SchemaHelper.d.ts:29*

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

▸ **getIndexes**(`connection`: AbstractSqlConnection, `tableName`: string, `schemaName?`: string): Promise&#60;Index[]>

*Overrides void*

*Defined in [packages/sqlite/src/SqliteSchemaHelper.ts:68](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/sqlite/src/SqliteSchemaHelper.ts#L68)*

#### Parameters:

Name | Type |
------ | ------ |
`connection` | AbstractSqlConnection |
`tableName` | string |
`schemaName?` | string |

**Returns:** Promise&#60;Index[]>

___

### getListTablesSQL

▸ **getListTablesSQL**(): string

*Overrides void*

*Defined in [packages/sqlite/src/SqliteSchemaHelper.ts:44](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/sqlite/src/SqliteSchemaHelper.ts#L44)*

**Returns:** string

___

### getManagementDbName

▸ **getManagementDbName**(): string

*Inherited from [MySqlSchemaHelper](mysqlschemahelper.md).[getManagementDbName](mysqlschemahelper.md#getmanagementdbname)*

*Defined in packages/knex/dist/schema/SchemaHelper.d.ts:38*

**Returns:** string

___

### getPrimaryKeys

▸ **getPrimaryKeys**(`connection`: AbstractSqlConnection, `indexes`: [Dictionary](../index.md#dictionary), `tableName`: string, `schemaName?`: string): Promise&#60;string[]>

*Overrides [MySqlSchemaHelper](mysqlschemahelper.md).[getPrimaryKeys](mysqlschemahelper.md#getprimarykeys)*

*Defined in [packages/sqlite/src/SqliteSchemaHelper.ts:61](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/sqlite/src/SqliteSchemaHelper.ts#L61)*

#### Parameters:

Name | Type |
------ | ------ |
`connection` | AbstractSqlConnection |
`indexes` | [Dictionary](../index.md#dictionary) |
`tableName` | string |
`schemaName?` | string |

**Returns:** Promise&#60;string[]>

___

### getRenameColumnSQL

▸ **getRenameColumnSQL**(`tableName`: string, `from`: Column, `to`: EntityProperty, `idx?`: number): string

*Overrides [PostgreSqlSchemaHelper](postgresqlschemahelper.md).[getRenameColumnSQL](postgresqlschemahelper.md#getrenamecolumnsql)*

*Defined in [packages/sqlite/src/SqliteSchemaHelper.ts:84](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/sqlite/src/SqliteSchemaHelper.ts#L84)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`tableName` | string | - |
`from` | Column | - |
`to` | EntityProperty | - |
`idx` | number | 0 |

**Returns:** string

___

### getSchemaBeginning

▸ **getSchemaBeginning**(`charset`: string): string

*Overrides void*

*Defined in [packages/sqlite/src/SqliteSchemaHelper.ts:19](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/sqlite/src/SqliteSchemaHelper.ts#L19)*

#### Parameters:

Name | Type |
------ | ------ |
`charset` | string |

**Returns:** string

___

### getSchemaEnd

▸ **getSchemaEnd**(): string

*Overrides void*

*Defined in [packages/sqlite/src/SqliteSchemaHelper.ts:23](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/sqlite/src/SqliteSchemaHelper.ts#L23)*

**Returns:** string

___

### getTypeDefinition

▸ **getTypeDefinition**(`prop`: EntityProperty): string

*Overrides void*

*Defined in [packages/sqlite/src/SqliteSchemaHelper.ts:31](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/sqlite/src/SqliteSchemaHelper.ts#L31)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | EntityProperty |

**Returns:** string

___

### getTypeFromDefinition

▸ **getTypeFromDefinition**(`type`: string, `defaultType`: string): string

*Overrides void*

*Defined in [packages/sqlite/src/SqliteSchemaHelper.ts:36](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/sqlite/src/SqliteSchemaHelper.ts#L36)*

#### Parameters:

Name | Type |
------ | ------ |
`type` | string |
`defaultType` | string |

**Returns:** string

___

### indexForeignKeys

▸ **indexForeignKeys**(): boolean

*Inherited from [MySqlSchemaHelper](mysqlschemahelper.md).[indexForeignKeys](mysqlschemahelper.md#indexforeignkeys)*

*Defined in packages/knex/dist/schema/SchemaHelper.d.ts:12*

**Returns:** boolean

___

### isImplicitIndex

▸ **isImplicitIndex**(`name`: string): boolean

*Overrides [MySqlSchemaHelper](mysqlschemahelper.md).[isImplicitIndex](mysqlschemahelper.md#isimplicitindex)*

*Defined in [packages/sqlite/src/SqliteSchemaHelper.ts:114](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/sqlite/src/SqliteSchemaHelper.ts#L114)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** boolean

___

### isSame

▸ **isSame**(`prop`: EntityProperty, `type`: Column, `idx?`: number): IsSame

*Overrides void*

*Defined in [packages/sqlite/src/SqliteSchemaHelper.ts:27](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/sqlite/src/SqliteSchemaHelper.ts#L27)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | EntityProperty |
`type` | Column |
`idx?` | number |

**Returns:** IsSame

___

### mapForeignKeys

▸ **mapForeignKeys**(`fks`: any[]): [Dictionary](../index.md#dictionary)

*Overrides [MySqlSchemaHelper](mysqlschemahelper.md).[mapForeignKeys](mysqlschemahelper.md#mapforeignkeys)*

*Defined in [packages/sqlite/src/SqliteSchemaHelper.ts:92](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/sqlite/src/SqliteSchemaHelper.ts#L92)*

#### Parameters:

Name | Type |
------ | ------ |
`fks` | any[] |

**Returns:** [Dictionary](../index.md#dictionary)

___

### normalizeDefaultValue

▸ **normalizeDefaultValue**(`defaultValue`: string, `length`: number, `defaultValues?`: [Dictionary](../index.md#dictionary)&#60;string[]>): string \| number

*Inherited from [SqliteSchemaHelper](sqliteschemahelper.md).[normalizeDefaultValue](sqliteschemahelper.md#normalizedefaultvalue)*

*Defined in packages/knex/dist/schema/SchemaHelper.d.ts:33*

#### Parameters:

Name | Type |
------ | ------ |
`defaultValue` | string |
`length` | number |
`defaultValues?` | [Dictionary](../index.md#dictionary)&#60;string[]> |

**Returns:** string \| number

___

### supportsColumnAlter

▸ **supportsColumnAlter**(): boolean

*Overrides [MySqlSchemaHelper](mysqlschemahelper.md).[supportsColumnAlter](mysqlschemahelper.md#supportscolumnalter)*

*Defined in [packages/sqlite/src/SqliteSchemaHelper.ts:106](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/sqlite/src/SqliteSchemaHelper.ts#L106)*

**Returns:** boolean

___

### supportsSchemaConstraints

▸ **supportsSchemaConstraints**(): boolean

*Overrides [MySqlSchemaHelper](mysqlschemahelper.md).[supportsSchemaConstraints](mysqlschemahelper.md#supportsschemaconstraints)*

*Defined in [packages/sqlite/src/SqliteSchemaHelper.ts:40](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/sqlite/src/SqliteSchemaHelper.ts#L40)*

**Returns:** boolean

## Object literals

### TYPES

▪ `Static` `Readonly` **TYPES**: object

*Defined in [packages/sqlite/src/SqliteSchemaHelper.ts:6](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/sqlite/src/SqliteSchemaHelper.ts#L6)*

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`Date` | string[] | ['datetime', 'text'] |
`bigint` | string[] | ['integer'] |
`boolean` | string[] | ['integer', 'int'] |
`date` | string[] | ['datetime', 'text'] |
`number` | string[] | ['integer', 'int', 'tinyint', 'smallint', 'bigint'] |
`object` | string[] | ['text'] |
`smallint` | string[] | ['integer'] |
`string` | string[] | ['varchar', 'text'] |
`text` | string[] | ['text'] |
`tinyint` | string[] | ['integer'] |
