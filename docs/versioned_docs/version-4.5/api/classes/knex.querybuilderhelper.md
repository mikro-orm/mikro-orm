---
id: "knex.querybuilderhelper"
title: "Class: QueryBuilderHelper"
sidebar_label: "QueryBuilderHelper"
custom_edit_url: null
hide_title: true
---

# Class: QueryBuilderHelper

[knex](../modules/knex.md).QueryBuilderHelper

## Constructors

### constructor

\+ **new QueryBuilderHelper**(`entityName`: *string*, `alias`: *string*, `aliasMap`: [*Dictionary*](../modules/core.md#dictionary)<string\>, `subQueries`: [*Dictionary*](../modules/core.md#dictionary)<string\>, `metadata`: [*MetadataStorage*](core.metadatastorage.md), `knex`: *Knex*<any, unknown[]\>, `platform`: [*Platform*](core.platform.md)): [*QueryBuilderHelper*](knex.querybuilderhelper.md)

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`alias` | *string* |
`aliasMap` | [*Dictionary*](../modules/core.md#dictionary)<string\> |
`subQueries` | [*Dictionary*](../modules/core.md#dictionary)<string\> |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |
`knex` | *Knex*<any, unknown[]\> |
`platform` | [*Platform*](core.platform.md) |

**Returns:** [*QueryBuilderHelper*](knex.querybuilderhelper.md)

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:20](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L20)

## Methods

### appendGroupCondition

▸ `Private`**appendGroupCondition**(`type`: [*QueryType*](../enums/knex.querytype.md), `qb`: [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\>, `operator`: *$and* \| *$or*, `method`: *having* \| *where*, `subCondition`: *any*[]): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`type` | [*QueryType*](../enums/knex.querytype.md) |
`qb` | [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\> |
`operator` | *$and* \| *$or* |
`method` | *having* \| *where* |
`subCondition` | *any*[] |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:525](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L525)

___

### appendJoinClause

▸ `Private`**appendJoinClause**(`clause`: [*JoinClause*](../interfaces/knex.knex-1.joinclause.md), `cond`: [*Dictionary*](../modules/core.md#dictionary)<any\>, `operator?`: *$and* \| *$or*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`clause` | [*JoinClause*](../interfaces/knex.knex-1.joinclause.md) |
`cond` | [*Dictionary*](../modules/core.md#dictionary)<any\> |
`operator?` | *$and* \| *$or* |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:369](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L369)

___

### appendJoinSubClause

▸ `Private`**appendJoinSubClause**(`clause`: [*JoinClause*](../interfaces/knex.knex-1.joinclause.md), `cond`: [*Dictionary*](../modules/core.md#dictionary)<any\>, `key`: *string*, `operator?`: *$and* \| *$or*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`clause` | [*JoinClause*](../interfaces/knex.knex-1.joinclause.md) |
`cond` | [*Dictionary*](../modules/core.md#dictionary)<any\> |
`key` | *string* |
`operator?` | *$and* \| *$or* |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:387](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L387)

___

### appendQueryCondition

▸ **appendQueryCondition**(`type`: [*QueryType*](../enums/knex.querytype.md), `cond`: *any*, `qb`: [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\>, `operator?`: *$and* \| *$or*, `method?`: *having* \| *where*): *void*

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`type` | [*QueryType*](../enums/knex.querytype.md) | - |
`cond` | *any* | - |
`qb` | [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\> | - |
`operator?` | *$and* \| *$or* | - |
`method` | *having* \| *where* | 'where' |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:260](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L260)

___

### appendQuerySubCondition

▸ `Private`**appendQuerySubCondition**(`qb`: [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\>, `type`: [*QueryType*](../enums/knex.querytype.md), `method`: *having* \| *where*, `cond`: *any*, `key`: *string*, `operator?`: *$and* \| *$or*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`qb` | [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\> |
`type` | [*QueryType*](../enums/knex.querytype.md) |
`method` | *having* \| *where* |
`cond` | *any* |
`key` | *string* |
`operator?` | *$and* \| *$or* |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:281](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L281)

___

### fieldName

▸ `Private`**fieldName**(`field`: *string*, `alias?`: *string*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`field` | *string* |
`alias?` | *string* |

**Returns:** *string*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:549](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L549)

___

### finalize

▸ **finalize**(`type`: [*QueryType*](../enums/knex.querytype.md), `qb`: [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\>, `meta?`: [*EntityMetadata*](core.entitymetadata.md)<any\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`type` | [*QueryType*](../enums/knex.querytype.md) |
`qb` | [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\> |
`meta?` | [*EntityMetadata*](core.entitymetadata.md)<any\> |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:453](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L453)

___

### getLockSQL

▸ **getLockSQL**(`qb`: [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\>, `lockMode?`: [*LockMode*](../enums/core.lockmode.md)): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`qb` | [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\> |
`lockMode?` | [*LockMode*](../enums/core.lockmode.md) |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:470](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L470)

___

### getOperatorReplacement

▸ `Private`**getOperatorReplacement**(`op`: *string*, `value`: [*Dictionary*](../modules/core.md#dictionary)<any\>): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`op` | *string* |
`value` | [*Dictionary*](../modules/core.md#dictionary)<any\> |

**Returns:** *string*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:355](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L355)

___

### getProperty

▸ `Private`**getProperty**(`field`: *string*, `alias?`: *string*): *undefined* \| [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>

#### Parameters:

Name | Type |
:------ | :------ |
`field` | *string* |
`alias?` | *string* |

**Returns:** *undefined* \| [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:564](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L564)

___

### getQueryOrder

▸ **getQueryOrder**(`type`: [*QueryType*](../enums/knex.querytype.md), `orderBy`: [*FlatQueryOrderMap*](../interfaces/core.flatqueryordermap.md), `populate`: [*Dictionary*](../modules/core.md#dictionary)<string\>): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`type` | [*QueryType*](../enums/knex.querytype.md) |
`orderBy` | [*FlatQueryOrderMap*](../interfaces/core.flatqueryordermap.md) |
`populate` | [*Dictionary*](../modules/core.md#dictionary)<string\> |

**Returns:** *string*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:425](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L425)

___

### getRegExpParam

▸ **getRegExpParam**(`re`: *RegExp*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`re` | *RegExp* |

**Returns:** *string*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:237](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L237)

___

### getTableName

▸ **getTableName**(`entityName`: *string*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |

**Returns:** *string*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:220](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L220)

___

### isOneToOneInverse

▸ **isOneToOneInverse**(`field`: *string*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`field` | *string* |

**Returns:** *boolean*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:213](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L213)

___

### isPrefixed

▸ `Private`**isPrefixed**(`field`: *string*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`field` | *string* |

**Returns:** *boolean*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:545](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L545)

___

### isSimpleRegExp

▸ **isSimpleRegExp**(`re`: *any*): *boolean*

Checks whether the RE can be rewritten to simple LIKE query

#### Parameters:

Name | Type |
:------ | :------ |
`re` | *any* |

**Returns:** *boolean*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:228](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L228)

___

### joinManyToManyReference

▸ **joinManyToManyReference**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `ownerAlias`: *string*, `alias`: *string*, `pivotAlias`: *string*, `type`: *leftJoin* \| *innerJoin* \| *pivotJoin*, `cond`: [*Dictionary*](../modules/core.md#dictionary)<any\>, `path`: *string*): [*Dictionary*](../modules/core.md#dictionary)<[*JoinOptions*](../interfaces/knex.joinoptions.md)\>

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`ownerAlias` | *string* |
`alias` | *string* |
`pivotAlias` | *string* |
`type` | *leftJoin* \| *innerJoin* \| *pivotJoin* |
`cond` | [*Dictionary*](../modules/core.md#dictionary)<any\> |
`path` | *string* |

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<[*JoinOptions*](../interfaces/knex.joinoptions.md)\>

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:146](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L146)

___

### joinManyToOneReference

▸ **joinManyToOneReference**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `ownerAlias`: *string*, `alias`: *string*, `type`: *leftJoin* \| *innerJoin* \| *pivotJoin*, `cond?`: [*Dictionary*](../modules/core.md#dictionary)<any\>): [*JoinOptions*](../interfaces/knex.joinoptions.md)

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`ownerAlias` | *string* |
`alias` | *string* |
`type` | *leftJoin* \| *innerJoin* \| *pivotJoin* |
`cond` | [*Dictionary*](../modules/core.md#dictionary)<any\> |

**Returns:** [*JoinOptions*](../interfaces/knex.joinoptions.md)

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:137](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L137)

___

### joinOneToReference

▸ **joinOneToReference**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `ownerAlias`: *string*, `alias`: *string*, `type`: *leftJoin* \| *innerJoin* \| *pivotJoin*, `cond?`: [*Dictionary*](../modules/core.md#dictionary)<any\>): [*JoinOptions*](../interfaces/knex.joinoptions.md)

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`ownerAlias` | *string* |
`alias` | *string* |
`type` | *leftJoin* \| *innerJoin* \| *pivotJoin* |
`cond` | [*Dictionary*](../modules/core.md#dictionary)<any\> |

**Returns:** [*JoinOptions*](../interfaces/knex.joinoptions.md)

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:123](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L123)

___

### joinPivotTable

▸ **joinPivotTable**(`field`: *string*, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `ownerAlias`: *string*, `alias`: *string*, `type`: *leftJoin* \| *innerJoin* \| *pivotJoin*, `cond?`: [*Dictionary*](../modules/core.md#dictionary)<any\>): [*JoinOptions*](../interfaces/knex.joinoptions.md)

#### Parameters:

Name | Type |
:------ | :------ |
`field` | *string* |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`ownerAlias` | *string* |
`alias` | *string* |
`type` | *leftJoin* \| *innerJoin* \| *pivotJoin* |
`cond` | [*Dictionary*](../modules/core.md#dictionary)<any\> |

**Returns:** [*JoinOptions*](../interfaces/knex.joinoptions.md)

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:172](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L172)

___

### mapJoinColumns

▸ **mapJoinColumns**(`type`: [*QueryType*](../enums/knex.querytype.md), `join`: [*JoinOptions*](../interfaces/knex.joinoptions.md)): (*string* \| [*Raw*](../interfaces/knex.knex-1.raw.md)<any\>)[]

#### Parameters:

Name | Type |
:------ | :------ |
`type` | [*QueryType*](../enums/knex.querytype.md) |
`join` | [*JoinOptions*](../interfaces/knex.joinoptions.md) |

**Returns:** (*string* \| [*Raw*](../interfaces/knex.knex-1.raw.md)<any\>)[]

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:200](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L200)

___

### mapper

▸ **mapper**(`field`: *string*, `type?`: [*QueryType*](../enums/knex.querytype.md)): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`field` | *string* |
`type?` | [*QueryType*](../enums/knex.querytype.md) |

**Returns:** *string*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:30](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L30)

▸ **mapper**(`field`: *string*, `type?`: [*QueryType*](../enums/knex.querytype.md), `value?`: *any*, `alias?`: *string*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`field` | *string* |
`type?` | [*QueryType*](../enums/knex.querytype.md) |
`value?` | *any* |
`alias?` | *string* |

**Returns:** *string*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:31](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L31)

___

### prefix

▸ `Private`**prefix**(`field`: *string*, `always?`: *boolean*, `quote?`: *boolean*): *string*

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`field` | *string* | - |
`always` | *boolean* | false |
`quote` | *boolean* | false |

**Returns:** *string*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:507](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L507)

___

### processCustomExpression

▸ `Private`**processCustomExpression**<T\>(`clause`: *any*, `m`: *string*, `key`: *string*, `cond`: *any*, `type?`: [*QueryType*](../enums/knex.querytype.md)): *void*

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | *any*[] | *any*[] |

#### Parameters:

Name | Type |
:------ | :------ |
`clause` | *any* |
`m` | *string* |
`key` | *string* |
`cond` | *any* |
`type` | [*QueryType*](../enums/knex.querytype.md) |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:305](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L305)

___

### processData

▸ **processData**(`data`: [*Dictionary*](../modules/core.md#dictionary)<any\>, `convertCustomTypes`: *boolean*, `multi?`: *boolean*): *any*

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`data` | [*Dictionary*](../modules/core.md#dictionary)<any\> | - |
`convertCustomTypes` | *boolean* | - |
`multi` | *boolean* | false |

**Returns:** *any*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:74](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L74)

___

### processJoins

▸ **processJoins**(`qb`: [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\>, `joins`: [*Dictionary*](../modules/core.md#dictionary)<[*JoinOptions*](../interfaces/knex.joinoptions.md)\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`qb` | [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\> |
`joins` | [*Dictionary*](../modules/core.md#dictionary)<[*JoinOptions*](../interfaces/knex.joinoptions.md)\> |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:184](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L184)

___

### processObjectSubClause

▸ `Private`**processObjectSubClause**(`cond`: *any*, `key`: *string*, `clause`: [*JoinClause*](../interfaces/knex.knex-1.joinclause.md), `m`: *andOn* \| *orOn*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`cond` | *any* |
`key` | *string* |
`clause` | [*JoinClause*](../interfaces/knex.knex-1.joinclause.md) |
`m` | *andOn* \| *orOn* |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:406](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L406)

___

### processObjectSubCondition

▸ `Private`**processObjectSubCondition**(`cond`: *any*, `key`: *string*, `qb`: [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\>, `method`: *having* \| *where*, `m`: *having* \| *where* \| *orWhere*, `type`: [*QueryType*](../enums/knex.querytype.md)): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`cond` | *any* |
`key` | *string* |
`qb` | [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\> |
`method` | *having* \| *where* |
`m` | *having* \| *where* \| *orWhere* |
`type` | [*QueryType*](../enums/knex.querytype.md) |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:320](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L320)

___

### splitField

▸ **splitField**(`field`: *string*): [*string*, *string*]

#### Parameters:

Name | Type |
:------ | :------ |
`field` | *string* |

**Returns:** [*string*, *string*]

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:462](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L462)

___

### updateVersionProperty

▸ **updateVersionProperty**(`qb`: [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\>, `data`: [*Dictionary*](../modules/core.md#dictionary)<any\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`qb` | [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\> |
`data` | [*Dictionary*](../modules/core.md#dictionary)<any\> |

**Returns:** *void*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:486](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L486)

___

### isCustomExpression

▸ `Static`**isCustomExpression**(`field`: *string*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`field` | *string* |

**Returns:** *boolean*

Defined in: [packages/knex/src/query/QueryBuilderHelper.ts:503](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/QueryBuilderHelper.ts#L503)
