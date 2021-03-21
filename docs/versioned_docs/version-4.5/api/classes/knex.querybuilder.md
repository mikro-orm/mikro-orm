---
id: "knex.querybuilder"
title: "Class: QueryBuilder<T>"
sidebar_label: "QueryBuilder"
custom_edit_url: null
hide_title: true
---

# Class: QueryBuilder<T\>

[knex](../modules/knex.md).QueryBuilder

SQL query builder

## Type parameters

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | [*AnyEntity*](../modules/core.md#anyentity) |

## Constructors

### constructor

\+ **new QueryBuilder**<T\>(`entityName`: *string*, `metadata`: [*MetadataStorage*](core.metadatastorage.md), `driver`: [*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>, `context?`: [*Transaction*](../interfaces/knex.knex-1.transaction.md)<any, any\>, `alias?`: *string*, `connectionType?`: *read* \| *write*, `em?`: [*EntityManager*](knex.entitymanager.md)<[*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>\>): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | [*AnyEntity*](../modules/core.md#anyentity)<any\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |
`driver` | [*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\> |
`context?` | [*Transaction*](../interfaces/knex.knex-1.transaction.md)<any, any\> |
`alias` | *string* |
`connectionType?` | *read* \| *write* |
`em?` | [*EntityManager*](knex.entitymanager.md)<[*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>\> |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:59](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L59)

## Properties

### \_aliasMap

• `Private` **\_aliasMap**: [*Dictionary*](../modules/core.md#dictionary)<string\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:43](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L43)

___

### \_cache

• `Private` `Optional` **\_cache**: *number* \| *boolean* \| [*string*, *number*]

Defined in: [packages/knex/src/query/QueryBuilder.ts:54](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L54)

___

### \_cond

• `Private` **\_cond**: [*Dictionary*](../modules/core.md#dictionary)<any\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:45](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L45)

___

### \_data

• `Private` **\_data**: [*Dictionary*](../modules/core.md#dictionary)<any\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:46](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L46)

___

### \_fields

• `Optional` **\_fields**: [*Field*](../modules/knex.md#field)<T\>[]

Defined in: [packages/knex/src/query/QueryBuilder.ts:35](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L35)

___

### \_groupBy

• `Private` **\_groupBy**: [*Field*](../modules/knex.md#field)<T\>[]

Defined in: [packages/knex/src/query/QueryBuilder.ts:48](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L48)

___

### \_having

• `Private` **\_having**: [*Dictionary*](../modules/core.md#dictionary)<any\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:49](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L49)

___

### \_joinedProps

• `Private` **\_joinedProps**: *Map*<string, [*PopulateOptions*](../modules/core.md#populateoptions)<any\>\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:53](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L53)

___

### \_joins

• `Private` **\_joins**: [*Dictionary*](../modules/core.md#dictionary)<[*JoinOptions*](../interfaces/knex.joinoptions.md)\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:42](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L42)

___

### \_limit

• `Private` `Optional` **\_limit**: *number*

Defined in: [packages/knex/src/query/QueryBuilder.ts:51](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L51)

___

### \_offset

• `Private` `Optional` **\_offset**: *number*

Defined in: [packages/knex/src/query/QueryBuilder.ts:52](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L52)

___

### \_onConflict

• `Private` `Optional` **\_onConflict**: { `fields`: *string*[] ; `ignore?`: *boolean* ; `merge?`: [*EntityData*](../modules/core.md#entitydata)<T\> ; `where?`: [*FilterQuery*](../modules/core.md#filterquery)<T\> \| [*FilterQuery*](../modules/core.md#filterquery)<T\> & [*Dictionary*](../modules/core.md#dictionary)<any\>  }[]

Defined in: [packages/knex/src/query/QueryBuilder.ts:50](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L50)

___

### \_orderBy

• `Private` **\_orderBy**: [*QueryOrderMap*](../interfaces/core.queryordermap.md)

Defined in: [packages/knex/src/query/QueryBuilder.ts:47](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L47)

___

### \_populate

• **\_populate**: [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[]

Defined in: [packages/knex/src/query/QueryBuilder.ts:36](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L36)

___

### \_populateMap

• **\_populateMap**: [*Dictionary*](../modules/core.md#dictionary)<string\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:37](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L37)

___

### \_schema

• `Private` `Optional` **\_schema**: *string*

Defined in: [packages/knex/src/query/QueryBuilder.ts:44](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L44)

___

### alias

• `Readonly` **alias**: *string*

___

### aliasCounter

• `Private` **aliasCounter**: *number*= 1

Defined in: [packages/knex/src/query/QueryBuilder.ts:39](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L39)

___

### finalized

• `Private` **finalized**: *boolean*= false

Defined in: [packages/knex/src/query/QueryBuilder.ts:41](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L41)

___

### flags

• `Private` **flags**: *Set*<[*QueryFlag*](../enums/core.queryflag.md)\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:40](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L40)

___

### helper

• `Private` `Readonly` **helper**: [*QueryBuilderHelper*](knex.querybuilderhelper.md)

Defined in: [packages/knex/src/query/QueryBuilder.ts:59](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L59)

___

### knex

• `Private` `Readonly` **knex**: *Knex*<any, unknown[]\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:58](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L58)

___

### lockMode

• `Private` `Optional` **lockMode**: [*LockMode*](../enums/core.lockmode.md)

Defined in: [packages/knex/src/query/QueryBuilder.ts:55](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L55)

___

### platform

• `Private` `Readonly` **platform**: [*AbstractSqlPlatform*](knex.abstractsqlplatform.md)

Defined in: [packages/knex/src/query/QueryBuilder.ts:57](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L57)

___

### subQueries

• `Private` **subQueries**: [*Dictionary*](../modules/core.md#dictionary)<string\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:56](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L56)

___

### type

• **type**: [*QueryType*](../enums/knex.querytype.md)

Defined in: [packages/knex/src/query/QueryBuilder.ts:34](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L34)

## Methods

### addSelect

▸ **addSelect**(`fields`: [*Field*](../modules/knex.md#field)<T\> \| [*Field*](../modules/knex.md#field)<T\>[]): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`fields` | [*Field*](../modules/knex.md#field)<T\> \| [*Field*](../modules/knex.md#field)<T\>[] |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:81](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L81)

___

### andWhere

▸ **andWhere**(`cond`: [*FilterQuery*](../modules/core.md#filterquery)<T\> \| [*FilterQuery*](../modules/core.md#filterquery)<T\> & [*Dictionary*](../modules/core.md#dictionary)<any\>): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`cond` | [*FilterQuery*](../modules/core.md#filterquery)<T\> \| [*FilterQuery*](../modules/core.md#filterquery)<T\> & [*Dictionary*](../modules/core.md#dictionary)<any\> |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:197](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L197)

▸ **andWhere**(`cond`: *string*, `params?`: *any*[]): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`cond` | *string* |
`params?` | *any*[] |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:198](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L198)

___

### as

▸ **as**(`alias`: *string*): [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\>

Returns knex instance with sub-query aliased with given alias.
You can provide `EntityName.propName` as alias, then the field name will be used based on the metadata

#### Parameters:

Name | Type |
:------ | :------ |
`alias` | *string* |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:459](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L459)

___

### autoJoinPivotTable

▸ `Private`**autoJoinPivotTable**(`field`: *string*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`field` | *string* |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilder.ts:721](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L721)

___

### cache

▸ **cache**(`config?`: *number* \| *boolean* \| [*string*, *number*]): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`config` | *number* \| *boolean* \| [*string*, *number*] | true |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:309](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L309)

___

### clone

▸ **clone**(): [*QueryBuilder*](knex.querybuilder.md)<T\>

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:472](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L472)

___

### count

▸ **count**(`field?`: *string* \| *string*[], `distinct?`: *boolean*): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`field?` | *string* \| *string*[] | - |
`distinct` | *boolean* | false |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:105](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L105)

___

### delete

▸ **delete**(`cond?`: *any*): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`cond` | *any* |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:97](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L97)

___

### execute

▸ **execute**<U\>(`method?`: *all* \| *get* \| *run*, `mapResults?`: *boolean*): *Promise*<U\>

Executes this QB and returns the raw results, mapped to the property names (unless disabled via last parameter).
Use `method` to specify what kind of result you want to get (array/single/meta).

#### Type parameters:

Name | Default |
:------ | :------ |
`U` | *any* |

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`method` | *all* \| *get* \| *run* | 'all' |
`mapResults` | *boolean* | true |

**Returns:** *Promise*<U\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:391](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L391)

___

### finalize

▸ `Private`**finalize**(): *void*

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilder.ts:634](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L634)

___

### getAliasForJoinPath

▸ **getAliasForJoinPath**(`path?`: *string*): *undefined* \| *string*

#### Parameters:

Name | Type |
:------ | :------ |
`path?` | *string* |

**Returns:** *undefined* \| *string*

Defined in: [packages/knex/src/query/QueryBuilder.ts:367](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L367)

___

### getFieldsForJoinedLoad

▸ `Protected`**getFieldsForJoinedLoad**<U\>(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<U\>, `alias`: *string*): [*Field*](../modules/knex.md#field)<U\>[]

#### Type parameters:

Name | Type |
:------ | :------ |
`U` | [*AnyEntity*](../modules/core.md#anyentity)<U\> |

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<U\> |
`alias` | *string* |

**Returns:** [*Field*](../modules/knex.md#field)<U\>[]

Defined in: [packages/knex/src/query/QueryBuilder.ts:146](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L146)

___

### getFormattedQuery

▸ **getFormattedQuery**(): *string*

Returns raw interpolated query string with all the parameters inlined.

**Returns:** *string*

Defined in: [packages/knex/src/query/QueryBuilder.ts:362](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L362)

___

### getKnex

▸ **getKnex**(): [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\>

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:484](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L484)

___

### getKnexQuery

▸ **getKnexQuery**(): [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\>

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:314](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L314)

___

### getNextAlias

▸ **getNextAlias**(`prefix?`: *string*): *string*

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`prefix` | *string* | 'e' |

**Returns:** *string*

Defined in: [packages/knex/src/query/QueryBuilder.ts:382](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L382)

___

### getParams

▸ **getParams**(): readonly [*Value*](../modules/knex.knex-1.md#value)[]

Returns the list of all parameters for this query.

**Returns:** readonly [*Value*](../modules/knex.knex-1.md#value)[]

Defined in: [packages/knex/src/query/QueryBuilder.ts:355](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L355)

___

### getQuery

▸ **getQuery**(): *string*

Returns the query with parameters as wildcards.

**Returns:** *string*

Defined in: [packages/knex/src/query/QueryBuilder.ts:348](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L348)

___

### getQueryBase

▸ `Private`**getQueryBase**(): [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\>

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:593](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L593)

___

### getResult

▸ **getResult**(): *Promise*<T[]\>

Alias for `qb.getResultList()`

**Returns:** *Promise*<T[]\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:430](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L430)

___

### getResultList

▸ **getResultList**(): *Promise*<T[]\>

Executes the query, returning array of results

**Returns:** *Promise*<T[]\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:437](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L437)

___

### getSingleResult

▸ **getSingleResult**(): *Promise*<*null* \| T\>

Executes the query, returning the first result or null

**Returns:** *Promise*<*null* \| T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:450](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L450)

___

### groupBy

▸ **groupBy**(`fields`: *string* \| keyof T \| (*string* \| keyof T)[]): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`fields` | *string* \| keyof T \| (*string* \| keyof T)[] |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:215](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L215)

___

### having

▸ **having**(`cond?`: *any*, `params?`: *any*[]): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`cond` | *any* |
`params?` | *any*[] |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:220](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L220)

___

### ignore

▸ **ignore**(): [*QueryBuilder*](knex.querybuilder.md)<T\>

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:235](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L235)

___

### init

▸ `Private`**init**(`type`: [*QueryType*](../enums/knex.querytype.md), `data?`: *any*, `cond?`: *any*): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`type` | [*QueryType*](../enums/knex.querytype.md) |
`data?` | *any* |
`cond?` | *any* |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:574](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L574)

___

### insert

▸ **insert**(`data`: [*EntityData*](../modules/core.md#entitydata)<T\>): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:89](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L89)

___

### join

▸ **join**(`field`: *string*, `alias`: *string*, `cond?`: *any*, `type?`: *leftJoin* \| *innerJoin* \| *pivotJoin*, `path?`: *string*): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`field` | *string* | - |
`alias` | *string* | - |
`cond` | *any* | - |
`type` | *leftJoin* \| *innerJoin* \| *pivotJoin* | 'innerJoin' |
`path?` | *string* | - |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:115](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L115)

___

### joinAndSelect

▸ **joinAndSelect**(`field`: *string*, `alias`: *string*, `cond?`: *any*, `type?`: *leftJoin* \| *innerJoin* \| *pivotJoin*, `path?`: *string*): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`field` | *string* | - |
`alias` | *string* | - |
`cond` | *any* | - |
`type` | *leftJoin* \| *innerJoin* \| *pivotJoin* | 'innerJoin' |
`path?` | *string* | - |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:124](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L124)

___

### joinReference

▸ `Private`**joinReference**(`field`: *string*, `alias`: *string*, `cond`: [*Dictionary*](../modules/core.md#dictionary)<any\>, `type`: *leftJoin* \| *innerJoin* \| *pivotJoin*, `path?`: *string*): [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>

#### Parameters:

Name | Type |
:------ | :------ |
`field` | *string* |
`alias` | *string* |
`cond` | [*Dictionary*](../modules/core.md#dictionary)<any\> |
`type` | *leftJoin* \| *innerJoin* \| *pivotJoin* |
`path?` | *string* |

**Returns:** [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:495](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L495)

___

### leftJoin

▸ **leftJoin**(`field`: *string*, `alias`: *string*, `cond?`: *any*): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`field` | *string* |
`alias` | *string* |
`cond` | *any* |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:120](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L120)

___

### leftJoinAndSelect

▸ **leftJoinAndSelect**(`field`: *string*, `alias`: *string*, `cond?`: *any*): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`field` | *string* |
`alias` | *string* |
`cond` | *any* |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:142](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L142)

___

### limit

▸ **limit**(`limit?`: *number*, `offset?`: *number*): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`limit?` | *number* | - |
`offset` | *number* | 0 |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:268](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L268)

___

### merge

▸ **merge**(`data?`: [*EntityData*](../modules/core.md#entitydata)<T\>): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`data?` | [*EntityData*](../modules/core.md#entitydata)<T\> |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:240](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L240)

___

### offset

▸ **offset**(`offset?`: *number*): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`offset?` | *number* |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:278](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L278)

___

### onConflict

▸ **onConflict**(`fields`: *string* \| *string*[]): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`fields` | *string* \| *string*[] |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:229](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L229)

___

### orWhere

▸ **orWhere**(`cond`: [*FilterQuery*](../modules/core.md#filterquery)<T\> \| [*FilterQuery*](../modules/core.md#filterquery)<T\> & [*Dictionary*](../modules/core.md#dictionary)<any\>): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`cond` | [*FilterQuery*](../modules/core.md#filterquery)<T\> \| [*FilterQuery*](../modules/core.md#filterquery)<T\> & [*Dictionary*](../modules/core.md#dictionary)<any\> |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:203](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L203)

▸ **orWhere**(`cond`: *string*, `params?`: *any*[]): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`cond` | *string* |
`params?` | *any*[] |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:204](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L204)

___

### orderBy

▸ **orderBy**(`orderBy`: [*QueryOrderMap*](../interfaces/core.queryordermap.md)): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`orderBy` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:209](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L209)

___

### populate

▸ **populate**(`populate`: [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[]): [*QueryBuilder*](knex.querybuilder.md)<T\>

**`internal`** 

#### Parameters:

Name | Type |
:------ | :------ |
`populate` | [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[] |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:248](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L248)

___

### prepareFields

▸ `Private`**prepareFields**<T, U\>(`fields`: [*Field*](../modules/knex.md#field)<T\>[], `type?`: *groupBy* \| *where* \| *sub-query*): U[]

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | - |
`U` | *string* \| [*Raw*](../interfaces/knex.knex-1.raw.md)<any\> | *string* \| [*Raw*](../interfaces/knex.knex-1.raw.md)<any\> |

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`fields` | [*Field*](../modules/knex.md#field)<T\>[] | - |
`type` | *groupBy* \| *where* \| *sub-query* | 'where' |

**Returns:** U[]

Defined in: [packages/knex/src/query/QueryBuilder.ts:536](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L536)

___

### raw

▸ **raw**(`sql`: *string*): [*Raw*](../interfaces/knex.knex-1.raw.md)<any\>

#### Parameters:

Name | Type |
:------ | :------ |
`sql` | *string* |

**Returns:** [*Raw*](../interfaces/knex.knex-1.raw.md)<any\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:261](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L261)

___

### ref

▸ **ref**(`field`: *string*): [*Ref*](../interfaces/knex.knex-1.ref.md)<string, {}\>

**`internal`** 

#### Parameters:

Name | Type |
:------ | :------ |
`field` | *string* |

**Returns:** [*Ref*](../interfaces/knex.knex-1.ref.md)<string, {}\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:257](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L257)

___

### select

▸ **select**(`fields`: [*Field*](../modules/knex.md#field)<T\> \| [*Field*](../modules/knex.md#field)<T\>[], `distinct?`: *boolean*): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`fields` | [*Field*](../modules/knex.md#field)<T\> \| [*Field*](../modules/knex.md#field)<T\>[] | - |
`distinct` | *boolean* | false |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:71](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L71)

___

### setFlag

▸ **setFlag**(`flag`: [*QueryFlag*](../enums/core.queryflag.md)): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`flag` | [*QueryFlag*](../enums/core.queryflag.md) |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:299](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L299)

___

### setLockMode

▸ **setLockMode**(`mode?`: [*LockMode*](../enums/core.lockmode.md)): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`mode?` | [*LockMode*](../enums/core.lockmode.md) |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:289](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L289)

___

### truncate

▸ **truncate**(): [*QueryBuilder*](knex.querybuilder.md)<T\>

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:101](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L101)

___

### unsetFlag

▸ **unsetFlag**(`flag`: [*QueryFlag*](../enums/core.queryflag.md)): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`flag` | [*QueryFlag*](../enums/core.queryflag.md) |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:304](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L304)

___

### update

▸ **update**(`data`: [*EntityData*](../modules/core.md#entitydata)<T\>): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:93](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L93)

___

### where

▸ **where**(`cond`: [*FilterQuery*](../modules/core.md#filterquery)<T\> \| [*FilterQuery*](../modules/core.md#filterquery)<T\> & [*Dictionary*](../modules/core.md#dictionary)<any\>, `operator?`: *$and* \| *$or*): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`cond` | [*FilterQuery*](../modules/core.md#filterquery)<T\> \| [*FilterQuery*](../modules/core.md#filterquery)<T\> & [*Dictionary*](../modules/core.md#dictionary)<any\> |
`operator?` | *$and* \| *$or* |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:160](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L160)

▸ **where**(`cond`: *string*, `params?`: *any*[], `operator?`: *$and* \| *$or*): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`cond` | *string* |
`params?` | *any*[] |
`operator?` | *$and* \| *$or* |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:161](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L161)

___

### withSchema

▸ **withSchema**(`schema?`: *string*): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`schema?` | *string* |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:283](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L283)

___

### withSubQuery

▸ **withSubQuery**(`subQuery`: [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\>, `alias`: *string*): [*QueryBuilder*](knex.querybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`subQuery` | [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\> |
`alias` | *string* |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/query/QueryBuilder.ts:155](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L155)

___

### wrapModifySubQuery

▸ `Private`**wrapModifySubQuery**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilder.ts:707](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L707)

___

### wrapPaginateSubQuery

▸ `Private`**wrapPaginateSubQuery**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilder.ts:687](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilder.ts#L687)
