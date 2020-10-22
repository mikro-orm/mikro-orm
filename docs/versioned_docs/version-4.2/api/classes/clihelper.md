---
id: "clihelper"
title: "Class: CLIHelper"
sidebar_label: "CLIHelper"
---

## Hierarchy

* **CLIHelper**

## Methods

### dump

▸ `Static`**dump**(`text`: string, `config?`: Configuration): void

*Defined in [packages/cli/src/CLIHelper.ts:42](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/cli/src/CLIHelper.ts#L42)*

#### Parameters:

Name | Type |
------ | ------ |
`text` | string |
`config?` | Configuration |

**Returns:** void

___

### dumpDependencies

▸ `Static`**dumpDependencies**(): Promise&#60;void>

*Defined in [packages/cli/src/CLIHelper.ts:55](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/cli/src/CLIHelper.ts#L55)*

**Returns:** Promise&#60;void>

___

### dumpTable

▸ `Static`**dumpTable**(`options`: { columns: string[] ; empty: string ; rows: string[][]  }): void

*Defined in [packages/cli/src/CLIHelper.ts:83](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/cli/src/CLIHelper.ts#L83)*

#### Parameters:

Name | Type |
------ | ------ |
`options` | { columns: string[] ; empty: string ; rows: string[][]  } |

**Returns:** void

___

### getConfigPaths

▸ `Static`**getConfigPaths**(): Promise&#60;string[]>

*Defined in [packages/cli/src/CLIHelper.ts:51](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/cli/src/CLIHelper.ts#L51)*

**Returns:** Promise&#60;string[]>

___

### getConfiguration

▸ `Static`**getConfiguration**&#60;D>(`validate?`: boolean, `options?`: Partial&#60;Configuration>): Promise&#60;Configuration&#60;D>>

*Defined in [packages/cli/src/CLIHelper.ts:9](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/cli/src/CLIHelper.ts#L9)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`D` | IDatabaseDriver | IDatabaseDriver |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`validate` | boolean | true |
`options` | Partial&#60;Configuration> | {} |

**Returns:** Promise&#60;Configuration&#60;D>>

___

### getDriverDependencies

▸ `Static`**getDriverDependencies**(): Promise&#60;string[]>

*Defined in [packages/cli/src/CLIHelper.ts:33](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/cli/src/CLIHelper.ts#L33)*

**Returns:** Promise&#60;string[]>

___

### getModuleVersion

▸ `Static`**getModuleVersion**(`name`: string): Promise&#60;string>

*Defined in [packages/cli/src/CLIHelper.ts:74](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/cli/src/CLIHelper.ts#L74)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** Promise&#60;string>

___

### getNodeVersion

▸ `Static`**getNodeVersion**(): string

*Defined in [packages/cli/src/CLIHelper.ts:29](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/cli/src/CLIHelper.ts#L29)*

**Returns:** string

___

### getORM

▸ `Static`**getORM**(`warnWhenNoEntities?`: boolean, `opts?`: Partial&#60;Configuration>): Promise&#60;MikroORM>

*Defined in [packages/cli/src/CLIHelper.ts:13](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/cli/src/CLIHelper.ts#L13)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`warnWhenNoEntities?` | boolean | - |
`opts` | Partial&#60;Configuration> | {} |

**Returns:** Promise&#60;MikroORM>
