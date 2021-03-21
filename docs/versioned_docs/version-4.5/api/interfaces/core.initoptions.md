---
id: "core.initoptions"
title: "Interface: InitOptions<T>"
sidebar_label: "InitOptions"
custom_edit_url: null
hide_title: true
---

# Interface: InitOptions<T\>

[core](../modules/core.md).InitOptions

## Type parameters

Name |
:------ |
`T` |

## Properties

### orderBy

• `Optional` **orderBy**: [*QueryOrderMap*](core.queryordermap.md)

Defined in: [packages/core/src/entity/Collection.ts:378](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L378)

___

### populate

• `Optional` **populate**: readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\>

Defined in: [packages/core/src/entity/Collection.ts:377](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L377)

___

### where

• `Optional` **where**: [*FilterQuery*](../modules/core.md#filterquery)<T\>

Defined in: [packages/core/src/entity/Collection.ts:379](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Collection.ts#L379)
