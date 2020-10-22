---
id: "schemagenerator"
title: "Class: SchemaGenerator"
sidebar_label: "SchemaGenerator"
---

## Hierarchy

* **SchemaGenerator**

## Constructors

### constructor

\+ **new SchemaGenerator**(`em`: [SqlEntityManager](sqlentitymanager.md)): [SchemaGenerator](schemagenerator.md)

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:16](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L16)*

#### Parameters:

Name | Type |
------ | ------ |
`em` | [SqlEntityManager](sqlentitymanager.md) |

**Returns:** [SchemaGenerator](schemagenerator.md)

## Properties

### config

• `Private` `Readonly` **config**: Configuration&#60;IDatabaseDriver&#60;Connection>> = this.em.config

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:10](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L10)*

___

### connection

• `Private` `Readonly` **connection**: [AbstractSqlConnection](abstractsqlconnection.md) = this.driver.getConnection()

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:15](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L15)*

___

### driver

• `Private` `Readonly` **driver**: [AbstractSqlDriver](abstractsqldriver.md)&#60;[AbstractSqlConnection](abstractsqlconnection.md)> = this.em.getDriver()

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:11](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L11)*

___

### em

• `Private` `Readonly` **em**: [SqlEntityManager](sqlentitymanager.md)

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:18](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L18)*

___

### helper

• `Private` `Readonly` **helper**: [SchemaHelper](schemahelper.md) = this.platform.getSchemaHelper()!

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:14](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L14)*

___

### knex

• `Private` `Readonly` **knex**: any = this.connection.getKnex()

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:16](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L16)*

___

### metadata

• `Private` `Readonly` **metadata**: MetadataStorage = this.em.getMetadata()

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:12](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L12)*

___

### platform

• `Private` `Readonly` **platform**: [AbstractSqlPlatform](abstractsqlplatform.md) = this.driver.getPlatform()

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:13](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L13)*

## Methods

### addCommitDependency

▸ `Private`**addCommitDependency**(`calc`: CommitOrderCalculator, `prop`: EntityProperty, `entityName`: string): void

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:598](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L598)*

#### Parameters:

Name | Type |
------ | ------ |
`calc` | CommitOrderCalculator |
`prop` | EntityProperty |
`entityName` | string |

**Returns:** void

___

### computeColumnDifference

▸ `Private`**computeColumnDifference**(`table`: [DatabaseTable](databasetable.md), `prop`: EntityProperty, `create`: EntityProperty[], `update`: { column: [Column](../interfaces/column.md) ; diff: [IsSame](../interfaces/issame.md) ; prop: EntityProperty  }[], `joinColumn?`: string, `idx?`: number): void

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:308](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L308)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`table` | [DatabaseTable](databasetable.md) | - |
`prop` | EntityProperty | - |
`create` | EntityProperty[] | - |
`update` | { column: [Column](../interfaces/column.md) ; diff: [IsSame](../interfaces/issame.md) ; prop: EntityProperty  }[] | - |
`joinColumn?` | string | - |
`idx` | number | 0 |

**Returns:** void

___

### computeTableDifference

▸ `Private`**computeTableDifference**(`meta`: EntityMetadata, `table`: [DatabaseTable](databasetable.md), `safe`: boolean): [TableDifference](../interfaces/tabledifference.md)

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:286](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L286)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |
`table` | [DatabaseTable](databasetable.md) |
`safe` | boolean |

**Returns:** [TableDifference](../interfaces/tabledifference.md)

___

### configureColumn

▸ `Private`**configureColumn**&#60;T>(`meta`: EntityMetadata&#60;T>, `prop`: EntityProperty&#60;T>, `col`: ColumnBuilder, `columnName`: string, `pkProp?`: EntityProperty&#60;T>, `alter?`: [IsSame](../interfaces/issame.md)): ColumnBuilder

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:421](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L421)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`meta` | EntityMetadata&#60;T> | - |
`prop` | EntityProperty&#60;T> | - |
`col` | ColumnBuilder | - |
`columnName` | string | - |
`pkProp` | EntityProperty&#60;T> | prop |
`alter?` | [IsSame](../interfaces/issame.md) | - |

**Returns:** ColumnBuilder

___

### createDatabase

▸ **createDatabase**(`name`: string): Promise&#60;void>

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:132](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L132)*

creates new database and connects to it

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** Promise&#60;void>

___

### createForeignKey

▸ `Private`**createForeignKey**(`table`: TableBuilder, `meta`: EntityMetadata, `prop`: EntityProperty, `diff?`: [IsSame](../interfaces/issame.md)): void

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:460](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L460)*

#### Parameters:

Name | Type |
------ | ------ |
`table` | TableBuilder |
`meta` | EntityMetadata |
`prop` | EntityProperty |
`diff?` | [IsSame](../interfaces/issame.md) |

**Returns:** void

___

### createForeignKeyReference

