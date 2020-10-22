---
id: "schemacommandfactory"
title: "Class: SchemaCommandFactory"
sidebar_label: "SchemaCommandFactory"
---

## Hierarchy

* **SchemaCommandFactory**

## Methods

### configureSchemaCommand

▸ `Static`**configureSchemaCommand**(`args`: Argv, `command`: &#34;create&#34; \| &#34;update&#34; \| &#34;drop&#34;): Argv&#60;{}>

*Defined in [packages/cli/src/commands/SchemaCommandFactory.ts:32](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/cli/src/commands/SchemaCommandFactory.ts#L32)*

#### Parameters:

Name | Type |
------ | ------ |
`args` | Argv |
`command` | &#34;create&#34; \| &#34;update&#34; \| &#34;drop&#34; |

**Returns:** Argv&#60;{}>

___

### create

▸ `Static`**create**&#60;U>(`command`: &#34;create&#34; \| &#34;update&#34; \| &#34;drop&#34;): CommandModule&#60;unknown, U> & { builder: (args: Argv) => Argv&#60;U> ; handler: (args: Arguments&#60;U>) => Promise&#60;void>  }

*Defined in [packages/cli/src/commands/SchemaCommandFactory.ts:21](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/cli/src/commands/SchemaCommandFactory.ts#L21)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`U` | [Options](../index.md#options) | Options |

#### Parameters:

Name | Type |
------ | ------ |
`command` | &#34;create&#34; \| &#34;update&#34; \| &#34;drop&#34; |

**Returns:** CommandModule&#60;unknown, U> & { builder: (args: Argv) => Argv&#60;U> ; handler: (args: Arguments&#60;U>) => Promise&#60;void>  }

___

### getOrderedParams

▸ `Static` `Private`**getOrderedParams**(`args`: Arguments&#60;[Options](../index.md#options)>, `method`: &#34;create&#34; \| &#34;update&#34; \| &#34;drop&#34;): any[]

*Defined in [packages/cli/src/commands/SchemaCommandFactory.ts:98](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/cli/src/commands/SchemaCommandFactory.ts#L98)*

#### Parameters:

Name | Type |
------ | ------ |
`args` | Arguments&#60;[Options](../index.md#options)> |
`method` | &#34;create&#34; \| &#34;update&#34; \| &#34;drop&#34; |

**Returns:** any[]

___

### handleSchemaCommand

▸ `Static`**handleSchemaCommand**(`args`: Arguments&#60;[Options](../index.md#options)>, `method`: &#34;create&#34; \| &#34;update&#34; \| &#34;drop&#34;, `successMessage`: string): Promise&#60;void>

*Defined in [packages/cli/src/commands/SchemaCommandFactory.ts:75](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/cli/src/commands/SchemaCommandFactory.ts#L75)*

#### Parameters:

Name | Type |
------ | ------ |
`args` | Arguments&#60;[Options](../index.md#options)> |
`method` | &#34;create&#34; \| &#34;update&#34; \| &#34;drop&#34; |
`successMessage` | string |

**Returns:** Promise&#60;void>

## Object literals

### DESCRIPTIONS

▪ `Static` `Readonly` **DESCRIPTIONS**: object

*Defined in [packages/cli/src/commands/SchemaCommandFactory.ts:9](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/cli/src/commands/SchemaCommandFactory.ts#L9)*

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`create` | string | "Create database schema based on current metadata" |
`drop` | string | "Drop database schema based on current metadata" |
`update` | string | "Update database schema based on current metadata" |

___

### SUCCESS\_MESSAGES

▪ `Static` `Readonly` **SUCCESS\_MESSAGES**: object

*Defined in [packages/cli/src/commands/SchemaCommandFactory.ts:15](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/cli/src/commands/SchemaCommandFactory.ts#L15)*

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`create` | string | "Schema successfully created" |
`drop` | string | "Schema successfully dropped" |
`update` | string | "Schema successfully updated" |
