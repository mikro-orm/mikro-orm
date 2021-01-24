---
id: "migrations.migrationrunner"
title: "Class: MigrationRunner"
sidebar_label: "MigrationRunner"
hide_title: true
---

# Class: MigrationRunner

[migrations](../modules/migrations.md).MigrationRunner

## Hierarchy

* **MigrationRunner**

## Constructors

### constructor

\+ **new MigrationRunner**(`driver`: [*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>, `options`: [*MigrationsOptions*](../modules/core.md#migrationsoptions), `config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>): [*MigrationRunner*](migrations.migrationrunner.md)

#### Parameters:

Name | Type |
------ | ------ |
`driver` | [*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\> |
`options` | [*MigrationsOptions*](../modules/core.md#migrationsoptions) |
`config` | [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |

**Returns:** [*MigrationRunner*](migrations.migrationrunner.md)

Defined in: [packages/migrations/src/MigrationRunner.ts:9](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/MigrationRunner.ts#L9)

## Properties

### config

• `Protected` `Readonly` **config**: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

___

### connection

• `Private` `Readonly` **connection**: [*AbstractSqlConnection*](knex.abstractsqlconnection.md)

Defined in: [packages/migrations/src/MigrationRunner.ts:7](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/MigrationRunner.ts#L7)

___

### driver

• `Protected` `Readonly` **driver**: [*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>

___

### helper

• `Private` `Readonly` **helper**: [*SchemaHelper*](knex.schemahelper.md)

Defined in: [packages/migrations/src/MigrationRunner.ts:8](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/MigrationRunner.ts#L8)

___

### masterTransaction

• `Private` `Optional` **masterTransaction**: *any*

Defined in: [packages/migrations/src/MigrationRunner.ts:9](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/MigrationRunner.ts#L9)

___

### options

• `Protected` `Readonly` **options**: [*MigrationsOptions*](../modules/core.md#migrationsoptions)

## Methods

### getQueries

▸ `Private`**getQueries**(`migration`: [*Migration*](migrations.migration.md), `method`: *up* \| *down*): *Promise*<[*Query*](../modules/migrations.md#query)[]\>

#### Parameters:

Name | Type |
------ | ------ |
`migration` | [*Migration*](migrations.migration.md) |
`method` | *up* \| *down* |

**Returns:** *Promise*<[*Query*](../modules/migrations.md#query)[]\>

Defined in: [packages/migrations/src/MigrationRunner.ts:38](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/MigrationRunner.ts#L38)

___

### run

▸ **run**(`migration`: [*Migration*](migrations.migration.md), `method`: *up* \| *down*): *Promise*<*void*\>

#### Parameters:

Name | Type |
------ | ------ |
`migration` | [*Migration*](migrations.migration.md) |
`method` | *up* \| *down* |

**Returns:** *Promise*<*void*\>

Defined in: [packages/migrations/src/MigrationRunner.ts:15](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/MigrationRunner.ts#L15)

___

### setMasterMigration

▸ **setMasterMigration**(`trx`: *any*): *void*

#### Parameters:

Name | Type |
------ | ------ |
`trx` | *any* |

**Returns:** *void*

Defined in: [packages/migrations/src/MigrationRunner.ts:30](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/MigrationRunner.ts#L30)

___

### unsetMasterMigration

▸ **unsetMasterMigration**(): *void*

**Returns:** *void*

Defined in: [packages/migrations/src/MigrationRunner.ts:34](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/MigrationRunner.ts#L34)
