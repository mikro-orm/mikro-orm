---
id: "knex.knex-1.migrationsource"
title: "Interface: MigrationSource<TMigrationSpec>"
sidebar_label: "MigrationSource"
custom_edit_url: null
hide_title: true
---

# Interface: MigrationSource<TMigrationSpec\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).MigrationSource

## Type parameters

Name |
:------ |
`TMigrationSpec` |

## Methods

### getMigration

▸ **getMigration**(`migration`: TMigrationSpec): [*Migration*](knex.knex-1.migration.md)

#### Parameters:

Name | Type |
:------ | :------ |
`migration` | TMigrationSpec |

**Returns:** [*Migration*](knex.knex-1.migration.md)

Defined in: node_modules/knex/types/index.d.ts:2117

___

### getMigrationName

▸ **getMigrationName**(`migration`: TMigrationSpec): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`migration` | TMigrationSpec |

**Returns:** *string*

Defined in: node_modules/knex/types/index.d.ts:2116

___

### getMigrations

▸ **getMigrations**(`loadExtensions`: readonly *string*[]): *Promise*<TMigrationSpec[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`loadExtensions` | readonly *string*[] |

**Returns:** *Promise*<TMigrationSpec[]\>

Defined in: node_modules/knex/types/index.d.ts:2115
