---
id: "knex.knex-1.queryinterface"
title: "Interface: QueryInterface<TRecord, TResult>"
sidebar_label: "QueryInterface"
custom_edit_url: null
hide_title: true
---

# Interface: QueryInterface<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).QueryInterface

## Type parameters

Name | Type | Default |
:------ | :------ | :------ |
`TRecord` | *object* | *any* |
`TResult` | - | *any* |

## Hierarchy

* **QueryInterface**

  ↳ [*Knex*](knex.knex-2.md)

  ↳ [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)

## Properties

### andHaving

• **andHaving**: [*Having*](knex.knex-1.having.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:544

___

### andWhere

• **andWhere**: [*Where*](knex.knex-1.where.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:498

___

### andWhereBetween

• **andWhereBetween**: [*WhereBetween*](knex.knex-1.wherebetween.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:522

___

### andWhereNot

• **andWhereNot**: [*Where*](knex.knex-1.where.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:501

___

### andWhereNotBetween

• **andWhereNotBetween**: [*WhereBetween*](knex.knex-1.wherebetween.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:525

___

### andWhereRaw

• **andWhereRaw**: [*WhereRaw*](knex.knex-1.whereraw.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:505

___

### as

• **as**: [*As*](knex.knex-1.as.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:467

___

### avg

• **avg**: [*TypePreservingAggregation*](knex.knex-1.typepreservingaggregation.md)<TRecord, TResult, any\>

Defined in: node_modules/knex/types/index.d.ts:587

___

### avgDistinct

• **avgDistinct**: [*TypePreservingAggregation*](knex.knex-1.typepreservingaggregation.md)<TRecord, TResult, any\>

Defined in: node_modules/knex/types/index.d.ts:588

___

### column

• **column**: [*Select*](knex.knex-1.select.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:469

___

### columns

• **columns**: [*Select*](knex.knex-1.select.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:468

___

### count

• **count**: [*AsymmetricAggregation*](knex.knex-1.asymmetricaggregation.md)<TRecord, TResult, string \| number\>

Defined in: node_modules/knex/types/index.d.ts:581

___

### countDistinct

• **countDistinct**: [*AsymmetricAggregation*](knex.knex-1.asymmetricaggregation.md)<TRecord, TResult, string \| number\>

Defined in: node_modules/knex/types/index.d.ts:582

___

### crossJoin

• **crossJoin**: [*Join*](knex.knex-1.join.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:487

___

### distinct

• **distinct**: [*Distinct*](knex.knex-1.distinct.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:474

___

### distinctOn

• **distinctOn**: [*DistinctOn*](knex.knex-1.distincton.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:475

___

### first

• **first**: [*Select*](knex.knex-1.select.md)<TRecord, AddUnionMember<UnwrapArrayMember<TResult\>, undefined\>\>

Defined in: node_modules/knex/types/index.d.ts:609

___

### from

• **from**: [*Table*](knex.knex-1.table.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:471

___

### fullOuterJoin

• **fullOuterJoin**: [*Join*](knex.knex-1.join.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:486

___

### groupBy

• **groupBy**: [*GroupBy*](knex.knex-1.groupby.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:528

___

### groupByRaw

• **groupByRaw**: [*RawQueryBuilder*](knex.knex-1.rawquerybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:529

___

### having

• **having**: [*Having*](knex.knex-1.having.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:543

___

### havingBetween

• **havingBetween**: [*HavingRange*](knex.knex-1.havingrange.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:552

___

### havingIn

• **havingIn**: [*HavingRange*](knex.knex-1.havingrange.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:548

___

### havingNotBetween

• **havingNotBetween**: [*HavingRange*](knex.knex-1.havingrange.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:550

___

### havingRaw

• **havingRaw**: [*RawQueryBuilder*](knex.knex-1.rawquerybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:545

___

### havingWrapped

• **havingWrapped**: [*WhereWrapped*](knex.knex-1.wherewrapped.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:507

___

### hintComment

• **hintComment**: [*HintComment*](knex.knex-1.hintcomment.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:470

___

### innerJoin

• **innerJoin**: [*Join*](knex.knex-1.join.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:480

___

### intersect

• **intersect**: [*Intersect*](knex.knex-1.intersect.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:536

___

### into

• **into**: [*Table*](knex.knex-1.table.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:472

___

### join

• **join**: [*Join*](knex.knex-1.join.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:478

___

### joinRaw

• **joinRaw**: [*JoinRaw*](knex.knex-1.joinraw.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:479

___

### leftJoin

• **leftJoin**: [*Join*](knex.knex-1.join.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:481

___

### leftOuterJoin

• **leftOuterJoin**: [*Join*](knex.knex-1.join.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:482

___

### max

• **max**: [*TypePreservingAggregation*](knex.knex-1.typepreservingaggregation.md)<TRecord, TResult, any\>

Defined in: node_modules/knex/types/index.d.ts:584

___

### min

• **min**: [*TypePreservingAggregation*](knex.knex-1.typepreservingaggregation.md)<TRecord, TResult, any\>

Defined in: node_modules/knex/types/index.d.ts:583

___

### orHaving

• **orHaving**: [*Having*](knex.knex-1.having.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:546

___

### orHavingBetween

• **orHavingBetween**: [*HavingRange*](knex.knex-1.havingrange.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:551

___

### orHavingNotBetween

• **orHavingNotBetween**: [*HavingRange*](knex.knex-1.havingrange.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:549

___

### orHavingRaw

• **orHavingRaw**: [*RawQueryBuilder*](knex.knex-1.rawquerybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:547

___

### orWhere

• **orWhere**: [*Where*](knex.knex-1.where.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:499

___

### orWhereBetween

• **orWhereBetween**: [*WhereBetween*](knex.knex-1.wherebetween.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:521

___

### orWhereExists

• **orWhereExists**: [*WhereExists*](knex.knex-1.whereexists.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:509

___

### orWhereIn

• **orWhereIn**: [*WhereIn*](knex.knex-1.wherein.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:513

___

### orWhereNot

• **orWhereNot**: [*Where*](knex.knex-1.where.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:502

___

### orWhereNotBetween

• **orWhereNotBetween**: [*WhereBetween*](knex.knex-1.wherebetween.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:524

___

### orWhereNotExists

• **orWhereNotExists**: [*WhereExists*](knex.knex-1.whereexists.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:511

___

### orWhereNotIn

• **orWhereNotIn**: [*WhereIn*](knex.knex-1.wherein.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:515

___

### orWhereNotNull

• **orWhereNotNull**: [*WhereNull*](knex.knex-1.wherenull.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:519

___

### orWhereNull

• **orWhereNull**: [*WhereNull*](knex.knex-1.wherenull.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:517

___

### orWhereRaw

• **orWhereRaw**: [*WhereRaw*](knex.knex-1.whereraw.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:504

___

### orderBy

• **orderBy**: [*OrderBy*](knex.knex-1.orderby.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:532

___

### orderByRaw

• **orderByRaw**: [*RawQueryBuilder*](knex.knex-1.rawquerybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:533

___

### outerJoin

• **outerJoin**: [*Join*](knex.knex-1.join.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:485

___

### rightJoin

• **rightJoin**: [*Join*](knex.knex-1.join.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:483

___

### rightOuterJoin

• **rightOuterJoin**: [*Join*](knex.knex-1.join.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:484

___

### select

• **select**: [*Select*](knex.knex-1.select.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:466

___

### sum

• **sum**: [*TypePreservingAggregation*](knex.knex-1.typepreservingaggregation.md)<TRecord, TResult, any\>

Defined in: node_modules/knex/types/index.d.ts:585

___

### sumDistinct

• **sumDistinct**: [*TypePreservingAggregation*](knex.knex-1.typepreservingaggregation.md)<TRecord, TResult, any\>

Defined in: node_modules/knex/types/index.d.ts:586

___

### table

• **table**: [*Table*](knex.knex-1.table.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:473

___

### union

• **union**: [*Union*](knex.knex-1.union.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:539

___

### unionAll

• **unionAll**: [*Union*](knex.knex-1.union.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:540

___

### where

• **where**: [*Where*](knex.knex-1.where.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:497

___

### whereBetween

• **whereBetween**: [*WhereBetween*](knex.knex-1.wherebetween.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:520

___

### whereExists

• **whereExists**: [*WhereExists*](knex.knex-1.whereexists.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:508

___

### whereIn

• **whereIn**: [*WhereIn*](knex.knex-1.wherein.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:512

___

### whereNot

• **whereNot**: [*Where*](knex.knex-1.where.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:500

___

### whereNotBetween

• **whereNotBetween**: [*WhereBetween*](knex.knex-1.wherebetween.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:523

___

### whereNotExists

• **whereNotExists**: [*WhereExists*](knex.knex-1.whereexists.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:510

___

### whereNotIn

• **whereNotIn**: [*WhereIn*](knex.knex-1.wherein.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:514

___

### whereNotNull

• **whereNotNull**: [*WhereNull*](knex.knex-1.wherenull.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:518

___

### whereNull

• **whereNull**: [*WhereNull*](knex.knex-1.wherenull.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:516

___

### whereRaw

• **whereRaw**: [*WhereRaw*](knex.knex-1.whereraw.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:503

___

### whereWrapped

• **whereWrapped**: [*WhereWrapped*](knex.knex-1.wherewrapped.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:506

___

### with

• **with**: [*With*](knex.knex-1.with.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:490

___

### withRaw

• **withRaw**: [*WithRaw*](knex.knex-1.withraw.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:492

___

### withRecursive

• **withRecursive**: [*With*](knex.knex-1.with.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:491

___

### withSchema

• **withSchema**: [*WithSchema*](knex.knex-1.withschema.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:493

___

### withWrapped

• **withWrapped**: [*WithWrapped*](knex.knex-1.withwrapped.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:494

## Methods

### clear

▸ **clear**(`statement`: [*ClearStatements*](../modules/knex.knex-1.md#clearstatements)): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`statement` | [*ClearStatements*](../modules/knex.knex-1.md#clearstatements) |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:574

___

### clearCounters

▸ **clearCounters**(): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:573

___

### clearGroup

▸ **clearGroup**(): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:570

___

### clearHaving

▸ **clearHaving**(): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:572

___

### clearOrder

▸ **clearOrder**(): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:571

___

### clearSelect

▸ **clearSelect**(): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, *UnwrapArrayMember*<TResult\> *extends* *DeferredKeySelection*<TBase, TKeys, *true*, any, any, any, any\> ? *DeferredKeySelection*<TBase, never, *false*, {}, *false*, {}, never\>[] : TResult\>

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, *UnwrapArrayMember*<TResult\> *extends* *DeferredKeySelection*<TBase, TKeys, *true*, any, any, any, any\> ? *DeferredKeySelection*<TBase, never, *false*, {}, *false*, {}, never\>[] : TResult\>

Defined in: node_modules/knex/types/index.d.ts:555

___

### clearWhere

▸ **clearWhere**(): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:569

___

### decrement

▸ **decrement**(`columnName`: keyof TRecord, `amount?`: *number*): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, number\>

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | keyof TRecord |
`amount?` | *number* |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, number\>

Defined in: node_modules/knex/types/index.d.ts:599

▸ **decrement**(`columnName`: *string*, `amount?`: *number*): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, number\>

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`amount?` | *number* |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, number\>

Defined in: node_modules/knex/types/index.d.ts:603

___

### del

▸ **del**(`returning`: ***, `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, DeferredKeySelection<TRecord, never, *false*, {}, *false*, {}, never\>[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`returning` | *** |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, DeferredKeySelection<TRecord, never, *false*, {}, *false*, {}, never\>[]\>

Defined in: node_modules/knex/types/index.d.ts:833

▸ **del**<TKey, TResult2\>(`returning`: TKey, `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<AddKey<SetBase<UnwrapArrayMember<TResult\>, TRecord\>, TKey\>, *true*\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`returning` | TKey |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:837

▸ **del**<TKey, TResult2\>(`returning`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2[]\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TKey` | *string* | - |
`TResult2` | - | *AddAliases*<AddKey<SetBase<UnwrapArrayMember<TResult\>, TRecord\>, TKey\>, {}\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`returning` | readonly TKey[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2[]\>

Defined in: node_modules/knex/types/index.d.ts:848

▸ **del**<TResult2\>(`returning`: *string* \| readonly *string*[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *Partial*<AnyOrUnknownToOther<TRecord, {}\>\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`returning` | *string* \| readonly *string*[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:859

▸ **del**<TResult2\>(): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *number* |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:863

___

### delete

▸ **delete**(`returning`: ***, `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, DeferredKeySelection<TRecord, never, *false*, {}, *false*, {}, never\>[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`returning` | *** |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, DeferredKeySelection<TRecord, never, *false*, {}, *false*, {}, never\>[]\>

Defined in: node_modules/knex/types/index.d.ts:865

▸ **delete**<TKey, TResult2\>(`returning`: TKey, `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<AddKey<SetBase<UnwrapArrayMember<TResult\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>, TKey\>, *true*\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`returning` | TKey |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:869

▸ **delete**<TKey, TResult2\>(`returning`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TKey` | *string* | - |
`TResult2` | - | *AddAliases*<AddKey<SetBase<UnwrapArrayMember<TResult\>, TRecord\>, TKey\>, {}\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`returning` | readonly TKey[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:880

▸ **delete**<TResult2\>(`returning`: *string* \| readonly *string*[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`returning` | *string* \| readonly *string*[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:891

▸ **delete**<TResult2\>(): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *number* |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:895

___

### increment

▸ **increment**(`columnName`: keyof TRecord, `amount?`: *number*): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, number\>

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | keyof TRecord |
`amount?` | *number* |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, number\>

Defined in: node_modules/knex/types/index.d.ts:590

▸ **increment**(`columnName`: *string*, `amount?`: *number*): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, number\>

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`amount?` | *number* |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, number\>

Defined in: node_modules/knex/types/index.d.ts:594

___

### insert

▸ **insert**(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> \| readonly [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>[], `returning`: ***, `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, DeferredKeySelection<TRecord, never, *false*, {}, *false*, {}, never\>[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> \| readonly [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>[] |
`returning` | *** |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, DeferredKeySelection<TRecord, never, *false*, {}, *false*, {}, never\>[]\>

Defined in: node_modules/knex/types/index.d.ts:616

▸ **insert**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> \| readonly [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>[], `returning`: TKey, `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<AddKey<SetBase<UnwrapArrayMember<TResult\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>, TKey\>, *true*\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> \| readonly [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>[] |
`returning` | TKey |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:623

▸ **insert**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> \| readonly [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>[], `returning`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TKey` | *string* | - |
`TResult2` | - | *AddAliases*<AddKey<SetBase<UnwrapArrayMember<TResult\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>, TKey\>, {}\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> \| readonly [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>[] |
`returning` | readonly TKey[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:637

▸ **insert**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> \| readonly [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>[], `returning`: TKey, `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<AddKey<SetBase<UnwrapArrayMember<TResult\>, TRecord\>, TKey\>, *true*\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> \| readonly [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>[] |
`returning` | TKey |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:651

▸ **insert**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> \| readonly [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>[], `returning`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<AddKey<SetBase<UnwrapArrayMember<TResult\>, TRecord\>, TKey\>, *true*\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> \| readonly [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>[] |
`returning` | readonly TKey[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:665

▸ **insert**<TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> \| readonly [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *number*[] |

#### Parameters:

Name | Type |
:------ | :------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> \| readonly [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:679

___

### limit

▸ **limit**(`limit`: *number*): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`limit` | *number* |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:578

___

### modify

▸ **modify**<TRecord2, TResult2\>(`callback`: [*QueryCallbackWithArgs*](../modules/knex.knex-1.md#querycallbackwithargs)<TRecord, any\>, ...`args`: *any*[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TRecord2` | *object* | *any* |
`TResult2` | *object* | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`callback` | [*QueryCallbackWithArgs*](../modules/knex.knex-1.md#querycallbackwithargs)<TRecord, any\> |
`...args` | *any*[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:685

___

### offset

▸ **offset**(`offset`: *number*): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`offset` | *number* |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:577

___

### onConflict

▸ **onConflict**<TKey, TResult2\>(`column`: TKey): [*OnConflictQueryBuilder*](knex.knex-1.onconflictquerybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<AddKey<SetBase<UnwrapArrayMember<TResult\>, TRecord\>, TKey\>, *true*\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`column` | TKey |

**Returns:** [*OnConflictQueryBuilder*](knex.knex-1.onconflictquerybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:813

▸ **onConflict**<TKey, TResult2\>(`columns`: readonly TKey[]): [*OnConflictQueryBuilder*](knex.knex-1.onconflictquerybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<AddAliases<AddKey<SetBase<UnwrapArrayMember<TResult\>, TRecord\>, TKey\>, {}\>, *false*\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`columns` | readonly TKey[] |

**Returns:** [*OnConflictQueryBuilder*](knex.knex-1.onconflictquerybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:823

___

### pluck

▸ **pluck**<K\>(`column`: K): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TRecord[K][]\>

#### Type parameters:

Name | Type |
:------ | :------ |
`K` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
:------ | :------ |
`column` | K |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TRecord[K][]\>

Defined in: node_modules/knex/types/index.d.ts:611

▸ **pluck**<TResult2\>(`column`: *string*): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type |
:------ | :------ |
`TResult2` | *object* |

#### Parameters:

Name | Type |
:------ | :------ |
`column` | *string* |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:614

___

### returning

▸ **returning**(`column`: ***, `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, DeferredKeySelection<TRecord, never, *false*, {}, *false*, {}, never\>[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`column` | *** |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, DeferredKeySelection<TRecord, never, *false*, {}, *false*, {}, never\>[]\>

Defined in: node_modules/knex/types/index.d.ts:786

▸ **returning**<TKey, TResult2\>(`column`: TKey, `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<AddKey<SetBase<UnwrapArrayMember<TResult\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>, TKey\>, *true*\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`column` | TKey |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:787

▸ **returning**<TKey, TResult2\>(`columns`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<AddAliases<AddKey<SetBase<UnwrapArrayMember<TResult\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>, TKey\>, {}\>, *false*\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`columns` | readonly TKey[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:798

▸ **returning**<TResult2\>(`column`: *string* \| readonly *string*[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *Partial*<AnyOrUnknownToOther<TRecord, {}\>\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`column` | *string* \| readonly *string*[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:808

___

### truncate

▸ **truncate**(): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, void\>

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, void\>

Defined in: node_modules/knex/types/index.d.ts:897

___

### update

▸ **update**<K1, K2, TResult2\>(`columnName`: K1, `value`: [*DbColumn*](../modules/knex.knex-1.md#dbcolumn)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\>[K1]\>, `returning`: K2, `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`K1` | *string* | - |
`K2` | *string* | - |
`TResult2` | - | *SetSingle*<AddKey<SetBase<UnwrapArrayMember<TResult\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>, K2\>, *true*\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | K1 |
`value` | [*DbColumn*](../modules/knex.knex-1.md#dbcolumn)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\>[K1]\> |
`returning` | K2 |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:689

▸ **update**<K1, K2, TResult2\>(`columnName`: K1, `value`: [*DbColumn*](../modules/knex.knex-1.md#dbcolumn)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\>[K1]\>, `returning`: readonly K2[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`K1` | *string* | - |
`K2` | *string* | - |
`TResult2` | - | *AddAliases*<AddKey<SetBase<UnwrapArrayMember<TResult\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>, K2\>, {}\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | K1 |
`value` | [*DbColumn*](../modules/knex.knex-1.md#dbcolumn)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\>[K1]\> |
`returning` | readonly K2[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:703

▸ **update**<K\>(`columnName`: K, `value`: [*DbColumn*](../modules/knex.knex-1.md#dbcolumn)<TRecord[K]\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, number\>

#### Type parameters:

Name | Type |
:------ | :------ |
`K` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | K |
`value` | [*DbColumn*](../modules/knex.knex-1.md#dbcolumn)<TRecord[K]\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, number\>

Defined in: node_modules/knex/types/index.d.ts:717

▸ **update**<TResult2\>(`columnName`: *string*, `value`: [*Value*](../modules/knex.knex-1.md#value), `returning`: *string* \| readonly *string*[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *Partial*<AnyOrUnknownToOther<TRecord, {}\>\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`value` | [*Value*](../modules/knex.knex-1.md#value) |
`returning` | *string* \| readonly *string*[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:721

▸ **update**(`data`: [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>, `returning`: ***, `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, DeferredKeySelection<TRecord, never, *false*, {}, *false*, {}, never\>[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`data` | [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> |
`returning` | *** |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, DeferredKeySelection<TRecord, never, *false*, {}, *false*, {}, never\>[]\>

Defined in: node_modules/knex/types/index.d.ts:727

▸ **update**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>, `returning`: TKey, `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<AddKey<SetBase<UnwrapArrayMember<TResult\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>, TKey\>, *true*\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> |
`returning` | TKey |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:732

▸ **update**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>, `returning`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TKey` | *string* | - |
`TResult2` | - | *AddAliases*<AddKey<SetBase<UnwrapArrayMember<TResult\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>, TKey\>, {}\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> |
`returning` | readonly TKey[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:744

▸ **update**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>, `returning`: TKey \| readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TKey` | *string* | *string* |
`TResult2` | {}[] | *AddAliases*<AddKey<SetBase<UnwrapArrayMember<TResult\>, TRecord\>, TKey\>, {}\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> |
`returning` | TKey \| readonly TKey[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:756

▸ **update**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>, `returning`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TKey` | *string* | - |
`TResult2` | {}[] | *AddAliases*<AddKey<SetBase<UnwrapArrayMember<TResult\>, TRecord\>, TKey\>, {}\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> |
`returning` | readonly TKey[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:768

▸ **update**<TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *number* |

#### Parameters:

Name | Type |
:------ | :------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:780

▸ **update**<TResult2\>(`columnName`: *string*, `value`: [*Value*](../modules/knex.knex-1.md#value)): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *number* |

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`value` | [*Value*](../modules/knex.knex-1.md#value) |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:784
