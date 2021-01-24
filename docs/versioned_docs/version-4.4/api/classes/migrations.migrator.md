---
id: "migrations.migrator"
title: "Class: Migrator"
sidebar_label: "Migrator"
hide_title: true
---

# Class: Migrator

[migrations](../modules/migrations.md).Migrator

## Hierarchy

* **Migrator**

## Constructors

### constructor

\+ **new Migrator**(`em`: [*EntityManager*](knex.entitymanager.md)<[*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>\>): [*Migrator*](migrations.migrator.md)

#### Parameters:

Name | Type |
------ | ------ |
`em` | [*EntityManager*](knex.entitymanager.md)<[*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>\> |

**Returns:** [*Migrator*](migrations.migrator.md)

Defined in: [packages/migrations/src/Migrator.ts:20](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migrator.ts#L20)

## Properties

### config

• `Private` `Readonly` **config**: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

Defined in: [packages/migrations/src/Migrator.ts:16](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migrator.ts#L16)

___

### driver

• `Private` `Readonly` **driver**: [*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>

Defined in: [packages/migrations/src/Migrator.ts:14](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migrator.ts#L14)

___

### generator

• `Private` `Readonly` **generator**: [*MigrationGenerator*](migrations.migrationgenerator.md)

Defined in: [packages/migrations/src/Migrator.ts:19](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migrator.ts#L19)

___

### options

• `Private` `Readonly` **options**: [*MigrationsOptions*](../modules/core.md#migrationsoptions)

Defined in: [packages/migrations/src/Migrator.ts:17](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migrator.ts#L17)

___

### runner

• `Private` `Readonly` **runner**: [*MigrationRunner*](migrations.migrationrunner.md)

Defined in: [packages/migrations/src/Migrator.ts:18](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migrator.ts#L18)

___

### schemaGenerator

• `Private` `Readonly` **schemaGenerator**: [*SchemaGenerator*](knex.schemagenerator.md)

Defined in: [packages/migrations/src/Migrator.ts:15](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migrator.ts#L15)

___

### storage

• `Private` `Readonly` **storage**: [*MigrationStorage*](migrations.migrationstorage.md)

Defined in: [packages/migrations/src/Migrator.ts:20](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migrator.ts#L20)

___

### umzug

• `Private` `Readonly` **umzug**: *Umzug*

Defined in: [packages/migrations/src/Migrator.ts:13](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migrator.ts#L13)

## Methods

### createInitialMigration

▸ **createInitialMigration**(`path?`: *string*): *Promise*<[*MigrationResult*](../modules/migrations.md#migrationresult)\>

#### Parameters:

Name | Type |
------ | ------ |
`path?` | *string* |

**Returns:** *Promise*<[*MigrationResult*](../modules/migrations.md#migrationresult)\>

Defined in: [packages/migrations/src/Migrator.ts:62](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migrator.ts#L62)

___

### createMigration

▸ **createMigration**(`path?`: *string*, `blank?`: *boolean*, `initial?`: *boolean*): *Promise*<[*MigrationResult*](../modules/migrations.md#migrationresult)\>

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`path?` | *string* | - |
`blank` | *boolean* | false |
`initial` | *boolean* | false |

**Returns:** *Promise*<[*MigrationResult*](../modules/migrations.md#migrationresult)\>

Defined in: [packages/migrations/src/Migrator.ts:41](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migrator.ts#L41)

___

### down

▸ **down**(`options?`: *string* \| *string*[] \| [*MigrateOptions*](../modules/migrations.md#migrateoptions)): *Promise*<[*UmzugMigration*](../modules/migrations.md#umzugmigration)[]\>

#### Parameters:

Name | Type |
------ | ------ |
`options?` | *string* \| *string*[] \| [*MigrateOptions*](../modules/migrations.md#migrateoptions) |

**Returns:** *Promise*<[*UmzugMigration*](../modules/migrations.md#umzugmigration)[]\>

Defined in: [packages/migrations/src/Migrator.ts:139](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migrator.ts#L139)

___

### ensureMigrationsDirExists

▸ `Private`**ensureMigrationsDirExists**(): *Promise*<*void*\>

**Returns:** *Promise*<*void*\>

Defined in: [packages/migrations/src/Migrator.ts:239](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migrator.ts#L239)

___

### getExecutedMigrations

▸ **getExecutedMigrations**(): *Promise*<[*MigrationRow*](../modules/migrations.md#migrationrow)[]\>

**Returns:** *Promise*<[*MigrationRow*](../modules/migrations.md#migrationrow)[]\>

Defined in: [packages/migrations/src/Migrator.ts:123](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migrator.ts#L123)

___

### getPendingMigrations

▸ **getPendingMigrations**(): *Promise*<[*UmzugMigration*](../modules/migrations.md#umzugmigration)[]\>

**Returns:** *Promise*<[*UmzugMigration*](../modules/migrations.md#umzugmigration)[]\>

Defined in: [packages/migrations/src/Migrator.ts:129](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migrator.ts#L129)

___

### getSchemaDiff

▸ `Private`**getSchemaDiff**(`blank`: *boolean*, `initial`: *boolean*): *Promise*<*string*[]\>

#### Parameters:

Name | Type |
------ | ------ |
`blank` | *boolean* |
`initial` | *boolean* |

**Returns:** *Promise*<*string*[]\>

Defined in: [packages/migrations/src/Migrator.ts:165](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migrator.ts#L165)

___

### getStorage

▸ **getStorage**(): [*MigrationStorage*](migrations.migrationstorage.md)

**Returns:** [*MigrationStorage*](migrations.migrationstorage.md)

Defined in: [packages/migrations/src/Migrator.ts:143](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migrator.ts#L143)

___

### initialize

▸ `Protected`**initialize**(`MigrationClass`: [*Constructor*](../modules/core.md#constructor)<[*Migration*](migrations.migration.md)\>, `name?`: *string*): *object*

#### Parameters:

Name | Type |
------ | ------ |
`MigrationClass` | [*Constructor*](../modules/core.md#constructor)<[*Migration*](migrations.migration.md)\> |
`name?` | *string* |

**Returns:** *object*

Name | Type |
------ | ------ |
`down` | () => *Promise*<*void*\> |
`name` | *undefined* \| *string* |
`up` | () => *Promise*<*void*\> |

Defined in: [packages/migrations/src/Migrator.ts:155](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migrator.ts#L155)

___

### prefix

▸ `Private`**prefix**<T\>(`options?`: T): T

#### Type parameters:

Name | Type |
------ | ------ |
`T` | *string* \| *string*[] \| { `from?`: *undefined* \| *string* ; `migrations?`: *undefined* \| *string*[] ; `to?`: *undefined* \| *string* ; `transaction?`: *any*  } |

#### Parameters:

Name | Type |
------ | ------ |
`options?` | T |

**Returns:** T

Defined in: [packages/migrations/src/Migrator.ts:189](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migrator.ts#L189)

___

### resolve

▸ `Protected`**resolve**(`file`: *string*): *object*

#### Parameters:

Name | Type |
------ | ------ |
`file` | *string* |

**Returns:** *object*

Name | Type |
------ | ------ |
`down` | () => *Promise*<*void*\> |
`name` | *undefined* \| *string* |
`up` | () => *Promise*<*void*\> |

Defined in: [packages/migrations/src/Migrator.ts:147](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migrator.ts#L147)

___

### runInTransaction

▸ `Private`**runInTransaction**(`trx`: *any*, `method`: *up* \| *down*, `options`: *undefined* \| *string* \| *string*[] \| [*MigrateOptions*](../modules/migrations.md#migrateoptions)): *Promise*<Migration[]\>

#### Parameters:

Name | Type |
------ | ------ |
`trx` | *any* |
`method` | *up* \| *down* |
`options` | *undefined* \| *string* \| *string*[] \| [*MigrateOptions*](../modules/migrations.md#migrateoptions) |

**Returns:** *Promise*<Migration[]\>

Defined in: [packages/migrations/src/Migrator.ts:229](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migrator.ts#L229)

___

### runMigrations

▸ `Private`**runMigrations**(`method`: *up* \| *down*, `options?`: *string* \| *string*[] \| [*MigrateOptions*](../modules/migrations.md#migrateoptions)): *Promise*<Migration[]\>

#### Parameters:

Name | Type |
------ | ------ |
`method` | *up* \| *down* |
`options?` | *string* \| *string*[] \| [*MigrateOptions*](../modules/migrations.md#migrateoptions) |

**Returns:** *Promise*<Migration[]\>

Defined in: [packages/migrations/src/Migrator.ts:214](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migrator.ts#L214)

___

### up

▸ **up**(`options?`: *string* \| *string*[] \| [*MigrateOptions*](../modules/migrations.md#migrateoptions)): *Promise*<[*UmzugMigration*](../modules/migrations.md#umzugmigration)[]\>

#### Parameters:

Name | Type |
------ | ------ |
`options?` | *string* \| *string*[] \| [*MigrateOptions*](../modules/migrations.md#migrateoptions) |

**Returns:** *Promise*<[*UmzugMigration*](../modules/migrations.md#umzugmigration)[]\>

Defined in: [packages/migrations/src/Migrator.ts:135](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migrator.ts#L135)

___

### validateInitialMigration

▸ `Private`**validateInitialMigration**(): *Promise*<*boolean*\>

Initial migration can be created only if:
1. no previous migrations were generated or executed
2. existing schema do not contain any of the tables defined by metadata

If existing schema contains all of the tables already, we return true, based on that we mark the migration as already executed.
If only some of the tables are present, exception is thrown.

**Returns:** *Promise*<*boolean*\>

Defined in: [packages/migrations/src/Migrator.ts:87](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migrator.ts#L87)
