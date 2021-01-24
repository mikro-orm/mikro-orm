---
id: "knex.knex.migrator"
title: "Interface: Migrator"
sidebar_label: "Migrator"
hide_title: true
---

# Interface: Migrator

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).Migrator

## Hierarchy

* **Migrator**

## Methods

### currentVersion

▸ **currentVersion**(`config?`: [*MigratorConfig*](knex.knex.migratorconfig.md)): *Promise*<*string*\>

#### Parameters:

Name | Type |
------ | ------ |
`config?` | [*MigratorConfig*](knex.knex.migratorconfig.md) |

**Returns:** *Promise*<*string*\>

Defined in: node_modules/knex/types/index.d.ts:2133

___

### down

▸ **down**(`config?`: [*MigratorConfig*](knex.knex.migratorconfig.md)): *Promise*<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`config?` | [*MigratorConfig*](knex.knex.migratorconfig.md) |

**Returns:** *Promise*<*any*\>

Defined in: node_modules/knex/types/index.d.ts:2136

___

### forceFreeMigrationsLock

▸ **forceFreeMigrationsLock**(`config?`: [*MigratorConfig*](knex.knex.migratorconfig.md)): *Promise*<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`config?` | [*MigratorConfig*](knex.knex.migratorconfig.md) |

**Returns:** *Promise*<*any*\>

Defined in: node_modules/knex/types/index.d.ts:2137

___

### latest

▸ **latest**(`config?`: [*MigratorConfig*](knex.knex.migratorconfig.md)): *Promise*<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`config?` | [*MigratorConfig*](knex.knex.migratorconfig.md) |

**Returns:** *Promise*<*any*\>

Defined in: node_modules/knex/types/index.d.ts:2130

___

### list

▸ **list**(`config?`: [*MigratorConfig*](knex.knex.migratorconfig.md)): *Promise*<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`config?` | [*MigratorConfig*](knex.knex.migratorconfig.md) |

**Returns:** *Promise*<*any*\>

Defined in: node_modules/knex/types/index.d.ts:2134

___

### make

▸ **make**(`name`: *string*, `config?`: [*MigratorConfig*](knex.knex.migratorconfig.md)): *Promise*<*string*\>

#### Parameters:

Name | Type |
------ | ------ |
`name` | *string* |
`config?` | [*MigratorConfig*](knex.knex.migratorconfig.md) |

**Returns:** *Promise*<*string*\>

Defined in: node_modules/knex/types/index.d.ts:2129

___

### rollback

▸ **rollback**(`config?`: [*MigratorConfig*](knex.knex.migratorconfig.md), `all?`: *boolean*): *Promise*<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`config?` | [*MigratorConfig*](knex.knex.migratorconfig.md) |
`all?` | *boolean* |

**Returns:** *Promise*<*any*\>

Defined in: node_modules/knex/types/index.d.ts:2131

___

### status

▸ **status**(`config?`: [*MigratorConfig*](knex.knex.migratorconfig.md)): *Promise*<*number*\>

#### Parameters:

Name | Type |
------ | ------ |
`config?` | [*MigratorConfig*](knex.knex.migratorconfig.md) |

**Returns:** *Promise*<*number*\>

Defined in: node_modules/knex/types/index.d.ts:2132

___

### up

▸ **up**(`config?`: [*MigratorConfig*](knex.knex.migratorconfig.md)): *Promise*<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`config?` | [*MigratorConfig*](knex.knex.migratorconfig.md) |

**Returns:** *Promise*<*any*\>

Defined in: node_modules/knex/types/index.d.ts:2135