▸ `Private`**createForeignKeyReference**(`table`: TableBuilder, `prop`: EntityProperty): void

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:480](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L480)*

#### Parameters:

Name | Type |
------ | ------ |
`table` | TableBuilder |
`prop` | EntityProperty |

**Returns:** void

___

### createForeignKeys

▸ `Private`**createForeignKeys**(`table`: TableBuilder, `meta`: EntityMetadata, `props?`: EntityProperty[]): void

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:453](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L453)*

#### Parameters:

Name | Type |
------ | ------ |
`table` | TableBuilder |
`meta` | EntityMetadata |
`props?` | EntityProperty[] |

**Returns:** void

___

### createIndex

▸ `Private`**createIndex**(`table`: CreateTableBuilder, `meta`: EntityMetadata, `index`: { name?: string \| boolean ; properties: string \| string[] ; type?: string  }, `unique`: boolean): void

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:245](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L245)*

#### Parameters:

Name | Type |
------ | ------ |
`table` | CreateTableBuilder |
`meta` | EntityMetadata |
`index` | { name?: string \| boolean ; properties: string \| string[] ; type?: string  } |
`unique` | boolean |

**Returns:** void

___

### createSchema

▸ **createSchema**(`wrap?`: boolean): Promise&#60;void>

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:29](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L29)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`wrap` | boolean | true |

**Returns:** Promise&#60;void>

___

### createSimpleTableColumn

▸ `Private`**createSimpleTableColumn**(`table`: TableBuilder, `meta`: EntityMetadata, `prop`: EntityProperty, `alter?`: [IsSame](../interfaces/issame.md)): ColumnBuilder

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:369](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L369)*

#### Parameters:

Name | Type |
------ | ------ |
`table` | TableBuilder |
`meta` | EntityMetadata |
`prop` | EntityProperty |
`alter?` | [IsSame](../interfaces/issame.md) |

**Returns:** ColumnBuilder

___

### createTable

▸ `Private`**createTable**(`meta`: EntityMetadata): SchemaBuilder

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:226](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L226)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |

**Returns:** SchemaBuilder

___

### createTableColumn

▸ `Private`**createTableColumn**(`table`: TableBuilder, `meta`: EntityMetadata, `prop`: EntityProperty, `alter?`: [IsSame](../interfaces/issame.md)): ColumnBuilder[]

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:356](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L356)*

#### Parameters:

Name | Type |
------ | ------ |
`table` | TableBuilder |
`meta` | EntityMetadata |
`prop` | EntityProperty |
`alter?` | [IsSame](../interfaces/issame.md) |

**Returns:** ColumnBuilder[]

___

### dropDatabase

▸ **dropDatabase**(`name`: string): Promise&#60;void>

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:138](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L138)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** Promise&#60;void>

___

### dropSchema

▸ **dropSchema**(`wrap?`: boolean, `dropMigrationsTable?`: boolean, `dropDb?`: boolean): Promise&#60;void>

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:68](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L68)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`wrap` | boolean | true |
`dropMigrationsTable` | boolean | false |
`dropDb` | boolean | false |

**Returns:** Promise&#60;void>

___

### dropTable

▸ `Private`**dropTable**(`name`: string): SchemaBuilder

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:330](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L330)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** SchemaBuilder

___

### dropTableColumn

▸ `Private`**dropTableColumn**(`table`: TableBuilder, `column`: [Column](../interfaces/column.md)): void

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:405](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L405)*

#### Parameters:

Name | Type |
------ | ------ |
`table` | TableBuilder |
`column` | [Column](../interfaces/column.md) |

**Returns:** void

___

### dump

▸ `Private`**dump**(`builder`: SchemaBuilder, `append?`: string): string

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:606](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L606)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`builder` | SchemaBuilder | - |
`append` | string | "

" |

**Returns:** string

___

### ensureDatabase

▸ **ensureDatabase**(): Promise&#60;void>

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:35](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L35)*

**Returns:** Promise&#60;void>

___

### execute

▸ **execute**(`sql`: string): Promise&#60;void>

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:144](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L144)*

#### Parameters:

Name | Type |
------ | ------ |
`sql` | string |

**Returns:** Promise&#60;void>

___

### findIndexDifference

▸ `Private`**findIndexDifference**(`meta`: EntityMetadata, `table`: [DatabaseTable](databasetable.md), `remove`: [Column](../interfaces/column.md)[]): object

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:519](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L519)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |
`table` | [DatabaseTable](databasetable.md) |
`remove` | [Column](../interfaces/column.md)[] |

**Returns:** object

Name | Type |
------ | ------ |
`addIndex` | [IndexDef](../interfaces/indexdef.md)[] |
`dropIndex` | [IndexDef](../interfaces/indexdef.md)[] |

___

### findRenamedColumns

