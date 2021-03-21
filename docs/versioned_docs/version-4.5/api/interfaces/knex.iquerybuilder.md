---
id: "knex.iquerybuilder"
title: "Interface: IQueryBuilder<T>"
sidebar_label: "IQueryBuilder"
custom_edit_url: null
hide_title: true
---

# Interface: IQueryBuilder<T\>

[knex](../modules/knex.md).IQueryBuilder

## Type parameters

Name |
:------ |
`T` |

## Properties

### \_fields

• `Optional` **\_fields**: [*Field*](../modules/knex.md#field)<T\>[]

Defined in: [packages/knex/src/typings.ts:88](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L88)

___

### alias

• `Readonly` **alias**: *string*

Defined in: [packages/knex/src/typings.ts:86](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L86)

___

### type

• `Readonly` **type**: [*QueryType*](../enums/knex.querytype.md)

Defined in: [packages/knex/src/typings.ts:87](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L87)

## Methods

### addSelect

▸ **addSelect**(`fields`: *string* \| *string*[]): [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`fields` | *string* \| *string*[] |

**Returns:** [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

Defined in: [packages/knex/src/typings.ts:90](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L90)

___

### andWhere

▸ **andWhere**(`cond`: [*FilterQuery*](../modules/core.md#filterquery)<T\> \| [*FilterQuery*](../modules/core.md#filterquery)<T\> & [*Dictionary*](../modules/core.md#dictionary)<any\>): [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`cond` | [*FilterQuery*](../modules/core.md#filterquery)<T\> \| [*FilterQuery*](../modules/core.md#filterquery)<T\> & [*Dictionary*](../modules/core.md#dictionary)<any\> |

**Returns:** [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

Defined in: [packages/knex/src/typings.ts:103](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L103)

▸ **andWhere**(`cond`: *string*, `params?`: *any*[]): [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`cond` | *string* |
`params?` | *any*[] |

**Returns:** [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

Defined in: [packages/knex/src/typings.ts:104](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L104)

___

### count

▸ **count**(`field?`: *string* \| *string*[], `distinct?`: *boolean*): [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`field?` | *string* \| *string*[] |
`distinct?` | *boolean* |

**Returns:** [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

Defined in: [packages/knex/src/typings.ts:95](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L95)

___

### delete

▸ **delete**(`cond?`: *any*): [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`cond?` | *any* |

**Returns:** [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

Defined in: [packages/knex/src/typings.ts:93](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L93)

___

### getAliasForJoinPath

▸ **getAliasForJoinPath**(`path`: *string*): *undefined* \| *string*

#### Parameters:

Name | Type |
:------ | :------ |
`path` | *string* |

**Returns:** *undefined* \| *string*

Defined in: [packages/knex/src/typings.ts:110](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L110)

___

### getNextAlias

▸ **getNextAlias**(`prefix?`: *string*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`prefix?` | *string* |

**Returns:** *string*

Defined in: [packages/knex/src/typings.ts:111](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L111)

___

### groupBy

▸ **groupBy**(`fields`: *string* \| keyof T \| (*string* \| keyof T)[]): [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`fields` | *string* \| keyof T \| (*string* \| keyof T)[] |

**Returns:** [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

Defined in: [packages/knex/src/typings.ts:108](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L108)

___

### having

▸ **having**(`cond?`: *any*, `params?`: *any*[]): [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`cond?` | *any* |
`params?` | *any*[] |

**Returns:** [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

Defined in: [packages/knex/src/typings.ts:109](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L109)

___

### insert

▸ **insert**(`data`: *any*): [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`data` | *any* |

**Returns:** [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

Defined in: [packages/knex/src/typings.ts:91](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L91)

___

### join

▸ **join**(`field`: *string*, `alias`: *string*, `cond?`: *any*, `type?`: *leftJoin* \| *innerJoin* \| *pivotJoin*, `path?`: *string*): [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`field` | *string* |
`alias` | *string* |
`cond?` | *any* |
`type?` | *leftJoin* \| *innerJoin* \| *pivotJoin* |
`path?` | *string* |

**Returns:** [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

Defined in: [packages/knex/src/typings.ts:96](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L96)

___

### joinAndSelect

▸ **joinAndSelect**(`field`: *string*, `alias`: *string*, `cond?`: *any*): [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`field` | *string* |
`alias` | *string* |
`cond?` | *any* |

**Returns:** [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

Defined in: [packages/knex/src/typings.ts:98](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L98)

___

### leftJoin

▸ **leftJoin**(`field`: *string*, `alias`: *string*, `cond?`: *any*): [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`field` | *string* |
`alias` | *string* |
`cond?` | *any* |

**Returns:** [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

Defined in: [packages/knex/src/typings.ts:97](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L97)

___

### leftJoinAndSelect

▸ **leftJoinAndSelect**(`field`: *string*, `alias`: *string*, `cond?`: *any*): [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`field` | *string* |
`alias` | *string* |
`cond?` | *any* |

**Returns:** [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

Defined in: [packages/knex/src/typings.ts:99](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L99)

___

### orWhere

▸ **orWhere**(`cond`: [*FilterQuery*](../modules/core.md#filterquery)<T\> \| [*FilterQuery*](../modules/core.md#filterquery)<T\> & [*Dictionary*](../modules/core.md#dictionary)<any\>): [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`cond` | [*FilterQuery*](../modules/core.md#filterquery)<T\> \| [*FilterQuery*](../modules/core.md#filterquery)<T\> & [*Dictionary*](../modules/core.md#dictionary)<any\> |

**Returns:** [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

Defined in: [packages/knex/src/typings.ts:105](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L105)

▸ **orWhere**(`cond`: *string*, `params?`: *any*[]): [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`cond` | *string* |
`params?` | *any*[] |

**Returns:** [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

Defined in: [packages/knex/src/typings.ts:106](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L106)

___

### orderBy

▸ **orderBy**(`orderBy`: [*QueryOrderMap*](core.queryordermap.md)): [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`orderBy` | [*QueryOrderMap*](core.queryordermap.md) |

**Returns:** [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

Defined in: [packages/knex/src/typings.ts:107](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L107)

___

### select

▸ **select**(`fields`: [*Field*](../modules/knex.md#field)<T\> \| [*Field*](../modules/knex.md#field)<T\>[], `distinct?`: *boolean*): [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`fields` | [*Field*](../modules/knex.md#field)<T\> \| [*Field*](../modules/knex.md#field)<T\>[] |
`distinct?` | *boolean* |

**Returns:** [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

Defined in: [packages/knex/src/typings.ts:89](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L89)

___

### truncate

▸ **truncate**(): [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

**Returns:** [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

Defined in: [packages/knex/src/typings.ts:94](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L94)

___

### update

▸ **update**(`data`: *any*): [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`data` | *any* |

**Returns:** [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

Defined in: [packages/knex/src/typings.ts:92](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L92)

___

### where

▸ **where**(`cond`: [*FilterQuery*](../modules/core.md#filterquery)<T\> \| [*FilterQuery*](../modules/core.md#filterquery)<T\> & [*Dictionary*](../modules/core.md#dictionary)<any\>, `operator?`: *$and* \| *$or*): [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`cond` | [*FilterQuery*](../modules/core.md#filterquery)<T\> \| [*FilterQuery*](../modules/core.md#filterquery)<T\> & [*Dictionary*](../modules/core.md#dictionary)<any\> |
`operator?` | *$and* \| *$or* |

**Returns:** [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

Defined in: [packages/knex/src/typings.ts:101](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L101)

▸ **where**(`cond`: *string*, `params?`: *any*[], `operator?`: *$and* \| *$or*): [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`cond` | *string* |
`params?` | *any*[] |
`operator?` | *$and* \| *$or* |

**Returns:** [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

Defined in: [packages/knex/src/typings.ts:102](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L102)

___

### withSubQuery

▸ **withSubQuery**(`subQuery`: [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\>, `alias`: *string*): [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

#### Parameters:

Name | Type |
:------ | :------ |
`subQuery` | [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\> |
`alias` | *string* |

**Returns:** [*IQueryBuilder*](knex.iquerybuilder.md)<T\>

Defined in: [packages/knex/src/typings.ts:100](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L100)
