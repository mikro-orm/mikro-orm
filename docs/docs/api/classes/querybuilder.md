---
id: "querybuilder"
title: "Class: QueryBuilder<T>"
sidebar_label: "QueryBuilder"
---

SQL query builder

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | AnyEntity |

## Hierarchy

* **QueryBuilder**

## Constructors

### constructor

\+ **new QueryBuilder**(`entityName`: string, `metadata`: MetadataStorage, `driver`: [AbstractSqlDriver](abstractsqldriver.md), `context?`: Transaction, `alias?`: string, `connectionType?`: &#34;read&#34; \| &#34;write&#34;, `em?`: [SqlEntityManager](sqlentitymanager.md)): [QueryBuilder](querybuilder.md)

*Defined in [packages/knex/src/query/QueryBuilder.ts:41](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L41)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | string | - |
`metadata` | MetadataStorage | - |
`driver` | [AbstractSqlDriver](abstractsqldriver.md) | - |
`context?` | Transaction | - |
`alias` | string | \`e0\` |
`connectionType?` | &#34;read&#34; \| &#34;write&#34; | - |
`em?` | [SqlEntityManager](sqlentitymanager.md) | - |

**Returns:** [QueryBuilder](querybuilder.md)

## Properties

### \_aliasMap

• `Private` **\_aliasMap**: [Dictionary](../index.md#dictionary)&#60;string>

*Defined in [packages/knex/src/query/QueryBuilder.ts:27](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L27)*

___

### \_cache

• `Private` `Optional` **\_cache**: boolean \| number \| [string, number]

*Defined in [packages/knex/src/query/QueryBuilder.ts:36](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L36)*

___

### \_cond

• `Private` **\_cond**: [Dictionary](../index.md#dictionary)

*Defined in [packages/knex/src/query/QueryBuilder.ts:29](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L29)*

___

### \_data

• `Private` **\_data**: [Dictionary](../index.md#dictionary)

*Defined in [packages/knex/src/query/QueryBuilder.ts:30](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L30)*

___

### \_fields

• `Optional` **\_fields**: [Field](../index.md#field)&#60;T>[]

*Defined in [packages/knex/src/query/QueryBuilder.ts:19](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L19)*

___

### \_groupBy

• `Private` **\_groupBy**: [Field](../index.md#field)&#60;T>[] = []

*Defined in [packages/knex/src/query/QueryBuilder.ts:32](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L32)*

___

### \_having

• `Private` **\_having**: [Dictionary](../index.md#dictionary)

*Defined in [packages/knex/src/query/QueryBuilder.ts:33](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L33)*

___

### \_joins

• `Private` **\_joins**: [Dictionary](../index.md#dictionary)&#60;[JoinOptions](../interfaces/joinoptions.md)>

*Defined in [packages/knex/src/query/QueryBuilder.ts:26](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L26)*

___

### \_limit

• `Private` `Optional` **\_limit**: number

*Defined in [packages/knex/src/query/QueryBuilder.ts:34](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L34)*

___

### \_offset

• `Private` `Optional` **\_offset**: number

*Defined in [packages/knex/src/query/QueryBuilder.ts:35](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L35)*

___

### \_orderBy

• `Private` **\_orderBy**: QueryOrderMap

*Defined in [packages/knex/src/query/QueryBuilder.ts:31](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L31)*

___

### \_populate

•  **\_populate**: [PopulateOptions](../index.md#populateoptions)&#60;T>[] = []

*Defined in [packages/knex/src/query/QueryBuilder.ts:20](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L20)*

___

### \_populateMap

•  **\_populateMap**: [Dictionary](../index.md#dictionary)&#60;string>

*Defined in [packages/knex/src/query/QueryBuilder.ts:21](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L21)*

___

### \_schema

• `Private` `Optional` **\_schema**: string

*Defined in [packages/knex/src/query/QueryBuilder.ts:28](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L28)*

___

### alias

• `Readonly` **alias**: string

*Defined in [packages/knex/src/query/QueryBuilder.ts:47](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L47)*

___

### aliasCounter

• `Private` **aliasCounter**: number = 1

*Defined in [packages/knex/src/query/QueryBuilder.ts:23](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L23)*

___

### connectionType

• `Private` `Optional` **connectionType**: &#34;read&#34; \| &#34;write&#34;

*Defined in [packages/knex/src/query/QueryBuilder.ts:48](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L48)*

___

### context

• `Private` `Optional` `Readonly` **context**: Transaction

*Defined in [packages/knex/src/query/QueryBuilder.ts:46](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L46)*

___

### driver

• `Private` `Readonly` **driver**: [AbstractSqlDriver](abstractsqldriver.md)

*Defined in [packages/knex/src/query/QueryBuilder.ts:45](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L45)*

___

### em

• `Private` `Optional` `Readonly` **em**: [SqlEntityManager](sqlentitymanager.md)

*Defined in [packages/knex/src/query/QueryBuilder.ts:49](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L49)*

___

### entityName

• `Private` `Readonly` **entityName**: string

*Defined in [packages/knex/src/query/QueryBuilder.ts:43](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L43)*

___

### finalized

• `Private` **finalized**: boolean = false

*Defined in [packages/knex/src/query/QueryBuilder.ts:25](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L25)*

___

### flags

• `Private` **flags**: Set&#60;[QueryFlag](../enums/queryflag.md)> = new Set([QueryFlag.CONVERT\_CUSTOM\_TYPES])

*Defined in [packages/knex/src/query/QueryBuilder.ts:24](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L24)*

___

### helper

• `Private` `Readonly` **helper**: [QueryBuilderHelper](querybuilderhelper.md) = new QueryBuilderHelper(this.entityName, this.alias, this.\_aliasMap, this.subQueries, this.metadata, this.knex, this.platform)

*Defined in [packages/knex/src/query/QueryBuilder.ts:41](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L41)*

___

### knex

• `Private` `Readonly` **knex**: any = this.driver.getConnection(this.connectionType).getKnex()

*Defined in [packages/knex/src/query/QueryBuilder.ts:40](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L40)*

___

### lockMode

• `Private` `Optional` **lockMode**: [LockMode](../enums/lockmode.md)

*Defined in [packages/knex/src/query/QueryBuilder.ts:37](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L37)*

___

### metadata

• `Private` `Readonly` **metadata**: MetadataStorage

*Defined in [packages/knex/src/query/QueryBuilder.ts:44](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L44)*

___

### platform

• `Private` `Readonly` **platform**: [AbstractSqlPlatform](abstractsqlplatform.md) = this.driver.getPlatform()

*Defined in [packages/knex/src/query/QueryBuilder.ts:39](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L39)*

___

### subQueries

• `Private` **subQueries**: [Dictionary](../index.md#dictionary)&#60;string>

*Defined in [packages/knex/src/query/QueryBuilder.ts:38](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L38)*

___

### type

•  **type**: [QueryType](../enums/querytype.md)

*Defined in [packages/knex/src/query/QueryBuilder.ts:18](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L18)*

## Methods

### addSelect

▸ **addSelect**(`fields`: string \| string[]): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:63](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L63)*

#### Parameters:

Name | Type |
------ | ------ |
`fields` | string \| string[] |

**Returns:** this

___

### andWhere

▸ **andWhere**(`cond`: [QBFilterQuery](../index.md#qbfilterquery)&#60;T>): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:143](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L143)*

#### Parameters:

Name | Type |
------ | ------ |
`cond` | [QBFilterQuery](../index.md#qbfilterquery)&#60;T> |

**Returns:** this

▸ **andWhere**(`cond`: string, `params?`: any[]): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:144](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L144)*

#### Parameters:

Name | Type |
------ | ------ |
`cond` | string |
`params?` | any[] |

**Returns:** this

___

### as

▸ **as**(`alias`: string): KnexQueryBuilder

*Defined in [packages/knex/src/query/QueryBuilder.ts:366](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L366)*

Returns knex instance with sub-query aliased with given alias.
You can provide `EntityName.propName` as alias, then the field name will be used based on the metadata

#### Parameters:

Name | Type |
------ | ------ |
`alias` | string |

**Returns:** KnexQueryBuilder

___

### autoJoinPivotTable

▸ `Private`**autoJoinPivotTable**(`field`: string): void

*Defined in [packages/knex/src/query/QueryBuilder.ts:609](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L609)*

#### Parameters:

Name | Type |
------ | ------ |
`field` | string |

**Returns:** void

___

### cache

▸ **cache**(`config?`: boolean \| number \| [string, number]): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:236](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L236)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`config` | boolean \| number \| [string, number] | true |

**Returns:** this

___

### clone

▸ **clone**(): [QueryBuilder](querybuilder.md)&#60;T>

*Defined in [packages/knex/src/query/QueryBuilder.ts:379](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L379)*

**Returns:** [QueryBuilder](querybuilder.md)&#60;T>

___

### count

▸ **count**(`field?`: string \| string[], `distinct?`: boolean): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:87](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L87)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`field?` | string \| string[] | - |
`distinct` | boolean | false |

**Returns:** this

___

### delete

▸ **delete**(`cond?`: [QBFilterQuery](../index.md#qbfilterquery)): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:79](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L79)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`cond` | [QBFilterQuery](../index.md#qbfilterquery) | {} |

**Returns:** this

___

### execute

▸ **execute**&#60;U>(`method?`: &#34;all&#34; \| &#34;get&#34; \| &#34;run&#34;, `mapResults?`: boolean): Promise&#60;U>

*Defined in [packages/knex/src/query/QueryBuilder.ts:303](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L303)*

Executes this QB and returns the raw results, mapped to the property names (unless disabled via last parameter).
Use `method` to specify what kind of result you want to get (array/single/meta).

#### Type parameters:

Name | Default |
------ | ------ |
`U` | any |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`method` | &#34;all&#34; \| &#34;get&#34; \| &#34;run&#34; | "all" |
`mapResults` | boolean | true |

**Returns:** Promise&#60;U>

___

### finalize

▸ `Private`**finalize**(): void

*Defined in [packages/knex/src/query/QueryBuilder.ts:524](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L524)*

**Returns:** void

___

### getAliasForJoinPath

▸ **getAliasForJoinPath**(`path`: string): string \| undefined

*Defined in [packages/knex/src/query/QueryBuilder.ts:284](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L284)*

#### Parameters:

Name | Type |
------ | ------ |
`path` | string |

**Returns:** string \| undefined

___

### getFormattedQuery

▸ **getFormattedQuery**(): string

*Defined in [packages/knex/src/query/QueryBuilder.ts:279](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L279)*

Returns raw interpolated query string with all the parameters inlined.

**Returns:** string

___

### getKnex

▸ **getKnex**(): KnexQueryBuilder

*Defined in [packages/knex/src/query/QueryBuilder.ts:391](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L391)*

**Returns:** KnexQueryBuilder

___

### getKnexQuery

▸ **getKnexQuery**(): KnexQueryBuilder

*Defined in [packages/knex/src/query/QueryBuilder.ts:241](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L241)*

**Returns:** KnexQueryBuilder

___

### getNextAlias

▸ **getNextAlias**(`prefix?`: string): string

*Defined in [packages/knex/src/query/QueryBuilder.ts:294](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L294)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`prefix` | string | "e" |

**Returns:** string

___

### getParams

▸ **getParams**(): readonly Value[]

*Defined in [packages/knex/src/query/QueryBuilder.ts:272](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L272)*

Returns the list of all parameters for this query.

**Returns:** readonly Value[]

___

### getQuery

▸ **getQuery**(): string

*Defined in [packages/knex/src/query/QueryBuilder.ts:265](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L265)*

Returns the query with parameters as wildcards.

**Returns:** string

___

### getQueryBase

▸ `Private`**getQueryBase**(): KnexQueryBuilder

*Defined in [packages/knex/src/query/QueryBuilder.ts:483](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L483)*

**Returns:** KnexQueryBuilder

___

### getResult

▸ **getResult**(): Promise&#60;T[]>

*Defined in [packages/knex/src/query/QueryBuilder.ts:342](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L342)*

Alias for `qb.getResultList()`

**Returns:** Promise&#60;T[]>

___

### getResultList

▸ **getResultList**(): Promise&#60;T[]>

*Defined in [packages/knex/src/query/QueryBuilder.ts:349](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L349)*

Executes the query, returning array of results

**Returns:** Promise&#60;T[]>

___

### getSingleResult

▸ **getSingleResult**(): Promise&#60;T \| null>

*Defined in [packages/knex/src/query/QueryBuilder.ts:357](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L357)*

Executes the query, returning the first result or null

**Returns:** Promise&#60;T \| null>

___

### groupBy

▸ **groupBy**(`fields`: string \| keyof T \| (string \| keyof T)[]): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:161](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L161)*

#### Parameters:

Name | Type |
------ | ------ |
`fields` | string \| keyof T \| (string \| keyof T)[] |

**Returns:** this

___

### having

▸ **having**(`cond?`: [QBFilterQuery](../index.md#qbfilterquery) \| string, `params?`: any[]): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:166](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L166)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`cond` | [QBFilterQuery](../index.md#qbfilterquery) \| string | {} |
`params?` | any[] | - |

**Returns:** this

___

### init

▸ `Private`**init**(`type`: [QueryType](../enums/querytype.md), `data?`: any, `cond?`: any): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:464](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L464)*

#### Parameters:

Name | Type |
------ | ------ |
`type` | [QueryType](../enums/querytype.md) |
`data?` | any |
`cond?` | any |

**Returns:** this

___

### insert

▸ **insert**(`data`: any): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:71](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L71)*

#### Parameters:

Name | Type |
------ | ------ |
`data` | any |

**Returns:** this

___

### join

▸ **join**(`field`: string, `alias`: string, `cond?`: [QBFilterQuery](../index.md#qbfilterquery), `type?`: &#34;leftJoin&#34; \| &#34;innerJoin&#34; \| &#34;pivotJoin&#34;, `path?`: string): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:97](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L97)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`field` | string | - |
`alias` | string | - |
`cond` | [QBFilterQuery](../index.md#qbfilterquery) | {} |
`type` | &#34;leftJoin&#34; \| &#34;innerJoin&#34; \| &#34;pivotJoin&#34; | "innerJoin" |
`path?` | string | - |

**Returns:** this

___

### joinReference

▸ `Private`**joinReference**(`field`: string, `alias`: string, `cond`: [Dictionary](../index.md#dictionary), `type`: &#34;leftJoin&#34; \| &#34;innerJoin&#34; \| &#34;pivotJoin&#34;, `path?`: string): void

*Defined in [packages/knex/src/query/QueryBuilder.ts:402](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L402)*

#### Parameters:

Name | Type |
------ | ------ |
`field` | string |
`alias` | string |
`cond` | [Dictionary](../index.md#dictionary) |
`type` | &#34;leftJoin&#34; \| &#34;innerJoin&#34; \| &#34;pivotJoin&#34; |
`path?` | string |

**Returns:** void

___

### leftJoin

▸ **leftJoin**(`field`: string, `alias`: string, `cond?`: [QBFilterQuery](../index.md#qbfilterquery)): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:102](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L102)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`field` | string | - |
`alias` | string | - |
`cond` | [QBFilterQuery](../index.md#qbfilterquery) | {} |

**Returns:** this

___

### limit

▸ **limit**(`limit?`: number, `offset?`: number): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:195](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L195)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`limit?` | number | - |
`offset` | number | 0 |

**Returns:** this

___

### offset

▸ **offset**(`offset?`: number): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:205](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L205)*

#### Parameters:

Name | Type |
------ | ------ |
`offset?` | number |

**Returns:** this

___

### orWhere

▸ **orWhere**(`cond`: [QBFilterQuery](../index.md#qbfilterquery)&#60;T>): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:149](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L149)*

#### Parameters:

Name | Type |
------ | ------ |
`cond` | [QBFilterQuery](../index.md#qbfilterquery)&#60;T> |

**Returns:** this

▸ **orWhere**(`cond`: string, `params?`: any[]): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:150](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L150)*

#### Parameters:

Name | Type |
------ | ------ |
`cond` | string |
`params?` | any[] |

**Returns:** this

___

### orderBy

▸ **orderBy**(`orderBy`: QueryOrderMap): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:155](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L155)*

#### Parameters:

Name | Type |
------ | ------ |
`orderBy` | QueryOrderMap |

**Returns:** this

___

### populate

▸ **populate**(`populate`: [PopulateOptions](../index.md#populateoptions)&#60;T>[]): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:178](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L178)*

**`internal`** 

#### Parameters:

Name | Type |
------ | ------ |
`populate` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] |

**Returns:** this

___

### prepareFields

▸ `Private`**prepareFields**&#60;T, U>(`fields`: [Field](../index.md#field)&#60;T>[], `type?`: &#34;where&#34; \| &#34;groupBy&#34; \| &#34;sub-query&#34;): U[]

*Defined in [packages/knex/src/query/QueryBuilder.ts:434](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L434)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | - |
`U` | string \| Raw | string \\| Raw |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`fields` | [Field](../index.md#field)&#60;T>[] | - |
`type` | &#34;where&#34; \| &#34;groupBy&#34; \| &#34;sub-query&#34; | "where" |

**Returns:** U[]

___

### raw

▸ **raw**(`sql`: string): Raw

*Defined in [packages/knex/src/query/QueryBuilder.ts:191](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L191)*

#### Parameters:

Name | Type |
------ | ------ |
`sql` | string |

**Returns:** Raw

___

### ref

▸ **ref**(`field`: string): any

*Defined in [packages/knex/src/query/QueryBuilder.ts:187](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L187)*

**`internal`** 

#### Parameters:

Name | Type |
------ | ------ |
`field` | string |

**Returns:** any

___

### select

▸ **select**(`fields`: [Field](../index.md#field)&#60;T> \| [Field](../index.md#field)&#60;T>[], `distinct?`: boolean): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:53](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L53)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`fields` | [Field](../index.md#field)&#60;T> \| [Field](../index.md#field)&#60;T>[] | - |
`distinct` | boolean | false |

**Returns:** this

___

### setFlag

▸ **setFlag**(`flag`: [QueryFlag](../enums/queryflag.md)): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:226](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L226)*

#### Parameters:

Name | Type |
------ | ------ |
`flag` | [QueryFlag](../enums/queryflag.md) |

**Returns:** this

___

### setLockMode

▸ **setLockMode**(`mode?`: [LockMode](../enums/lockmode.md)): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:216](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L216)*

#### Parameters:

Name | Type |
------ | ------ |
`mode?` | [LockMode](../enums/lockmode.md) |

**Returns:** this

___

### truncate

▸ **truncate**(): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:83](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L83)*

**Returns:** this

___

### unsetFlag

▸ **unsetFlag**(`flag`: [QueryFlag](../enums/queryflag.md)): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:231](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L231)*

#### Parameters:

Name | Type |
------ | ------ |
`flag` | [QueryFlag](../enums/queryflag.md) |

**Returns:** this

___

### update

▸ **update**(`data`: any): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:75](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L75)*

#### Parameters:

Name | Type |
------ | ------ |
`data` | any |

**Returns:** this

___

### where

▸ **where**(`cond`: [QBFilterQuery](../index.md#qbfilterquery)&#60;T>, `operator?`: keyof *typeof* GroupOperator): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:111](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L111)*

#### Parameters:

Name | Type |
------ | ------ |
`cond` | [QBFilterQuery](../index.md#qbfilterquery)&#60;T> |
`operator?` | keyof *typeof* GroupOperator |

**Returns:** this

▸ **where**(`cond`: string, `params?`: any[], `operator?`: keyof *typeof* GroupOperator): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:112](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L112)*

#### Parameters:

Name | Type |
------ | ------ |
`cond` | string |
`params?` | any[] |
`operator?` | keyof *typeof* GroupOperator |

**Returns:** this

___

### withSchema

▸ **withSchema**(`schema?`: string): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:210](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L210)*

#### Parameters:

Name | Type |
------ | ------ |
`schema?` | string |

**Returns:** this

___

### withSubQuery

▸ **withSubQuery**(`subQuery`: KnexQueryBuilder, `alias`: string): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:106](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L106)*

#### Parameters:

Name | Type |
------ | ------ |
`subQuery` | KnexQueryBuilder |
`alias` | string |

**Returns:** this

___

### wrapModifySubQuery

▸ `Private`**wrapModifySubQuery**(`meta`: EntityMetadata): void

*Defined in [packages/knex/src/query/QueryBuilder.ts:595](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L595)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |

**Returns:** void

___

### wrapPaginateSubQuery

▸ `Private`**wrapPaginateSubQuery**(`meta`: EntityMetadata): void

*Defined in [packages/knex/src/query/QueryBuilder.ts:575](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/QueryBuilder.ts#L575)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |

**Returns:** void
