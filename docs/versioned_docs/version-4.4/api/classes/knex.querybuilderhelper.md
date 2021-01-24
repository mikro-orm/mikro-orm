---
id: "knex.querybuilderhelper"
title: "Class: QueryBuilderHelper"
sidebar_label: "QueryBuilderHelper"
hide_title: true
---

# Class: QueryBuilderHelper

[knex](../modules/knex.md).QueryBuilderHelper

## Hierarchy

* **QueryBuilderHelper**

## Constructors

### constructor

\+ **new QueryBuilderHelper**(`entityName`: *string*, `alias`: *string*, `aliasMap`: [*Dictionary*](../modules/core.md#dictionary)<*string*\>, `subQueries`: [*Dictionary*](../modules/core.md#dictionary)<*string*\>, `metadata`: [*MetadataStorage*](core.metadatastorage.md), `knex`: *Knex*<*any*, *unknown*[]\>, `platform`: [*Platform*](core.platform.md)): [*QueryBuilderHelper*](knex.querybuilderhelper.md)

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |
`alias` | *string* |
`aliasMap` | [*Dictionary*](../modules/core.md#dictionary)<*string*\> |
`subQueries` | [*Dictionary*](../modules/core.md#dictionary)<*string*\> |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |
`knex` | *Knex*<*any*, *unknown*[]\> |
`platform` | [*Platform*](core.platform.md) |

**Returns:** [*QueryBuilderHelper*](knex.querybuilderhelper.md)

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:10](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L10)

## Methods

### appendGroupCondition

▸ `Private`**appendGroupCondition**(`type`: [*QueryType*](../enums/knex.querytype.md), `qb`: [*QueryBuilder*](knex.knex.querybuilder.md)<*any*, *any*\>, `operator`: *$and* \| *$or*, `method`: *having* \| *where*, `subCondition`: *any*[]): *void*

#### Parameters:

Name | Type |
------ | ------ |
`type` | [*QueryType*](../enums/knex.querytype.md) |
`qb` | [*QueryBuilder*](knex.knex.querybuilder.md)<*any*, *any*\> |
`operator` | *$and* \| *$or* |
`method` | *having* \| *where* |
`subCondition` | *any*[] |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:496](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L496)

___

### appendJoinClause

▸ `Private`**appendJoinClause**(`clause`: [*JoinClause*](../interfaces/knex.knex.joinclause.md), `cond`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>, `operator?`: *$and* \| *$or*): *void*

#### Parameters:

Name | Type |
------ | ------ |
`clause` | [*JoinClause*](../interfaces/knex.knex.joinclause.md) |
`cond` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> |
`operator?` | *$and* \| *$or* |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:347](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L347)

___

### appendJoinSubClause

▸ `Private`**appendJoinSubClause**(`clause`: [*JoinClause*](../interfaces/knex.knex.joinclause.md), `cond`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>, `key`: *string*, `operator?`: *$and* \| *$or*): *void*

#### Parameters:

Name | Type |
------ | ------ |
`clause` | [*JoinClause*](../interfaces/knex.knex.joinclause.md) |
`cond` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> |
`key` | *string* |
`operator?` | *$and* \| *$or* |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:365](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L365)

___

### appendQueryCondition

▸ **appendQueryCondition**(`type`: [*QueryType*](../enums/knex.querytype.md), `cond`: *any*, `qb`: [*QueryBuilder*](knex.knex.querybuilder.md)<*any*, *any*\>, `operator?`: *$and* \| *$or*, `method?`: *having* \| *where*): *void*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`type` | [*QueryType*](../enums/knex.querytype.md) | - |
`cond` | *any* | - |
`qb` | [*QueryBuilder*](knex.knex.querybuilder.md)<*any*, *any*\> | - |
`operator?` | *$and* \| *$or* | - |
`method` | *having* \| *where* | 'where' |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:238](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L238)

___

### appendQuerySubCondition

▸ `Private`**appendQuerySubCondition**(`qb`: [*QueryBuilder*](knex.knex.querybuilder.md)<*any*, *any*\>, `type`: [*QueryType*](../enums/knex.querytype.md), `method`: *having* \| *where*, `cond`: *any*, `key`: *string*, `operator?`: *$and* \| *$or*): *void*

#### Parameters:

