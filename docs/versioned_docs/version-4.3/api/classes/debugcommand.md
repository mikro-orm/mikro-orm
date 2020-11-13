---
id: "debugcommand"
title: "Class: DebugCommand"
sidebar_label: "DebugCommand"
---

## Hierarchy

* **DebugCommand**

## Implements

* CommandModule

## Properties

### command

•  **command**: string = "debug"

*Defined in [packages/cli/src/commands/DebugCommand.ts:9](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/cli/src/commands/DebugCommand.ts#L9)*

___

### describe

•  **describe**: string = "Debug CLI configuration"

*Defined in [packages/cli/src/commands/DebugCommand.ts:10](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/cli/src/commands/DebugCommand.ts#L10)*

## Methods

### handler

▸ **handler**(): Promise&#60;void>

*Defined in [packages/cli/src/commands/DebugCommand.ts:15](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/cli/src/commands/DebugCommand.ts#L15)*

**`inheritdoc`** 

**Returns:** Promise&#60;void>

___

### checkPaths

▸ `Static` `Private`**checkPaths**(`paths`: string[], `failedColor`: &#34;red&#34; \| &#34;yellow&#34;, `baseDir?`: string, `onlyDirectories?`: boolean): Promise&#60;void>

*Defined in [packages/cli/src/commands/DebugCommand.ts:47](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/cli/src/commands/DebugCommand.ts#L47)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`paths` | string[] | - |
`failedColor` | &#34;red&#34; \| &#34;yellow&#34; | - |
`baseDir?` | string | - |
`onlyDirectories` | boolean | false |

**Returns:** Promise&#60;void>
