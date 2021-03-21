---
id: "migrations.migrationstorage"
title: "Class: MigrationStorage"
sidebar_label: "MigrationStorage"
custom_edit_url: null
hide_title: true
---

# Class: MigrationStorage

[migrations](../modules/migrations.md).MigrationStorage

## Constructors

### constructor

\+ **new MigrationStorage**(`driver`: [*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>, `options`: [*MigrationsOptions*](../modules/core.md#migrationsoptions)): [*MigrationStorage*](migrations.migrationstorage.md)

#### Parameters:

Name | Type |
:------ | :------ |
`driver` | [*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\> |
`options` | [*MigrationsOptions*](../modules/core.md#migrationsoptions) |

**Returns:** [*MigrationStorage*](migrations.migrationstorage.md)

Defined in: [packages/migrations/src/MigrationStorage.ts:10](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/migrations/src/MigrationStorage.ts#L10)

## Properties

### connection

• `Private` `Readonly` **connection**: [*AbstractSqlConnection*](knex.abstractsqlconnection.md)

Defined in: [packages/migrations/src/MigrationStorage.ts:7](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/migrations/src/MigrationStorage.ts#L7)

___

### driver

• `Protected` `Readonly` **driver**: [*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>

___

### helper

• `Private` `Readonly` **helper**: [*SchemaHelper*](knex.schemahelper.md)

Defined in: [packages/migrations/src/MigrationStorage.ts:9](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/migrations/src/MigrationStorage.ts#L9)

___

### knex

• `Private` `Readonly` **knex**: *Knex*<any, unknown[]\>

Defined in: [packages/migrations/src/MigrationStorage.ts:8](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/migrations/src/MigrationStorage.ts#L8)

___

### masterTransaction

• `Private` `Optional` **masterTransaction**: *any*

Defined in: [packages/migrations/src/MigrationStorage.ts:10](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/migrations/src/MigrationStorage.ts#L10)

___

### options

• `Protected` `Readonly` **options**: [*MigrationsOptions*](../modules/core.md#migrationsoptions)

## Methods

### ensureTable

▸ **ensureTable**(): *Promise*<void\>

**Returns:** *Promise*<void\>

Defined in: [packages/migrations/src/MigrationStorage.ts:38](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/migrations/src/MigrationStorage.ts#L38)

___

### executed

▸ **executed**(): *Promise*<string[]\>

**Returns:** *Promise*<string[]\>

Defined in: [packages/migrations/src/MigrationStorage.ts:15](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/migrations/src/MigrationStorage.ts#L15)

___

### getExecutedMigrations

▸ **getExecutedMigrations**(): *Promise*<[*MigrationRow*](../modules/migrations.md#migrationrow)[]\>

**Returns:** *Promise*<[*MigrationRow*](../modules/migrations.md#migrationrow)[]\>

Defined in: [packages/migrations/src/MigrationStorage.ts:28](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/migrations/src/MigrationStorage.ts#L28)

___

### logMigration

▸ **logMigration**(`name`: *string*): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* |

**Returns:** *Promise*<void\>

Defined in: [packages/migrations/src/MigrationStorage.ts:20](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/migrations/src/MigrationStorage.ts#L20)

___

### setMasterMigration

▸ **setMasterMigration**(`trx`: *any*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`trx` | *any* |

**Returns:** *void*

Defined in: [packages/migrations/src/MigrationStorage.ts:52](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/migrations/src/MigrationStorage.ts#L52)

___

### unlogMigration

▸ **unlogMigration**(`name`: *string*): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* |

**Returns:** *Promise*<void\>

Defined in: [packages/migrations/src/MigrationStorage.ts:24](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/migrations/src/MigrationStorage.ts#L24)

___

### unsetMasterMigration

▸ **unsetMasterMigration**(): *void*

**Returns:** *void*

Defined in: [packages/migrations/src/MigrationStorage.ts:56](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/migrations/src/MigrationStorage.ts#L56)