Name | Type |
------ | ------ |
`qb` | [*QueryBuilder*](knex.knex.querybuilder.md)<*any*, *any*\> |
`type` | [*QueryType*](../enums/knex.querytype.md) |
`method` | *having* \| *where* |
`cond` | *any* |
`key` | *string* |
`operator?` | *$and* \| *$or* |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:259](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L259)

___

### fieldName

▸ `Private`**fieldName**(`field`: *string*, `alias?`: *string*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`field` | *string* |
`alias?` | *string* |

**Returns:** *string*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:520](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L520)

___

### finalize

▸ **finalize**(`type`: [*QueryType*](../enums/knex.querytype.md), `qb`: [*QueryBuilder*](knex.knex.querybuilder.md)<*any*, *any*\>, `meta?`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`type` | [*QueryType*](../enums/knex.querytype.md) |
`qb` | [*QueryBuilder*](knex.knex.querybuilder.md)<*any*, *any*\> |
`meta?` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:431](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L431)

___

### getLockSQL

▸ **getLockSQL**(`qb`: [*QueryBuilder*](knex.knex.querybuilder.md)<*any*, *any*\>, `lockMode?`: [*NONE*](../enums/core.lockmode.md#none) \| [*OPTIMISTIC*](../enums/core.lockmode.md#optimistic) \| [*PESSIMISTIC\_READ*](../enums/core.lockmode.md#pessimistic_read) \| [*PESSIMISTIC\_WRITE*](../enums/core.lockmode.md#pessimistic_write)): *void*

#### Parameters:

Name | Type |
------ | ------ |
`qb` | [*QueryBuilder*](knex.knex.querybuilder.md)<*any*, *any*\> |
`lockMode?` | [*NONE*](../enums/core.lockmode.md#none) \| [*OPTIMISTIC*](../enums/core.lockmode.md#optimistic) \| [*PESSIMISTIC\_READ*](../enums/core.lockmode.md#pessimistic_read) \| [*PESSIMISTIC\_WRITE*](../enums/core.lockmode.md#pessimistic_write) |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:448](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L448)

___

### getOperatorReplacement

▸ `Private`**getOperatorReplacement**(`op`: *string*, `value`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>): *string*

#### Parameters:

Name | Type |
------ | ------ |
`op` | *string* |
`value` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> |

**Returns:** *string*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:333](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L333)

___

### getProperty

▸ `Private`**getProperty**(`field`: *string*, `alias?`: *string*): *undefined* \| [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`field` | *string* |
`alias?` | *string* |

**Returns:** *undefined* \| [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:535](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L535)

___

### getQueryOrder

▸ **getQueryOrder**(`type`: [*QueryType*](../enums/knex.querytype.md), `orderBy`: [*FlatQueryOrderMap*](../interfaces/core.flatqueryordermap.md), `populate`: [*Dictionary*](../modules/core.md#dictionary)<*string*\>): *string*

#### Parameters:

Name | Type |
------ | ------ |
`type` | [*QueryType*](../enums/knex.querytype.md) |
`orderBy` | [*FlatQueryOrderMap*](../interfaces/core.flatqueryordermap.md) |
`populate` | [*Dictionary*](../modules/core.md#dictionary)<*string*\> |

**Returns:** *string*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:403](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L403)

___

### getRegExpParam

▸ **getRegExpParam**(`re`: *RegExp*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`re` | *RegExp* |

**Returns:** *string*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:215](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L215)

___

### getTableName

▸ **getTableName**(`entityName`: *string*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |

**Returns:** *string*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:198](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L198)

___

### isOneToOneInverse

▸ **isOneToOneInverse**(`field`: *string*): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`field` | *string* |

**Returns:** *boolean*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:191](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L191)

___

### isPrefixed

▸ `Private`**isPrefixed**(`field`: *string*): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`field` | *string* |

**Returns:** *boolean*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:516](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L516)

___

### isSimpleRegExp

▸ **isSimpleRegExp**(`re`: *any*): *boolean*

Checks whether the RE can be rewritten to simple LIKE query

#### Parameters:

Name | Type |
------ | ------ |
`re` | *any* |

**Returns:** *boolean*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:206](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L206)

___

### joinManyToManyReference

▸ **joinManyToManyReference**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `ownerAlias`: *string*, `alias`: *string*, `pivotAlias`: *string*, `type`: *leftJoin* \| *innerJoin* \| *pivotJoin*, `cond`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>, `path`: *string*): [*Dictionary*](../modules/core.md#dictionary)<[*JoinOptions*](../interfaces/knex.joinoptions.md)\>

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`ownerAlias` | *string* |
`alias` | *string* |
`pivotAlias` | *string* |
`type` | *leftJoin* \| *innerJoin* \| *pivotJoin* |
`cond` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> |
`path` | *string* |

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<[*JoinOptions*](../interfaces/knex.joinoptions.md)\>

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:124](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L124)

___

### joinManyToOneReference

▸ **joinManyToOneReference**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `ownerAlias`: *string*, `alias`: *string*, `type`: *leftJoin* \| *innerJoin* \| *pivotJoin*, `cond?`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>): [*JoinOptions*](../interfaces/knex.joinoptions.md)

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> | - |
`ownerAlias` | *string* | - |
`alias` | *string* | - |
`type` | *leftJoin* \| *innerJoin* \| *pivotJoin* | - |
`cond` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> | ... |

