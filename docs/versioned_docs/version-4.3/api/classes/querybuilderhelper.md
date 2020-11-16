---
id: "querybuilderhelper"
title: "Class: QueryBuilderHelper"
sidebar_label: "QueryBuilderHelper"
---

## Hierarchy

* **QueryBuilderHelper**

## Constructors

### constructor

\+ **new QueryBuilderHelper**(`entityName`: string, `alias`: string, `aliasMap`: [Dictionary](../index.md#dictionary)&#60;string>, `subQueries`: [Dictionary](../index.md#dictionary)&#60;string>, `metadata`: MetadataStorage, `knex`: Knex, `platform`: Platform): [QueryBuilderHelper](querybuilderhelper.md)

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:10](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L10)*

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`alias` | string |
`aliasMap` | [Dictionary](../index.md#dictionary)&#60;string> |
`subQueries` | [Dictionary](../index.md#dictionary)&#60;string> |
`metadata` | MetadataStorage |
`knex` | Knex |
`platform` | Platform |

**Returns:** [QueryBuilderHelper](querybuilderhelper.md)

## Properties

### alias

• `Private` `Readonly` **alias**: string

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:13](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L13)*

___

### aliasMap

• `Private` `Readonly` **aliasMap**: [Dictionary](../index.md#dictionary)&#60;string>

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:14](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L14)*

___

### entityName

• `Private` `Readonly` **entityName**: string

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:12](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L12)*

___

### knex

• `Private` `Readonly` **knex**: Knex

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:17](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L17)*

___

### metadata

• `Private` `Readonly` **metadata**: MetadataStorage

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:16](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L16)*

___

### platform

• `Private` `Readonly` **platform**: Platform

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:18](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L18)*

___

### subQueries

• `Private` `Readonly` **subQueries**: [Dictionary](../index.md#dictionary)&#60;string>

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:15](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L15)*

## Methods

### appendGroupCondition

▸ `Private`**appendGroupCondition**(`type`: [QueryType](../enums/querytype.md), `qb`: KnexQueryBuilder, `operator`: &#34;$and&#34; \| &#34;$or&#34;, `method`: &#34;where&#34; \| &#34;having&#34;, `subCondition`: any[]): void

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:496](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L496)*

#### Parameters:

Name | Type |
------ | ------ |
`type` | [QueryType](../enums/querytype.md) |
`qb` | KnexQueryBuilder |
`operator` | &#34;$and&#34; \| &#34;$or&#34; |
`method` | &#34;where&#34; \| &#34;having&#34; |
`subCondition` | any[] |

**Returns:** void

___

### appendJoinClause

