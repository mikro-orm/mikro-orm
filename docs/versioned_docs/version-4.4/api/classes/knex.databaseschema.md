---
id: "knex.databaseschema"
title: "Class: DatabaseSchema"
sidebar_label: "DatabaseSchema"
hide_title: true
---

# Class: DatabaseSchema

[knex](../modules/knex.md).DatabaseSchema

## Hierarchy

* **DatabaseSchema**

## Constructors

### constructor

\+ **new DatabaseSchema**(): [*DatabaseSchema*](knex.databaseschema.md)

**Returns:** [*DatabaseSchema*](knex.databaseschema.md)

## Properties

### tables

• `Private` `Readonly` **tables**: [*DatabaseTable*](knex.databasetable.md)[]

Defined in: [packages/knex/src/schema/DatabaseSchema.ts:9](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/DatabaseSchema.ts#L9)

## Methods

### addTable

▸ **addTable**(`name`: *string*, `schema`: *undefined* \| *null* \| *string*): [*DatabaseTable*](knex.databasetable.md)

#### Parameters:

Name | Type |
------ | ------ |
`name` | *string* |
`schema` | *undefined* \| *null* \| *string* |

**Returns:** [*DatabaseTable*](knex.databasetable.md)

Defined in: [packages/knex/src/schema/DatabaseSchema.ts:11](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/DatabaseSchema.ts#L11)

___

### getTable

▸ **getTable**(`name`: *string*): *undefined* \| [*DatabaseTable*](knex.databasetable.md)

#### Parameters:

Name | Type |
------ | ------ |
`name` | *string* |

**Returns:** *undefined* \| [*DatabaseTable*](knex.databasetable.md)

Defined in: [packages/knex/src/schema/DatabaseSchema.ts:22](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/DatabaseSchema.ts#L22)

___

### getTables

▸ **getTables**(): [*DatabaseTable*](knex.databasetable.md)[]

**Returns:** [*DatabaseTable*](knex.databasetable.md)[]

Defined in: [packages/knex/src/schema/DatabaseSchema.ts:18](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/DatabaseSchema.ts#L18)

___

### create

▸ `Static`**create**(`connection`: [*AbstractSqlConnection*](knex.abstractsqlconnection.md), `helper`: [*SchemaHelper*](knex.schemahelper.md), `config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>): *Promise*<[*DatabaseSchema*](knex.databaseschema.md)\>

#### Parameters:

Name | Type |
------ | ------ |
`connection` | [*AbstractSqlConnection*](knex.abstractsqlconnection.md) |
`helper` | [*SchemaHelper*](knex.schemahelper.md) |
`config` | [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |

**Returns:** *Promise*<[*DatabaseSchema*](knex.databaseschema.md)\>

Defined in: [packages/knex/src/schema/DatabaseSchema.ts:26](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/DatabaseSchema.ts#L26)
