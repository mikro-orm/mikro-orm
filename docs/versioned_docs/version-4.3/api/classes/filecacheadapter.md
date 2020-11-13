---
id: "filecacheadapter"
title: "Class: FileCacheAdapter"
sidebar_label: "FileCacheAdapter"
---

## Hierarchy

* **FileCacheAdapter**

## Implements

* [CacheAdapter](../interfaces/cacheadapter.md)

## Constructors

### constructor

\+ **new FileCacheAdapter**(`options`: { cacheDir: string  }, `baseDir`: string, `pretty?`: boolean): [FileCacheAdapter](filecacheadapter.md)

*Defined in [packages/core/src/cache/FileCacheAdapter.ts:9](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/cache/FileCacheAdapter.ts#L9)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`options` | { cacheDir: string  } | - |
`baseDir` | string | - |
`pretty` | boolean | false |

**Returns:** [FileCacheAdapter](filecacheadapter.md)

## Properties

### VERSION

• `Private` `Readonly` **VERSION**: string = Utils.getORMVersion()

*Defined in [packages/core/src/cache/FileCacheAdapter.ts:9](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/cache/FileCacheAdapter.ts#L9)*

___

### baseDir

• `Private` `Readonly` **baseDir**: string

*Defined in [packages/core/src/cache/FileCacheAdapter.ts:12](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/cache/FileCacheAdapter.ts#L12)*

___

### options

• `Private` `Readonly` **options**: { cacheDir: string  }

*Defined in [packages/core/src/cache/FileCacheAdapter.ts:11](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/cache/FileCacheAdapter.ts#L11)*

#### Type declaration:

Name | Type |
------ | ------ |
`cacheDir` | string |

___

### pretty

• `Private` `Readonly` **pretty**: boolean

*Defined in [packages/core/src/cache/FileCacheAdapter.ts:13](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/cache/FileCacheAdapter.ts#L13)*

## Methods

### clear

▸ **clear**(): Promise&#60;void>

*Implementation of [CacheAdapter](../interfaces/cacheadapter.md)*

*Defined in [packages/core/src/cache/FileCacheAdapter.ts:51](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/cache/FileCacheAdapter.ts#L51)*

Clears all items stored in the cache.

**Returns:** Promise&#60;void>

___

### get

▸ **get**(`name`: string): Promise&#60;any>

*Implementation of [CacheAdapter](../interfaces/cacheadapter.md)*

*Defined in [packages/core/src/cache/FileCacheAdapter.ts:18](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/cache/FileCacheAdapter.ts#L18)*

Gets the items under `name` key from the cache.

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** Promise&#60;any>

___

### getHash

▸ `Private`**getHash**(`origin`: string): Promise&#60;string \| null>

*Defined in [packages/core/src/cache/FileCacheAdapter.ts:62](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/cache/FileCacheAdapter.ts#L62)*

#### Parameters:

Name | Type |
------ | ------ |
`origin` | string |

**Returns:** Promise&#60;string \| null>

___

### path

▸ `Private`**path**(`name`: string): Promise&#60;string>

*Defined in [packages/core/src/cache/FileCacheAdapter.ts:57](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/cache/FileCacheAdapter.ts#L57)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** Promise&#60;string>

___

### set

▸ **set**(`name`: string, `data`: any, `origin`: string): Promise&#60;void>

*Defined in [packages/core/src/cache/FileCacheAdapter.ts:38](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/cache/FileCacheAdapter.ts#L38)*

**`inheritdoc`** 

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |
`data` | any |
`origin` | string |

**Returns:** Promise&#60;void>
