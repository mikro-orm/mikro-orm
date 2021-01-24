---
id: "knex.knex.knextimeouterror"
title: "Class: KnexTimeoutError"
sidebar_label: "KnexTimeoutError"
hide_title: true
---

# Class: KnexTimeoutError

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).KnexTimeoutError

## Hierarchy

* *Error*

  ↳ **KnexTimeoutError**

## Constructors

### constructor

\+ **new KnexTimeoutError**(`message?`: *string*): [*KnexTimeoutError*](knex.knex.knextimeouterror.md)

#### Parameters:

Name | Type |
------ | ------ |
`message?` | *string* |

**Returns:** [*KnexTimeoutError*](knex.knex.knextimeouterror.md)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:978

## Properties

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