▸ `Private`**appendJoinClause**(`clause`: JoinClause, `cond`: [Dictionary](../index.md#dictionary), `operator?`: &#34;$and&#34; \| &#34;$or&#34;): void

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:347](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L347)*

#### Parameters:

Name | Type |
------ | ------ |
`clause` | JoinClause |
`cond` | [Dictionary](../index.md#dictionary) |
`operator?` | &#34;$and&#34; \| &#34;$or&#34; |

**Returns:** void

___

### appendJoinSubClause

▸ `Private`**appendJoinSubClause**(`clause`: JoinClause, `cond`: [Dictionary](../index.md#dictionary), `key`: string, `operator?`: &#34;$and&#34; \| &#34;$or&#34;): void

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:365](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L365)*

#### Parameters:

Name | Type |
------ | ------ |
`clause` | JoinClause |
`cond` | [Dictionary](../index.md#dictionary) |
`key` | string |
`operator?` | &#34;$and&#34; \| &#34;$or&#34; |

**Returns:** void

___

### appendQueryCondition

▸ **appendQueryCondition**(`type`: [QueryType](../enums/querytype.md), `cond`: any, `qb`: KnexQueryBuilder, `operator?`: &#34;$and&#34; \| &#34;$or&#34;, `method?`: &#34;where&#34; \| &#34;having&#34;): void

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:238](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L238)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`type` | [QueryType](../enums/querytype.md) | - |
`cond` | any | - |
`qb` | KnexQueryBuilder | - |
`operator?` | &#34;$and&#34; \| &#34;$or&#34; | - |
`method` | &#34;where&#34; \| &#34;having&#34; | "where" |

**Returns:** void

___

### appendQuerySubCondition

▸ `Private`**appendQuerySubCondition**(`qb`: KnexQueryBuilder, `type`: [QueryType](../enums/querytype.md), `method`: &#34;where&#34; \| &#34;having&#34;, `cond`: any, `key`: string, `operator?`: &#34;$and&#34; \| &#34;$or&#34;): void

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:259](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L259)*

#### Parameters:

Name | Type |
------ | ------ |
`qb` | KnexQueryBuilder |
`type` | [QueryType](../enums/querytype.md) |
`method` | &#34;where&#34; \| &#34;having&#34; |
`cond` | any |
`key` | string |
`operator?` | &#34;$and&#34; \| &#34;$or&#34; |

**Returns:** void

___

### fieldName

▸ `Private`**fieldName**(`field`: string, `alias?`: string): string

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:520](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L520)*

#### Parameters:

Name | Type |
------ | ------ |
`field` | string |
`alias?` | string |

**Returns:** string

___

### finalize

▸ **finalize**(`type`: [QueryType](../enums/querytype.md), `qb`: KnexQueryBuilder, `meta?`: EntityMetadata): void

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:431](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L431)*

#### Parameters:

Name | Type |
------ | ------ |
`type` | [QueryType](../enums/querytype.md) |
`qb` | KnexQueryBuilder |
`meta?` | EntityMetadata |

**Returns:** void

___

### getLockSQL

▸ **getLockSQL**(`qb`: KnexQueryBuilder, `lockMode?`: [LockMode](../enums/lockmode.md)): void

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:448](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L448)*

#### Parameters:

Name | Type |
------ | ------ |
`qb` | KnexQueryBuilder |
`lockMode?` | [LockMode](../enums/lockmode.md) |

**Returns:** void

___

### getOperatorReplacement

▸ `Private`**getOperatorReplacement**(`op`: string, `value`: [Dictionary](../index.md#dictionary)): string

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:333](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L333)*

#### Parameters:

Name | Type |
------ | ------ |
`op` | string |
`value` | [Dictionary](../index.md#dictionary) |

**Returns:** string

___

### getProperty

▸ `Private`**getProperty**(`field`: string, `alias?`: string): EntityProperty \| undefined

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:535](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L535)*

#### Parameters:

Name | Type |
------ | ------ |
`field` | string |
`alias?` | string |

**Returns:** EntityProperty \| undefined

___

### getQueryOrder

▸ **getQueryOrder**(`type`: [QueryType](../enums/querytype.md), `orderBy`: FlatQueryOrderMap, `populate`: [Dictionary](../index.md#dictionary)&#60;string>): string

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:403](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L403)*

#### Parameters:

Name | Type |
------ | ------ |
`type` | [QueryType](../enums/querytype.md) |
`orderBy` | FlatQueryOrderMap |
`populate` | [Dictionary](../index.md#dictionary)&#60;string> |

**Returns:** string

___

### getRegExpParam

▸ **getRegExpParam**(`re`: RegExp): string

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:215](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L215)*

#### Parameters:

Name | Type |
------ | ------ |
`re` | RegExp |

**Returns:** string

___

### getTableName

▸ **getTableName**(`entityName`: string): string

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:198](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L198)*

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |

**Returns:** string

___

### isOneToOneInverse

▸ **isOneToOneInverse**(`field`: string): boolean

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:191](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L191)*

#### Parameters:

Name | Type |
------ | ------ |
`field` | string |

**Returns:** boolean

___

### isPrefixed

▸ `Private`**isPrefixed**(`field`: string): boolean

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:516](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L516)*

#### Parameters:

Name | Type |
------ | ------ |
`field` | string |

**Returns:** boolean

___

### isSimpleRegExp

▸ **isSimpleRegExp**(`re`: any): boolean

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:206](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L206)*

Checks whether the RE can be rewritten to simple LIKE query

