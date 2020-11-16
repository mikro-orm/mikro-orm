---
id: "configurationloader"
title: "Class: ConfigurationLoader"
sidebar_label: "ConfigurationLoader"
---

## Hierarchy

* **ConfigurationLoader**

## Methods

### getConfigPaths

▸ `Static`**getConfigPaths**(): Promise&#60;string[]>

*Defined in [packages/core/src/utils/ConfigurationLoader.ts:41](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/ConfigurationLoader.ts#L41)*

**Returns:** Promise&#60;string[]>

___

### getConfiguration

▸ `Static`**getConfiguration**&#60;D>(`validate?`: boolean, `options?`: Partial&#60;[Configuration](configuration.md)>): Promise&#60;[Configuration](configuration.md)&#60;D>>

*Defined in [packages/core/src/utils/ConfigurationLoader.ts:11](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/ConfigurationLoader.ts#L11)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`D` | [IDatabaseDriver](../interfaces/idatabasedriver.md) | IDatabaseDriver |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`validate` | boolean | true |
`options` | Partial&#60;[Configuration](configuration.md)> | {} |

**Returns:** Promise&#60;[Configuration](configuration.md)&#60;D>>

___

### getPackageConfig

▸ `Static`**getPackageConfig**(): Promise&#60;[Dictionary](../index.md#dictionary)>

*Defined in [packages/core/src/utils/ConfigurationLoader.ts:28](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/ConfigurationLoader.ts#L28)*

**Returns:** Promise&#60;[Dictionary](../index.md#dictionary)>

___

### getSettings

▸ `Static`**getSettings**(): Promise&#60;[Settings](../interfaces/settings.md)>

*Defined in [packages/core/src/utils/ConfigurationLoader.ts:36](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/ConfigurationLoader.ts#L36)*

**Returns:** Promise&#60;[Settings](../interfaces/settings.md)>

___

### getTsConfig

▸ `Static`**getTsConfig**(`tsConfigPath`: string): Promise&#60;[Dictionary](../index.md#dictionary)>

*Defined in [packages/core/src/utils/ConfigurationLoader.ts:83](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/ConfigurationLoader.ts#L83)*

#### Parameters:

Name | Type |
------ | ------ |
`tsConfigPath` | string |

**Returns:** Promise&#60;[Dictionary](../index.md#dictionary)>

___

### registerTsNode

▸ `Static`**registerTsNode**(`configPath?`: string): Promise&#60;void>

*Defined in [packages/core/src/utils/ConfigurationLoader.ts:61](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/ConfigurationLoader.ts#L61)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`configPath` | string | "tsconfig.json" |

**Returns:** Promise&#60;void>