**Returns:** [*JoinOptions*](../interfaces/knex.joinoptions.md)

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:115](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L115)

___

### joinOneToReference

▸ **joinOneToReference**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `ownerAlias`: *string*, `alias`: *string*, `type`: *leftJoin* \| *innerJoin* \| *pivotJoin*, `cond?`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>): [*JoinOptions*](../interfaces/knex.joinoptions.md)

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> | - |
`ownerAlias` | *string* | - |
`alias` | *string* | - |
`type` | *leftJoin* \| *innerJoin* \| *pivotJoin* | - |
`cond` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> | ... |

**Returns:** [*JoinOptions*](../interfaces/knex.joinoptions.md)

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:101](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L101)

___

### joinPivotTable

▸ **joinPivotTable**(`field`: *string*, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `ownerAlias`: *string*, `alias`: *string*, `type`: *leftJoin* \| *innerJoin* \| *pivotJoin*, `cond?`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>): [*JoinOptions*](../interfaces/knex.joinoptions.md)

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`field` | *string* | - |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> | - |
`ownerAlias` | *string* | - |
`alias` | *string* | - |
`type` | *leftJoin* \| *innerJoin* \| *pivotJoin* | - |
`cond` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> | ... |

**Returns:** [*JoinOptions*](../interfaces/knex.joinoptions.md)

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:150](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L150)

___

### mapJoinColumns

▸ **mapJoinColumns**(`type`: [*QueryType*](../enums/knex.querytype.md), `join`: [*JoinOptions*](../interfaces/knex.joinoptions.md)): (*string* \| [*Raw*](../interfaces/knex.knex.raw.md)<*any*\>)[]

#### Parameters:

Name | Type |
------ | ------ |
`type` | [*QueryType*](../enums/knex.querytype.md) |
`join` | [*JoinOptions*](../interfaces/knex.joinoptions.md) |

**Returns:** (*string* \| [*Raw*](../interfaces/knex.knex.raw.md)<*any*\>)[]

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:178](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L178)

___

### mapper