▸ `Private`**findRenamedColumns**(`create`: EntityProperty[], `remove`: [Column](../interfaces/column.md)[]): { from: [Column](../interfaces/column.md) ; to: EntityProperty  }[]

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:493](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L493)*

#### Parameters:

Name | Type |
------ | ------ |
`create` | EntityProperty[] |
`remove` | [Column](../interfaces/column.md)[] |

**Returns:** { from: [Column](../interfaces/column.md) ; to: EntityProperty  }[]

___

### generate

▸ **generate**(): Promise&#60;string>

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:20](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L20)*

**Returns:** Promise&#60;string>

___

### getCreateSchemaSQL

▸ **getCreateSchemaSQL**(`wrap?`: boolean): Promise&#60;string>

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:46](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L46)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`wrap` | boolean | true |

**Returns:** Promise&#60;string>

___

### getDropSchemaSQL

▸ **getDropSchemaSQL**(`wrap?`: boolean, `dropMigrationsTable?`: boolean): Promise&#60;string>

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:78](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L78)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`wrap` | boolean | true |
`dropMigrationsTable` | boolean | false |

**Returns:** Promise&#60;string>

___

### getIndexName

▸ `Private`**getIndexName**&#60;T>(`meta`: EntityMetadata&#60;T>, `prop`: EntityProperty&#60;T>, `type`: &#34;unique&#34; \| &#34;index&#34;, `columnNames`: string[]): string

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:443](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L443)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata&#60;T> |
`prop` | EntityProperty&#60;T> |
`type` | &#34;unique&#34; \| &#34;index&#34; |
`columnNames` | string[] |

**Returns:** string

___

### getOrderedMetadata

▸ `Private`**getOrderedMetadata**(): EntityMetadata[]

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:574](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L574)*

**Returns:** EntityMetadata[]

___

### getUpdateSchemaSQL

▸ **getUpdateSchemaSQL**(`wrap?`: boolean, `safe?`: boolean, `dropTables?`: boolean): Promise&#60;string>

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:98](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L98)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`wrap` | boolean | true |
`safe` | boolean | false |
`dropTables` | boolean | true |

**Returns:** Promise&#60;string>

___

### getUpdateTableFKsSQL

▸ `Private`**getUpdateTableFKsSQL**(`meta`: EntityMetadata, `schema`: [DatabaseSchema](databaseschema.md)): string

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:162](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L162)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |
`schema` | [DatabaseSchema](databaseschema.md) |

**Returns:** string

___

### getUpdateTableIndexesSQL

▸ `Private`**getUpdateTableIndexesSQL**(`meta`: EntityMetadata, `schema`: [DatabaseSchema](databaseschema.md)): string

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:178](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L178)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |
`schema` | [DatabaseSchema](databaseschema.md) |

**Returns:** string

___

### getUpdateTableSQL

▸ `Private`**getUpdateTableSQL**(`meta`: EntityMetadata, `schema`: [DatabaseSchema](databaseschema.md), `safe`: boolean): string

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:152](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L152)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |
`schema` | [DatabaseSchema](databaseschema.md) |
`safe` | boolean |

**Returns:** string

___

### shouldHaveColumn

▸ `Private`**shouldHaveColumn**(`meta`: EntityMetadata, `prop`: EntityProperty, `update?`: boolean): boolean

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:340](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L340)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`meta` | EntityMetadata | - |
`prop` | EntityProperty | - |
`update` | boolean | false |

**Returns:** boolean

___

### updateSchema

▸ **updateSchema**(`wrap?`: boolean, `safe?`: boolean, `dropTables?`: boolean): Promise&#60;void>

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:93](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L93)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`wrap` | boolean | true |
`safe` | boolean | false |
`dropTables` | boolean | true |

**Returns:** Promise&#60;void>

___

### updateTable

▸ `Private`**updateTable**(`meta`: EntityMetadata, `table`: [DatabaseTable](databasetable.md), `safe`: boolean): SchemaBuilder[]

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:256](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L256)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |
`table` | [DatabaseTable](databasetable.md) |
`safe` | boolean |

**Returns:** SchemaBuilder[]

___

### updateTableColumn

▸ `Private`**updateTableColumn**(`table`: TableBuilder, `meta`: EntityMetadata, `prop`: EntityProperty, `column`: [Column](../interfaces/column.md), `diff`: [IsSame](../interfaces/issame.md)): void

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:387](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L387)*

#### Parameters:

Name | Type |
------ | ------ |
`table` | TableBuilder |
`meta` | EntityMetadata |
`prop` | EntityProperty |
`column` | [Column](../interfaces/column.md) |
`diff` | [IsSame](../interfaces/issame.md) |

**Returns:** void

___

### wrapSchema

▸ `Private`**wrapSchema**(`sql`: string, `wrap?`: boolean): Promise&#60;string>

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:214](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/SchemaGenerator.ts#L214)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`sql` | string | - |
`wrap` | boolean | true |

**Returns:** Promise&#60;string>
