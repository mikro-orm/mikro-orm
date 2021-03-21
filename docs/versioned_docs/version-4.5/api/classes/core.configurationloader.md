---
id: "core.configurationloader"
title: "Class: ConfigurationLoader"
sidebar_label: "ConfigurationLoader"
custom_edit_url: null
hide_title: true
---

# Class: ConfigurationLoader

[core](../modules/core.md).ConfigurationLoader

## Constructors

### constructor

\+ **new ConfigurationLoader**(): [*ConfigurationLoader*](core.configurationloader.md)

**Returns:** [*ConfigurationLoader*](core.configurationloader.md)

## Methods

### getConfigPaths

▸ `Static`**getConfigPaths**(): *Promise*<string[]\>

**Returns:** *Promise*<string[]\>

Defined in: [packages/core/src/utils/ConfigurationLoader.ts:47](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/ConfigurationLoader.ts#L47)

___

### getConfiguration

▸ `Static`**getConfiguration**<D\>(`validate?`: *boolean*, `options?`: *Partial*<[*Options*](../modules/core.md#options)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>\>): *Promise*<[*Configuration*](core.configuration.md)<D\>\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`D` | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md), D\> | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\> |

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`validate` | *boolean* | true |
`options?` | *Partial*<[*Options*](../modules/core.md#options)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>\> | - |

**Returns:** *Promise*<[*Configuration*](core.configuration.md)<D\>\>

Defined in: [packages/core/src/utils/ConfigurationLoader.ts:12](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/ConfigurationLoader.ts#L12)

___

### getPackageConfig

▸ `Static`**getPackageConfig**(): *Promise*<[*Dictionary*](../modules/core.md#dictionary)<any\>\>

**Returns:** *Promise*<[*Dictionary*](../modules/core.md#dictionary)<any\>\>

Defined in: [packages/core/src/utils/ConfigurationLoader.ts:34](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/ConfigurationLoader.ts#L34)

___

### getSettings

▸ `Static`**getSettings**(): *Promise*<[*Settings*](../interfaces/core.settings.md)\>

**Returns:** *Promise*<[*Settings*](../interfaces/core.settings.md)\>

Defined in: [packages/core/src/utils/ConfigurationLoader.ts:42](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/ConfigurationLoader.ts#L42)

___

### getTsConfig

▸ `Static`**getTsConfig**(`tsConfigPath`: *string*): *Promise*<[*Dictionary*](../modules/core.md#dictionary)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`tsConfigPath` | *string* |

**Returns:** *Promise*<[*Dictionary*](../modules/core.md#dictionary)<any\>\>

Defined in: [packages/core/src/utils/ConfigurationLoader.ts:89](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/ConfigurationLoader.ts#L89)

___

### loadEnvironmentVars

▸ `Static`**loadEnvironmentVars**<D\>(`options?`: [*Options*](../modules/core.md#options)<D\> \| [*Configuration*](core.configuration.md)<D\>): *Partial*<[*Options*](../modules/core.md#options)<D\>\>

#### Type parameters:

Name | Type |
:------ | :------ |
`D` | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md), D\> |

#### Parameters:

Name | Type |
:------ | :------ |
`options?` | [*Options*](../modules/core.md#options)<D\> \| [*Configuration*](core.configuration.md)<D\> |

**Returns:** *Partial*<[*Options*](../modules/core.md#options)<D\>\>

Defined in: [packages/core/src/utils/ConfigurationLoader.ts:94](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/ConfigurationLoader.ts#L94)

___

### registerTsNode

▸ `Static`**registerTsNode**(`configPath?`: *string*): *Promise*<void\>

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`configPath` | *string* | 'tsconfig.json' |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/utils/ConfigurationLoader.ts:67](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/ConfigurationLoader.ts#L67)
