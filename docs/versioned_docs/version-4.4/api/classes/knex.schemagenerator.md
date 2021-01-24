---
id: "knex.schemagenerator"
title: "Class: SchemaGenerator"
sidebar_label: "SchemaGenerator"
hide_title: true
---

# Class: SchemaGenerator

[knex](../modules/knex.md).SchemaGenerator

## Hierarchy

* **SchemaGenerator**

## Constructors

### constructor

\+ **new SchemaGenerator**(`em`: [*EntityManager*](knex.entitymanager.md)<[*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>\>): [*SchemaGenerator*](knex.schemagenerator.md)

#### Parameters:

Name | Type |
------ | ------ |
`em` | [*EntityManager*](knex.entitymanager.md)<[*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>\> |

**Returns:** [*SchemaGenerator*](knex.schemagenerator.md)

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:16](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L16)

## Properties

### config

• `Private` `Readonly` **config**: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:10](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L10)

___

### connection

• `Private` `Readonly` **connection**: [*AbstractSqlConnection*](knex.abstractsqlconnection.md)

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:15](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L15)

___

### driver

• `Private` `Readonly` **driver**: [*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:11](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L11)

___

### helper

• `Private` `Readonly` **helper**: [*SchemaHelper*](knex.schemahelper.md)

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:14](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L14)

___

### knex

• `Private` `Readonly` **knex**: *Knex*<*any*, *unknown*[]\>

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:16](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L16)

___

### metadata

• `Private` `Readonly` **metadata**: [*MetadataStorage*](core.metadatastorage.md)

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:12](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L12)

___

### platform

• `Private` `Readonly` **platform**: [*AbstractSqlPlatform*](knex.abstractsqlplatform.md)

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:13](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L13)

## Methods

### computeColumnDifference

▸ `Private`**computeColumnDifference**(`table`: [*DatabaseTable*](knex.databasetable.md), `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `create`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>[], `update`: { `column`: [*Column*](../interfaces/knex.column.md) ; `diff`: [*IsSame*](../interfaces/knex.issame.md) ; `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>  }[], `joinColumn?`: *string*, `idx?`: *number*): *void*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`table` | [*DatabaseTable*](knex.databasetable.md) | - |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> | - |
`create` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>[] | - |
`update` | { `column`: [*Column*](../interfaces/knex.column.md) ; `diff`: [*IsSame*](../interfaces/knex.issame.md) ; `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>  }[] | - |
`joinColumn?` | *string* | - |
`idx` | *number* | 0 |

**Returns:** *void*

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:314](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L314)

___

### computeTableDifference

▸ `Private`**computeTableDifference**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `table`: [*DatabaseTable*](knex.databasetable.md), `safe`: *boolean*): [*TableDifference*](../interfaces/knex.tabledifference.md)

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`table` | [*DatabaseTable*](knex.databasetable.md) |
`safe` | *boolean* |

**Returns:** [*TableDifference*](../interfaces/knex.tabledifference.md)

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:292](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L292)

___

### configureColumn

▸ `Private`**configureColumn**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>, `col`: [*ColumnBuilder*](../interfaces/knex.knex.columnbuilder.md), `columnName`: *string*, `pkProp?`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>, `alter?`: [*IsSame*](../interfaces/knex.issame.md)): [*ColumnBuilder*](../interfaces/knex.knex.columnbuilder.md)

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> | - |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> | - |
`col` | [*ColumnBuilder*](../interfaces/knex.knex.columnbuilder.md) | - |
`columnName` | *string* | - |
`pkProp` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> | ... |
`alter?` | [*IsSame*](../interfaces/knex.issame.md) | - |

**Returns:** [*ColumnBuilder*](../interfaces/knex.knex.columnbuilder.md)

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:435](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L435)

___

### createDatabase

▸ **createDatabase**(`name`: *string*): *Promise*<*void*\>

creates new database and connects to it

#### Parameters:

Name | Type |
------ | ------ |
`name` | *string* |

**Returns:** *Promise*<*void*\>

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:134](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L134)

___

### createForeignKey

▸ `Private`**createForeignKey**(`table`: [*TableBuilder*](../interfaces/knex.knex.tablebuilder.md), `meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `createdColumns`: *string*[], `diff?`: [*IsSame*](../interfaces/knex.issame.md)): *void*

