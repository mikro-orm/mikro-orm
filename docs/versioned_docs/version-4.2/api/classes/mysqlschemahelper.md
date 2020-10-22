---
id: "mysqlschemahelper"
title: "Class: MySqlSchemaHelper"
sidebar_label: "MySqlSchemaHelper"
---

## Hierarchy

* SchemaHelper

  ↳ **MySqlSchemaHelper**

## Methods

### databaseExists

▸ **databaseExists**(`connection`: Connection, `name`: string): Promise&#60;boolean>

*Inherited from [MySqlSchemaHelper](mysqlschemahelper.md).[databaseExists](mysqlschemahelper.md#databaseexists)*

*Defined in packages/knex/dist/schema/SchemaHelper.d.ts:40*

#### Parameters:

Name | Type |
------ | ------ |
`connection` | Connection |
`name` | string |

**Returns:** Promise&#60;boolean>

___

### finalizeTable

▸ **finalizeTable**(`table`: CreateTableBuilder, `charset`: string): void

*Overrides [PostgreSqlSchemaHelper](postgresqlschemahelper.md).[finalizeTable](postgresqlschemahelper.md#finalizetable)*

*Defined in [packages/mysql-base/src/MySqlSchemaHelper.ts:42](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/mysql-base/src/MySqlSchemaHelper.ts#L42)*

#### Parameters:

Name | Type |
------ | ------ |
`table` | CreateTableBuilder |
`charset` | string |

**Returns:** void

___

### getColumns

▸ **getColumns**(`connection`: AbstractSqlConnection, `tableName`: string, `schemaName?`: string): Promise&#60;any[]>

*Overrides void*

*Defined in [packages/mysql-base/src/MySqlSchemaHelper.ts:82](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/mysql-base/src/MySqlSchemaHelper.ts#L82)*

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

*Overrides [SqliteSchemaHelper](sqliteschemahelper.md).[getEnumDefinitions](sqliteschemahelper.md#getenumdefinitions)*

*Defined in [packages/mysql-base/src/MySqlSchemaHelper.ts:71](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/mysql-base/src/MySqlSchemaHelper.ts#L71)*

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

▸ **getForeignKeysSQL**(`tableName`: string, `schemaName?`: string): string

*Overrides void*

*Defined in [packages/mysql-base/src/MySqlSchemaHelper.ts:64](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/mysql-base/src/MySqlSchemaHelper.ts#L64)*

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | string |
`schemaName?` | string |

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

*Defined in [packages/mysql-base/src/MySqlSchemaHelper.ts:98](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/mysql-base/src/MySqlSchemaHelper.ts#L98)*

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

*Defined in [packages/mysql-base/src/MySqlSchemaHelper.ts:55](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/mysql-base/src/MySqlSchemaHelper.ts#L55)*

**Returns:** string

___

### getManagementDbName

▸ **getManagementDbName**(): string

*Inherited from [MySqlSchemaHelper](mysqlschemahelper.md).[getManagementDbName](mysqlschemahelper.md#getmanagementdbname)*

*Defined in packages/knex/dist/schema/SchemaHelper.d.ts:38*

**Returns:** string

___

### getPrimaryKeys

▸ **getPrimaryKeys**(`connection`: AbstractSqlConnection, `indexes`: Index[], `tableName`: string, `schemaName?`: string): Promise&#60;string[]>

*Inherited from [MySqlSchemaHelper](mysqlschemahelper.md).[getPrimaryKeys](mysqlschemahelper.md#getprimarykeys)*

*Defined in packages/knex/dist/schema/SchemaHelper.d.ts:18*

#### Parameters:

Name | Type |
------ | ------ |
`connection` | AbstractSqlConnection |
`indexes` | Index[] |
`tableName` | string |
`schemaName?` | string |

**Returns:** Promise&#60;string[]>

___

### getRenameColumnSQL

▸ **getRenameColumnSQL**(`tableName`: string, `from`: Column, `to`: EntityProperty, `idx?`: number): string

*Overrides [PostgreSqlSchemaHelper](postgresqlschemahelper.md).[getRenameColumnSQL](postgresqlschemahelper.md#getrenamecolumnsql)*

*Defined in [packages/mysql-base/src/MySqlSchemaHelper.ts:59](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/mysql-base/src/MySqlSchemaHelper.ts#L59)*

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

*Defined in [packages/mysql-base/src/MySqlSchemaHelper.ts:34](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/mysql-base/src/MySqlSchemaHelper.ts#L34)*

#### Parameters:

Name | Type |
------ | ------ |
`charset` | string |

**Returns:** string

___

### getSchemaEnd

▸ **getSchemaEnd**(): string

*Overrides void*

*Defined in [packages/mysql-base/src/MySqlSchemaHelper.ts:38](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/mysql-base/src/MySqlSchemaHelper.ts#L38)*

**Returns:** string

___

### getTypeDefinition

▸ **getTypeDefinition**(`prop`: EntityProperty): string

*Overrides void*

*Defined in [packages/mysql-base/src/MySqlSchemaHelper.ts:47](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/mysql-base/src/MySqlSchemaHelper.ts#L47)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | EntityProperty |

**Returns:** string

___

### getTypeFromDefinition

▸ **getTypeFromDefinition**(`type`: string, `defaultType`: string): string

*Overrides void*

*Defined in [packages/mysql-base/src/MySqlSchemaHelper.ts:51](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/mysql-base/src/MySqlSchemaHelper.ts#L51)*

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

*Inherited from [MySqlSchemaHelper](mysqlschemahelper.md).[isImplicitIndex](mysqlschemahelper.md#isimplicitindex)*

*Defined in packages/knex/dist/schema/SchemaHelper.d.ts:16*

Implicit indexes will be ignored when diffing

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** boolean

___

### isSame

▸ **isSame**(`prop`: EntityProperty, `column`: Column, `idx?`: number): IsSame

*Overrides void*

*Defined in [packages/mysql-base/src/MySqlSchemaHelper.ts:110](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/mysql-base/src/MySqlSchemaHelper.ts#L110)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | EntityProperty |
`column` | Column |
`idx?` | number |

**Returns:** IsSame

___

### mapForeignKeys

▸ **mapForeignKeys**(`fks`: any[]): [Dictionary](../index.md#dictionary)

*Inherited from [MySqlSchemaHelper](mysqlschemahelper.md).[mapForeignKeys](mysqlschemahelper.md#mapforeignkeys)*

*Defined in packages/knex/dist/schema/SchemaHelper.d.ts:30*

#### Parameters:

Name | Type |
------ | ------ |
`fks` | any[] |

**Returns:** [Dictionary](../index.md#dictionary)

___

### normalizeDefaultValue

▸ **normalizeDefaultValue**(`defaultValue`: string, `length`: number): string \| number

*Overrides [SqliteSchemaHelper](sqliteschemahelper.md).[normalizeDefaultValue](sqliteschemahelper.md#normalizedefaultvalue)*

*Defined in [packages/mysql-base/src/MySqlSchemaHelper.ts:114](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/mysql-base/src/MySqlSchemaHelper.ts#L114)*

#### Parameters:

Name | Type |
------ | ------ |
`defaultValue` | string |
`length` | number |

**Returns:** string \| number

___

### supportsColumnAlter

▸ **supportsColumnAlter**(): boolean

*Inherited from [MySqlSchemaHelper](mysqlschemahelper.md).[supportsColumnAlter](mysqlschemahelper.md#supportscolumnalter)*

*Defined in packages/knex/dist/schema/SchemaHelper.d.ts:32*

**Returns:** boolean

___

### supportsSchemaConstraints

▸ **supportsSchemaConstraints**(): boolean

*Inherited from [MySqlSchemaHelper](mysqlschemahelper.md).[supportsSchemaConstraints](mysqlschemahelper.md#supportsschemaconstraints)*

*Defined in packages/knex/dist/schema/SchemaHelper.d.ts:11*

**Returns:** boolean

## Object literals

### DEFAULT\_TYPE\_LENGTHS

▪ `Static` `Readonly` **DEFAULT\_TYPE\_LENGTHS**: object

*Defined in [packages/mysql-base/src/MySqlSchemaHelper.ts:22](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/mysql-base/src/MySqlSchemaHelper.ts#L22)*

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`date` | number | 0 |
`number` | number | 11 |
`string` | number | 255 |

___

### DEFAULT\_VALUES

▪ `Static` `Readonly` **DEFAULT\_VALUES**: object

*Defined in [packages/mysql-base/src/MySqlSchemaHelper.ts:28](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/mysql-base/src/MySqlSchemaHelper.ts#L28)*

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`0` | string[] | ['0', 'false'] |
`current_timestamp(?)` | string[] | ['current\_timestamp(?)'] |
`now()` | string[] | ['now()', 'current\_timestamp'] |

___

### TYPES

▪ `Static` `Readonly` **TYPES**: object

*Defined in [packages/mysql-base/src/MySqlSchemaHelper.ts:6](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/mysql-base/src/MySqlSchemaHelper.ts#L6)*

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`Date` | string[] | ['datetime(?)', 'timestamp(?)', 'datetime', 'timestamp'] |
`boolean` | string[] | ['tinyint(1)', 'tinyint'] |
`date` | string[] | ['datetime(?)', 'timestamp(?)', 'datetime', 'timestamp'] |
`double` | string[] | ['double'] |
`enum` | string[] | ['enum'] |
`float` | string[] | ['float'] |
`json` | string[] | ['json'] |
`number` | string[] | ['int(?)', 'int', 'float', 'double', 'tinyint', 'smallint'] |
`object` | string[] | ['json'] |
`smallint` | string[] | ['smallint'] |
`string` | string[] | ['varchar(?)', 'varchar', 'text', 'bigint', 'enum'] |
`text` | string[] | ['text'] |
`tinyint` | string[] | ['tinyint'] |
