---
id: "migrator"
title: "Class: Migrator"
sidebar_label: "Migrator"
---

## Hierarchy

* **Migrator**

## Constructors

### constructor

\+ **new Migrator**(`em`: [EntityManager](entitymanager.md)): [Migrator](migrator.md)

*Defined in [packages/migrations/src/Migrator.ts:20](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L20)*

#### Parameters:

Name | Type |
------ | ------ |
`em` | [EntityManager](entitymanager.md) |

**Returns:** [Migrator](migrator.md)

## Properties

### config

• `Private` `Readonly` **config**: Configuration&#60;IDatabaseDriver&#60;Connection>> = this.em.config

*Defined in [packages/migrations/src/Migrator.ts:16](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L16)*

___

### driver

• `Private` `Readonly` **driver**: AbstractSqlDriver&#60;AbstractSqlConnection> = this.em.getDriver()

*Defined in [packages/migrations/src/Migrator.ts:14](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L14)*

___

### em

• `Private` `Readonly` **em**: [EntityManager](entitymanager.md)

*Defined in [packages/migrations/src/Migrator.ts:22](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L22)*

___

### generator

• `Private` `Readonly` **generator**: [MigrationGenerator](migrationgenerator.md) = new MigrationGenerator(this.driver, this.config.getNamingStrategy(), this.options)

*Defined in [packages/migrations/src/Migrator.ts:19](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L19)*

___

### options

