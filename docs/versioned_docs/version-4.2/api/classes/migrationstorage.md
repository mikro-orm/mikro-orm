---
id: "migrationstorage"
title: "Class: MigrationStorage"
sidebar_label: "MigrationStorage"
---

## Hierarchy

* **MigrationStorage**

## Constructors

### constructor

\+ **new MigrationStorage**(`driver`: AbstractSqlDriver, `options`: [MigrationsOptions](../index.md#migrationsoptions)): [MigrationStorage](migrationstorage.md)

*Defined in [packages/migrations/src/MigrationStorage.ts:10](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/MigrationStorage.ts#L10)*

#### Parameters:

Name | Type |
------ | ------ |
`driver` | AbstractSqlDriver |
`options` | [MigrationsOptions](../index.md#migrationsoptions) |

**Returns:** [MigrationStorage](migrationstorage.md)

## Properties

### connection

• `Private` `Readonly` **connection**: AbstractSqlConnection = this.driver.getConnection()

*Defined in [packages/migrations/src/MigrationStorage.ts:7](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/MigrationStorage.ts#L7)*

___

### driver

• `Protected` `Readonly` **driver**: AbstractSqlDriver

*Defined in [packages/migrations/src/MigrationStorage.ts:12](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/MigrationStorage.ts#L12)*

___

### helper

• `Private` `Readonly` **helper**: SchemaHelper = this.driver.getPlatform().getSchemaHelper()!

*Defined in [packages/migrations/src/MigrationStorage.ts:9](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/MigrationStorage.ts#L9)*

___

### knex

• `Private` `Readonly` **knex**: any = this.connection.getKnex()

*Defined in [packages/migrations/src/MigrationStorage.ts:8](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/MigrationStorage.ts#L8)*

___

### masterTransaction

• `Private` `Optional` **masterTransaction**: [Transaction](../index.md#transaction)

*Defined in [packages/migrations/src/MigrationStorage.ts:10](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/MigrationStorage.ts#L10)*

___

### options

• `Protected` `Readonly` **options**: [MigrationsOptions](../index.md#migrationsoptions)

*Defined in [packages/migrations/src/MigrationStorage.ts:13](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/MigrationStorage.ts#L13)*

## Methods

### ensureTable

▸ **ensureTable**(): Promise&#60;void>

*Defined in [packages/migrations/src/MigrationStorage.ts:38](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/MigrationStorage.ts#L38)*

**Returns:** Promise&#60;void>

___

### executed

▸ **executed**(): Promise&#60;string[]>

*Defined in [packages/migrations/src/MigrationStorage.ts:15](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/MigrationStorage.ts#L15)*

**Returns:** Promise&#60;string[]>

___

### getExecutedMigrations

▸ **getExecutedMigrations**(): Promise&#60;[MigrationRow](../index.md#migrationrow)[]>

*Defined in [packages/migrations/src/MigrationStorage.ts:28](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/MigrationStorage.ts#L28)*

**Returns:** Promise&#60;[MigrationRow](../index.md#migrationrow)[]>

___

### logMigration

▸ **logMigration**(`name`: string): Promise&#60;void>

*Defined in [packages/migrations/src/MigrationStorage.ts:20](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/MigrationStorage.ts#L20)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** Promise&#60;void>

___

### setMasterMigration

▸ **setMasterMigration**(`trx`: [Transaction](../index.md#transaction)): void

*Defined in [packages/migrations/src/MigrationStorage.ts:52](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/MigrationStorage.ts#L52)*

#### Parameters:

Name | Type |
------ | ------ |
`trx` | [Transaction](../index.md#transaction) |

**Returns:** void

___

### unlogMigration

▸ **unlogMigration**(`name`: string): Promise&#60;void>

*Defined in [packages/migrations/src/MigrationStorage.ts:24](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/MigrationStorage.ts#L24)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** Promise&#60;void>

___

### unsetMasterMigration

▸ **unsetMasterMigration**(): void

*Defined in [packages/migrations/src/MigrationStorage.ts:56](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/MigrationStorage.ts#L56)*

**Returns:** void