#### Parameters:

Name | Type |
------ | ------ |
`re` | any |

**Returns:** boolean

___

### joinManyToManyReference

▸ **joinManyToManyReference**(`prop`: EntityProperty, `ownerAlias`: string, `alias`: string, `pivotAlias`: string, `type`: &#34;leftJoin&#34; \| &#34;innerJoin&#34; \| &#34;pivotJoin&#34;, `cond`: [Dictionary](../index.md#dictionary), `path`: string): [Dictionary](../index.md#dictionary)&#60;[JoinOptions](../interfaces/joinoptions.md)>

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:124](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L124)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | EntityProperty |
`ownerAlias` | string |
`alias` | string |
`pivotAlias` | string |
`type` | &#34;leftJoin&#34; \| &#34;innerJoin&#34; \| &#34;pivotJoin&#34; |
`cond` | [Dictionary](../index.md#dictionary) |
`path` | string |

**Returns:** [Dictionary](../index.md#dictionary)&#60;[JoinOptions](../interfaces/joinoptions.md)>

___

### joinManyToOneReference

▸ **joinManyToOneReference**(`prop`: EntityProperty, `ownerAlias`: string, `alias`: string, `type`: &#34;leftJoin&#34; \| &#34;innerJoin&#34; \| &#34;pivotJoin&#34;, `cond?`: [Dictionary](../index.md#dictionary)): [JoinOptions](../interfaces/joinoptions.md)

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:115](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L115)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`prop` | EntityProperty | - |
`ownerAlias` | string | - |
`alias` | string | - |
`type` | &#34;leftJoin&#34; \| &#34;innerJoin&#34; \| &#34;pivotJoin&#34; | - |
`cond` | [Dictionary](../index.md#dictionary) | {} |

**Returns:** [JoinOptions](../interfaces/joinoptions.md)

___

### joinOneToReference

▸ **joinOneToReference**(`prop`: EntityProperty, `ownerAlias`: string, `alias`: string, `type`: &#34;leftJoin&#34; \| &#34;innerJoin&#34; \| &#34;pivotJoin&#34;, `cond?`: [Dictionary](../index.md#dictionary)): [JoinOptions](../interfaces/joinoptions.md)

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:101](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L101)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`prop` | EntityProperty | - |
`ownerAlias` | string | - |
`alias` | string | - |
`type` | &#34;leftJoin&#34; \| &#34;innerJoin&#34; \| &#34;pivotJoin&#34; | - |
`cond` | [Dictionary](../index.md#dictionary) | {} |

**Returns:** [JoinOptions](../interfaces/joinoptions.md)

___

### joinPivotTable

▸ **joinPivotTable**(`field`: string, `prop`: EntityProperty, `ownerAlias`: string, `alias`: string, `type`: &#34;leftJoin&#34; \| &#34;innerJoin&#34; \| &#34;pivotJoin&#34;, `cond?`: [Dictionary](../index.md#dictionary)): [JoinOptions](../interfaces/joinoptions.md)

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:150](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L150)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`field` | string | - |
`prop` | EntityProperty | - |
`ownerAlias` | string | - |
`alias` | string | - |
`type` | &#34;leftJoin&#34; \| &#34;innerJoin&#34; \| &#34;pivotJoin&#34; | - |
`cond` | [Dictionary](../index.md#dictionary) | {} |

**Returns:** [JoinOptions](../interfaces/joinoptions.md)

___

### mapJoinColumns

▸ **mapJoinColumns**(`type`: [QueryType](../enums/querytype.md), `join`: [JoinOptions](../interfaces/joinoptions.md)): (string \| Raw)[]

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:178](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L178)*

#### Parameters:

Name | Type |
------ | ------ |
`type` | [QueryType](../enums/querytype.md) |
`join` | [JoinOptions](../interfaces/joinoptions.md) |

**Returns:** (string \| Raw)[]

___

### mapper

▸ **mapper**(`field`: string, `type?`: [QueryType](../enums/querytype.md)): string

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:20](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L20)*

#### Parameters:

Name | Type |
------ | ------ |
`field` | string |
`type?` | [QueryType](../enums/querytype.md) |

**Returns:** string

▸ **mapper**(`field`: string, `type?`: [QueryType](../enums/querytype.md), `value?`: any, `alias?`: string): string

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:21](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L21)*

#### Parameters:

Name | Type |
------ | ------ |
`field` | string |
`type?` | [QueryType](../enums/querytype.md) |
`value?` | any |
`alias?` | string |

**Returns:** string

___

### prefix

▸ `Private`**prefix**(`field`: string, `always?`: boolean): string

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:485](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L485)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`field` | string | - |
`always` | boolean | false |

**Returns:** string

___

### processCustomExpression

▸ `Private`**processCustomExpression**&#60;T>(`clause`: any, `m`: string, `key`: string, `cond`: any, `type?`: [QueryType](../enums/querytype.md)): void

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:283](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L283)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | any[] | any[] |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`clause` | any | - |
`m` | string | - |
`key` | string | - |
`cond` | any | - |
`type` | [QueryType](../enums/querytype.md) | QueryType.SELECT |

