---
id: "core.driverexception"
title: "Class: DriverException"
sidebar_label: "DriverException"
custom_edit_url: null
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
:------ | :------ |
`previous` | Error |

**Returns:** [*DriverException*](core.driverexception.md)

Overrides: void

Defined in: [packages/core/src/exceptions.ts:10](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/exceptions.ts#L10)

## Properties

### code

• `Optional` **code**: *string*

Defined in: [packages/core/src/exceptions.ts:6](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/exceptions.ts#L6)

___

### errmsg

• `Optional` **errmsg**: *string*

Defined in: [packages/core/src/exceptions.ts:10](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/exceptions.ts#L10)

___

### errno

• `Optional` **errno**: *number*

Defined in: [packages/core/src/exceptions.ts:7](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/exceptions.ts#L7)

___

### message

• **message**: *string*

Inherited from: void

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:974

___

### name

• **name**: *string*

Inherited from: void

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:973

___

### prepareStackTrace

• `Optional` **prepareStackTrace**: (`err`: Error, `stackTraces`: CallSite[]) => *any*

Optional override for formatting stack traces

**`see`** https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Type declaration:

▸ (`err`: Error, `stackTraces`: CallSite[]): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`err` | Error |
`stackTraces` | CallSite[] |

**Returns:** *any*

Defined in: node_modules/@types/node/globals.d.ts:11

Defined in: node_modules/@types/node/globals.d.ts:11

___

### sqlMessage

• `Optional` **sqlMessage**: *string*

Defined in: [packages/core/src/exceptions.ts:9](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/exceptions.ts#L9)

___

### sqlState

• `Optional` **sqlState**: *string*

Defined in: [packages/core/src/exceptions.ts:8](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/exceptions.ts#L8)

___

### stack

• `Optional` **stack**: *string*

Inherited from: void

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
:------ | :------ |
`targetObject` | *object* |
`constructorOpt?` | Function |

**Returns:** *void*

Defined in: node_modules/@types/node/globals.d.ts:4
