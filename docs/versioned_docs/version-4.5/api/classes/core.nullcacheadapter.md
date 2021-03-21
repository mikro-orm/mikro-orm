---
id: "core.nullcacheadapter"
title: "Class: NullCacheAdapter"
sidebar_label: "NullCacheAdapter"
custom_edit_url: null
hide_title: true
---

# Class: NullCacheAdapter

[core](../modules/core.md).NullCacheAdapter

## Implements

* [*CacheAdapter*](../interfaces/core.cacheadapter.md)

## Constructors

### constructor

\+ **new NullCacheAdapter**(): [*NullCacheAdapter*](core.nullcacheadapter.md)

**Returns:** [*NullCacheAdapter*](core.nullcacheadapter.md)

## Methods

### clear

▸ **clear**(): *Promise*<void\>

Clears all items stored in the cache.

**Returns:** *Promise*<void\>

Implementation of: [CacheAdapter](../interfaces/core.cacheadapter.md)

Defined in: [packages/core/src/cache/NullCacheAdapter.ts:22](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/cache/NullCacheAdapter.ts#L22)

___

### get

▸ **get**(`name`: *string*): *Promise*<any\>

Gets the items under `name` key from the cache.

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* |

**Returns:** *Promise*<any\>

Implementation of: [CacheAdapter](../interfaces/core.cacheadapter.md)

Defined in: [packages/core/src/cache/NullCacheAdapter.ts:8](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/cache/NullCacheAdapter.ts#L8)

___

### set

▸ **set**(`name`: *string*, `data`: *any*, `origin`: *string*): *Promise*<void\>

Sets the item to the cache. `origin` is used for cache invalidation and should reflect the change in data.

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* |
`data` | *any* |
`origin` | *string* |

**Returns:** *Promise*<void\>

Implementation of: [CacheAdapter](../interfaces/core.cacheadapter.md)

Defined in: [packages/core/src/cache/NullCacheAdapter.ts:15](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/cache/NullCacheAdapter.ts#L15)
