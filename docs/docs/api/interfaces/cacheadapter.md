---
id: "cacheadapter"
title: "Interface: CacheAdapter"
sidebar_label: "CacheAdapter"
---

## Hierarchy

* **CacheAdapter**

## Implemented by

* [FileCacheAdapter](../classes/filecacheadapter.md)
* [MemoryCacheAdapter](../classes/memorycacheadapter.md)
* [NullCacheAdapter](../classes/nullcacheadapter.md)

## Methods

### clear

▸ **clear**(): Promise&#60;void>

*Defined in [packages/core/src/cache/CacheAdapter.ts:16](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/cache/CacheAdapter.ts#L16)*

Clears all items stored in the cache.

**Returns:** Promise&#60;void>

___

### get

▸ **get**(`name`: string): Promise&#60;any>

*Defined in [packages/core/src/cache/CacheAdapter.ts:6](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/cache/CacheAdapter.ts#L6)*

Gets the items under `name` key from the cache.

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** Promise&#60;any>

___

### set

▸ **set**(`name`: string, `data`: any, `origin`: string, `expiration?`: number): Promise&#60;void>

*Defined in [packages/core/src/cache/CacheAdapter.ts:11](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/cache/CacheAdapter.ts#L11)*

Sets the item to the cache. `origin` is used for cache invalidation and should reflect the change in data.

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |
`data` | any |
`origin` | string |
`expiration?` | number |

**Returns:** Promise&#60;void>
