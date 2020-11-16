---
id: "migrationcommandfactory"
title: "Class: MigrationCommandFactory"
sidebar_label: "MigrationCommandFactory"
---

## Hierarchy

* **MigrationCommandFactory**

## Methods

### configureCreateCommand

▸ `Static` `Private`**configureCreateCommand**(`args`: Argv): void

*Defined in [packages/cli/src/commands/MigrationCommandFactory.ts:57](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/cli/src/commands/MigrationCommandFactory.ts#L57)*

#### Parameters:

Name | Type |
------ | ------ |
`args` | Argv |

**Returns:** void

___

### configureMigrationCommand

▸ `Static`**configureMigrationCommand**(`args`: Argv, `method`: [MigratorMethod](../index.md#migratormethod)): Argv&#60;{}>

*Defined in [packages/cli/src/commands/MigrationCommandFactory.ts:27](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/cli/src/commands/MigrationCommandFactory.ts#L27)*

#### Parameters:

Name | Type |
------ | ------ |
`args` | Argv |
`method` | [MigratorMethod](../index.md#migratormethod) |

**Returns:** Argv&#60;{}>

___

### configureUpDownCommand

▸ `Static` `Private`**configureUpDownCommand**(`args`: Argv, `method`: [MigratorMethod](../index.md#migratormethod)): void

*Defined in [packages/cli/src/commands/MigrationCommandFactory.ts:39](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/cli/src/commands/MigrationCommandFactory.ts#L39)*

#### Parameters:

Name | Type |
------ | ------ |
`args` | Argv |
`method` | [MigratorMethod](../index.md#migratormethod) |

**Returns:** void

___

### create

▸ `Static`**create**&#60;U>(`command`: [MigratorMethod](../index.md#migratormethod)): CommandModule&#60;unknown, U> & { builder: (args: Argv) => Argv&#60;U> ; handler: (args: Arguments&#60;U>) => Promise&#60;void>  }

*Defined in [packages/cli/src/commands/MigrationCommandFactory.ts:18](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/cli/src/commands/MigrationCommandFactory.ts#L18)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`U` | [Options](../index.md#options) | Options |

#### Parameters:

Name | Type |
------ | ------ |
`command` | [MigratorMethod](../index.md#migratormethod) |

**Returns:** CommandModule&#60;unknown, U> & { builder: (args: Argv) => Argv&#60;U> ; handler: (args: Arguments&#60;U>) => Promise&#60;void>  }

___

### getUpDownOptions

▸ `Static` `Private`**getUpDownOptions**(`flags`: [CliUpDownOptions](../index.md#cliupdownoptions)): [MigrateOptions](../index.md#migrateoptions)

*Defined in [packages/cli/src/commands/MigrationCommandFactory.ts:144](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/cli/src/commands/MigrationCommandFactory.ts#L144)*

#### Parameters:

Name | Type |
------ | ------ |
`flags` | [CliUpDownOptions](../index.md#cliupdownoptions) |

**Returns:** [MigrateOptions](../index.md#migrateoptions)

___

### getUpDownSuccessMessage

▸ `Static` `Private`**getUpDownSuccessMessage**(`method`: &#34;up&#34; \| &#34;down&#34;, `options`: [MigrateOptions](../index.md#migrateoptions)): string

*Defined in [packages/cli/src/commands/MigrationCommandFactory.ts:156](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/cli/src/commands/MigrationCommandFactory.ts#L156)*

#### Parameters:

Name | Type |
------ | ------ |
`method` | &#34;up&#34; \| &#34;down&#34; |
`options` | [MigrateOptions](../index.md#migrateoptions) |

**Returns:** string

___

### handleCreateCommand

▸ `Static` `Private`**handleCreateCommand**(`migrator`: Migrator, `args`: Arguments&#60;[Options](../index.md#options)>, `config`: Configuration): Promise&#60;void>

*Defined in [packages/cli/src/commands/MigrationCommandFactory.ts:129](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/cli/src/commands/MigrationCommandFactory.ts#L129)*

#### Parameters:

Name | Type |
------ | ------ |
`migrator` | Migrator |
`args` | Arguments&#60;[Options](../index.md#options)> |
`config` | Configuration |

**Returns:** Promise&#60;void>

___

### handleListCommand

▸ `Static` `Private`**handleListCommand**(`migrator`: Migrator): Promise&#60;void>

*Defined in [packages/cli/src/commands/MigrationCommandFactory.ts:119](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/cli/src/commands/MigrationCommandFactory.ts#L119)*

#### Parameters:

Name | Type |
------ | ------ |
`migrator` | Migrator |

**Returns:** Promise&#60;void>

___

### handleMigrationCommand

▸ `Static`**handleMigrationCommand**(`args`: Arguments&#60;[Options](../index.md#options)>, `method`: [MigratorMethod](../index.md#migratormethod)): Promise&#60;void>

*Defined in [packages/cli/src/commands/MigrationCommandFactory.ts:80](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/cli/src/commands/MigrationCommandFactory.ts#L80)*

#### Parameters:

Name | Type |
------ | ------ |
`args` | Arguments&#60;[Options](../index.md#options)> |
`method` | [MigratorMethod](../index.md#migratormethod) |

**Returns:** Promise&#60;void>

___

### handlePendingCommand

▸ `Static` `Private`**handlePendingCommand**(`migrator`: Migrator): Promise&#60;void>

*Defined in [packages/cli/src/commands/MigrationCommandFactory.ts:110](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/cli/src/commands/MigrationCommandFactory.ts#L110)*

#### Parameters:

Name | Type |
------ | ------ |
`migrator` | Migrator |

**Returns:** Promise&#60;void>

___

### handleUpDownCommand

▸ `Static` `Private`**handleUpDownCommand**(`args`: Arguments&#60;[Options](../index.md#options)>, `migrator`: Migrator, `method`: [MigratorMethod](../index.md#migratormethod)): Promise&#60;void>

*Defined in [packages/cli/src/commands/MigrationCommandFactory.ts:103](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/cli/src/commands/MigrationCommandFactory.ts#L103)*

#### Parameters:

Name | Type |
------ | ------ |
`args` | Arguments&#60;[Options](../index.md#options)> |
`migrator` | Migrator |
`method` | [MigratorMethod](../index.md#migratormethod) |

**Returns:** Promise&#60;void>

## Object literals

### DESCRIPTIONS

▪ `Static` `Readonly` **DESCRIPTIONS**: object

*Defined in [packages/cli/src/commands/MigrationCommandFactory.ts:10](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/cli/src/commands/MigrationCommandFactory.ts#L10)*

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`create` | string | "Create new migration with current schema diff" |
`down` | string | "Migrate one step down" |
`list` | string | "List all executed migrations" |
`pending` | string | "List all pending migrations" |
`up` | string | "Migrate up to the latest version" |