**Returns:** void

___

### processData

▸ **processData**(`data`: [Dictionary](../index.md#dictionary), `convertCustomTypes`: boolean, `multi?`: boolean): any

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:58](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L58)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`data` | [Dictionary](../index.md#dictionary) | - |
`convertCustomTypes` | boolean | - |
`multi` | boolean | false |

**Returns:** any

___

### processJoins

▸ **processJoins**(`qb`: KnexQueryBuilder, `joins`: [Dictionary](../index.md#dictionary)&#60;[JoinOptions](../interfaces/joinoptions.md)>): void

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:162](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L162)*

#### Parameters:

Name | Type |
------ | ------ |
`qb` | KnexQueryBuilder |
`joins` | [Dictionary](../index.md#dictionary)&#60;[JoinOptions](../interfaces/joinoptions.md)> |

**Returns:** void

___

### processObjectSubClause

▸ `Private`**processObjectSubClause**(`cond`: any, `key`: string, `clause`: JoinClause, `m`: &#34;andOn&#34; \| &#34;orOn&#34;): void

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:384](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L384)*

#### Parameters:

Name | Type |
------ | ------ |
`cond` | any |
`key` | string |
`clause` | JoinClause |
`m` | &#34;andOn&#34; \| &#34;orOn&#34; |

**Returns:** void

___

### processObjectSubCondition

▸ `Private`**processObjectSubCondition**(`cond`: any, `key`: string, `qb`: KnexQueryBuilder, `method`: &#34;where&#34; \| &#34;having&#34;, `m`: &#34;where&#34; \| &#34;orWhere&#34; \| &#34;having&#34;, `type`: [QueryType](../enums/querytype.md)): void

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:298](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L298)*

#### Parameters:

Name | Type |
------ | ------ |
`cond` | any |
`key` | string |
`qb` | KnexQueryBuilder |
`method` | &#34;where&#34; \| &#34;having&#34; |
`m` | &#34;where&#34; \| &#34;orWhere&#34; \| &#34;having&#34; |
`type` | [QueryType](../enums/querytype.md) |

**Returns:** void

___

### splitField

▸ **splitField**(`field`: string): [string, string]

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:440](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L440)*

#### Parameters:

Name | Type |
------ | ------ |
`field` | string |

**Returns:** [string, string]

___

### updateVersionProperty

▸ **updateVersionProperty**(`qb`: KnexQueryBuilder, `data`: [Dictionary](../index.md#dictionary)): void

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:464](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L464)*

#### Parameters:

Name | Type |
------ | ------ |
`qb` | KnexQueryBuilder |
`data` | [Dictionary](../index.md#dictionary) |

**Returns:** void

___

### isCustomExpression

▸ `Static`**isCustomExpression**(`field`: string): boolean

*Defined in [packages/knex/src/query/QueryBuilderHelper.ts:481](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilderHelper.ts#L481)*

#### Parameters:

Name | Type |
------ | ------ |
`field` | string |

**Returns:** boolean
