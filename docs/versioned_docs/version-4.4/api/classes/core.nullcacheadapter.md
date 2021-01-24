---
id: "core.nullcacheadapter"
title: "Class: NullCacheAdapter"
sidebar_label: "NullCacheAdapter"
hide_title: true
---

# Class: NullCacheAdapter

[core](../modules/core.md).NullCacheAdapter

## Hierarchy

* **NullCacheAdapter**

## Implements

* [*CacheAdapter*](../interfaces/core.cacheadapter.md)

## Constructors

### constructor

\+ **new NullCacheAdapter**(): [*NullCacheAdapter*](core.nullcacheadapter.md)

**Returns:** [*NullCacheAdapter*](core.nullcacheadapter.md)

## Methods

### clear

▸ **clear**(): *Promise*<*void*\>

Clears all items stored in the cache.

**Returns:** *Promise*<*void*\>

Implementation of: [CacheAdapter](../interfaces/core.cacheadapter.md)

Defined in: [packages/core/src/cache/NullCacheAdapter.ts:22](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/cache/NullCacheAdapter.ts#L22)

___

### get

▸ **get**(`name`: *string*): *Promise*<*any*\>

Gets the items under `name` key from the cache.

#### Parameters:

Name | Type |
------ | ------ |
`name` | *string* |

**Returns:** *Promise*<*any*\>

Implementation of: [CacheAdapter](../interfaces/core.cacheadapter.md)

Defined in: [packages/core/src/cache/NullCacheAdapter.ts:8](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/cache/NullCacheAdapter.ts#L8)

___

### set

▸ **set**(`name`: *string*, `data`: *any*, `origin`: *string*): *Promise*<*void*\>

**`inheritdoc`** 

#### Parameters:

Name | Type |
------ | ------ |
`name` | *string* |
`data` | *any* |
`origin` | *string* |

**Returns:** *Promise*<*void*\>

Defined in: [packages/core/src/cache/NullCacheAdapter.ts:15](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/cache/NullCacheAdapter.ts#L15)
