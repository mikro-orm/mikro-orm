---
id: "postgresqlschemahelper"
title: "Class: PostgreSqlSchemaHelper"
sidebar_label: "PostgreSqlSchemaHelper"
---

## Hierarchy

* SchemaHelper

  ↳ **PostgreSqlSchemaHelper**

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

▸ **getColumns**(`connection`: AbstractSqlConnection, `tableName`: string, `schemaName`: string): Promise&#60;any[]>

*Overrides void*

*Defined in [packages/postgresql/src/PostgreSqlSchemaHelper.ts:74](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlSchemaHelper.ts#L74)*

#### Parameters:

Name | Type |
------ | ------ |
`connection` | AbstractSqlConnection |
`tableName` | string |
`schemaName` | string |

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

*Overrides [MySqlSchemaHelper](mysqlschemahelper.md).[getDatabaseExistsSQL](mysqlschemahelper.md#getdatabaseexistssql)*

*Defined in [packages/postgresql/src/PostgreSqlSchemaHelper.ts:158](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlSchemaHelper.ts#L158)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** string

___

### getDatabaseNotExistsError

▸ **getDatabaseNotExistsError**(`dbName`: string): string

*Overrides [MySqlSchemaHelper](mysqlschemahelper.md).[getDatabaseNotExistsError](mysqlschemahelper.md#getdatabasenotexistserror)*

*Defined in [packages/postgresql/src/PostgreSqlSchemaHelper.ts:162](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlSchemaHelper.ts#L162)*

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

*Defined in [packages/postgresql/src/PostgreSqlSchemaHelper.ts:118](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlSchemaHelper.ts#L118)*

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

▸ **getForeignKeysSQL**(`tableName`: string, `schemaName`: string): string

*Overrides void*

*Defined in [packages/postgresql/src/PostgreSqlSchemaHelper.ts:100](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlSchemaHelper.ts#L100)*

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | string |
`schemaName` | string |

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

▸ **getIndexes**(`connection`: AbstractSqlConnection, `tableName`: string, `schemaName`: string): Promise&#60;Index[]>

*Overrides void*

*Defined in [packages/postgresql/src/PostgreSqlSchemaHelper.ts:88](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlSchemaHelper.ts#L88)*

#### Parameters:

Name | Type |
------ | ------ |
`connection` | AbstractSqlConnection |
`tableName` | string |
`schemaName` | string |

**Returns:** Promise&#60;Index[]>

___

### getIndexesSQL

▸ `Private`**getIndexesSQL**(`tableName`: string, `schemaName`: string): string

*Defined in [packages/postgresql/src/PostgreSqlSchemaHelper.ts:170](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlSchemaHelper.ts#L170)*

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | string |
`schemaName` | string |

**Returns:** string

___

### getListTablesSQL

▸ **getListTablesSQL**(): string

*Overrides void*

*Defined in [packages/postgresql/src/PostgreSqlSchemaHelper.ts:68](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlSchemaHelper.ts#L68)*

**Returns:** string

___

### getManagementDbName

▸ **getManagementDbName**(): string

*Overrides [MySqlSchemaHelper](mysqlschemahelper.md).[getManagementDbName](mysqlschemahelper.md#getmanagementdbname)*

*Defined in [packages/postgresql/src/PostgreSqlSchemaHelper.ts:166](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlSchemaHelper.ts#L166)*

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

▸ **getRenameColumnSQL**(`tableName`: string, `from`: Column, `to`: EntityProperty, `idx?`: number, `quote?`: string): string

*Inherited from [PostgreSqlSchemaHelper](postgresqlschemahelper.md).[getRenameColumnSQL](postgresqlschemahelper.md#getrenamecolumnsql)*

*Defined in packages/knex/dist/schema/SchemaHelper.d.ts:22*

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | string |
`from` | Column |
`to` | EntityProperty |
`idx?` | number |
`quote?` | string |

**Returns:** string

___

### getSchemaBeginning

▸ **getSchemaBeginning**(`charset`: string): string

*Overrides void*

*Defined in [packages/postgresql/src/PostgreSqlSchemaHelper.ts:40](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlSchemaHelper.ts#L40)*

#### Parameters:

Name | Type |
------ | ------ |
`charset` | string |

**Returns:** string

___

### getSchemaEnd

▸ **getSchemaEnd**(): string

*Overrides void*

*Defined in [packages/postgresql/src/PostgreSqlSchemaHelper.ts:44](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlSchemaHelper.ts#L44)*

**Returns:** string

___

### getTypeDefinition

▸ **getTypeDefinition**(`prop`: EntityProperty): string

*Overrides void*

*Defined in [packages/postgresql/src/PostgreSqlSchemaHelper.ts:48](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlSchemaHelper.ts#L48)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | EntityProperty |

**Returns:** string

___

### getTypeFromDefinition

▸ **getTypeFromDefinition**(`type`: string, `defaultType`: string): string

*Overrides void*

*Defined in [packages/postgresql/src/PostgreSqlSchemaHelper.ts:52](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlSchemaHelper.ts#L52)*

#### Parameters:

Name | Type |
------ | ------ |
`type` | string |
`defaultType` | string |

**Returns:** string

___

### indexForeignKeys

▸ **indexForeignKeys**(): boolean

*Overrides [MySqlSchemaHelper](mysqlschemahelper.md).[indexForeignKeys](mysqlschemahelper.md#indexforeignkeys)*

*Defined in [packages/postgresql/src/PostgreSqlSchemaHelper.ts:60](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlSchemaHelper.ts#L60)*

**Returns:** boolean

___

### isImplicitIndex

▸ **isImplicitIndex**(`name`: string): boolean

*Overrides [MySqlSchemaHelper](mysqlschemahelper.md).[isImplicitIndex](mysqlschemahelper.md#isimplicitindex)*

*Defined in [packages/postgresql/src/PostgreSqlSchemaHelper.ts:64](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlSchemaHelper.ts#L64)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** boolean

___

### isSame

▸ **isSame**(`prop`: EntityProperty, `column`: Column, `idx?`: number): IsSame

*Overrides void*

*Defined in [packages/postgresql/src/PostgreSqlSchemaHelper.ts:56](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlSchemaHelper.ts#L56)*

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

*Defined in [packages/postgresql/src/PostgreSqlSchemaHelper.ts:140](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlSchemaHelper.ts#L140)*

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

*Defined in [packages/postgresql/src/PostgreSqlSchemaHelper.ts:25](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlSchemaHelper.ts#L25)*

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`date` | number | 0 |
`string` | number | 255 |

___

### DEFAULT\_VALUES

▪ `Static` `Readonly` **DEFAULT\_VALUES**: object

*Defined in [packages/postgresql/src/PostgreSqlSchemaHelper.ts:30](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlSchemaHelper.ts#L30)*

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`('now'::text)::timestamp(?) with time zone` | string[] | ['current\_timestamp(?)'] |
`('now'::text)::timestamp(?) without time zone` | string[] | ['current\_timestamp(?)'] |
`current_timestamp(?)` | string[] | ['current\_timestamp(?)'] |
`now()` | string[] | ['now()', 'current\_timestamp'] |
`null::character varying` | string[] | ['null'] |
`null::timestamp with time zone` | string[] | ['null'] |
`null::timestamp without time zone` | string[] | ['null'] |

___

### TYPES

▪ `Static` `Readonly` **TYPES**: object

*Defined in [packages/postgresql/src/PostgreSqlSchemaHelper.ts:6](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/postgresql/src/PostgreSqlSchemaHelper.ts#L6)*

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`Buffer` | string[] | ['bytea'] |
`Date` | string[] | ['timestamptz(?)', 'timestamp(?)', 'datetime(?)', 'timestamp with time zone', 'timestamp without time zone', 'datetimetz', 'time', 'date', 'timetz', 'datetz'] |
`boolean` | string[] | ['bool', 'boolean'] |
`buffer` | string[] | ['bytea'] |
`date` | string[] | ['timestamptz(?)', 'timestamp(?)', 'datetime(?)', 'timestamp with time zone', 'timestamp without time zone', 'datetimetz', 'time', 'date', 'timetz', 'datetz'] |
`double` | string[] | ['double precision', 'float8'] |
`enum` | string[] | ['text'] |
`float` | string[] | ['float'] |
`json` | string[] | ['jsonb', 'json'] |
`number` | string[] | ['int4', 'integer', 'int2', 'int', 'float', 'float8', 'double', 'double precision', 'bigint', 'smallint', 'decimal', 'numeric', 'real'] |
`object` | string[] | ['jsonb', 'json'] |
`smallint` | string[] | ['int2'] |
`string` | string[] | ['varchar(?)', 'character varying', 'text', 'character', 'char', 'uuid', 'bigint', 'int8', 'enum'] |
`text` | string[] | ['text'] |
`tinyint` | string[] | ['int2'] |
`uuid` | string[] | ['uuid'] |
