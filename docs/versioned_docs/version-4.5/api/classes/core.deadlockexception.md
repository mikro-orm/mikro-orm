---
id: "core.deadlockexception"
title: "Class: DeadlockException"
sidebar_label: "DeadlockException"
custom_edit_url: null
hide_title: true
---

# Class: DeadlockException

[core](../modules/core.md).DeadlockException

Exception for a deadlock error of a transaction detected in the driver.

## Hierarchy

* [*ServerException*](core.serverexception.md)

  ↳ **DeadlockException**

## Constructors

### constructor

\+ **new DeadlockException**(`previous`: Error): [*DeadlockException*](core.deadlockexception.md)

#### Parameters:

Name | Type |
:------ | :------ |
`previous` | Error |

**Returns:** [*DeadlockException*](core.deadlockexception.md)

Inherited from: [ServerException](core.serverexception.md)

Defined in: [packages/core/src/exceptions.ts:10](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/exceptions.ts#L10)

## Properties

### code

• `Optional` **code**: *string*

Inherited from: [ServerException](core.serverexception.md).[code](core.serverexception.md#code)

Defined in: [packages/core/src/exceptions.ts:6](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/exceptions.ts#L6)

___

### errmsg

• `Optional` **errmsg**: *string*

Inherited from: [ServerException](core.serverexception.md).[errmsg](core.serverexception.md#errmsg)

Defined in: [packages/core/src/exceptions.ts:10](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/exceptions.ts#L10)

___

### errno

• `Optional` **errno**: *number*

Inherited from: [ServerException](core.serverexception.md).[errno](core.serverexception.md#errno)

Defined in: [packages/core/src/exceptions.ts:7](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/exceptions.ts#L7)

___

### message

• **message**: *string*

Inherited from: [ServerException](core.serverexception.md).[message](core.serverexception.md#message)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:974

___

### name

• **name**: *string*

Inherited from: [ServerException](core.serverexception.md).[name](core.serverexception.md#name)

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

Inherited from: [ServerException](core.serverexception.md).[prepareStackTrace](core.serverexception.md#preparestacktrace)

Defined in: node_modules/@types/node/globals.d.ts:11

___

### sqlMessage

• `Optional` **sqlMessage**: *string*

Inherited from: [ServerException](core.serverexception.md).[sqlMessage](core.serverexception.md#sqlmessage)

Defined in: [packages/core/src/exceptions.ts:9](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/exceptions.ts#L9)

___

### sqlState

• `Optional` **sqlState**: *string*

Inherited from: [ServerException](core.serverexception.md).[sqlState](core.serverexception.md#sqlstate)

Defined in: [packages/core/src/exceptions.ts:8](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/exceptions.ts#L8)

___

### stack

• `Optional` **stack**: *string*

Inherited from: [ServerException](core.serverexception.md).[stack](core.serverexception.md#stack)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:975

___

### stackTraceLimit

• **stackTraceLimit**: *number*

Inherited from: [ServerException](core.serverexception.md).[stackTraceLimit](core.serverexception.md#stacktracelimit)

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

Inherited from: [ServerException](core.serverexception.md)

Defined in: node_modules/@types/node/globals.d.ts:4
