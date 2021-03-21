---
id: "core.countoptions"
title: "Interface: CountOptions<T>"
sidebar_label: "CountOptions"
custom_edit_url: null
hide_title: true
---

# Interface: CountOptions<T\>

[core](../modules/core.md).CountOptions

## Type parameters

Name |
:------ |
`T` |

## Properties

### cache

• `Optional` **cache**: *number* \| *boolean* \| [*string*, *number*]

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:114](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L114)

___

### filters

• `Optional` **filters**: *boolean* \| *string*[] \| [*Dictionary*](../modules/core.md#dictionary)<boolean \| [*Dictionary*](../modules/core.md#dictionary)<any\>\>

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:110](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L110)

___

### groupBy

• `Optional` **groupBy**: *string* \| *string*[]

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:112](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L112)

___

### having

• `Optional` **having**: [*FilterQuery*](../modules/core.md#filterquery)<T\> \| [*FilterQuery*](../modules/core.md#filterquery)<T\> & [*Dictionary*](../modules/core.md#dictionary)<any\>

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:113](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L113)

___

### schema

• `Optional` **schema**: *string*

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:111](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L111)
