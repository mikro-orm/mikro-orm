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

*Defined in [packages/migrations/src/Migrator.ts:20](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/Migrator.ts#L20)*

#### Parameters:

Name | Type |
------ | ------ |
`em` | [EntityManager](entitymanager.md) |

**Returns:** [Migrator](migrator.md)

## Properties

### config

• `Private` `Readonly` **config**: Configuration&#60;IDatabaseDriver&#60;Connection>> = this.em.config

*Defined in [packages/migrations/src/Migrator.ts:16](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/Migrator.ts#L16)*

___

### driver

• `Private` `Readonly` **driver**: AbstractSqlDriver&#60;AbstractSqlConnection> = this.em.getDriver()

*Defined in [packages/migrations/src/Migrator.ts:14](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/Migrator.ts#L14)*

___

### em

• `Private` `Readonly` **em**: [EntityManager](entitymanager.md)

*Defined in [packages/migrations/src/Migrator.ts:22](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/Migrator.ts#L22)*

___

### generator

• `Private` `Readonly` **generator**: [MigrationGenerator](migrationgenerator.md) = new MigrationGenerator(this.driver, this.config.getNamingStrategy(), this.options)

*Defined in [packages/migrations/src/Migrator.ts:19](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/Migrator.ts#L19)*

___

### options

• `Private` `Readonly` **options**: [MigrationsOptions](../index.md#migrationsoptions) = this.config.get('migrations')

*Defined in [packages/migrations/src/Migrator.ts:17](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/Migrator.ts#L17)*

___

### runner

• `Private` `Readonly` **runner**: [MigrationRunner](migrationrunner.md) = new MigrationRunner(this.driver, this.options, this.config)

*Defined in [packages/migrations/src/Migrator.ts:18](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/Migrator.ts#L18)*

___

### schemaGenerator

• `Private` `Readonly` **schemaGenerator**: SchemaGenerator = new SchemaGenerator(this.em)

*Defined in [packages/migrations/src/Migrator.ts:15](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/Migrator.ts#L15)*

___

### storage

• `Private` `Readonly` **storage**: [MigrationStorage](migrationstorage.md) = new MigrationStorage(this.driver, this.options)

*Defined in [packages/migrations/src/Migrator.ts:20](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/Migrator.ts#L20)*

___

### umzug

• `Private` `Readonly` **umzug**: Umzug

*Defined in [packages/migrations/src/Migrator.ts:13](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/Migrator.ts#L13)*

## Methods

### createMigration

▸ **createMigration**(`path?`: string, `blank?`: boolean, `initial?`: boolean): Promise&#60;[MigrationResult](../index.md#migrationresult)>

*Defined in [packages/migrations/src/Migrator.ts:41](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/Migrator.ts#L41)*

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

*Defined in [packages/migrations/src/Migrator.ts:92](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/Migrator.ts#L92)*

#### Parameters:

Name | Type |
------ | ------ |
`options?` | string \| string[] \| [MigrateOptions](../index.md#migrateoptions) |

**Returns:** Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>

___

### getExecutedMigrations

▸ **getExecutedMigrations**(): Promise&#60;[MigrationRow](../index.md#migrationrow)[]>

*Defined in [packages/migrations/src/Migrator.ts:76](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/Migrator.ts#L76)*

**Returns:** Promise&#60;[MigrationRow](../index.md#migrationrow)[]>

___

### getPendingMigrations

▸ **getPendingMigrations**(): Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>

*Defined in [packages/migrations/src/Migrator.ts:82](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/Migrator.ts#L82)*

**Returns:** Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>

___

### getSchemaDiff

▸ `Private`**getSchemaDiff**(`blank`: boolean, `initial`: boolean): Promise&#60;string[]>

*Defined in [packages/migrations/src/Migrator.ts:118](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/Migrator.ts#L118)*

#### Parameters:

Name | Type |
------ | ------ |
`blank` | boolean |
`initial` | boolean |

**Returns:** Promise&#60;string[]>

___

### getStorage

▸ **getStorage**(): [MigrationStorage](migrationstorage.md)

*Defined in [packages/migrations/src/Migrator.ts:96](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/Migrator.ts#L96)*

**Returns:** [MigrationStorage](migrationstorage.md)

___

### initialize

▸ `Protected`**initialize**(`MigrationClass`: [Constructor](../index.md#constructor)&#60;Migration>, `name?`: string): object

*Defined in [packages/migrations/src/Migrator.ts:108](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/Migrator.ts#L108)*

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

*Defined in [packages/migrations/src/Migrator.ts:142](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/Migrator.ts#L142)*

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

*Defined in [packages/migrations/src/Migrator.ts:100](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/Migrator.ts#L100)*

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

*Defined in [packages/migrations/src/Migrator.ts:182](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/Migrator.ts#L182)*

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

*Defined in [packages/migrations/src/Migrator.ts:167](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/Migrator.ts#L167)*

#### Parameters:

Name | Type |
------ | ------ |
`method` | &#34;up&#34; \| &#34;down&#34; |
`options?` | string \| string[] \| [MigrateOptions](../index.md#migrateoptions) |

**Returns:** Promise&#60;Migration[]>

___

### up

▸ **up**(`options?`: string \| string[] \| [MigrateOptions](../index.md#migrateoptions)): Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>

*Defined in [packages/migrations/src/Migrator.ts:88](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/Migrator.ts#L88)*

#### Parameters:

Name | Type |
------ | ------ |
`options?` | string \| string[] \| [MigrateOptions](../index.md#migrateoptions) |

**Returns:** Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>

___

### validateInitialMigration

▸ **validateInitialMigration**(): Promise&#60;void>

*Defined in [packages/migrations/src/Migrator.ts:67](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/Migrator.ts#L67)*

**Returns:** Promise&#60;void>
