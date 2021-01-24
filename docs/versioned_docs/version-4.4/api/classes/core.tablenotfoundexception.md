---
id: "core.tablenotfoundexception"
title: "Class: TableNotFoundException"
sidebar_label: "TableNotFoundException"
hide_title: true
---

# Class: TableNotFoundException

[core](../modules/core.md).TableNotFoundException

Exception for an unknown table referenced in a statement detected in the driver.

## Hierarchy

* [*DatabaseObjectNotFoundException*](core.databaseobjectnotfoundexception.md)

  ↳ **TableNotFoundException**

## Constructors

### constructor

\+ **new TableNotFoundException**(`previous`: Error): [*TableNotFoundException*](core.tablenotfoundexception.md)

#### Parameters:

Name | Type |
------ | ------ |
`previous` | Error |

**Returns:** [*TableNotFoundException*](core.tablenotfoundexception.md)

Inherited from: [DatabaseObjectNotFoundException](core.databaseobjectnotfoundexception.md)

Defined in: [packages/core/src/exceptions.ts:10](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/exceptions.ts#L10)

## Properties

### code

• `Optional` **code**: *undefined* \| *string*

Inherited from: [DatabaseObjectNotFoundException](core.databaseobjectnotfoundexception.md).[code](core.databaseobjectnotfoundexception.md#code)

Defined in: [packages/core/src/exceptions.ts:6](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/exceptions.ts#L6)

___

### errmsg

• `Optional` **errmsg**: *undefined* \| *string*

Inherited from: [DatabaseObjectNotFoundException](core.databaseobjectnotfoundexception.md).[errmsg](core.databaseobjectnotfoundexception.md#errmsg)

Defined in: [packages/core/src/exceptions.ts:10](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/exceptions.ts#L10)

___

### errno

• `Optional` **errno**: *undefined* \| *number*

Inherited from: [DatabaseObjectNotFoundException](core.databaseobjectnotfoundexception.md).[errno](core.databaseobjectnotfoundexception.md#errno)

Defined in: [packages/core/src/exceptions.ts:7](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/exceptions.ts#L7)

___

### message

• **message**: *string*

Inherited from: [DatabaseObjectNotFoundException](core.databaseobjectnotfoundexception.md).[message](core.databaseobjectnotfoundexception.md#message)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:974

___

### name

• **name**: *string*

Inherited from: [DatabaseObjectNotFoundException](core.databaseobjectnotfoundexception.md).[name](core.databaseobjectnotfoundexception.md#name)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:973

___

### prepareStackTrace

• `Optional` **prepareStackTrace**: *undefined* \| (`err`: Error, `stackTraces`: CallSite[]) => *any*

Optional override for formatting stack traces

**`see`** https://github.com/v8/v8/wiki/Stack%20Trace%20API#customizing-stack-traces

Inherited from: [DatabaseObjectNotFoundException](core.databaseobjectnotfoundexception.md).[prepareStackTrace](core.databaseobjectnotfoundexception.md#preparestacktrace)

Defined in: node_modules/@types/node/globals.d.ts:11

___

### sqlMessage

• `Optional` **sqlMessage**: *undefined* \| *string*

Inherited from: [DatabaseObjectNotFoundException](core.databaseobjectnotfoundexception.md).[sqlMessage](core.databaseobjectnotfoundexception.md#sqlmessage)

Defined in: [packages/core/src/exceptions.ts:9](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/exceptions.ts#L9)

___

### sqlState

• `Optional` **sqlState**: *undefined* \| *string*

Inherited from: [DatabaseObjectNotFoundException](core.databaseobjectnotfoundexception.md).[sqlState](core.databaseobjectnotfoundexception.md#sqlstate)

Defined in: [packages/core/src/exceptions.ts:8](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/exceptions.ts#L8)

___

### stack

• `Optional` **stack**: *undefined* \| *string*

Inherited from: [DatabaseObjectNotFoundException](core.databaseobjectnotfoundexception.md).[stack](core.databaseobjectnotfoundexception.md#stack)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:975

___

### stackTraceLimit

• **stackTraceLimit**: *number*

Inherited from: [DatabaseObjectNotFoundException](core.databaseobjectnotfoundexception.md).[stackTraceLimit](core.databaseobjectnotfoundexception.md#stacktracelimit)

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

Inherited from: [DatabaseObjectNotFoundException](core.databaseobjectnotfoundexception.md)

Defined in: node_modules/@types/node/globals.d.ts:4
