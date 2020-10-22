---
id: "imigrator"
title: "Interface: IMigrator"
sidebar_label: "IMigrator"
---

## Hierarchy

* **IMigrator**

## Methods

### createMigration

▸ **createMigration**(`path?`: string, `blank?`: boolean, `initial?`: boolean): Promise&#60;[MigrationResult](../index.md#migrationresult)>

*Defined in [packages/core/src/typings.ts:324](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L324)*

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

*Defined in [packages/core/src/typings.ts:328](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L328)*

#### Parameters:

Name | Type |
------ | ------ |
`options?` | string \| string[] \| [MigrateOptions](../index.md#migrateoptions) |

**Returns:** Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>

___

### getExecutedMigrations

▸ **getExecutedMigrations**(): Promise&#60;[MigrationRow](../index.md#migrationrow)[]>

*Defined in [packages/core/src/typings.ts:325](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L325)*

**Returns:** Promise&#60;[MigrationRow](../index.md#migrationrow)[]>

___

### getPendingMigrations

▸ **getPendingMigrations**(): Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>

*Defined in [packages/core/src/typings.ts:326](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L326)*

**Returns:** Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>

___

### up

▸ **up**(`options?`: string \| string[] \| [MigrateOptions](../index.md#migrateoptions)): Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>

*Defined in [packages/core/src/typings.ts:327](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L327)*

#### Parameters:

Name | Type |
------ | ------ |
`options?` | string \| string[] \| [MigrateOptions](../index.md#migrateoptions) |

**Returns:** Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>
