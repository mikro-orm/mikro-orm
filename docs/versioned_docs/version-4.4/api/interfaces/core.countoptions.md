---
id: "core.countoptions"
title: "Interface: CountOptions<T>"
sidebar_label: "CountOptions"
hide_title: true
---

# Interface: CountOptions<T\>

[core](../modules/core.md).CountOptions

## Type parameters

Name |
------ |
`T` |

## Hierarchy

* **CountOptions**

## Properties

### cache

• `Optional` **cache**: *undefined* \| *number* \| *boolean* \| [*string*, *number*]

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:114](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L114)

___

### filters

• `Optional` **filters**: *undefined* \| *boolean* \| *string*[] \| [*Dictionary*](../modules/core.md#dictionary)<*boolean* \| [*Dictionary*](../modules/core.md#dictionary)<*any*\>\>

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:110](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L110)

___

### groupBy

• `Optional` **groupBy**: *undefined* \| *string* \| *string*[]

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:112](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L112)

___

### having

• `Optional` **having**: *undefined* \| { `__@PrimaryKeyType@41543?`: *any*  } \| { `__@PrimaryKeyType@41543?`: *any*  } & [*Dictionary*](../modules/core.md#dictionary)<*any*\> \| *NonNullable*<*Query*<T\>\> \| *NonNullable*<*Query*<T\>\> & [*Dictionary*](../modules/core.md#dictionary)<*any*\>

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:113](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L113)

___

### schema

• `Optional` **schema**: *undefined* \| *string*

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:111](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L111)
