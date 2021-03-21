---
id: "core.uniqueoptions"
title: "Interface: UniqueOptions<T>"
sidebar_label: "UniqueOptions"
custom_edit_url: null
hide_title: true
---

# Interface: UniqueOptions<T\>

[core](../modules/core.md).UniqueOptions

## Type parameters

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

## Hierarchy

* **UniqueOptions**

  ↳ [*IndexOptions*](core.indexoptions.md)

## Properties

### name

• `Optional` **name**: *string*

Defined in: [packages/core/src/decorators/Indexed.ts:29](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Indexed.ts#L29)

___

### options

• `Optional` **options**: [*Dictionary*](../modules/core.md#dictionary)<any\>

Defined in: [packages/core/src/decorators/Indexed.ts:31](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Indexed.ts#L31)

___

### properties

• `Optional` **properties**: keyof T \| keyof T[]

Defined in: [packages/core/src/decorators/Indexed.ts:30](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Indexed.ts#L30)
