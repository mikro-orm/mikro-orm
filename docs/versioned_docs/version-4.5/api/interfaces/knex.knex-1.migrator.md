---
id: "knex.knex-1.migrator"
title: "Interface: Migrator"
sidebar_label: "Migrator"
custom_edit_url: null
hide_title: true
---

# Interface: Migrator

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).Migrator

## Methods

### currentVersion

▸ **currentVersion**(`config?`: [*MigratorConfig*](knex.knex-1.migratorconfig.md)): *Promise*<string\>

#### Parameters:

Name | Type |
:------ | :------ |
`config?` | [*MigratorConfig*](knex.knex-1.migratorconfig.md) |

**Returns:** *Promise*<string\>

Defined in: node_modules/knex/types/index.d.ts:2139

___

### down

▸ **down**(`config?`: [*MigratorConfig*](knex.knex-1.migratorconfig.md)): *Promise*<any\>

#### Parameters:

Name | Type |
:------ | :------ |
`config?` | [*MigratorConfig*](knex.knex-1.migratorconfig.md) |

**Returns:** *Promise*<any\>

Defined in: node_modules/knex/types/index.d.ts:2142

___

### forceFreeMigrationsLock

▸ **forceFreeMigrationsLock**(`config?`: [*MigratorConfig*](knex.knex-1.migratorconfig.md)): *Promise*<any\>

#### Parameters:

Name | Type |
:------ | :------ |
`config?` | [*MigratorConfig*](knex.knex-1.migratorconfig.md) |

**Returns:** *Promise*<any\>

Defined in: node_modules/knex/types/index.d.ts:2143

___

### latest

▸ **latest**(`config?`: [*MigratorConfig*](knex.knex-1.migratorconfig.md)): *Promise*<any\>

#### Parameters:

Name | Type |
:------ | :------ |
`config?` | [*MigratorConfig*](knex.knex-1.migratorconfig.md) |

**Returns:** *Promise*<any\>

Defined in: node_modules/knex/types/index.d.ts:2136

___

### list

▸ **list**(`config?`: [*MigratorConfig*](knex.knex-1.migratorconfig.md)): *Promise*<any\>

#### Parameters:

Name | Type |
:------ | :------ |
`config?` | [*MigratorConfig*](knex.knex-1.migratorconfig.md) |

**Returns:** *Promise*<any\>

Defined in: node_modules/knex/types/index.d.ts:2140

___

### make

▸ **make**(`name`: *string*, `config?`: [*MigratorConfig*](knex.knex-1.migratorconfig.md)): *Promise*<string\>

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* |
`config?` | [*MigratorConfig*](knex.knex-1.migratorconfig.md) |

**Returns:** *Promise*<string\>

Defined in: node_modules/knex/types/index.d.ts:2135

___

### rollback

▸ **rollback**(`config?`: [*MigratorConfig*](knex.knex-1.migratorconfig.md), `all?`: *boolean*): *Promise*<any\>

#### Parameters:

Name | Type |
:------ | :------ |
`config?` | [*MigratorConfig*](knex.knex-1.migratorconfig.md) |
`all?` | *boolean* |

**Returns:** *Promise*<any\>

Defined in: node_modules/knex/types/index.d.ts:2137

___

### status

▸ **status**(`config?`: [*MigratorConfig*](knex.knex-1.migratorconfig.md)): *Promise*<number\>

#### Parameters:

Name | Type |
:------ | :------ |
`config?` | [*MigratorConfig*](knex.knex-1.migratorconfig.md) |

**Returns:** *Promise*<number\>

Defined in: node_modules/knex/types/index.d.ts:2138

___

### up

▸ **up**(`config?`: [*MigratorConfig*](knex.knex-1.migratorconfig.md)): *Promise*<any\>

#### Parameters:

Name | Type |
:------ | :------ |
`config?` | [*MigratorConfig*](knex.knex-1.migratorconfig.md) |

**Returns:** *Promise*<any\>

Defined in: node_modules/knex/types/index.d.ts:2141
