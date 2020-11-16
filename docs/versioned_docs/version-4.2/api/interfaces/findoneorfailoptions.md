---
id: "findoneorfailoptions"
title: "Interface: FindOneOrFailOptions<T, P>"
sidebar_label: "FindOneOrFailOptions"
---

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`T` | - | - |
`P` | [Populate](../index.md#populate)&#60;T> | Populate\&#60;T> |

## Hierarchy

* [FindOneOptions](findoneoptions.md)&#60;T, P>

  ↳ **FindOneOrFailOptions**

## Properties

### failHandler

• `Optional` **failHandler**: (entityName: string, where: [Dictionary](../index.md#dictionary) \| [IPrimaryKey](../index.md#iprimarykey) \| any) => [Error](../classes/driverexception.md#error)

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:103](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/drivers/IDatabaseDriver.ts#L103)*

___

### lockMode

• `Optional` **lockMode**: [LockMode](../enums/lockmode.md)

*Inherited from [FindOneOptions](findoneoptions.md).[lockMode](findoneoptions.md#lockmode)*

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:98](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/drivers/IDatabaseDriver.ts#L98)*

___

### lockVersion

• `Optional` **lockVersion**: number \| Date

*Inherited from [FindOneOptions](findoneoptions.md).[lockVersion](findoneoptions.md#lockversion)*

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:99](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/drivers/IDatabaseDriver.ts#L99)*
