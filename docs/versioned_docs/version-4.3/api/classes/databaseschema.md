---
id: "databaseschema"
title: "Class: DatabaseSchema"
sidebar_label: "DatabaseSchema"
---

## Hierarchy

* **DatabaseSchema**

## Properties

### tables

• `Private` `Readonly` **tables**: [DatabaseTable](databasetable.md)[] = []

*Defined in [packages/knex/src/schema/DatabaseSchema.ts:9](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/DatabaseSchema.ts#L9)*

## Methods

### addTable

▸ **addTable**(`name`: string, `schema`: string \| undefined): [DatabaseTable](databasetable.md)

*Defined in [packages/knex/src/schema/DatabaseSchema.ts:11](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/DatabaseSchema.ts#L11)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |
`schema` | string \| undefined |

**Returns:** [DatabaseTable](databasetable.md)

___

### getTable

▸ **getTable**(`name`: string): [DatabaseTable](databasetable.md) \| undefined

*Defined in [packages/knex/src/schema/DatabaseSchema.ts:22](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/DatabaseSchema.ts#L22)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** [DatabaseTable](databasetable.md) \| undefined

___

### getTables

▸ **getTables**(): [DatabaseTable](databasetable.md)[]

*Defined in [packages/knex/src/schema/DatabaseSchema.ts:18](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/DatabaseSchema.ts#L18)*

**Returns:** [DatabaseTable](databasetable.md)[]

___

### create

▸ `Static`**create**(`connection`: [AbstractSqlConnection](abstractsqlconnection.md), `helper`: [SchemaHelper](schemahelper.md), `config`: Configuration): Promise&#60;[DatabaseSchema](databaseschema.md)>

*Defined in [packages/knex/src/schema/DatabaseSchema.ts:26](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/schema/DatabaseSchema.ts#L26)*

#### Parameters:

Name | Type |
------ | ------ |
`connection` | [AbstractSqlConnection](abstractsqlconnection.md) |
`helper` | [SchemaHelper](schemahelper.md) |
`config` | Configuration |

**Returns:** Promise&#60;[DatabaseSchema](databaseschema.md)>
