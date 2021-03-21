---
id: "core.matchingoptions"
title: "Interface: MatchingOptions<T, P>"
sidebar_label: "MatchingOptions"
custom_edit_url: null
hide_title: true
---

# Interface: MatchingOptions<T, P\>

[core](../modules/core.md).MatchingOptions

## Type parameters

Name | Type | Default |
:------ | :------ | :------ |
`T` | - | - |
`P` | [*Populate*](../modules/core.md#populate)<T\> | [*Populate*](../modules/core.md#populate)<T\> |

## Hierarchy

* [*FindOptions*](core.findoptions.md)<T, P\>

  ↳ **MatchingOptions**

## Properties

### cache

• `Optional` **cache**: *number* \| *boolean* \| [*string*, *number*]

Inherited from: [FindOptions](core.findoptions.md).[cache](core.findoptions.md#cache)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:85](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L85)

___

### convertCustomTypes

• `Optional` **convertCustomTypes**: *boolean*

Inherited from: [FindOptions](core.findoptions.md).[convertCustomTypes](core.findoptions.md#convertcustomtypes)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:89](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L89)

___

### ctx

• `Optional` **ctx**: *any*

Defined in: [packages/core/src/entity/Collection.ts:13](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L13)

___

### disableIdentityMap

• `Optional` **disableIdentityMap**: *boolean*

Inherited from: [FindOptions](core.findoptions.md).[disableIdentityMap](core.findoptions.md#disableidentitymap)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:90](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L90)

___

### fields

• `Optional` **fields**: (*string* \| [*FieldsMap*](../modules/core.md#fieldsmap))[]

Inherited from: [FindOptions](core.findoptions.md).[fields](core.findoptions.md#fields)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:91](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L91)

___

### filters

• `Optional` **filters**: *boolean* \| *string*[] \| [*Dictionary*](../modules/core.md#dictionary)<boolean \| [*Dictionary*](../modules/core.md#dictionary)<any\>\>

Inherited from: [FindOptions](core.findoptions.md).[filters](core.findoptions.md#filters)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:97](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L97)

___

### flags

• `Optional` **flags**: [*QueryFlag*](../enums/core.queryflag.md)[]

Inherited from: [FindOptions](core.findoptions.md).[flags](core.findoptions.md#flags)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:93](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L93)

___

### groupBy

• `Optional` **groupBy**: *string* \| *string*[]

Inherited from: [FindOptions](core.findoptions.md).[groupBy](core.findoptions.md#groupby)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:94](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L94)

___

### having

• `Optional` **having**: [*FilterQuery*](../modules/core.md#filterquery)<T\> \| [*FilterQuery*](../modules/core.md#filterquery)<T\> & [*Dictionary*](../modules/core.md#dictionary)<any\>

Inherited from: [FindOptions](core.findoptions.md).[having](core.findoptions.md#having)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:95](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L95)

___

### limit

• `Optional` **limit**: *number*

Inherited from: [FindOptions](core.findoptions.md).[limit](core.findoptions.md#limit)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:86](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L86)

___

### offset

• `Optional` **offset**: *number*

Inherited from: [FindOptions](core.findoptions.md).[offset](core.findoptions.md#offset)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:87](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L87)

___

### orderBy

• `Optional` **orderBy**: [*QueryOrderMap*](core.queryordermap.md)

Inherited from: [FindOptions](core.findoptions.md).[orderBy](core.findoptions.md#orderby)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:84](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L84)

___

### populate

• `Optional` **populate**: P

Inherited from: [FindOptions](core.findoptions.md).[populate](core.findoptions.md#populate)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:83](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L83)

___

### refresh

• `Optional` **refresh**: *boolean*

Inherited from: [FindOptions](core.findoptions.md).[refresh](core.findoptions.md#refresh)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:88](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L88)

___

### schema

• `Optional` **schema**: *string*

Inherited from: [FindOptions](core.findoptions.md).[schema](core.findoptions.md#schema)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:92](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L92)

___

### store

• `Optional` **store**: *boolean*

Defined in: [packages/core/src/entity/Collection.ts:12](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L12)

___

### strategy

• `Optional` **strategy**: [*LoadStrategy*](../enums/core.loadstrategy.md)

Inherited from: [FindOptions](core.findoptions.md).[strategy](core.findoptions.md#strategy)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:96](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L96)

___

### where

• `Optional` **where**: [*FilterQuery*](../modules/core.md#filterquery)<T\>

Defined in: [packages/core/src/entity/Collection.ts:11](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L11)
