---
id: "icriterianode"
title: "Interface: ICriteriaNode"
sidebar_label: "ICriteriaNode"
---

## Hierarchy

* **ICriteriaNode**

## Properties

### entityName

• `Readonly` **entityName**: string

*Defined in [packages/knex/src/typings.ts:113](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/typings.ts#L113)*

___

### key

• `Optional` `Readonly` **key**: string \| undefined

*Defined in [packages/knex/src/typings.ts:115](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/typings.ts#L115)*

___

### parent

• `Optional` `Readonly` **parent**: [ICriteriaNode](icriterianode.md) \| undefined

*Defined in [packages/knex/src/typings.ts:114](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/typings.ts#L114)*

___

### payload

•  **payload**: any

*Defined in [packages/knex/src/typings.ts:116](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/typings.ts#L116)*

___

### prop

• `Optional` **prop**: EntityProperty

*Defined in [packages/knex/src/typings.ts:117](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/typings.ts#L117)*

## Methods

### getPath

▸ **getPath**(): string

*Defined in [packages/knex/src/typings.ts:123](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/typings.ts#L123)*

**Returns:** string

___

### getPivotPath

▸ **getPivotPath**(`path`: string): string

*Defined in [packages/knex/src/typings.ts:124](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/typings.ts#L124)*

#### Parameters:

Name | Type |
------ | ------ |
`path` | string |

**Returns:** string

___

### process

▸ **process**&#60;T>(`qb`: [IQueryBuilder](iquerybuilder.md)&#60;T>, `alias?`: string): any

*Defined in [packages/knex/src/typings.ts:118](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/typings.ts#L118)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`qb` | [IQueryBuilder](iquerybuilder.md)&#60;T> |
`alias?` | string |

**Returns:** any

___

### renameFieldToPK

▸ **renameFieldToPK**&#60;T>(`qb`: [IQueryBuilder](iquerybuilder.md)&#60;T>): string

*Defined in [packages/knex/src/typings.ts:122](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/typings.ts#L122)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`qb` | [IQueryBuilder](iquerybuilder.md)&#60;T> |

**Returns:** string

___

### shouldInline

▸ **shouldInline**(`payload`: any): boolean

*Defined in [packages/knex/src/typings.ts:119](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/typings.ts#L119)*

#### Parameters:

Name | Type |
------ | ------ |
`payload` | any |

**Returns:** boolean

___

### shouldRename

▸ **shouldRename**(`payload`: any): boolean

*Defined in [packages/knex/src/typings.ts:121](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/typings.ts#L121)*

#### Parameters:

Name | Type |
------ | ------ |
`payload` | any |

**Returns:** boolean

___

### willAutoJoin

▸ **willAutoJoin**&#60;T>(`qb`: [IQueryBuilder](iquerybuilder.md)&#60;T>, `alias?`: string): boolean

*Defined in [packages/knex/src/typings.ts:120](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/typings.ts#L120)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`qb` | [IQueryBuilder](iquerybuilder.md)&#60;T> |
`alias?` | string |

**Returns:** boolean
