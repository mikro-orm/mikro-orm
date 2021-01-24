---
id: "migrations.migrationgenerator"
title: "Class: MigrationGenerator"
sidebar_label: "MigrationGenerator"
hide_title: true
---

# Class: MigrationGenerator

[migrations](../modules/migrations.md).MigrationGenerator

## Hierarchy

* **MigrationGenerator**

## Constructors

### constructor

\+ **new MigrationGenerator**(`driver`: [*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>, `namingStrategy`: [*NamingStrategy*](../interfaces/core.namingstrategy.md), `options`: [*MigrationsOptions*](../modules/core.md#migrationsoptions)): [*MigrationGenerator*](migrations.migrationgenerator.md)

#### Parameters:

Name | Type |
------ | ------ |
`driver` | [*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\> |
`namingStrategy` | [*NamingStrategy*](../interfaces/core.namingstrategy.md) |
`options` | [*MigrationsOptions*](../modules/core.md#migrationsoptions) |

**Returns:** [*MigrationGenerator*](migrations.migrationgenerator.md)

Defined in: [packages/migrations/src/MigrationGenerator.ts:5](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/MigrationGenerator.ts#L5)

## Properties

### driver

• `Protected` `Readonly` **driver**: [*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>

___

### namingStrategy

• `Protected` `Readonly` **namingStrategy**: [*NamingStrategy*](../interfaces/core.namingstrategy.md)

___

### options

• `Protected` `Readonly` **options**: [*MigrationsOptions*](../modules/core.md#migrationsoptions)

## Methods

### createStatement

▸ **createStatement**(`sql`: *string*, `padLeft`: *number*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`sql` | *string* |
`padLeft` | *number* |

**Returns:** *string*

Defined in: [packages/migrations/src/MigrationGenerator.ts:30](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/MigrationGenerator.ts#L30)

___

### generate

▸ **generate**(`diff`: *string*[], `path?`: *string*): *Promise*<[*string*, *string*]\>

#### Parameters:

Name | Type |
------ | ------ |
`diff` | *string*[] |
`path?` | *string* |

**Returns:** *Promise*<[*string*, *string*]\>

Defined in: [packages/migrations/src/MigrationGenerator.ts:11](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/MigrationGenerator.ts#L11)

___

### generateJSMigrationFile

▸ **generateJSMigrationFile**(`className`: *string*, `diff`: *string*[]): *string*

#### Parameters:

Name | Type |
------ | ------ |
`className` | *string* |
`diff` | *string*[] |

**Returns:** *string*

Defined in: [packages/migrations/src/MigrationGenerator.ts:39](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/MigrationGenerator.ts#L39)

___

### generateTSMigrationFile

▸ **generateTSMigrationFile**(`className`: *string*, `diff`: *string*[]): *string*

#### Parameters:

Name | Type |
------ | ------ |
`className` | *string* |
`diff` | *string*[] |

**Returns:** *string*

Defined in: [packages/migrations/src/MigrationGenerator.ts:53](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/migrations/src/MigrationGenerator.ts#L53)
