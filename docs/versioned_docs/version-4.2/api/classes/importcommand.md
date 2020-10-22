---
id: "importcommand"
title: "Class: ImportCommand"
sidebar_label: "ImportCommand"
---

## Hierarchy

* **ImportCommand**

## Implements

* CommandModule

## Properties

### command

•  **command**: string = "database:import &#60;file>"

*Defined in [packages/cli/src/commands/ImportCommand.ts:9](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/cli/src/commands/ImportCommand.ts#L9)*

___

### describe

•  **describe**: string = "Imports the SQL file to the database"

*Defined in [packages/cli/src/commands/ImportCommand.ts:10](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/cli/src/commands/ImportCommand.ts#L10)*

## Methods

### handler

▸ **handler**(`args`: Arguments): Promise&#60;void>

*Defined in [packages/cli/src/commands/ImportCommand.ts:15](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/cli/src/commands/ImportCommand.ts#L15)*

**`inheritdoc`** 

#### Parameters:

Name | Type |
------ | ------ |
`args` | Arguments |

**Returns:** Promise&#60;void>
