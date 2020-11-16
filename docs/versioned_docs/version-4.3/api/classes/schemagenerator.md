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

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:16](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L16)*

#### Parameters:

Name | Type |
------ | ------ |
`em` | [SqlEntityManager](sqlentitymanager.md) |

**Returns:** [SchemaGenerator](schemagenerator.md)

## Properties

### config

• `Private` `Readonly` **config**: Configuration&#60;IDatabaseDriver&#60;Connection>> = this.em.config

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:10](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L10)*

___

### connection

• `Private` `Readonly` **connection**: [AbstractSqlConnection](abstractsqlconnection.md) = this.driver.getConnection()

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:15](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L15)*

___

### driver

• `Private` `Readonly` **driver**: [AbstractSqlDriver](abstractsqldriver.md)&#60;[AbstractSqlConnection](abstractsqlconnection.md)> = this.em.getDriver()

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:11](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L11)*

___

### em

• `Private` `Readonly` **em**: [SqlEntityManager](sqlentitymanager.md)

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:18](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L18)*

___

### helper

• `Private` `Readonly` **helper**: [SchemaHelper](schemahelper.md) = this.platform.getSchemaHelper()!

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:14](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L14)*

___

### knex

• `Private` `Readonly` **knex**: any = this.connection.getKnex()

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:16](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L16)*

___

### metadata

• `Private` `Readonly` **metadata**: MetadataStorage = this.em.getMetadata()

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:12](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L12)*

___

### platform

• `Private` `Readonly` **platform**: [AbstractSqlPlatform](abstractsqlplatform.md) = this.driver.getPlatform()

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:13](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L13)*

## Methods

### computeColumnDifference

▸ `Private`**computeColumnDifference**(`table`: [DatabaseTable](databasetable.md), `prop`: EntityProperty, `create`: EntityProperty[], `update`: { column: [Column](../interfaces/column.md) ; diff: [IsSame](../interfaces/issame.md) ; prop: EntityProperty  }[], `joinColumn?`: string, `idx?`: number): void

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:314](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L314)*

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

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:292](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L292)*

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

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:427](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L427)*

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

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:134](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L134)*

creates new database and connects to it

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** Promise&#60;void>

___

### createForeignKey

▸ `Private`**createForeignKey**(`table`: TableBuilder, `meta`: EntityMetadata, `prop`: EntityProperty, `createdColumns`: string[], `diff?`: [IsSame](../interfaces/issame.md)): void

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:466](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L466)*

#### Parameters:

Name | Type |
------ | ------ |
`table` | TableBuilder |
`meta` | EntityMetadata |
`prop` | EntityProperty |
`createdColumns` | string[] |
`diff?` | [IsSame](../interfaces/issame.md) |

**Returns:** void

___

### createForeignKeyReference

▸ `Private`**createForeignKeyReference**(`table`: TableBuilder, `prop`: EntityProperty): void

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:485](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L485)*

#### Parameters:

Name | Type |
------ | ------ |
`table` | TableBuilder |
`prop` | EntityProperty |

**Returns:** void

___

### createForeignKeys

▸ `Private`**createForeignKeys**(`table`: TableBuilder, `meta`: EntityMetadata, `props?`: EntityProperty[], `createdColumns?`: string[]): void

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:459](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L459)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`table` | TableBuilder | - |
`meta` | EntityMetadata | - |
`props?` | EntityProperty[] | - |
`createdColumns` | string[] | [] |

**Returns:** void

___

### createIndex

▸ `Private`**createIndex**(`table`: CreateTableBuilder, `meta`: EntityMetadata, `index`: { name?: string \| boolean ; properties: string \| string[] ; type?: string  }, `unique`: boolean): void

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:250](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L250)*

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

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:29](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L29)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`wrap` | boolean | true |

**Returns:** Promise&#60;void>

___

### createSimpleTableColumn

▸ `Private`**createSimpleTableColumn**(`table`: TableBuilder, `meta`: EntityMetadata, `prop`: EntityProperty, `alter?`: [IsSame](../interfaces/issame.md)): ColumnBuilder

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:375](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L375)*

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

▸ `Private`**createTable**(`meta`: EntityMetadata, `createdColumns`: string[]): SchemaBuilder

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:228](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L228)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |
`createdColumns` | string[] |

**Returns:** SchemaBuilder

___

### createTableColumn

▸ `Private`**createTableColumn**(`table`: TableBuilder, `meta`: EntityMetadata, `prop`: EntityProperty, `alter?`: [IsSame](../interfaces/issame.md)): ColumnBuilder[]

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:362](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L362)*

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

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:140](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L140)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** Promise&#60;void>

___

### dropSchema

▸ **dropSchema**(`wrap?`: boolean, `dropMigrationsTable?`: boolean, `dropDb?`: boolean): Promise&#60;void>

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:69](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L69)*

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

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:336](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L336)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** SchemaBuilder

___

### dropTableColumn

▸ `Private`**dropTableColumn**(`table`: TableBuilder, `column`: [Column](../interfaces/column.md)): void

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:411](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L411)*

#### Parameters:

Name | Type |
------ | ------ |
`table` | TableBuilder |
`column` | [Column](../interfaces/column.md) |

