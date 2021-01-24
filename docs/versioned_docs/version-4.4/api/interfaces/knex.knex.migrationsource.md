---
id: "knex.knex.migrationsource"
title: "Interface: MigrationSource<TMigrationSpec>"
sidebar_label: "MigrationSource"
hide_title: true
---

# Interface: MigrationSource<TMigrationSpec\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).MigrationSource

## Type parameters

Name |
------ |
`TMigrationSpec` |

## Hierarchy

* **MigrationSource**

## Methods

### getMigration

▸ **getMigration**(`migration`: TMigrationSpec): [*Migration*](knex.knex.migration.md)

#### Parameters:

Name | Type |
------ | ------ |
`migration` | TMigrationSpec |

**Returns:** [*Migration*](knex.knex.migration.md)

Defined in: node_modules/knex/types/index.d.ts:2111

___

### getMigrationName

▸ **getMigrationName**(`migration`: TMigrationSpec): *string*

#### Parameters:

Name | Type |
------ | ------ |
`migration` | TMigrationSpec |

**Returns:** *string*

Defined in: node_modules/knex/types/index.d.ts:2110

___

### getMigrations

▸ **getMigrations**(`loadExtensions`: readonly *string*[]): *Promise*<TMigrationSpec[]\>

#### Parameters:

Name | Type |
------ | ------ |
`loadExtensions` | readonly *string*[] |

**Returns:** *Promise*<TMigrationSpec[]\>

Defined in: node_modules/knex/types/index.d.ts:2109
