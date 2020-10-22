---
id: "memorycacheadapter"
title: "Class: MemoryCacheAdapter"
sidebar_label: "MemoryCacheAdapter"
---

## Hierarchy

* **MemoryCacheAdapter**

## Implements

* [CacheAdapter](../interfaces/cacheadapter.md)

## Constructors

### constructor

\+ **new MemoryCacheAdapter**(`options`: { expiration: number  }): [MemoryCacheAdapter](memorycacheadapter.md)

*Defined in [packages/core/src/cache/MemoryCacheAdapter.ts:5](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/cache/MemoryCacheAdapter.ts#L5)*

#### Parameters:

Name | Type |
------ | ------ |
`options` | { expiration: number  } |

**Returns:** [MemoryCacheAdapter](memorycacheadapter.md)

## Properties

### data

• `Private` `Readonly` **data**: Map&#60;string, { data: any ; expiration: number  }> = new Map&#60;string, { data: any; expiration: number }>()

*Defined in [packages/core/src/cache/MemoryCacheAdapter.ts:5](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/cache/MemoryCacheAdapter.ts#L5)*

___

### options

• `Private` `Readonly` **options**: { expiration: number  }

*Defined in [packages/core/src/cache/MemoryCacheAdapter.ts:7](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/cache/MemoryCacheAdapter.ts#L7)*

#### Type declaration:

Name | Type |
------ | ------ |
`expiration` | number |

## Methods

### clear

▸ **clear**(): Promise&#60;void>

*Implementation of [CacheAdapter](../interfaces/cacheadapter.md)*

*Defined in [packages/core/src/cache/MemoryCacheAdapter.ts:36](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/cache/MemoryCacheAdapter.ts#L36)*

Clears all items stored in the cache.

**Returns:** Promise&#60;void>

___

### get

▸ **get**&#60;T>(`name`: string): Promise&#60;T \| undefined>

*Implementation of [CacheAdapter](../interfaces/cacheadapter.md)*

*Defined in [packages/core/src/cache/MemoryCacheAdapter.ts:12](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/cache/MemoryCacheAdapter.ts#L12)*

Gets the items under `name` key from the cache.

#### Type parameters:

Name | Default |
------ | ------ |
`T` | any |

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** Promise&#60;T \| undefined>

___

### set

▸ **set**(`name`: string, `data`: any, `origin`: string, `expiration?`: number): Promise&#60;void>

*Implementation of [CacheAdapter](../interfaces/cacheadapter.md)*

*Defined in [packages/core/src/cache/MemoryCacheAdapter.ts:29](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/cache/MemoryCacheAdapter.ts#L29)*

Sets the item to the cache. `origin` is used for cache invalidation and should reflect the change in data.

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |
`data` | any |
`origin` | string |
`expiration?` | number |

**Returns:** Promise&#60;void>
