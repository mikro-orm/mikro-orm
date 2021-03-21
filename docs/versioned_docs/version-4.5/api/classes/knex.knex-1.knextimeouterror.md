---
id: "knex.knex-1.knextimeouterror"
title: "Class: KnexTimeoutError"
sidebar_label: "KnexTimeoutError"
custom_edit_url: null
hide_title: true
---

# Class: KnexTimeoutError

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).KnexTimeoutError

## Hierarchy

* *Error*

  ↳ **KnexTimeoutError**

## Constructors

### constructor

\+ **new KnexTimeoutError**(`message?`: *string*): [*KnexTimeoutError*](knex.knex-1.knextimeouterror.md)

#### Parameters:

Name | Type |
:------ | :------ |
`message?` | *string* |

**Returns:** [*KnexTimeoutError*](knex.knex-1.knextimeouterror.md)

Inherited from: void

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:978

## Properties

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
