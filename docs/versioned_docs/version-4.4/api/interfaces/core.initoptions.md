---
id: "core.initoptions"
title: "Interface: InitOptions<T>"
sidebar_label: "InitOptions"
hide_title: true
---

# Interface: InitOptions<T\>

[core](../modules/core.md).InitOptions

## Type parameters

Name |
------ |
`T` |

## Hierarchy

* **InitOptions**

## Properties

### orderBy

• `Optional` **orderBy**: *undefined* \| [*QueryOrderMap*](core.queryordermap.md)

Defined in: [packages/core/src/entity/Collection.ts:340](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L340)

___

### populate

• `Optional` **populate**: *undefined* \| *boolean* \| readonly *string*[] \| [*SELECT\_IN*](../enums/core.loadstrategy.md#select_in) \| [*JOINED*](../enums/core.loadstrategy.md#joined) \| readonly keyof T[] \| *PopulateChildren*<T\>

Defined in: [packages/core/src/entity/Collection.ts:339](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L339)

___

### where

• `Optional` **where**: *undefined* \| { `__@PrimaryKeyType@41543?`: *any*  } \| *NonNullable*<*Query*<T\>\>

Defined in: [packages/core/src/entity/Collection.ts:341](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/Collection.ts#L341)