**Returns:** void

___

### dump

▸ `Private`**dump**(`builder`: SchemaBuilder, `append?`: string): string

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:601](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L601)*

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

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:35](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L35)*

**Returns:** Promise&#60;void>

___

### execute

▸ **execute**(`sql`: string): Promise&#60;void>

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:146](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L146)*

#### Parameters:

Name | Type |
------ | ------ |
`sql` | string |

**Returns:** Promise&#60;void>

___

### findIndexDifference

▸ `Private`**findIndexDifference**(`meta`: EntityMetadata, `table`: [DatabaseTable](databasetable.md), `remove`: [Column](../interfaces/column.md)[]): object

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:524](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L524)*

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

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:498](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L498)*

#### Parameters:

Name | Type |
------ | ------ |
`create` | EntityProperty[] |
`remove` | [Column](../interfaces/column.md)[] |

**Returns:** { from: [Column](../interfaces/column.md) ; to: EntityProperty  }[]

___

### generate

▸ **generate**(): Promise&#60;string>

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:20](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L20)*

**Returns:** Promise&#60;string>

___

### getCreateSchemaSQL

▸ **getCreateSchemaSQL**(`wrap?`: boolean): Promise&#60;string>

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:46](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L46)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`wrap` | boolean | true |

**Returns:** Promise&#60;string>

___

### getDropSchemaSQL

▸ **getDropSchemaSQL**(`wrap?`: boolean, `dropMigrationsTable?`: boolean): Promise&#60;string>

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:79](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L79)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`wrap` | boolean | true |
`dropMigrationsTable` | boolean | false |

**Returns:** Promise&#60;string>

___

### getIndexName

▸ `Private`**getIndexName**&#60;T>(`meta`: EntityMetadata&#60;T>, `prop`: EntityProperty&#60;T>, `type`: &#34;unique&#34; \| &#34;index&#34;, `columnNames`: string[]): string

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:449](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L449)*

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

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:581](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L581)*

**Returns:** EntityMetadata[]

___

### getUpdateSchemaSQL

▸ **getUpdateSchemaSQL**(`wrap?`: boolean, `safe?`: boolean, `dropTables?`: boolean): Promise&#60;string>

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:99](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L99)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`wrap` | boolean | true |
`safe` | boolean | false |
`dropTables` | boolean | true |

**Returns:** Promise&#60;string>

___

### getUpdateTableFKsSQL

▸ `Private`**getUpdateTableFKsSQL**(`meta`: EntityMetadata, `schema`: [DatabaseSchema](databaseschema.md), `createdColumns`: string[]): string

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:164](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L164)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |
`schema` | [DatabaseSchema](databaseschema.md) |
`createdColumns` | string[] |

**Returns:** string

___

### getUpdateTableIndexesSQL

▸ `Private`**getUpdateTableIndexesSQL**(`meta`: EntityMetadata, `schema`: [DatabaseSchema](databaseschema.md)): string

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:180](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L180)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |
`schema` | [DatabaseSchema](databaseschema.md) |

**Returns:** string

___

### getUpdateTableSQL

▸ `Private`**getUpdateTableSQL**(`meta`: EntityMetadata, `schema`: [DatabaseSchema](databaseschema.md), `safe`: boolean, `createdColumns`: string[]): string

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:154](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L154)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |
`schema` | [DatabaseSchema](databaseschema.md) |
`safe` | boolean |
`createdColumns` | string[] |

**Returns:** string

___

### shouldHaveColumn

▸ `Private`**shouldHaveColumn**(`meta`: EntityMetadata, `prop`: EntityProperty, `update?`: boolean): boolean

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:346](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L346)*

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

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:94](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L94)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`wrap` | boolean | true |
`safe` | boolean | false |
`dropTables` | boolean | true |

**Returns:** Promise&#60;void>

___

### updateTable

▸ `Private`**updateTable**(`meta`: EntityMetadata, `table`: [DatabaseTable](databasetable.md), `safe`: boolean, `createdColumns`: string[]): SchemaBuilder[]

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:261](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L261)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |
`table` | [DatabaseTable](databasetable.md) |
`safe` | boolean |
`createdColumns` | string[] |

**Returns:** SchemaBuilder[]

___

### updateTableColumn

▸ `Private`**updateTableColumn**(`table`: TableBuilder, `meta`: EntityMetadata, `prop`: EntityProperty, `column`: [Column](../interfaces/column.md), `diff`: [IsSame](../interfaces/issame.md), `createdColumns`: string[]): void

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:393](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L393)*

#### Parameters:

Name | Type |
------ | ------ |
`table` | TableBuilder |
`meta` | EntityMetadata |
`prop` | EntityProperty |
`column` | [Column](../interfaces/column.md) |
`diff` | [IsSame](../interfaces/issame.md) |
`createdColumns` | string[] |

**Returns:** void

___

### wrapSchema

▸ `Private`**wrapSchema**(`sql`: string, `wrap?`: boolean): Promise&#60;string>

*Defined in [packages/knex/src/schema/SchemaGenerator.ts:216](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/SchemaGenerator.ts#L216)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`sql` | string | - |
`wrap` | boolean | true |

**Returns:** Promise&#60;string>
