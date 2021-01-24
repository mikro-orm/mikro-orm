---
id: "core.findoneoptions"
title: "Interface: FindOneOptions<T, P>"
sidebar_label: "FindOneOptions"
hide_title: true
---

# Interface: FindOneOptions<T, P\>

[core](../modules/core.md).FindOneOptions

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`T` | - | - |
`P` | [*Populate*](../modules/core.md#populate)<T\> | [*Populate*](../modules/core.md#populate)<T\\> |

## Hierarchy

* *Omit*<[*FindOptions*](core.findoptions.md)<T, P\>, *limit* \| *offset*\>

  ↳ **FindOneOptions**

  ↳↳ [*FindOneOrFailOptions*](core.findoneorfailoptions.md)

## Properties

### cache

• `Optional` **cache**: *undefined* \| *number* \| *boolean* \| [*string*, *number*]

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:85](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L85)

___

### convertCustomTypes

• `Optional` **convertCustomTypes**: *undefined* \| *boolean*

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:89](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L89)

___

### disableIdentityMap

• `Optional` **disableIdentityMap**: *undefined* \| *boolean*

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:90](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L90)

___

### fields

• `Optional` **fields**: *undefined* \| (*string* \| [*FieldsMap*](../modules/core.md#fieldsmap))[]

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:91](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L91)

___

### filters

• `Optional` **filters**: *undefined* \| *boolean* \| *string*[] \| [*Dictionary*](../modules/core.md#dictionary)<*boolean* \| [*Dictionary*](../modules/core.md#dictionary)<*any*\>\>

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:97](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L97)

___

### flags

• `Optional` **flags**: *undefined* \| [*QueryFlag*](../enums/core.queryflag.md)[]

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:93](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L93)

___

### groupBy

• `Optional` **groupBy**: *undefined* \| *string* \| *string*[]

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:94](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L94)

___

### having

• `Optional` **having**: *undefined* \| { `__@PrimaryKeyType@41543?`: *any*  } \| { `__@PrimaryKeyType@41543?`: *any*  } & [*Dictionary*](../modules/core.md#dictionary)<*any*\> \| *NonNullable*<*Query*<T\>\> \| *NonNullable*<*Query*<T\>\> & [*Dictionary*](../modules/core.md#dictionary)<*any*\>

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:95](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L95)

___

### lockMode

• `Optional` **lockMode**: *undefined* \| [*NONE*](../enums/core.lockmode.md#none) \| [*OPTIMISTIC*](../enums/core.lockmode.md#optimistic) \| [*PESSIMISTIC\_READ*](../enums/core.lockmode.md#pessimistic_read) \| [*PESSIMISTIC\_WRITE*](../enums/core.lockmode.md#pessimistic_write)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:101](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L101)

___

### lockVersion

• `Optional` **lockVersion**: *undefined* \| *number* \| Date

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:102](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L102)

___

### orderBy

• `Optional` **orderBy**: *undefined* \| [*QueryOrderMap*](core.queryordermap.md)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:84](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L84)

___

### populate

• `Optional` **populate**: *undefined* \| P

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:83](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L83)

___

### refresh

• `Optional` **refresh**: *undefined* \| *boolean*

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:88](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L88)

___

### schema

• `Optional` **schema**: *undefined* \| *string*

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:92](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L92)

___

### strategy

• `Optional` **strategy**: *undefined* \| [*SELECT\_IN*](../enums/core.loadstrategy.md#select_in) \| [*JOINED*](../enums/core.loadstrategy.md#joined)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:96](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L96)
