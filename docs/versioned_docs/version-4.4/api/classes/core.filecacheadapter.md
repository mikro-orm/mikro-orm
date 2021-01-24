---
id: "core.filecacheadapter"
title: "Class: FileCacheAdapter"
sidebar_label: "FileCacheAdapter"
hide_title: true
---

# Class: FileCacheAdapter

[core](../modules/core.md).FileCacheAdapter

## Hierarchy

* **FileCacheAdapter**

## Implements

* [*CacheAdapter*](../interfaces/core.cacheadapter.md)

## Constructors

### constructor

\+ **new FileCacheAdapter**(`options`: { `cacheDir`: *string*  }, `baseDir`: *string*, `pretty?`: *boolean*): [*FileCacheAdapter*](core.filecacheadapter.md)

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`options` | { `cacheDir`: *string*  } | - |
`baseDir` | *string* | - |
`pretty` | *boolean* | false |

**Returns:** [*FileCacheAdapter*](core.filecacheadapter.md)

Defined in: [packages/core/src/cache/FileCacheAdapter.ts:9](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/cache/FileCacheAdapter.ts#L9)

## Properties

### VERSION

• `Private` `Readonly` **VERSION**: *string*

Defined in: [packages/core/src/cache/FileCacheAdapter.ts:9](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/cache/FileCacheAdapter.ts#L9)

## Methods

### clear

▸ **clear**(): *Promise*<*void*\>

Clears all items stored in the cache.

**Returns:** *Promise*<*void*\>

Implementation of: [CacheAdapter](../interfaces/core.cacheadapter.md)

Defined in: [packages/core/src/cache/FileCacheAdapter.ts:51](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/cache/FileCacheAdapter.ts#L51)

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

Defined in: [packages/core/src/cache/FileCacheAdapter.ts:18](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/cache/FileCacheAdapter.ts#L18)

___

### getHash

▸ `Private`**getHash**(`origin`: *string*): *Promise*<*null* \| *string*\>

#### Parameters:

Name | Type |
------ | ------ |
`origin` | *string* |

**Returns:** *Promise*<*null* \| *string*\>

Defined in: [packages/core/src/cache/FileCacheAdapter.ts:62](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/cache/FileCacheAdapter.ts#L62)

___

### path

▸ `Private`**path**(`name`: *string*): *Promise*<*string*\>

#### Parameters:

Name | Type |
------ | ------ |
`name` | *string* |

**Returns:** *Promise*<*string*\>

Defined in: [packages/core/src/cache/FileCacheAdapter.ts:57](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/cache/FileCacheAdapter.ts#L57)

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

Defined in: [packages/core/src/cache/FileCacheAdapter.ts:38](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/cache/FileCacheAdapter.ts#L38)
