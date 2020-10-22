---
id: "findoneoptions"
title: "Interface: FindOneOptions<T, P>"
sidebar_label: "FindOneOptions"
---

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`T` | - | - |
`P` | [Populate](../index.md#populate)&#60;T> | Populate\&#60;T> |

## Hierarchy

* {}

  ↳ **FindOneOptions**

  ↳↳ [FindOneOrFailOptions](findoneorfailoptions.md)

## Properties

### lockMode

• `Optional` **lockMode**: [LockMode](../enums/lockmode.md)

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:98](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L98)*

___

### lockVersion

• `Optional` **lockVersion**: number \| Date

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:99](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L99)*
