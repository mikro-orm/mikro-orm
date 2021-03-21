---
id: "core.findoneorfailoptions"
title: "Interface: FindOneOrFailOptions<T, P>"
sidebar_label: "FindOneOrFailOptions"
custom_edit_url: null
hide_title: true
---

# Interface: FindOneOrFailOptions<T, P\>

[core](../modules/core.md).FindOneOrFailOptions

## Type parameters

Name | Type | Default |
:------ | :------ | :------ |
`T` | - | - |
`P` | [*Populate*](../modules/core.md#populate)<T\> | [*Populate*](../modules/core.md#populate)<T\> |

## Hierarchy

* [*FindOneOptions*](core.findoneoptions.md)<T, P\>

  ↳ **FindOneOrFailOptions**

## Properties

### cache

• `Optional` **cache**: *number* \| *boolean* \| [*string*, *number*]

Inherited from: [FindOneOptions](core.findoneoptions.md).[cache](core.findoneoptions.md#cache)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:85](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L85)

___

### convertCustomTypes

• `Optional` **convertCustomTypes**: *boolean*

Inherited from: [FindOneOptions](core.findoneoptions.md).[convertCustomTypes](core.findoneoptions.md#convertcustomtypes)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:89](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L89)

___

### disableIdentityMap

• `Optional` **disableIdentityMap**: *boolean*

Inherited from: [FindOneOptions](core.findoneoptions.md).[disableIdentityMap](core.findoneoptions.md#disableidentitymap)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:90](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L90)

___

### failHandler

• `Optional` **failHandler**: (`entityName`: *string*, `where`: *any*) => Error

#### Type declaration:

▸ (`entityName`: *string*, `where`: *any*): Error

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`where` | *any* |

**Returns:** Error

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:106](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L106)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:106](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L106)

___

### fields

• `Optional` **fields**: (*string* \| [*FieldsMap*](../modules/core.md#fieldsmap))[]

Inherited from: [FindOneOptions](core.findoneoptions.md).[fields](core.findoneoptions.md#fields)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:91](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L91)

___

### filters

• `Optional` **filters**: *boolean* \| *string*[] \| [*Dictionary*](../modules/core.md#dictionary)<boolean \| [*Dictionary*](../modules/core.md#dictionary)<any\>\>

Inherited from: [FindOneOptions](core.findoneoptions.md).[filters](core.findoneoptions.md#filters)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:97](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L97)

___

### flags

• `Optional` **flags**: [*QueryFlag*](../enums/core.queryflag.md)[]

Inherited from: [FindOneOptions](core.findoneoptions.md).[flags](core.findoneoptions.md#flags)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:93](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L93)

___

### groupBy

• `Optional` **groupBy**: *string* \| *string*[]

Inherited from: [FindOneOptions](core.findoneoptions.md).[groupBy](core.findoneoptions.md#groupby)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:94](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L94)

___

### having

• `Optional` **having**: [*FilterQuery*](../modules/core.md#filterquery)<T\> \| [*FilterQuery*](../modules/core.md#filterquery)<T\> & [*Dictionary*](../modules/core.md#dictionary)<any\>

Inherited from: [FindOneOptions](core.findoneoptions.md).[having](core.findoneoptions.md#having)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:95](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L95)

___

### lockMode

• `Optional` **lockMode**: [*LockMode*](../enums/core.lockmode.md)

Inherited from: [FindOneOptions](core.findoneoptions.md).[lockMode](core.findoneoptions.md#lockmode)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:101](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L101)

___

### lockVersion

• `Optional` **lockVersion**: *number* \| Date

Inherited from: [FindOneOptions](core.findoneoptions.md).[lockVersion](core.findoneoptions.md#lockversion)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:102](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L102)

___

### orderBy

• `Optional` **orderBy**: [*QueryOrderMap*](core.queryordermap.md)

Inherited from: [FindOneOptions](core.findoneoptions.md).[orderBy](core.findoneoptions.md#orderby)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:84](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L84)

___

### populate

• `Optional` **populate**: P

Inherited from: [FindOneOptions](core.findoneoptions.md).[populate](core.findoneoptions.md#populate)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:83](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L83)

___

### refresh

• `Optional` **refresh**: *boolean*

Inherited from: [FindOneOptions](core.findoneoptions.md).[refresh](core.findoneoptions.md#refresh)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:88](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L88)

___

### schema

• `Optional` **schema**: *string*

Inherited from: [FindOneOptions](core.findoneoptions.md).[schema](core.findoneoptions.md#schema)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:92](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L92)

___

### strategy

• `Optional` **strategy**: [*LoadStrategy*](../enums/core.loadstrategy.md)

Inherited from: [FindOneOptions](core.findoneoptions.md).[strategy](core.findoneoptions.md#strategy)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:96](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L96)
