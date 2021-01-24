---
id: "core.driverexception"
title: "Class: DriverException"
sidebar_label: "DriverException"
hide_title: true
---

# Class: DriverException

[core](../modules/core.md).DriverException

Base class for all errors detected in the driver.

## Hierarchy

* *Error*

  ↳ **DriverException**

  ↳↳ [*ConnectionException*](core.connectionexception.md)

  ↳↳ [*ServerException*](core.serverexception.md)

## Constructors

### constructor

\+ **new DriverException**(`previous`: Error): [*DriverException*](core.driverexception.md)

#### Parameters:

Name | Type |
------ | ------ |
`previous` | Error |

**Returns:** [*DriverException*](core.driverexception.md)

Defined in: [packages/core/src/exceptions.ts:10](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/exceptions.ts#L10)

## Properties

### code

• `Optional` **code**: *undefined* \| *string*

Defined in: [packages/core/src/exceptions.ts:6](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/exceptions.ts#L6)

___

### errmsg

• `Optional` **errmsg**: *undefined* \| *string*

Defined in: [packages/core/src/exceptions.ts:10](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/exceptions.ts#L10)

___

### errno

• `Optional` **errno**: *undefined* \| *number*

Defined in: [packages/core/src/exceptions.ts:7](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/exceptions.ts#L7)

___

### message

• **message**: *string*

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:974

___

### name

• **name**: *string*

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:973

___

### prepareStackTrace

• `Optional` **prepareStackTrace**: *undefined* \| (`err`: Error, `stackTraces`: CallSite[]) => *any*

Optional override for formatting stack traces

**`see`** https://github.com/v8/v8/wiki/Stack%20Trace%20API#customizing-stack-traces

Defined in: node_modules/@types/node/globals.d.ts:11

___

### sqlMessage

• `Optional` **sqlMessage**: *undefined* \| *string*

Defined in: [packages/core/src/exceptions.ts:9](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/exceptions.ts#L9)

___

### sqlState

• `Optional` **sqlState**: *undefined* \| *string*

Defined in: [packages/core/src/exceptions.ts:8](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/exceptions.ts#L8)

___

### stack

• `Optional` **stack**: *undefined* \| *string*

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:975

___

### stackTraceLimit

• **stackTraceLimit**: *number*

Defined in: node_modules/@types/node/globals.d.ts:13

## Methods

### captureStackTrace

▸ **captureStackTrace**(`targetObject`: *object*, `constructorOpt?`: Function): *void*

Create .stack property on a target object

#### Parameters:

Name | Type |
------ | ------ |
`targetObject` | *object* |
`constructorOpt?` | Function |

**Returns:** *void*

Defined in: node_modules/@types/node/globals.d.ts:4
