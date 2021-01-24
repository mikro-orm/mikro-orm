---
id: "core.configurationloader"
title: "Class: ConfigurationLoader"
sidebar_label: "ConfigurationLoader"
hide_title: true
---

# Class: ConfigurationLoader

[core](../modules/core.md).ConfigurationLoader

## Hierarchy

* **ConfigurationLoader**

## Constructors

### constructor

\+ **new ConfigurationLoader**(): [*ConfigurationLoader*](core.configurationloader.md)

**Returns:** [*ConfigurationLoader*](core.configurationloader.md)

## Methods

### getConfigPaths

▸ `Static`**getConfigPaths**(): *Promise*<*string*[]\>

**Returns:** *Promise*<*string*[]\>

Defined in: [packages/core/src/utils/ConfigurationLoader.ts:41](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/ConfigurationLoader.ts#L41)

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

Defined in: [packages/core/src/utils/ConfigurationLoader.ts:11](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/ConfigurationLoader.ts#L11)

___

### getPackageConfig

▸ `Static`**getPackageConfig**(): *Promise*<[*Dictionary*](../modules/core.md#dictionary)<*any*\>\>

**Returns:** *Promise*<[*Dictionary*](../modules/core.md#dictionary)<*any*\>\>

Defined in: [packages/core/src/utils/ConfigurationLoader.ts:28](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/ConfigurationLoader.ts#L28)

___

### getSettings

▸ `Static`**getSettings**(): *Promise*<[*Settings*](../interfaces/core.settings.md)\>

**Returns:** *Promise*<[*Settings*](../interfaces/core.settings.md)\>

Defined in: [packages/core/src/utils/ConfigurationLoader.ts:36](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/ConfigurationLoader.ts#L36)

___

### getTsConfig

▸ `Static`**getTsConfig**(`tsConfigPath`: *string*): *Promise*<[*Dictionary*](../modules/core.md#dictionary)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`tsConfigPath` | *string* |

**Returns:** *Promise*<[*Dictionary*](../modules/core.md#dictionary)<*any*\>\>

Defined in: [packages/core/src/utils/ConfigurationLoader.ts:83](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/ConfigurationLoader.ts#L83)

___

### registerTsNode

▸ `Static`**registerTsNode**(`configPath?`: *string*): *Promise*<*void*\>

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`configPath` | *string* | 'tsconfig.json' |

**Returns:** *Promise*<*void*\>

Defined in: [packages/core/src/utils/ConfigurationLoader.ts:61](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/ConfigurationLoader.ts#L61)