• `Private` `Readonly` **options**: [MigrationsOptions](../index.md#migrationsoptions) = this.config.get('migrations')

*Defined in [packages/migrations/src/Migrator.ts:17](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L17)*

___

### runner

• `Private` `Readonly` **runner**: [MigrationRunner](migrationrunner.md) = new MigrationRunner(this.driver, this.options, this.config)

*Defined in [packages/migrations/src/Migrator.ts:18](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L18)*

___

### schemaGenerator

• `Private` `Readonly` **schemaGenerator**: SchemaGenerator = new SchemaGenerator(this.em)

*Defined in [packages/migrations/src/Migrator.ts:15](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L15)*

___

### storage

• `Private` `Readonly` **storage**: [MigrationStorage](migrationstorage.md) = new MigrationStorage(this.driver, this.options)

*Defined in [packages/migrations/src/Migrator.ts:20](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L20)*

___

### umzug

• `Private` `Readonly` **umzug**: Umzug

*Defined in [packages/migrations/src/Migrator.ts:13](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L13)*

## Methods

### createInitialMigration

▸ **createInitialMigration**(`path?`: string): Promise&#60;[MigrationResult](../index.md#migrationresult)>

*Defined in [packages/migrations/src/Migrator.ts:62](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L62)*

#### Parameters:

Name | Type |
------ | ------ |
`path?` | string |

**Returns:** Promise&#60;[MigrationResult](../index.md#migrationresult)>

___

### createMigration

▸ **createMigration**(`path?`: string, `blank?`: boolean, `initial?`: boolean): Promise&#60;[MigrationResult](../index.md#migrationresult)>

*Defined in [packages/migrations/src/Migrator.ts:41](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L41)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`path?` | string | - |
`blank` | boolean | false |
`initial` | boolean | false |

**Returns:** Promise&#60;[MigrationResult](../index.md#migrationresult)>

___

### down

▸ **down**(`options?`: string \| string[] \| [MigrateOptions](../index.md#migrateoptions)): Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>

*Defined in [packages/migrations/src/Migrator.ts:139](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L139)*

#### Parameters:

Name | Type |
------ | ------ |
`options?` | string \| string[] \| [MigrateOptions](../index.md#migrateoptions) |

**Returns:** Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>

___

### ensureMigrationsDirExists

▸ `Private`**ensureMigrationsDirExists**(): Promise&#60;void>

*Defined in [packages/migrations/src/Migrator.ts:239](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L239)*

**Returns:** Promise&#60;void>

___

### getExecutedMigrations

▸ **getExecutedMigrations**(): Promise&#60;[MigrationRow](../index.md#migrationrow)[]>

*Defined in [packages/migrations/src/Migrator.ts:123](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L123)*

**Returns:** Promise&#60;[MigrationRow](../index.md#migrationrow)[]>

___

### getPendingMigrations

▸ **getPendingMigrations**(): Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>

*Defined in [packages/migrations/src/Migrator.ts:129](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L129)*

**Returns:** Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>

___

### getSchemaDiff

▸ `Private`**getSchemaDiff**(`blank`: boolean, `initial`: boolean): Promise&#60;string[]>

*Defined in [packages/migrations/src/Migrator.ts:165](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L165)*

#### Parameters:

Name | Type |
------ | ------ |
`blank` | boolean |
`initial` | boolean |

**Returns:** Promise&#60;string[]>

___

### getStorage

▸ **getStorage**(): [MigrationStorage](migrationstorage.md)

*Defined in [packages/migrations/src/Migrator.ts:143](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L143)*

**Returns:** [MigrationStorage](migrationstorage.md)

___

### initialize

▸ `Protected`**initialize**(`MigrationClass`: [Constructor](../index.md#constructor)&#60;Migration>, `name?`: string): object

*Defined in [packages/migrations/src/Migrator.ts:155](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L155)*

#### Parameters:

Name | Type |
------ | ------ |
`MigrationClass` | [Constructor](../index.md#constructor)&#60;Migration> |
`name?` | string |

**Returns:** object

Name | Type |
------ | ------ |
`name` | string |
`down` | () => Promise&#60;void> |
`up` | () => Promise&#60;void> |

___

### prefix

▸ `Private`**prefix**&#60;T>(`options?`: T): T

*Defined in [packages/migrations/src/Migrator.ts:189](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L189)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | string \| string[] \| { from?: string ; migrations?: string[] ; to?: string ; transaction?: [Transaction](../index.md#transaction)  } |

#### Parameters:

Name | Type |
------ | ------ |
`options?` | T |

**Returns:** T

___

### resolve

▸ `Protected`**resolve**(`file`: string): object

*Defined in [packages/migrations/src/Migrator.ts:147](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L147)*

#### Parameters:

Name | Type |
------ | ------ |
`file` | string |

**Returns:** object

Name | Type |
------ | ------ |
`name` | string |
`down` | () => Promise&#60;void> |
`up` | () => Promise&#60;void> |

___

### runInTransaction

▸ `Private`**runInTransaction**(`trx`: [Transaction](../index.md#transaction), `method`: &#34;up&#34; \| &#34;down&#34;, `options`: string \| string[] \| undefined \| [MigrateOptions](../index.md#migrateoptions)): Promise&#60;Migration[]>

*Defined in [packages/migrations/src/Migrator.ts:229](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L229)*

#### Parameters:

Name | Type |
------ | ------ |
`trx` | [Transaction](../index.md#transaction) |
`method` | &#34;up&#34; \| &#34;down&#34; |
`options` | string \| string[] \| undefined \| [MigrateOptions](../index.md#migrateoptions) |

**Returns:** Promise&#60;Migration[]>

___

### runMigrations

▸ `Private`**runMigrations**(`method`: &#34;up&#34; \| &#34;down&#34;, `options?`: string \| string[] \| [MigrateOptions](../index.md#migrateoptions)): Promise&#60;Migration[]>

*Defined in [packages/migrations/src/Migrator.ts:214](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L214)*

#### Parameters:

Name | Type |
------ | ------ |
`method` | &#34;up&#34; \| &#34;down&#34; |
`options?` | string \| string[] \| [MigrateOptions](../index.md#migrateoptions) |

**Returns:** Promise&#60;Migration[]>

___

### up

▸ **up**(`options?`: string \| string[] \| [MigrateOptions](../index.md#migrateoptions)): Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>

*Defined in [packages/migrations/src/Migrator.ts:135](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L135)*

#### Parameters:

Name | Type |
------ | ------ |
`options?` | string \| string[] \| [MigrateOptions](../index.md#migrateoptions) |

**Returns:** Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>

___

### validateInitialMigration

▸ `Private`**validateInitialMigration**(): Promise&#60;boolean>

*Defined in [packages/migrations/src/Migrator.ts:87](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/migrations/src/Migrator.ts#L87)*

Initial migration can be created only if:
1. no previous migrations were generated or executed
2. existing schema do not contain any of the tables defined by metadata

If existing schema contains all of the tables already, we return true, based on that we mark the migration as already executed.
If only some of the tables are present, exception is thrown.

**Returns:** Promise&#60;boolean>
