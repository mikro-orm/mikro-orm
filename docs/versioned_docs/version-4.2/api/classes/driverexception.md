---
id: "driverexception"
title: "Class: DriverException"
sidebar_label: "DriverException"
---

Base class for all errors detected in the driver.

## Hierarchy

* [Error](driverexception.md#error)

  ↳ **DriverException**

  ↳↳ [ConnectionException](connectionexception.md)

  ↳↳ [ServerException](serverexception.md)

## Constructors

### constructor

\+ **new DriverException**(`previous`: [Error](driverexception.md#error)): [DriverException](driverexception.md)

*Defined in [packages/core/src/exceptions.ts:10](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/exceptions.ts#L10)*

#### Parameters:

Name | Type |
------ | ------ |
`previous` | [Error](driverexception.md#error) |

**Returns:** [DriverException](driverexception.md)

## Properties

### code

• `Optional` **code**: string

*Defined in [packages/core/src/exceptions.ts:6](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/exceptions.ts#L6)*

___

### errmsg

• `Optional` **errmsg**: string

*Defined in [packages/core/src/exceptions.ts:10](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/exceptions.ts#L10)*

___

### errno

• `Optional` **errno**: number

*Defined in [packages/core/src/exceptions.ts:7](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/exceptions.ts#L7)*

___

### message

•  **message**: string

*Inherited from [DriverException](driverexception.md).[message](driverexception.md#message)*

*Defined in node_modules/typescript/lib/lib.es5.d.ts:974*

___

### name

•  **name**: string

*Inherited from [DriverException](driverexception.md).[name](driverexception.md#name)*

*Defined in node_modules/typescript/lib/lib.es5.d.ts:973*

___

### sqlMessage

• `Optional` **sqlMessage**: string

*Defined in [packages/core/src/exceptions.ts:9](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/exceptions.ts#L9)*

___

### sqlState

• `Optional` **sqlState**: string

*Defined in [packages/core/src/exceptions.ts:8](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/exceptions.ts#L8)*

___

### stack

• `Optional` **stack**: string

*Inherited from [DriverException](driverexception.md).[stack](driverexception.md#stack)*

*Defined in node_modules/typescript/lib/lib.es5.d.ts:975*

___

### Error

▪ `Static` **Error**: ErrorConstructor

*Defined in node_modules/typescript/lib/lib.es5.d.ts:984*
