---
id: "migrationrunner"
title: "Class: MigrationRunner"
sidebar_label: "MigrationRunner"
---

## Hierarchy

* **MigrationRunner**

## Constructors

### constructor

\+ **new MigrationRunner**(`driver`: AbstractSqlDriver, `options`: [MigrationsOptions](../index.md#migrationsoptions), `config`: Configuration): [MigrationRunner](migrationrunner.md)

*Defined in [packages/migrations/src/MigrationRunner.ts:9](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/MigrationRunner.ts#L9)*

#### Parameters:

Name | Type |
------ | ------ |
`driver` | AbstractSqlDriver |
`options` | [MigrationsOptions](../index.md#migrationsoptions) |
`config` | Configuration |

**Returns:** [MigrationRunner](migrationrunner.md)

## Properties

### config

• `Protected` `Readonly` **config**: Configuration

*Defined in [packages/migrations/src/MigrationRunner.ts:13](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/MigrationRunner.ts#L13)*

___

### connection

• `Private` `Readonly` **connection**: AbstractSqlConnection = this.driver.getConnection()

*Defined in [packages/migrations/src/MigrationRunner.ts:7](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/MigrationRunner.ts#L7)*

___

### driver

• `Protected` `Readonly` **driver**: AbstractSqlDriver

*Defined in [packages/migrations/src/MigrationRunner.ts:11](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/MigrationRunner.ts#L11)*

___

### helper

• `Private` `Readonly` **helper**: SchemaHelper = this.driver.getPlatform().getSchemaHelper()!

*Defined in [packages/migrations/src/MigrationRunner.ts:8](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/MigrationRunner.ts#L8)*

___

### masterTransaction

• `Private` `Optional` **masterTransaction**: [Transaction](../index.md#transaction)

*Defined in [packages/migrations/src/MigrationRunner.ts:9](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/MigrationRunner.ts#L9)*

___

### options

• `Protected` `Readonly` **options**: [MigrationsOptions](../index.md#migrationsoptions)

*Defined in [packages/migrations/src/MigrationRunner.ts:12](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/MigrationRunner.ts#L12)*

## Methods

### getQueries

▸ `Private`**getQueries**(`migration`: Migration, `method`: &#34;up&#34; \| &#34;down&#34;): Promise&#60;[Query](../index.md#query)[]>

*Defined in [packages/migrations/src/MigrationRunner.ts:38](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/MigrationRunner.ts#L38)*

#### Parameters:

Name | Type |
------ | ------ |
`migration` | Migration |
`method` | &#34;up&#34; \| &#34;down&#34; |

**Returns:** Promise&#60;[Query](../index.md#query)[]>

___

### run

▸ **run**(`migration`: Migration, `method`: &#34;up&#34; \| &#34;down&#34;): Promise&#60;void>

*Defined in [packages/migrations/src/MigrationRunner.ts:15](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/MigrationRunner.ts#L15)*

#### Parameters:

Name | Type |
------ | ------ |
`migration` | Migration |
`method` | &#34;up&#34; \| &#34;down&#34; |

**Returns:** Promise&#60;void>

___

### setMasterMigration

▸ **setMasterMigration**(`trx`: [Transaction](../index.md#transaction)): void

*Defined in [packages/migrations/src/MigrationRunner.ts:30](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/MigrationRunner.ts#L30)*

#### Parameters:

Name | Type |
------ | ------ |
`trx` | [Transaction](../index.md#transaction) |

**Returns:** void

___

### unsetMasterMigration

▸ **unsetMasterMigration**(): void

*Defined in [packages/migrations/src/MigrationRunner.ts:34](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/MigrationRunner.ts#L34)*

**Returns:** void