#### Parameters:

Name | Type |
------ | ------ |
`table` | [*TableBuilder*](../interfaces/knex.knex.tablebuilder.md) |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`createdColumns` | *string*[] |
`diff?` | [*IsSame*](../interfaces/knex.issame.md) |

**Returns:** *void*

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:474](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L474)

___

### createForeignKeyReference

▸ `Private`**createForeignKeyReference**(`table`: [*TableBuilder*](../interfaces/knex.knex.tablebuilder.md), `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`table` | [*TableBuilder*](../interfaces/knex.knex.tablebuilder.md) |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |

**Returns:** *void*

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:493](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L493)

___

### createForeignKeys

▸ `Private`**createForeignKeys**(`table`: [*TableBuilder*](../interfaces/knex.knex.tablebuilder.md), `meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `props?`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>[], `createdColumns?`: *string*[]): *void*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`table` | [*TableBuilder*](../interfaces/knex.knex.tablebuilder.md) | - |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> | - |
`props?` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>[] | - |
`createdColumns` | *string*[] | ... |

**Returns:** *void*

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:467](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L467)

___

### createIndex

▸ `Private`**createIndex**(`table`: [*CreateTableBuilder*](../interfaces/knex.knex.createtablebuilder.md), `meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `index`: { `name?`: *undefined* \| *string* \| *boolean* ; `properties`: *string* \| *string*[] ; `type?`: *undefined* \| *string*  }, `unique`: *boolean*): *void*

#### Parameters:

Name | Type |
------ | ------ |
`table` | [*CreateTableBuilder*](../interfaces/knex.knex.createtablebuilder.md) |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`index` | { `name?`: *undefined* \| *string* \| *boolean* ; `properties`: *string* \| *string*[] ; `type?`: *undefined* \| *string*  } |
`unique` | *boolean* |

**Returns:** *void*

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:250](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L250)

___

### createSchema

▸ **createSchema**(`wrap?`: *boolean*): *Promise*<*void*\>

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`wrap` | *boolean* | true |

**Returns:** *Promise*<*void*\>

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:29](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L29)

___

### createSimpleTableColumn

▸ `Private`**createSimpleTableColumn**(`table`: [*TableBuilder*](../interfaces/knex.knex.tablebuilder.md), `meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `alter?`: [*IsSame*](../interfaces/knex.issame.md)): [*ColumnBuilder*](../interfaces/knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`table` | [*TableBuilder*](../interfaces/knex.knex.tablebuilder.md) |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`alter?` | [*IsSame*](../interfaces/knex.issame.md) |

**Returns:** [*ColumnBuilder*](../interfaces/knex.knex.columnbuilder.md)

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:383](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L383)

___

### createTable

▸ `Private`**createTable**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `createdColumns`: *string*[]): [*SchemaBuilder*](../interfaces/knex.knex.schemabuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`createdColumns` | *string*[] |

**Returns:** [*SchemaBuilder*](../interfaces/knex.knex.schemabuilder.md)

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:228](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L228)

___

### createTableColumn

