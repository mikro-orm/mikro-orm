---
id: "core.indexoptions"
title: "Interface: IndexOptions<T>"
sidebar_label: "IndexOptions"
custom_edit_url: null
hide_title: true
---

# Interface: IndexOptions<T\>

[core](../modules/core.md).IndexOptions

## Type parameters

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

## Hierarchy

* [*UniqueOptions*](core.uniqueoptions.md)<T\>

  ↳ **IndexOptions**

## Properties

### name

• `Optional` **name**: *string*

Inherited from: [UniqueOptions](core.uniqueoptions.md).[name](core.uniqueoptions.md#name)

Defined in: [packages/core/src/decorators/Indexed.ts:29](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Indexed.ts#L29)

___

### options

• `Optional` **options**: [*Dictionary*](../modules/core.md#dictionary)<any\>

Inherited from: [UniqueOptions](core.uniqueoptions.md).[options](core.uniqueoptions.md#options)

Defined in: [packages/core/src/decorators/Indexed.ts:31](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Indexed.ts#L31)

___

### properties

• `Optional` **properties**: keyof T \| keyof T[]

Inherited from: [UniqueOptions](core.uniqueoptions.md).[properties](core.uniqueoptions.md#properties)

Defined in: [packages/core/src/decorators/Indexed.ts:30](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Indexed.ts#L30)

___

### type

• `Optional` **type**: *string*

Defined in: [packages/core/src/decorators/Indexed.ts:35](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Indexed.ts#L35)
