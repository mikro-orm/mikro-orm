---
id: "migrations"
title: "Module: migrations"
sidebar_label: "migrations"
hide_title: true
---

# Module: migrations

## Table of contents

### Classes

- [Migration](../classes/migrations.migration.md)
- [MigrationGenerator](../classes/migrations.migrationgenerator.md)
- [MigrationRunner](../classes/migrations.migrationrunner.md)
- [MigrationStorage](../classes/migrations.migrationstorage.md)
- [Migrator](../classes/migrations.migrator.md)

## Type aliases

### MigrateOptions

Ƭ **MigrateOptions**: { `from?`: *string* \| *number* ; `migrations?`: *string*[] ; `to?`: *string* \| *number* ; `transaction?`: [*Transaction*](core.md#transaction)  }

#### Type declaration:

Name | Type |
------ | ------ |
`from?` | *string* \| *number* |
`migrations?` | *string*[] |
`to?` | *string* \| *number* |
`transaction?` | [*Transaction*](core.md#transaction) |

Defined in: [packages/migrations/src/typings.ts:4](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/typings.ts#L4)

___

### MigrationResult

Ƭ **MigrationResult**: { `code`: *string* ; `diff`: *string*[] ; `fileName`: *string*  }

#### Type declaration:

Name | Type |
------ | ------ |
`code` | *string* |
`diff` | *string*[] |
`fileName` | *string* |

Defined in: [packages/migrations/src/typings.ts:5](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/typings.ts#L5)

___

### MigrationRow

Ƭ **MigrationRow**: { `executed_at`: Date ; `name`: *string*  }

#### Type declaration:

Name | Type |
------ | ------ |
`executed_at` | Date |
`name` | *string* |

Defined in: [packages/migrations/src/typings.ts:6](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/typings.ts#L6)

___

### Query

Ƭ **Query**: *string* \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md) \| [*Raw*](../interfaces/knex.knex.raw.md)

Defined in: [packages/migrations/src/Migration.ts:4](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/Migration.ts#L4)

___

### UmzugMigration

Ƭ **UmzugMigration**: { `file`: *string* ; `name?`: *string* ; `path?`: *string*  }

#### Type declaration:

Name | Type |
------ | ------ |
`file` | *string* |
`name?` | *string* |
`path?` | *string* |

Defined in: [packages/migrations/src/typings.ts:3](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/typings.ts#L3)
