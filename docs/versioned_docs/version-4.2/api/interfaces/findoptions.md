---
id: "findoptions"
title: "Interface: FindOptions<T, P>"
sidebar_label: "FindOptions"
---

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`T` | - | - |
`P` | [Populate](../index.md#populate)&#60;T> | Populate\&#60;T> |

## Hierarchy

* **FindOptions**

## Properties

### cache

• `Optional` **cache**: boolean \| number \| [string, number]

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:83](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L83)*

___

### convertCustomTypes

• `Optional` **convertCustomTypes**: boolean

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:87](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L87)*

___

### fields

• `Optional` **fields**: string[]

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:88](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L88)*

___

### filters

• `Optional` **filters**: [Dictionary](../index.md#dictionary)&#60;boolean \| [Dictionary](../index.md#dictionary)> \| string[] \| boolean

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:94](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L94)*

___

### flags

• `Optional` **flags**: [QueryFlag](../enums/queryflag.md)[]

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:90](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L90)*

___

### groupBy

• `Optional` **groupBy**: string \| string[]

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:91](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L91)*

___

### having

• `Optional` **having**: [QBFilterQuery](../index.md#qbfilterquery)&#60;T>

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:92](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L92)*

___

### limit

• `Optional` **limit**: number

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:84](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L84)*

___

### offset

• `Optional` **offset**: number

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:85](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L85)*

___

### orderBy

• `Optional` **orderBy**: [QueryOrderMap](queryordermap.md)

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:82](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L82)*

___

### populate

• `Optional` **populate**: P

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:81](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L81)*

___

### refresh

• `Optional` **refresh**: boolean

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:86](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L86)*

___

### schema

• `Optional` **schema**: string

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:89](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L89)*

___

### strategy

• `Optional` **strategy**: [LoadStrategy](../enums/loadstrategy.md)

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:93](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L93)*
