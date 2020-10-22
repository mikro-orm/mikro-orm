---
id: "nullcacheadapter"
title: "Class: NullCacheAdapter"
sidebar_label: "NullCacheAdapter"
---

## Hierarchy

* **NullCacheAdapter**

## Implements

* [CacheAdapter](../interfaces/cacheadapter.md)

## Methods

### clear

▸ **clear**(): Promise&#60;void>

*Implementation of [CacheAdapter](../interfaces/cacheadapter.md)*

*Defined in [packages/core/src/cache/NullCacheAdapter.ts:22](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/cache/NullCacheAdapter.ts#L22)*

Clears all items stored in the cache.

**Returns:** Promise&#60;void>

___

### get

▸ **get**(`name`: string): Promise&#60;any>

*Implementation of [CacheAdapter](../interfaces/cacheadapter.md)*

*Defined in [packages/core/src/cache/NullCacheAdapter.ts:8](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/cache/NullCacheAdapter.ts#L8)*

Gets the items under `name` key from the cache.

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** Promise&#60;any>

___

### set

▸ **set**(`name`: string, `data`: any, `origin`: string): Promise&#60;void>

*Defined in [packages/core/src/cache/NullCacheAdapter.ts:15](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/cache/NullCacheAdapter.ts#L15)*

**`inheritdoc`** 

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |
`data` | any |
`origin` | string |

**Returns:** Promise&#60;void>
