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

*Defined in [packages/core/src/typings.ts:329](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/typings.ts#L329)*

#### Parameters:

Name | Type |
------ | ------ |
`path?` | string |

**Returns:** Promise&#60;[MigrationResult](../index.md#migrationresult)>

___

### createMigration

▸ **createMigration**(`path?`: string, `blank?`: boolean, `initial?`: boolean): Promise&#60;[MigrationResult](../index.md#migrationresult)>

*Defined in [packages/core/src/typings.ts:328](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/typings.ts#L328)*

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

*Defined in [packages/core/src/typings.ts:333](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/typings.ts#L333)*

#### Parameters:

Name | Type |
------ | ------ |
`options?` | string \| string[] \| [MigrateOptions](../index.md#migrateoptions) |

**Returns:** Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>

___

### getExecutedMigrations

▸ **getExecutedMigrations**(): Promise&#60;[MigrationRow](../index.md#migrationrow)[]>

*Defined in [packages/core/src/typings.ts:330](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/typings.ts#L330)*

**Returns:** Promise&#60;[MigrationRow](../index.md#migrationrow)[]>

___

### getPendingMigrations

▸ **getPendingMigrations**(): Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>

*Defined in [packages/core/src/typings.ts:331](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/typings.ts#L331)*

**Returns:** Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>

___

### up

▸ **up**(`options?`: string \| string[] \| [MigrateOptions](../index.md#migrateoptions)): Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>

*Defined in [packages/core/src/typings.ts:332](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/typings.ts#L332)*

#### Parameters:

Name | Type |
------ | ------ |
`options?` | string \| string[] \| [MigrateOptions](../index.md#migrateoptions) |

**Returns:** Promise&#60;[UmzugMigration](../index.md#umzugmigration)[]>
