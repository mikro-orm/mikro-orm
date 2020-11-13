---
id: "imigrator"
title: "Interface: IMigrator"
sidebar_label: "IMigrator"
---

## Hierarchy

* **IMigrator**

## Methods

### createInitialMigration

▸ **createInitialMigration**(`path?`: string): Promise&#60;[MigrationResult](../index.md#migrationresult)>

*Defined in [packages/core/src/typings.ts:339](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L339)*

#### Parameters:

Name | Type |
------ | ------ |
`path?` | string |

**Returns:** Promise&#60;[MigrationResult](../index.md#migrationresult)>

___

### createMigration

▸ **createMigration**(`path?`: string, `blank?`: boolean, `initial?`: boolean): Promise&#60;[MigrationResult](../index.md#migrationresult)>

*Defined in [packages/core/src/typings.ts:338](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L338)*

#### Parameters:

Name | Type |
------ | ------ |
`path?` | string |
`blank?` | boolean |
`initial?` | boolean |

**Returns:** Promise&#60;[MigrationResult](../index.md#migrationresult)>

___

### down

▸ **down**(`options?`: string \| string[] \| [MigrateOptions](../index.md#migrateoptions)): Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>

*Defined in [packages/core/src/typings.ts:343](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L343)*

#### Parameters:

Name | Type |
------ | ------ |
`options?` | string \| string[] \| [MigrateOptions](../index.md#migrateoptions) |

**Returns:** Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>

___

### getExecutedMigrations

▸ **getExecutedMigrations**(): Promise&#60;[MigrationRow](../index.md#migrationrow)[]>

*Defined in [packages/core/src/typings.ts:340](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L340)*

**Returns:** Promise&#60;[MigrationRow](../index.md#migrationrow)[]>

___

### getPendingMigrations

▸ **getPendingMigrations**(): Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>

*Defined in [packages/core/src/typings.ts:341](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L341)*

**Returns:** Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>

___

### up

▸ **up**(`options?`: string \| string[] \| [MigrateOptions](../index.md#migrateoptions)): Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>

*Defined in [packages/core/src/typings.ts:342](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L342)*

#### Parameters:

Name | Type |
------ | ------ |
`options?` | string \| string[] \| [MigrateOptions](../index.md#migrateoptions) |

**Returns:** Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>
