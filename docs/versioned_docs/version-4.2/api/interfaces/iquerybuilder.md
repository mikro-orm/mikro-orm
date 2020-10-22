---
id: "iquerybuilder"
title: "Interface: IQueryBuilder<T>"
sidebar_label: "IQueryBuilder"
---

## Type parameters

Name |
------ |
`T` |

## Hierarchy

* **IQueryBuilder**

## Properties

### \_fields

• `Optional` **\_fields**: [Field](../index.md#field)&#60;T>[]

*Defined in [packages/knex/src/typings.ts:88](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/typings.ts#L88)*

___

### alias

• `Readonly` **alias**: string

*Defined in [packages/knex/src/typings.ts:86](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/typings.ts#L86)*

___

### type

• `Readonly` **type**: [QueryType](../enums/querytype.md)

*Defined in [packages/knex/src/typings.ts:87](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/typings.ts#L87)*

## Methods

### addSelect

▸ **addSelect**(`fields`: string \| string[]): this

*Defined in [packages/knex/src/typings.ts:90](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/typings.ts#L90)*

#### Parameters:

Name | Type |
------ | ------ |
`fields` | string \| string[] |

**Returns:** this

___

### andWhere

▸ **andWhere**(`cond`: [QBFilterQuery](../index.md#qbfilterquery)&#60;T>): this

*Defined in [packages/knex/src/typings.ts:101](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/typings.ts#L101)*

#### Parameters:

Name | Type |
------ | ------ |
`cond` | [QBFilterQuery](../index.md#qbfilterquery)&#60;T> |

**Returns:** this

▸ **andWhere**(`cond`: string, `params?`: any[]): this

*Defined in [packages/knex/src/typings.ts:102](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/typings.ts#L102)*

#### Parameters:

Name | Type |
------ | ------ |
`cond` | string |
`params?` | any[] |

**Returns:** this

___

### count

▸ **count**(`field?`: string \| string[], `distinct?`: boolean): this

*Defined in [packages/knex/src/typings.ts:95](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/typings.ts#L95)*

#### Parameters:

Name | Type |
------ | ------ |
`field?` | string \| string[] |
`distinct?` | boolean |

**Returns:** this

___

### delete

▸ **delete**(`cond?`: [QBFilterQuery](../index.md#qbfilterquery)): this

*Defined in [packages/knex/src/typings.ts:93](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/typings.ts#L93)*

#### Parameters:

Name | Type |
------ | ------ |
`cond?` | [QBFilterQuery](../index.md#qbfilterquery) |

**Returns:** this

___

### getAliasForJoinPath

▸ **getAliasForJoinPath**(`path`: string): string \| undefined

*Defined in [packages/knex/src/typings.ts:108](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/typings.ts#L108)*

#### Parameters:

Name | Type |
------ | ------ |
`path` | string |

**Returns:** string \| undefined

___

### getNextAlias

▸ **getNextAlias**(`prefix?`: string): string

*Defined in [packages/knex/src/typings.ts:109](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/typings.ts#L109)*

#### Parameters:

Name | Type |
------ | ------ |
`prefix?` | string |

**Returns:** string

___

### groupBy

▸ **groupBy**(`fields`: string \| keyof T \| (string \| keyof T)[]): this

*Defined in [packages/knex/src/typings.ts:106](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/typings.ts#L106)*

#### Parameters:

Name | Type |
------ | ------ |
`fields` | string \| keyof T \| (string \| keyof T)[] |

**Returns:** this

___

### having

▸ **having**(`cond?`: [QBFilterQuery](../index.md#qbfilterquery) \| string, `params?`: any[]): this

*Defined in [packages/knex/src/typings.ts:107](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/typings.ts#L107)*

#### Parameters:

Name | Type |
------ | ------ |
`cond?` | [QBFilterQuery](../index.md#qbfilterquery) \| string |
`params?` | any[] |

**Returns:** this

___

### insert

▸ **insert**(`data`: any): this

*Defined in [packages/knex/src/typings.ts:91](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/typings.ts#L91)*

#### Parameters:

Name | Type |
------ | ------ |
`data` | any |

**Returns:** this

___

### join

▸ **join**(`field`: string, `alias`: string, `cond?`: [QBFilterQuery](../index.md#qbfilterquery), `type?`: &#34;leftJoin&#34; \| &#34;innerJoin&#34; \| &#34;pivotJoin&#34;, `path?`: string): this

*Defined in [packages/knex/src/typings.ts:96](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/typings.ts#L96)*

#### Parameters:

Name | Type |
------ | ------ |
`field` | string |
`alias` | string |
`cond?` | [QBFilterQuery](../index.md#qbfilterquery) |
`type?` | &#34;leftJoin&#34; \| &#34;innerJoin&#34; \| &#34;pivotJoin&#34; |
`path?` | string |

**Returns:** this

___

### leftJoin

▸ **leftJoin**(`field`: string, `alias`: string, `cond?`: [QBFilterQuery](../index.md#qbfilterquery)): this

*Defined in [packages/knex/src/typings.ts:97](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/typings.ts#L97)*

#### Parameters:

Name | Type |
------ | ------ |
`field` | string |
`alias` | string |
`cond?` | [QBFilterQuery](../index.md#qbfilterquery) |

**Returns:** this

___

### orWhere

▸ **orWhere**(`cond`: [QBFilterQuery](../index.md#qbfilterquery)&#60;T>): this

*Defined in [packages/knex/src/typings.ts:103](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/typings.ts#L103)*

#### Parameters:

Name | Type |
------ | ------ |
`cond` | [QBFilterQuery](../index.md#qbfilterquery)&#60;T> |

**Returns:** this

▸ **orWhere**(`cond`: string, `params?`: any[]): this

*Defined in [packages/knex/src/typings.ts:104](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/typings.ts#L104)*

#### Parameters:

Name | Type |
------ | ------ |
`cond` | string |
`params?` | any[] |

**Returns:** this

___

### orderBy

▸ **orderBy**(`orderBy`: QueryOrderMap): this

*Defined in [packages/knex/src/typings.ts:105](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/typings.ts#L105)*

#### Parameters:

Name | Type |
------ | ------ |
`orderBy` | QueryOrderMap |

**Returns:** this

___

### select

▸ **select**(`fields`: [Field](../index.md#field)&#60;T> \| [Field](../index.md#field)&#60;T>[], `distinct?`: boolean): this

*Defined in [packages/knex/src/typings.ts:89](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/typings.ts#L89)*

#### Parameters:

Name | Type |
------ | ------ |
`fields` | [Field](../index.md#field)&#60;T> \| [Field](../index.md#field)&#60;T>[] |
`distinct?` | boolean |

**Returns:** this

___

### truncate

▸ **truncate**(): this

*Defined in [packages/knex/src/typings.ts:94](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/typings.ts#L94)*

**Returns:** this

___

### update

▸ **update**(`data`: any): this

*Defined in [packages/knex/src/typings.ts:92](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/typings.ts#L92)*

#### Parameters:

Name | Type |
------ | ------ |
`data` | any |

**Returns:** this

___

### where

▸ **where**(`cond`: [QBFilterQuery](../index.md#qbfilterquery)&#60;T>, `operator?`: keyof *typeof* GroupOperator): this

*Defined in [packages/knex/src/typings.ts:99](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/typings.ts#L99)*

#### Parameters:

Name | Type |
------ | ------ |
`cond` | [QBFilterQuery](../index.md#qbfilterquery)&#60;T> |
`operator?` | keyof *typeof* GroupOperator |

**Returns:** this

▸ **where**(`cond`: string, `params?`: any[], `operator?`: keyof *typeof* GroupOperator): this

*Defined in [packages/knex/src/typings.ts:100](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/typings.ts#L100)*

#### Parameters:

Name | Type |
------ | ------ |
`cond` | string |
`params?` | any[] |
`operator?` | keyof *typeof* GroupOperator |

**Returns:** this

___

### withSubQuery

▸ **withSubQuery**(`subQuery`: KnexQueryBuilder, `alias`: string): this

*Defined in [packages/knex/src/typings.ts:98](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/typings.ts#L98)*

#### Parameters:

Name | Type |
------ | ------ |
`subQuery` | KnexQueryBuilder |
`alias` | string |

**Returns:** this
