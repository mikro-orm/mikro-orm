---
id: "core.findoneoptions"
title: "Interface: FindOneOptions<T, P>"
sidebar_label: "FindOneOptions"
custom_edit_url: null
hide_title: true
---

# Interface: FindOneOptions<T, P\>

[core](../modules/core.md).FindOneOptions

## Type parameters

Name | Type | Default |
:------ | :------ | :------ |
`T` | - | - |
`P` | [*Populate*](../modules/core.md#populate)<T\> | [*Populate*](../modules/core.md#populate)<T\> |

## Hierarchy

* *Omit*<[*FindOptions*](core.findoptions.md)<T, P\>, *limit* \| *offset*\>

  ↳ **FindOneOptions**

  ↳↳ [*FindOneOrFailOptions*](core.findoneorfailoptions.md)

## Properties

### cache

• `Optional` **cache**: *number* \| *boolean* \| [*string*, *number*]

Inherited from: void

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:85](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L85)

___

### convertCustomTypes

• `Optional` **convertCustomTypes**: *boolean*

Inherited from: void

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:89](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L89)

___

### disableIdentityMap

• `Optional` **disableIdentityMap**: *boolean*

Inherited from: void

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:90](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L90)

___

### fields

• `Optional` **fields**: (*string* \| [*FieldsMap*](../modules/core.md#fieldsmap))[]

Inherited from: void

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:91](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L91)

___

### filters

• `Optional` **filters**: *boolean* \| *string*[] \| [*Dictionary*](../modules/core.md#dictionary)<boolean \| [*Dictionary*](../modules/core.md#dictionary)<any\>\>

Inherited from: void

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:97](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L97)

___

### flags

• `Optional` **flags**: [*QueryFlag*](../enums/core.queryflag.md)[]

Inherited from: void

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:93](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L93)

___

### groupBy

• `Optional` **groupBy**: *string* \| *string*[]

Inherited from: void

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:94](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L94)

___

### having

• `Optional` **having**: [*FilterQuery*](../modules/core.md#filterquery)<T\> \| [*FilterQuery*](../modules/core.md#filterquery)<T\> & [*Dictionary*](../modules/core.md#dictionary)<any\>

Inherited from: void

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:95](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L95)

___

### lockMode

• `Optional` **lockMode**: [*LockMode*](../enums/core.lockmode.md)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:101](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L101)

___

### lockVersion

• `Optional` **lockVersion**: *number* \| Date

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:102](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L102)

___

### orderBy

• `Optional` **orderBy**: [*QueryOrderMap*](core.queryordermap.md)

Inherited from: void

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:84](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L84)

___

### populate

• `Optional` **populate**: P

Inherited from: void

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:83](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L83)

___

### refresh

• `Optional` **refresh**: *boolean*

Inherited from: void

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:88](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L88)

___

### schema

• `Optional` **schema**: *string*

Inherited from: void

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:92](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L92)

___

### strategy

• `Optional` **strategy**: [*LoadStrategy*](../enums/core.loadstrategy.md)

Inherited from: void

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:96](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L96)
