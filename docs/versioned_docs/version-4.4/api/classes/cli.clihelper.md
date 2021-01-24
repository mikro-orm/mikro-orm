---
id: "cli.clihelper"
title: "Class: CLIHelper"
sidebar_label: "CLIHelper"
hide_title: true
---

# Class: CLIHelper

[cli](../modules/cli.md).CLIHelper

## Hierarchy

* **CLIHelper**

## Constructors

### constructor

\+ **new CLIHelper**(): [*CLIHelper*](cli.clihelper.md)

**Returns:** [*CLIHelper*](cli.clihelper.md)

## Methods

### dump

▸ `Static`**dump**(`text`: *string*, `config?`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`text` | *string* |
`config?` | [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |

**Returns:** *void*

Defined in: [packages/cli/src/CLIHelper.ts:42](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/cli/src/CLIHelper.ts#L42)

___

### dumpDependencies

▸ `Static`**dumpDependencies**(): *Promise*<*void*\>

**Returns:** *Promise*<*void*\>

Defined in: [packages/cli/src/CLIHelper.ts:55](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/cli/src/CLIHelper.ts#L55)

___

### dumpTable

▸ `Static`**dumpTable**(`options`: { `columns`: *string*[] ; `empty`: *string* ; `rows`: *string*[][]  }): *void*

#### Parameters:

Name | Type |
------ | ------ |
`options` | { `columns`: *string*[] ; `empty`: *string* ; `rows`: *string*[][]  } |

**Returns:** *void*

Defined in: [packages/cli/src/CLIHelper.ts:83](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/cli/src/CLIHelper.ts#L83)

___

### getConfigPaths

▸ `Static`**getConfigPaths**(): *Promise*<*string*[]\>

**Returns:** *Promise*<*string*[]\>

Defined in: [packages/cli/src/CLIHelper.ts:51](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/cli/src/CLIHelper.ts#L51)

___

### getConfiguration

▸ `Static`**getConfiguration**<D\>(`validate?`: *boolean*, `options?`: *Partial*<[*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>\>): *Promise*<[*Configuration*](core.configuration.md)<D\>\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`D` | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md), D\> | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\\> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`validate` | *boolean* | true |
`options` | *Partial*<[*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>\> | ... |

**Returns:** *Promise*<[*Configuration*](core.configuration.md)<D\>\>

Defined in: [packages/cli/src/CLIHelper.ts:9](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/cli/src/CLIHelper.ts#L9)

___

### getDriverDependencies

▸ `Static`**getDriverDependencies**(): *Promise*<*string*[]\>

**Returns:** *Promise*<*string*[]\>

Defined in: [packages/cli/src/CLIHelper.ts:33](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/cli/src/CLIHelper.ts#L33)

___

### getModuleVersion

▸ `Static`**getModuleVersion**(`name`: *string*): *Promise*<*string*\>

#### Parameters:

Name | Type |
------ | ------ |
`name` | *string* |

**Returns:** *Promise*<*string*\>

Defined in: [packages/cli/src/CLIHelper.ts:74](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/cli/src/CLIHelper.ts#L74)

___

### getNodeVersion

▸ `Static`**getNodeVersion**(): *string*

**Returns:** *string*

Defined in: [packages/cli/src/CLIHelper.ts:29](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/cli/src/CLIHelper.ts#L29)

___

### getORM

▸ `Static`**getORM**(`warnWhenNoEntities?`: *boolean*, `opts?`: *Partial*<[*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>\>): *Promise*<[*MikroORM*](core.mikroorm.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>\>

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`warnWhenNoEntities?` | *boolean* | - |
`opts` | *Partial*<[*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>\> | ... |

**Returns:** *Promise*<[*MikroORM*](core.mikroorm.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>\>

Defined in: [packages/cli/src/CLIHelper.ts:13](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/cli/src/CLIHelper.ts#L13)
