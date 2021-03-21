---
id: "core.memorycacheadapter"
title: "Class: MemoryCacheAdapter"
sidebar_label: "MemoryCacheAdapter"
custom_edit_url: null
hide_title: true
---

# Class: MemoryCacheAdapter

[core](../modules/core.md).MemoryCacheAdapter

## Implements

* [*CacheAdapter*](../interfaces/core.cacheadapter.md)

## Constructors

### constructor

\+ **new MemoryCacheAdapter**(`options`: { `expiration`: *number*  }): [*MemoryCacheAdapter*](core.memorycacheadapter.md)

#### Parameters:

Name | Type |
:------ | :------ |
`options` | *object* |
`options.expiration` | *number* |

**Returns:** [*MemoryCacheAdapter*](core.memorycacheadapter.md)

Defined in: [packages/core/src/cache/MemoryCacheAdapter.ts:5](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/cache/MemoryCacheAdapter.ts#L5)

## Properties

### data

• `Private` `Readonly` **data**: *Map*<string, { `data`: *any* ; `expiration`: *number*  }\>

Defined in: [packages/core/src/cache/MemoryCacheAdapter.ts:5](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/cache/MemoryCacheAdapter.ts#L5)

## Methods

### clear

▸ **clear**(): *Promise*<void\>

Clears all items stored in the cache.

**Returns:** *Promise*<void\>

Implementation of: [CacheAdapter](../interfaces/core.cacheadapter.md)

Defined in: [packages/core/src/cache/MemoryCacheAdapter.ts:36](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/cache/MemoryCacheAdapter.ts#L36)

___

### get

▸ **get**(`name`: *string*): *Promise*<undefined \| T\>

Gets the items under `name` key from the cache.

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* |

**Returns:** *Promise*<undefined \| T\>

Implementation of: [CacheAdapter](../interfaces/core.cacheadapter.md)

Defined in: [packages/core/src/cache/MemoryCacheAdapter.ts:12](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/cache/MemoryCacheAdapter.ts#L12)

___

### set

▸ **set**(`name`: *string*, `data`: *any*, `origin`: *string*, `expiration?`: *number*): *Promise*<void\>

Sets the item to the cache. `origin` is used for cache invalidation and should reflect the change in data.

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* |
`data` | *any* |
`origin` | *string* |
`expiration?` | *number* |

**Returns:** *Promise*<void\>

Implementation of: [CacheAdapter](../interfaces/core.cacheadapter.md)

Defined in: [packages/core/src/cache/MemoryCacheAdapter.ts:29](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/cache/MemoryCacheAdapter.ts#L29)