▸ `Private`**createTableColumn**(`table`: [*TableBuilder*](../interfaces/knex.knex.tablebuilder.md), `meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `alter?`: [*IsSame*](../interfaces/knex.issame.md)): [*ColumnBuilder*](../interfaces/knex.knex.columnbuilder.md)[]

#### Parameters:

Name | Type |
------ | ------ |
`table` | [*TableBuilder*](../interfaces/knex.knex.tablebuilder.md) |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`alter?` | [*IsSame*](../interfaces/knex.issame.md) |

**Returns:** [*ColumnBuilder*](../interfaces/knex.knex.columnbuilder.md)[]

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:370](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L370)

___

### dropDatabase

▸ **dropDatabase**(`name`: *string*): *Promise*<*void*\>

#### Parameters:

Name | Type |
------ | ------ |
`name` | *string* |

**Returns:** *Promise*<*void*\>

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:140](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L140)

___

### dropSchema

▸ **dropSchema**(`wrap?`: *boolean*, `dropMigrationsTable?`: *boolean*, `dropDb?`: *boolean*): *Promise*<*void*\>

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`wrap` | *boolean* | true |
`dropMigrationsTable` | *boolean* | false |
`dropDb` | *boolean* | false |

**Returns:** *Promise*<*void*\>

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:69](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L69)

___

### dropTable

▸ `Private`**dropTable**(`name`: *string*, `schema?`: *string*): [*SchemaBuilder*](../interfaces/knex.knex.schemabuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`name` | *string* |
`schema?` | *string* |

**Returns:** [*SchemaBuilder*](../interfaces/knex.knex.schemabuilder.md)

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:336](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L336)

___

### dropTableColumn

▸ `Private`**dropTableColumn**(`table`: [*TableBuilder*](../interfaces/knex.knex.tablebuilder.md), `column`: [*Column*](../interfaces/knex.column.md)): *void*

#### Parameters:

Name | Type |
------ | ------ |
`table` | [*TableBuilder*](../interfaces/knex.knex.tablebuilder.md) |
`column` | [*Column*](../interfaces/knex.column.md) |

**Returns:** *void*

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:419](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L419)

___

### dump

▸ `Private`**dump**(`builder`: [*SchemaBuilder*](../interfaces/knex.knex.schemabuilder.md), `append?`: *string*): *string*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`builder` | [*SchemaBuilder*](../interfaces/knex.knex.schemabuilder.md) | - |
`append` | *string* | '\n\n' |

**Returns:** *string*

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:615](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L615)

___

### ensureDatabase

▸ **ensureDatabase**(): *Promise*<*void*\>

**Returns:** *Promise*<*void*\>

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:35](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L35)

___

### execute

▸ **execute**(`sql`: *string*): *Promise*<*void*\>

#### Parameters:

Name | Type |
------ | ------ |
`sql` | *string* |

**Returns:** *Promise*<*void*\>

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:146](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L146)

___

### findIndexDifference

▸ `Private`**findIndexDifference**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `table`: [*DatabaseTable*](knex.databasetable.md), `remove`: [*Column*](../interfaces/knex.column.md)[]): *object*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`table` | [*DatabaseTable*](knex.databasetable.md) |
`remove` | [*Column*](../interfaces/knex.column.md)[] |

**Returns:** *object*

Name | Type |
------ | ------ |
`addIndex` | [*IndexDef*](../interfaces/knex.indexdef.md)[] |
`dropIndex` | [*IndexDef*](../interfaces/knex.indexdef.md)[] |

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:538](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L538)

___

### findRenamedColumns

▸ `Private`**findRenamedColumns**(`create`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>[], `remove`: [*Column*](../interfaces/knex.column.md)[]): { `from`: [*Column*](../interfaces/knex.column.md) ; `to`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>  }[]

#### Parameters:

Name | Type |
------ | ------ |
`create` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>[] |
`remove` | [*Column*](../interfaces/knex.column.md)[] |

**Returns:** { `from`: [*Column*](../interfaces/knex.column.md) ; `to`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>  }[]

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:508](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L508)

___

### generate

▸ **generate**(): *Promise*<*string*\>

**Returns:** *Promise*<*string*\>

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:20](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L20)

___

### getCreateSchemaSQL

▸ **getCreateSchemaSQL**(`wrap?`: *boolean*): *Promise*<*string*\>

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`wrap` | *boolean* | true |

**Returns:** *Promise*<*string*\>

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:46](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L46)

___

### getDropSchemaSQL

▸ **getDropSchemaSQL**(`wrap?`: *boolean*, `dropMigrationsTable?`: *boolean*): *Promise*<*string*\>

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`wrap` | *boolean* | true |
`dropMigrationsTable` | *boolean* | false |

**Returns:** *Promise*<*string*\>

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:79](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L79)

___

### getIndexName

▸ `Private`**getIndexName**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>, `type`: *index* \| *unique*, `columnNames`: *string*[]): *string*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |
`type` | *index* \| *unique* |
`columnNames` | *string*[] |

**Returns:** *string*

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:457](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L457)

___

### getOrderedMetadata

▸ `Private`**getOrderedMetadata**(): [*EntityMetadata*](core.entitymetadata.md)<*any*\>[]

**Returns:** [*EntityMetadata*](core.entitymetadata.md)<*any*\>[]

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:595](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L595)

___

### getUpdateSchemaSQL

▸ **getUpdateSchemaSQL**(`wrap?`: *boolean*, `safe?`: *boolean*, `dropTables?`: *boolean*): *Promise*<*string*\>

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`wrap` | *boolean* | true |
`safe` | *boolean* | false |
`dropTables` | *boolean* | true |

**Returns:** *Promise*<*string*\>

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:99](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L99)

___

### getUpdateTableFKsSQL

▸ `Private`**getUpdateTableFKsSQL**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `schema`: [*DatabaseSchema*](knex.databaseschema.md), `createdColumns`: *string*[]): *string*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`schema` | [*DatabaseSchema*](knex.databaseschema.md) |
`createdColumns` | *string*[] |

**Returns:** *string*

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:164](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L164)

___

### getUpdateTableIndexesSQL

▸ `Private`**getUpdateTableIndexesSQL**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `schema`: [*DatabaseSchema*](knex.databaseschema.md)): *string*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`schema` | [*DatabaseSchema*](knex.databaseschema.md) |

**Returns:** *string*

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:180](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L180)

___

### getUpdateTableSQL

▸ `Private`**getUpdateTableSQL**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `schema`: [*DatabaseSchema*](knex.databaseschema.md), `safe`: *boolean*, `createdColumns`: *string*[]): *string*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`schema` | [*DatabaseSchema*](knex.databaseschema.md) |
`safe` | *boolean* |
`createdColumns` | *string*[] |

**Returns:** *string*

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:154](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L154)

___

### shouldHaveColumn

▸ `Private`**shouldHaveColumn**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `update?`: *boolean*): *boolean*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> | - |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> | - |
`update` | *boolean* | false |

**Returns:** *boolean*

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:347](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L347)

___

### updateSchema

▸ **updateSchema**(`wrap?`: *boolean*, `safe?`: *boolean*, `dropTables?`: *boolean*): *Promise*<*void*\>

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`wrap` | *boolean* | true |
`safe` | *boolean* | false |
`dropTables` | *boolean* | true |

**Returns:** *Promise*<*void*\>

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:94](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L94)

___

### updateTable

▸ `Private`**updateTable**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `table`: [*DatabaseTable*](knex.databasetable.md), `safe`: *boolean*, `createdColumns`: *string*[]): [*SchemaBuilder*](../interfaces/knex.knex.schemabuilder.md)[]

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`table` | [*DatabaseTable*](knex.databasetable.md) |
`safe` | *boolean* |
`createdColumns` | *string*[] |

**Returns:** [*SchemaBuilder*](../interfaces/knex.knex.schemabuilder.md)[]

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:261](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L261)

___

### updateTableColumn

▸ `Private`**updateTableColumn**(`table`: [*TableBuilder*](../interfaces/knex.knex.tablebuilder.md), `meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `column`: [*Column*](../interfaces/knex.column.md), `diff`: [*IsSame*](../interfaces/knex.issame.md), `createdColumns`: *string*[]): *void*

#### Parameters:

Name | Type |
------ | ------ |
`table` | [*TableBuilder*](../interfaces/knex.knex.tablebuilder.md) |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`column` | [*Column*](../interfaces/knex.column.md) |
`diff` | [*IsSame*](../interfaces/knex.issame.md) |
`createdColumns` | *string*[] |

**Returns:** *void*

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:401](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L401)

___

### wrapSchema

▸ `Private`**wrapSchema**(`sql`: *string*, `wrap?`: *boolean*): *Promise*<*string*\>

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`sql` | *string* | - |
`wrap` | *boolean* | true |

**Returns:** *Promise*<*string*\>

Defined in: [packages/knex/src/schema/SchemaGenerator.ts:216](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaGenerator.ts#L216)
