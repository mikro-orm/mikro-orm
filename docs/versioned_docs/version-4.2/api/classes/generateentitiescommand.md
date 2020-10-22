---
id: "generateentitiescommand"
title: "Class: GenerateEntitiesCommand<U>"
sidebar_label: "GenerateEntitiesCommand"
---

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`U` | [Options](../index.md#options) | Options |

## Hierarchy

* **GenerateEntitiesCommand**

## Implements

* CommandModule&#60;unknown, U>

## Properties

### command

•  **command**: string = "generate-entities"

*Defined in [packages/cli/src/commands/GenerateEntitiesCommand.ts:10](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/cli/src/commands/GenerateEntitiesCommand.ts#L10)*

___

### describe

•  **describe**: string = "Generate entities based on current database schema"

*Defined in [packages/cli/src/commands/GenerateEntitiesCommand.ts:11](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/cli/src/commands/GenerateEntitiesCommand.ts#L11)*

## Methods

### builder

▸ **builder**(`args`: Argv): Argv&#60;U>

*Defined in [packages/cli/src/commands/GenerateEntitiesCommand.ts:16](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/cli/src/commands/GenerateEntitiesCommand.ts#L16)*

**`inheritdoc`** 

#### Parameters:

Name | Type |
------ | ------ |
`args` | Argv |

**Returns:** Argv&#60;U>

___

### handler

▸ **handler**(`args`: Arguments&#60;U>): Promise&#60;void>

*Defined in [packages/cli/src/commands/GenerateEntitiesCommand.ts:39](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/cli/src/commands/GenerateEntitiesCommand.ts#L39)*

**`inheritdoc`** 

#### Parameters:

Name | Type |
------ | ------ |
`args` | Arguments&#60;U> |

**Returns:** Promise&#60;void>
