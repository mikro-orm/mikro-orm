---
id: "core.logger"
title: "Class: Logger"
sidebar_label: "Logger"
hide_title: true
---

# Class: Logger

[core](../modules/core.md).Logger

## Hierarchy

* **Logger**

## Constructors

### constructor

\+ **new Logger**(`logger`: (`message`: *string*) => *void*, `debugMode?`: *boolean* \| [*LoggerNamespace*](../modules/core.md#loggernamespace)[]): [*Logger*](core.logger.md)

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`logger` | (`message`: *string*) => *void* | - |
`debugMode` | *boolean* \| [*LoggerNamespace*](../modules/core.md#loggernamespace)[] | false |

**Returns:** [*Logger*](core.logger.md)

Defined in: [packages/core/src/utils/Logger.ts:3](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Logger.ts#L3)

## Properties

### debugMode

• **debugMode**: *boolean* \| [*LoggerNamespace*](../modules/core.md#loggernamespace)[]= false

## Methods

### isEnabled

▸ **isEnabled**(`namespace`: [*LoggerNamespace*](../modules/core.md#loggernamespace)): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`namespace` | [*LoggerNamespace*](../modules/core.md#loggernamespace) |

**Returns:** *boolean*

Defined in: [packages/core/src/utils/Logger.ts:28](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Logger.ts#L28)

___

### log

▸ **log**(`namespace`: [*LoggerNamespace*](../modules/core.md#loggernamespace), `message`: *string*): *void*

Logs a message inside given namespace.

#### Parameters:

Name | Type |
------ | ------ |
`namespace` | [*LoggerNamespace*](../modules/core.md#loggernamespace) |
`message` | *string* |

**Returns:** *void*

Defined in: [packages/core/src/utils/Logger.ts:11](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Logger.ts#L11)

___

### setDebugMode

▸ **setDebugMode**(`debugMode`: *boolean* \| [*LoggerNamespace*](../modules/core.md#loggernamespace)[]): *void*

Sets active namespaces. Pass `true` to enable all logging.

#### Parameters:

Name | Type |
------ | ------ |
`debugMode` | *boolean* \| [*LoggerNamespace*](../modules/core.md#loggernamespace)[] |

**Returns:** *void*

Defined in: [packages/core/src/utils/Logger.ts:24](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Logger.ts#L24)
