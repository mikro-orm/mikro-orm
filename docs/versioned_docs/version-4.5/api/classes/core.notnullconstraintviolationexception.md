---
id: "core.notnullconstraintviolationexception"
title: "Class: NotNullConstraintViolationException"
sidebar_label: "NotNullConstraintViolationException"
custom_edit_url: null
hide_title: true
---

# Class: NotNullConstraintViolationException

[core](../modules/core.md).NotNullConstraintViolationException

Exception for a NOT NULL constraint violation detected in the driver.

## Hierarchy

* [*ConstraintViolationException*](core.constraintviolationexception.md)

  ↳ **NotNullConstraintViolationException**

## Constructors

### constructor

\+ **new NotNullConstraintViolationException**(`previous`: Error): [*NotNullConstraintViolationException*](core.notnullconstraintviolationexception.md)

#### Parameters:

Name | Type |
:------ | :------ |
`previous` | Error |

**Returns:** [*NotNullConstraintViolationException*](core.notnullconstraintviolationexception.md)

Inherited from: [ConstraintViolationException](core.constraintviolationexception.md)

Defined in: [packages/core/src/exceptions.ts:10](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/exceptions.ts#L10)

## Properties

### code

• `Optional` **code**: *string*

Inherited from: [ConstraintViolationException](core.constraintviolationexception.md).[code](core.constraintviolationexception.md#code)

Defined in: [packages/core/src/exceptions.ts:6](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/exceptions.ts#L6)

___

### errmsg

• `Optional` **errmsg**: *string*

Inherited from: [ConstraintViolationException](core.constraintviolationexception.md).[errmsg](core.constraintviolationexception.md#errmsg)

Defined in: [packages/core/src/exceptions.ts:10](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/exceptions.ts#L10)

___

### errno

• `Optional` **errno**: *number*

Inherited from: [ConstraintViolationException](core.constraintviolationexception.md).[errno](core.constraintviolationexception.md#errno)

Defined in: [packages/core/src/exceptions.ts:7](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/exceptions.ts#L7)

___

### message

• **message**: *string*

Inherited from: [ConstraintViolationException](core.constraintviolationexception.md).[message](core.constraintviolationexception.md#message)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:974

___

### name

• **name**: *string*

Inherited from: [ConstraintViolationException](core.constraintviolationexception.md).[name](core.constraintviolationexception.md#name)

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

Inherited from: [ConstraintViolationException](core.constraintviolationexception.md).[prepareStackTrace](core.constraintviolationexception.md#preparestacktrace)

Defined in: node_modules/@types/node/globals.d.ts:11

___

### sqlMessage

• `Optional` **sqlMessage**: *string*

Inherited from: [ConstraintViolationException](core.constraintviolationexception.md).[sqlMessage](core.constraintviolationexception.md#sqlmessage)

Defined in: [packages/core/src/exceptions.ts:9](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/exceptions.ts#L9)

___

### sqlState

• `Optional` **sqlState**: *string*

Inherited from: [ConstraintViolationException](core.constraintviolationexception.md).[sqlState](core.constraintviolationexception.md#sqlstate)

Defined in: [packages/core/src/exceptions.ts:8](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/exceptions.ts#L8)

___

### stack

• `Optional` **stack**: *string*

Inherited from: [ConstraintViolationException](core.constraintviolationexception.md).[stack](core.constraintviolationexception.md#stack)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:975

___

### stackTraceLimit

• **stackTraceLimit**: *number*

Inherited from: [ConstraintViolationException](core.constraintviolationexception.md).[stackTraceLimit](core.constraintviolationexception.md#stacktracelimit)

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

Inherited from: [ConstraintViolationException](core.constraintviolationexception.md)

Defined in: node_modules/@types/node/globals.d.ts:4