▸ **mapper**(`field`: *string*, `type?`: [*TRUNCATE*](../enums/knex.querytype.md#truncate) \| [*SELECT*](../enums/knex.querytype.md#select) \| [*COUNT*](../enums/knex.querytype.md#count) \| [*INSERT*](../enums/knex.querytype.md#insert) \| [*UPDATE*](../enums/knex.querytype.md#update) \| [*DELETE*](../enums/knex.querytype.md#delete)): *string*

#### Parameters:

Name | Type |
------ | ------ |
`field` | *string* |
`type?` | [*TRUNCATE*](../enums/knex.querytype.md#truncate) \| [*SELECT*](../enums/knex.querytype.md#select) \| [*COUNT*](../enums/knex.querytype.md#count) \| [*INSERT*](../enums/knex.querytype.md#insert) \| [*UPDATE*](../enums/knex.querytype.md#update) \| [*DELETE*](../enums/knex.querytype.md#delete) |

**Returns:** *string*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:20](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L20)

▸ **mapper**(`field`: *string*, `type?`: [*TRUNCATE*](../enums/knex.querytype.md#truncate) \| [*SELECT*](../enums/knex.querytype.md#select) \| [*COUNT*](../enums/knex.querytype.md#count) \| [*INSERT*](../enums/knex.querytype.md#insert) \| [*UPDATE*](../enums/knex.querytype.md#update) \| [*DELETE*](../enums/knex.querytype.md#delete), `value?`: *any*, `alias?`: *string*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`field` | *string* |
`type?` | [*TRUNCATE*](../enums/knex.querytype.md#truncate) \| [*SELECT*](../enums/knex.querytype.md#select) \| [*COUNT*](../enums/knex.querytype.md#count) \| [*INSERT*](../enums/knex.querytype.md#insert) \| [*UPDATE*](../enums/knex.querytype.md#update) \| [*DELETE*](../enums/knex.querytype.md#delete) |
`value?` | *any* |
`alias?` | *string* |

**Returns:** *string*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:21](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L21)

___

### prefix

▸ `Private`**prefix**(`field`: *string*, `always?`: *boolean*): *string*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`field` | *string* | - |
`always` | *boolean* | false |

**Returns:** *string*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:485](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L485)

___

### processCustomExpression

▸ `Private`**processCustomExpression**<T\>(`clause`: *any*, `m`: *string*, `key`: *string*, `cond`: *any*, `type?`: [*QueryType*](../enums/knex.querytype.md)): *void*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | *any*[] | *any*[] |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`clause` | *any* | - |
`m` | *string* | - |
`key` | *string* | - |
`cond` | *any* | - |
`type` | [*QueryType*](../enums/knex.querytype.md) | ... |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:283](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L283)

___

### processData

▸ **processData**(`data`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>, `convertCustomTypes`: *boolean*, `multi?`: *boolean*): *any*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`data` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> | - |
`convertCustomTypes` | *boolean* | - |
`multi` | *boolean* | false |

**Returns:** *any*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:58](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L58)

___

### processJoins

▸ **processJoins**(`qb`: [*QueryBuilder*](knex.knex.querybuilder.md)<*any*, *any*\>, `joins`: [*Dictionary*](../modules/core.md#dictionary)<[*JoinOptions*](../interfaces/knex.joinoptions.md)\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`qb` | [*QueryBuilder*](knex.knex.querybuilder.md)<*any*, *any*\> |
`joins` | [*Dictionary*](../modules/core.md#dictionary)<[*JoinOptions*](../interfaces/knex.joinoptions.md)\> |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:162](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L162)

___

### processObjectSubClause

▸ `Private`**processObjectSubClause**(`cond`: *any*, `key`: *string*, `clause`: [*JoinClause*](../interfaces/knex.knex.joinclause.md), `m`: *andOn* \| *orOn*): *void*

#### Parameters:

Name | Type |
------ | ------ |
`cond` | *any* |
`key` | *string* |
`clause` | [*JoinClause*](../interfaces/knex.knex.joinclause.md) |
`m` | *andOn* \| *orOn* |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:384](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L384)

___

### processObjectSubCondition

▸ `Private`**processObjectSubCondition**(`cond`: *any*, `key`: *string*, `qb`: [*QueryBuilder*](knex.knex.querybuilder.md)<*any*, *any*\>, `method`: *having* \| *where*, `m`: *having* \| *where* \| *orWhere*, `type`: [*QueryType*](../enums/knex.querytype.md)): *void*

#### Parameters:

Name | Type |
------ | ------ |
`cond` | *any* |
`key` | *string* |
`qb` | [*QueryBuilder*](knex.knex.querybuilder.md)<*any*, *any*\> |
`method` | *having* \| *where* |
`m` | *having* \| *where* \| *orWhere* |
`type` | [*QueryType*](../enums/knex.querytype.md) |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:298](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L298)

___

### splitField

▸ **splitField**(`field`: *string*): [*string*, *string*]

#### Parameters:

Name | Type |
------ | ------ |
`field` | *string* |

**Returns:** [*string*, *string*]

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:440](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L440)

___

### updateVersionProperty

▸ **updateVersionProperty**(`qb`: [*QueryBuilder*](knex.knex.querybuilder.md)<*any*, *any*\>, `data`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`qb` | [*QueryBuilder*](knex.knex.querybuilder.md)<*any*, *any*\> |
`data` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:464](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L464)

___

### isCustomExpression

▸ `Static`**isCustomExpression**(`field`: *string*): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`field` | *string* |

**Returns:** *boolean*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:481](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/QueryBuilderHelper.ts#L481)
