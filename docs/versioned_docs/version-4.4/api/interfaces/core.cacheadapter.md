---
id: "core.cacheadapter"
title: "Interface: CacheAdapter"
sidebar_label: "CacheAdapter"
hide_title: true
---

# Interface: CacheAdapter

[core](../modules/core.md).CacheAdapter

## Hierarchy

* **CacheAdapter**

## Implemented by

* [*FileCacheAdapter*](../classes/core.filecacheadapter.md)
* [*MemoryCacheAdapter*](../classes/core.memorycacheadapter.md)
* [*NullCacheAdapter*](../classes/core.nullcacheadapter.md)

## Methods

### clear

▸ **clear**(): *Promise*<*void*\>

Clears all items stored in the cache.

**Returns:** *Promise*<*void*\>

Defined in: [packages/core/src/cache/CacheAdapter.ts:16](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/cache/CacheAdapter.ts#L16)

___

### get

▸ **get**(`name`: *string*): *Promise*<*any*\>

Gets the items under `name` key from the cache.

#### Parameters:

Name | Type |
------ | ------ |
`name` | *string* |

**Returns:** *Promise*<*any*\>

Defined in: [packages/core/src/cache/CacheAdapter.ts:6](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/cache/CacheAdapter.ts#L6)

___

### set

▸ **set**(`name`: *string*, `data`: *any*, `origin`: *string*, `expiration?`: *number*): *Promise*<*void*\>

Sets the item to the cache. `origin` is used for cache invalidation and should reflect the change in data.

#### Parameters:

Name | Type |
------ | ------ |
`name` | *string* |
`data` | *any* |
`origin` | *string* |
`expiration?` | *number* |

**Returns:** *Promise*<*void*\>

Defined in: [packages/core/src/cache/CacheAdapter.ts:11](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/cache/CacheAdapter.ts#L11)
