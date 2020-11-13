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

*Defined in [packages/knex/src/query/QueryBuilder.ts:58](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L58)*

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

*Defined in [packages/knex/src/query/QueryBuilder.ts:43](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L43)*

___

### \_cache

• `Private` `Optional` **\_cache**: boolean \| number \| [string, number]

*Defined in [packages/knex/src/query/QueryBuilder.ts:53](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L53)*

___

### \_cond

• `Private` **\_cond**: [Dictionary](../index.md#dictionary)

*Defined in [packages/knex/src/query/QueryBuilder.ts:45](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L45)*

___

### \_data

• `Private` **\_data**: [Dictionary](../index.md#dictionary)

*Defined in [packages/knex/src/query/QueryBuilder.ts:46](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L46)*

___

### \_fields

• `Optional` **\_fields**: [Field](../index.md#field)&#60;T>[]

*Defined in [packages/knex/src/query/QueryBuilder.ts:35](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L35)*

___

### \_groupBy

• `Private` **\_groupBy**: [Field](../index.md#field)&#60;T>[] = []

*Defined in [packages/knex/src/query/QueryBuilder.ts:48](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L48)*

___

### \_having

• `Private` **\_having**: [Dictionary](../index.md#dictionary)

*Defined in [packages/knex/src/query/QueryBuilder.ts:49](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L49)*

___

### \_joinedProps

• `Private` **\_joinedProps**: Map&#60;string, [PopulateOptions](../index.md#populateoptions)&#60;any>> = new Map&#60;string, PopulateOptions&#60;any>>()

*Defined in [packages/knex/src/query/QueryBuilder.ts:52](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L52)*

___

### \_joins

• `Private` **\_joins**: [Dictionary](../index.md#dictionary)&#60;[JoinOptions](../interfaces/joinoptions.md)>

*Defined in [packages/knex/src/query/QueryBuilder.ts:42](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L42)*

___

### \_limit

• `Private` `Optional` **\_limit**: number

*Defined in [packages/knex/src/query/QueryBuilder.ts:50](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L50)*

___

### \_offset

• `Private` `Optional` **\_offset**: number

*Defined in [packages/knex/src/query/QueryBuilder.ts:51](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L51)*

___

### \_orderBy

• `Private` **\_orderBy**: QueryOrderMap

*Defined in [packages/knex/src/query/QueryBuilder.ts:47](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L47)*

___

### \_populate

•  **\_populate**: [PopulateOptions](../index.md#populateoptions)&#60;T>[] = []

*Defined in [packages/knex/src/query/QueryBuilder.ts:36](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L36)*

___

### \_populateMap

•  **\_populateMap**: [Dictionary](../index.md#dictionary)&#60;string>

*Defined in [packages/knex/src/query/QueryBuilder.ts:37](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L37)*

___

### \_schema

• `Private` `Optional` **\_schema**: string

*Defined in [packages/knex/src/query/QueryBuilder.ts:44](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L44)*

___

### alias

• `Readonly` **alias**: string

*Defined in [packages/knex/src/query/QueryBuilder.ts:64](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L64)*

___

### aliasCounter

• `Private` **aliasCounter**: number = 1

*Defined in [packages/knex/src/query/QueryBuilder.ts:39](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L39)*

___

### connectionType

• `Private` `Optional` **connectionType**: &#34;read&#34; \| &#34;write&#34;

*Defined in [packages/knex/src/query/QueryBuilder.ts:65](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L65)*

___

### context

• `Private` `Optional` `Readonly` **context**: Transaction

*Defined in [packages/knex/src/query/QueryBuilder.ts:63](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L63)*

___

### driver

• `Private` `Readonly` **driver**: [AbstractSqlDriver](abstractsqldriver.md)

*Defined in [packages/knex/src/query/QueryBuilder.ts:62](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L62)*

___

### em

• `Private` `Optional` `Readonly` **em**: [SqlEntityManager](sqlentitymanager.md)

*Defined in [packages/knex/src/query/QueryBuilder.ts:66](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L66)*

___

### entityName

• `Private` `Readonly` **entityName**: string

*Defined in [packages/knex/src/query/QueryBuilder.ts:60](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L60)*

___

### finalized

• `Private` **finalized**: boolean = false

*Defined in [packages/knex/src/query/QueryBuilder.ts:41](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L41)*

___

### flags

• `Private` **flags**: Set&#60;[QueryFlag](../enums/queryflag.md)> = new Set([QueryFlag.CONVERT\_CUSTOM\_TYPES])

*Defined in [packages/knex/src/query/QueryBuilder.ts:40](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L40)*

___

### helper

• `Private` `Readonly` **helper**: [QueryBuilderHelper](querybuilderhelper.md) = new QueryBuilderHelper(this.entityName, this.alias, this.\_aliasMap, this.subQueries, this.metadata, this.knex, this.platform)

*Defined in [packages/knex/src/query/QueryBuilder.ts:58](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L58)*

___

### knex

• `Private` `Readonly` **knex**: any = this.driver.getConnection(this.connectionType).getKnex()

*Defined in [packages/knex/src/query/QueryBuilder.ts:57](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L57)*

___

### lockMode

• `Private` `Optional` **lockMode**: [LockMode](../enums/lockmode.md)

*Defined in [packages/knex/src/query/QueryBuilder.ts:54](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L54)*

___

### metadata

• `Private` `Readonly` **metadata**: MetadataStorage

*Defined in [packages/knex/src/query/QueryBuilder.ts:61](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L61)*

___

### platform

• `Private` `Readonly` **platform**: [AbstractSqlPlatform](abstractsqlplatform.md) = this.driver.getPlatform()

*Defined in [packages/knex/src/query/QueryBuilder.ts:56](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L56)*

___

### subQueries

• `Private` **subQueries**: [Dictionary](../index.md#dictionary)&#60;string>

*Defined in [packages/knex/src/query/QueryBuilder.ts:55](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L55)*

___

### type

•  **type**: [QueryType](../enums/querytype.md)

*Defined in [packages/knex/src/query/QueryBuilder.ts:34](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L34)*

## Methods

### addSelect

▸ **addSelect**(`fields`: [Field](../index.md#field)&#60;T> \| [Field](../index.md#field)&#60;T>[]): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:80](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L80)*

#### Parameters:

Name | Type |
------ | ------ |
`fields` | [Field](../index.md#field)&#60;T> \| [Field](../index.md#field)&#60;T>[] |

**Returns:** this

___

### andWhere

▸ **andWhere**(`cond`: [QBFilterQuery](../index.md#qbfilterquery)&#60;T>): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:192](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L192)*

#### Parameters:

Name | Type |
------ | ------ |
`cond` | [QBFilterQuery](../index.md#qbfilterquery)&#60;T> |

**Returns:** this

▸ **andWhere**(`cond`: string, `params?`: any[]): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:193](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L193)*

#### Parameters:

Name | Type |
------ | ------ |
`cond` | string |
`params?` | any[] |

**Returns:** this

___

### as

▸ **as**(`alias`: string): KnexQueryBuilder

*Defined in [packages/knex/src/query/QueryBuilder.ts:425](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L425)*

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

*Defined in [packages/knex/src/query/QueryBuilder.ts:677](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L677)*

#### Parameters:

Name | Type |
------ | ------ |
`field` | string |

**Returns:** void

___

### cache

▸ **cache**(`config?`: boolean \| number \| [string, number]): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:285](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L285)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`config` | boolean \| number \| [string, number] | true |

**Returns:** this

___

### clone

▸ **clone**(): [QueryBuilder](querybuilder.md)&#60;T>

*Defined in [packages/knex/src/query/QueryBuilder.ts:438](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L438)*

**Returns:** [QueryBuilder](querybuilder.md)&#60;T>

___

### count

▸ **count**(`field?`: string \| string[], `distinct?`: boolean): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:104](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L104)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`field?` | string \| string[] | - |
`distinct` | boolean | false |

**Returns:** this

___

### delete

▸ **delete**(`cond?`: [QBFilterQuery](../index.md#qbfilterquery)): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:96](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L96)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`cond` | [QBFilterQuery](../index.md#qbfilterquery) | {} |

**Returns:** this

___

### execute

▸ **execute**&#60;U>(`method?`: &#34;all&#34; \| &#34;get&#34; \| &#34;run&#34;, `mapResults?`: boolean): Promise&#60;U>

*Defined in [packages/knex/src/query/QueryBuilder.ts:357](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L357)*

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

*Defined in [packages/knex/src/query/QueryBuilder.ts:592](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L592)*

**Returns:** void

___

### getAliasForJoinPath

▸ **getAliasForJoinPath**(`path`: string): string \| undefined

*Defined in [packages/knex/src/query/QueryBuilder.ts:333](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L333)*

#### Parameters:

Name | Type |
------ | ------ |
`path` | string |

**Returns:** string \| undefined

___

### getFieldsForJoinedLoad

▸ `Protected`**getFieldsForJoinedLoad**&#60;U>(`prop`: EntityProperty&#60;U>, `alias`: string): [Field](../index.md#field)&#60;U>[]

*Defined in [packages/knex/src/query/QueryBuilder.ts:145](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L145)*

#### Type parameters:

Name | Type |
------ | ------ |
`U` | [AnyEntity](../index.md#anyentity)&#60;U> |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | EntityProperty&#60;U> |
`alias` | string |

**Returns:** [Field](../index.md#field)&#60;U>[]

___

### getFormattedQuery

▸ **getFormattedQuery**(): string

*Defined in [packages/knex/src/query/QueryBuilder.ts:328](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L328)*

Returns raw interpolated query string with all the parameters inlined.

**Returns:** string

___

### getKnex

▸ **getKnex**(): KnexQueryBuilder

*Defined in [packages/knex/src/query/QueryBuilder.ts:450](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L450)*

**Returns:** KnexQueryBuilder

___

### getKnexQuery

▸ **getKnexQuery**(): KnexQueryBuilder

*Defined in [packages/knex/src/query/QueryBuilder.ts:290](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L290)*

**Returns:** KnexQueryBuilder

___

### getNextAlias

▸ **getNextAlias**(`prefix?`: string): string

*Defined in [packages/knex/src/query/QueryBuilder.ts:348](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L348)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`prefix` | string | "e" |

**Returns:** string

___

### getParams

▸ **getParams**(): readonly Value[]

*Defined in [packages/knex/src/query/QueryBuilder.ts:321](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L321)*

Returns the list of all parameters for this query.

**Returns:** readonly Value[]

___

### getQuery

▸ **getQuery**(): string

*Defined in [packages/knex/src/query/QueryBuilder.ts:314](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L314)*

Returns the query with parameters as wildcards.

**Returns:** string

___

### getQueryBase

▸ `Private`**getQueryBase**(): KnexQueryBuilder

*Defined in [packages/knex/src/query/QueryBuilder.ts:551](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L551)*

**Returns:** KnexQueryBuilder

___

### getResult

▸ **getResult**(): Promise&#60;T[]>

*Defined in [packages/knex/src/query/QueryBuilder.ts:396](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L396)*

Alias for `qb.getResultList()`

**Returns:** Promise&#60;T[]>

___

### getResultList

▸ **getResultList**(): Promise&#60;T[]>

*Defined in [packages/knex/src/query/QueryBuilder.ts:403](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L403)*

Executes the query, returning array of results

**Returns:** Promise&#60;T[]>

___

### getSingleResult

▸ **getSingleResult**(): Promise&#60;T \| null>

*Defined in [packages/knex/src/query/QueryBuilder.ts:416](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L416)*

Executes the query, returning the first result or null

**Returns:** Promise&#60;T \| null>

___

### groupBy

▸ **groupBy**(`fields`: string \| keyof T \| (string \| keyof T)[]): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:210](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L210)*

#### Parameters:

Name | Type |
------ | ------ |
`fields` | string \| keyof T \| (string \| keyof T)[] |

**Returns:** this

___

### having

▸ **having**(`cond?`: [QBFilterQuery](../index.md#qbfilterquery) \| string, `params?`: any[]): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:215](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L215)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`cond` | [QBFilterQuery](../index.md#qbfilterquery) \| string | {} |
`params?` | any[] | - |

**Returns:** this

___

### init

▸ `Private`**init**(`type`: [QueryType](../enums/querytype.md), `data?`: any, `cond?`: any): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:532](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L532)*

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

*Defined in [packages/knex/src/query/QueryBuilder.ts:88](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L88)*

#### Parameters:

Name | Type |
------ | ------ |
`data` | any |

**Returns:** this

___

### join

▸ **join**(`field`: string, `alias`: string, `cond?`: [QBFilterQuery](../index.md#qbfilterquery), `type?`: &#34;leftJoin&#34; \| &#34;innerJoin&#34; \| &#34;pivotJoin&#34;, `path?`: string): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:114](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L114)*

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

### joinAndSelect

▸ **joinAndSelect**(`field`: string, `alias`: string, `cond?`: [QBFilterQuery](../index.md#qbfilterquery), `type?`: &#34;leftJoin&#34; \| &#34;innerJoin&#34; \| &#34;pivotJoin&#34;, `path?`: string): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:123](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L123)*

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

▸ `Private`**joinReference**(`field`: string, `alias`: string, `cond`: [Dictionary](../index.md#dictionary), `type`: &#34;leftJoin&#34; \| &#34;innerJoin&#34; \| &#34;pivotJoin&#34;, `path?`: string): EntityProperty

*Defined in [packages/knex/src/query/QueryBuilder.ts:461](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L461)*

#### Parameters:

Name | Type |
------ | ------ |
`field` | string |
`alias` | string |
`cond` | [Dictionary](../index.md#dictionary) |
`type` | &#34;leftJoin&#34; \| &#34;innerJoin&#34; \| &#34;pivotJoin&#34; |
`path?` | string |

**Returns:** EntityProperty

___

### leftJoin

▸ **leftJoin**(`field`: string, `alias`: string, `cond?`: [QBFilterQuery](../index.md#qbfilterquery)): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:119](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L119)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`field` | string | - |
`alias` | string | - |
`cond` | [QBFilterQuery](../index.md#qbfilterquery) | {} |

**Returns:** this

___

### leftJoinAndSelect

▸ **leftJoinAndSelect**(`field`: string, `alias`: string, `cond?`: [QBFilterQuery](../index.md#qbfilterquery)): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:141](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L141)*

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

*Defined in [packages/knex/src/query/QueryBuilder.ts:244](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L244)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`limit?` | number | - |
`offset` | number | 0 |

**Returns:** this

___

### offset

▸ **offset**(`offset?`: number): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:254](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L254)*

#### Parameters:

Name | Type |
------ | ------ |
`offset?` | number |

**Returns:** this

___

### orWhere

▸ **orWhere**(`cond`: [QBFilterQuery](../index.md#qbfilterquery)&#60;T>): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:198](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L198)*

#### Parameters:

Name | Type |
------ | ------ |
`cond` | [QBFilterQuery](../index.md#qbfilterquery)&#60;T> |

**Returns:** this

▸ **orWhere**(`cond`: string, `params?`: any[]): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:199](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L199)*

#### Parameters:

Name | Type |
------ | ------ |
`cond` | string |
`params?` | any[] |

**Returns:** this

___

### orderBy

▸ **orderBy**(`orderBy`: QueryOrderMap): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:204](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L204)*

#### Parameters:

Name | Type |
------ | ------ |
`orderBy` | QueryOrderMap |

**Returns:** this

___

### populate

▸ **populate**(`populate`: [PopulateOptions](../index.md#populateoptions)&#60;T>[]): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:227](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L227)*

**`internal`** 

#### Parameters:

Name | Type |
------ | ------ |
`populate` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] |

**Returns:** this

___

### prepareFields

▸ `Private`**prepareFields**&#60;T, U>(`fields`: [Field](../index.md#field)&#60;T>[], `type?`: &#34;where&#34; \| &#34;groupBy&#34; \| &#34;sub-query&#34;): U[]

*Defined in [packages/knex/src/query/QueryBuilder.ts:502](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L502)*

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

*Defined in [packages/knex/src/query/QueryBuilder.ts:240](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L240)*

#### Parameters:

Name | Type |
------ | ------ |
`sql` | string |

**Returns:** Raw

___

### ref

▸ **ref**(`field`: string): any

*Defined in [packages/knex/src/query/QueryBuilder.ts:236](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L236)*

**`internal`** 

#### Parameters:

Name | Type |
------ | ------ |
`field` | string |

**Returns:** any

___

### select

▸ **select**(`fields`: [Field](../index.md#field)&#60;T> \| [Field](../index.md#field)&#60;T>[], `distinct?`: boolean): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:70](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L70)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`fields` | [Field](../index.md#field)&#60;T> \| [Field](../index.md#field)&#60;T>[] | - |
`distinct` | boolean | false |

**Returns:** this

___

### setFlag

▸ **setFlag**(`flag`: [QueryFlag](../enums/queryflag.md)): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:275](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L275)*

#### Parameters:

Name | Type |
------ | ------ |
`flag` | [QueryFlag](../enums/queryflag.md) |

**Returns:** this

___

### setLockMode

▸ **setLockMode**(`mode?`: [LockMode](../enums/lockmode.md)): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:265](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L265)*

#### Parameters:

Name | Type |
------ | ------ |
`mode?` | [LockMode](../enums/lockmode.md) |

**Returns:** this

___

### truncate

▸ **truncate**(): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:100](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L100)*

**Returns:** this

___

### unsetFlag

▸ **unsetFlag**(`flag`: [QueryFlag](../enums/queryflag.md)): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:280](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L280)*

#### Parameters:

Name | Type |
------ | ------ |
`flag` | [QueryFlag](../enums/queryflag.md) |

**Returns:** this

___

### update

▸ **update**(`data`: any): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:92](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L92)*

#### Parameters:

Name | Type |
------ | ------ |
`data` | any |

**Returns:** this

___

### where

▸ **where**(`cond`: [QBFilterQuery](../index.md#qbfilterquery)&#60;T>, `operator?`: keyof *typeof* GroupOperator): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:160](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L160)*

#### Parameters:

Name | Type |
------ | ------ |
`cond` | [QBFilterQuery](../index.md#qbfilterquery)&#60;T> |
`operator?` | keyof *typeof* GroupOperator |

**Returns:** this

▸ **where**(`cond`: string, `params?`: any[], `operator?`: keyof *typeof* GroupOperator): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:161](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L161)*

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

*Defined in [packages/knex/src/query/QueryBuilder.ts:259](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L259)*

#### Parameters:

Name | Type |
------ | ------ |
`schema?` | string |

**Returns:** this

___

### withSubQuery

▸ **withSubQuery**(`subQuery`: KnexQueryBuilder, `alias`: string): this

*Defined in [packages/knex/src/query/QueryBuilder.ts:155](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L155)*

#### Parameters:

Name | Type |
------ | ------ |
`subQuery` | KnexQueryBuilder |
`alias` | string |

**Returns:** this

___

### wrapModifySubQuery

▸ `Private`**wrapModifySubQuery**(`meta`: EntityMetadata): void

*Defined in [packages/knex/src/query/QueryBuilder.ts:663](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L663)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |

**Returns:** void

___

### wrapPaginateSubQuery

▸ `Private`**wrapPaginateSubQuery**(`meta`: EntityMetadata): void

*Defined in [packages/knex/src/query/QueryBuilder.ts:643](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/QueryBuilder.ts#L643)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |

**Returns:** void
