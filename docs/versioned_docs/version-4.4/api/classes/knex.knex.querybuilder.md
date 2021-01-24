---
id: "knex.knex.querybuilder"
title: "Class: QueryBuilder<TRecord, TResult>"
sidebar_label: "QueryBuilder"
hide_title: true
---

# Class: QueryBuilder<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).QueryBuilder

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`TRecord` | {} | *any* |
`TResult` | - | *any* |

## Hierarchy

* [*QueryInterface*](../interfaces/knex.knex.queryinterface.md)<TRecord, TResult\>

* [*ChainableInterface*](../interfaces/knex.knex.chainableinterface.md)<*ResolveResult*<TResult\>\>

  ↳ **QueryBuilder**

## Constructors

### constructor

\+ **new QueryBuilder**<TRecord, TResult\>(): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TRecord` | {} | *any* |
`TResult` | - | *any* |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

## Properties

### [Symbol.toStringTag]

• `Readonly` **[Symbol.toStringTag]**: *string*

Inherited from: [ChainableInterface](../interfaces/knex.knex.chainableinterface.md).[[Symbol.toStringTag]](../interfaces/knex.knex.chainableinterface.md#[symbol.tostringtag])

Defined in: node_modules/knex/types/index.d.ts:1639

___

### and

• **and**: [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1591

___

### andHaving

• **andHaving**: [*Having*](../interfaces/knex.knex.having.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[andHaving](../interfaces/knex.knex.queryinterface.md#andhaving)

Defined in: node_modules/knex/types/index.d.ts:543

___

### andWhere

• **andWhere**: [*Where*](../interfaces/knex.knex.where.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[andWhere](../interfaces/knex.knex.queryinterface.md#andwhere)

Defined in: node_modules/knex/types/index.d.ts:497

___

### andWhereBetween

• **andWhereBetween**: [*WhereBetween*](../interfaces/knex.knex.wherebetween.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[andWhereBetween](../interfaces/knex.knex.queryinterface.md#andwherebetween)

Defined in: node_modules/knex/types/index.d.ts:521

___

### andWhereNot

• **andWhereNot**: [*Where*](../interfaces/knex.knex.where.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[andWhereNot](../interfaces/knex.knex.queryinterface.md#andwherenot)

Defined in: node_modules/knex/types/index.d.ts:500

___

### andWhereNotBetween

• **andWhereNotBetween**: [*WhereBetween*](../interfaces/knex.knex.wherebetween.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[andWhereNotBetween](../interfaces/knex.knex.queryinterface.md#andwherenotbetween)

Defined in: node_modules/knex/types/index.d.ts:524

___

### andWhereRaw

• **andWhereRaw**: [*WhereRaw*](../interfaces/knex.knex.whereraw.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[andWhereRaw](../interfaces/knex.knex.queryinterface.md#andwhereraw)

Defined in: node_modules/knex/types/index.d.ts:504

___

### as

• **as**: [*As*](../interfaces/knex.knex.as.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[as](../interfaces/knex.knex.queryinterface.md#as)

Defined in: node_modules/knex/types/index.d.ts:467

___

### avg

• **avg**: [*TypePreservingAggregation*](../interfaces/knex.knex.typepreservingaggregation.md)<TRecord, TResult, *any*\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[avg](../interfaces/knex.knex.queryinterface.md#avg)

Defined in: node_modules/knex/types/index.d.ts:586

___

### avgDistinct

• **avgDistinct**: [*TypePreservingAggregation*](../interfaces/knex.knex.typepreservingaggregation.md)<TRecord, TResult, *any*\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[avgDistinct](../interfaces/knex.knex.queryinterface.md#avgdistinct)

Defined in: node_modules/knex/types/index.d.ts:587

___

### client

• **client**: [*Client*](knex.knex.client.md)

Defined in: node_modules/knex/types/index.d.ts:1588

___

### column

• **column**: [*Select*](../interfaces/knex.knex.select.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[column](../interfaces/knex.knex.queryinterface.md#column)

Defined in: node_modules/knex/types/index.d.ts:469

___

### columns

• **columns**: [*Select*](../interfaces/knex.knex.select.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[columns](../interfaces/knex.knex.queryinterface.md#columns)

Defined in: node_modules/knex/types/index.d.ts:468

___

### count

• **count**: [*AsymmetricAggregation*](../interfaces/knex.knex.asymmetricaggregation.md)<TRecord, TResult, *string* \| *number*\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[count](../interfaces/knex.knex.queryinterface.md#count)

Defined in: node_modules/knex/types/index.d.ts:580

___

### countDistinct

• **countDistinct**: [*AsymmetricAggregation*](../interfaces/knex.knex.asymmetricaggregation.md)<TRecord, TResult, *string* \| *number*\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[countDistinct](../interfaces/knex.knex.queryinterface.md#countdistinct)

Defined in: node_modules/knex/types/index.d.ts:581

___

### crossJoin

• **crossJoin**: [*Join*](../interfaces/knex.knex.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[crossJoin](../interfaces/knex.knex.queryinterface.md#crossjoin)

Defined in: node_modules/knex/types/index.d.ts:486

___

### distinct

• **distinct**: [*Distinct*](../interfaces/knex.knex.distinct.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[distinct](../interfaces/knex.knex.queryinterface.md#distinct)

Defined in: node_modules/knex/types/index.d.ts:473

___

### distinctOn

• **distinctOn**: [*DistinctOn*](../interfaces/knex.knex.distincton.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[distinctOn](../interfaces/knex.knex.queryinterface.md#distincton)

Defined in: node_modules/knex/types/index.d.ts:474

___

### first

• **first**: [*Select*](../interfaces/knex.knex.select.md)<TRecord, *AddUnionMember*<*UnwrapArrayMember*<TResult\>, *undefined*\>\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[first](../interfaces/knex.knex.queryinterface.md#first)

Defined in: node_modules/knex/types/index.d.ts:608

___

### from

• **from**: [*Table*](../interfaces/knex.knex.table.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[from](../interfaces/knex.knex.queryinterface.md#from)

Defined in: node_modules/knex/types/index.d.ts:470

___

### fullOuterJoin

• **fullOuterJoin**: [*Join*](../interfaces/knex.knex.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[fullOuterJoin](../interfaces/knex.knex.queryinterface.md#fullouterjoin)

Defined in: node_modules/knex/types/index.d.ts:485

___

### groupBy

• **groupBy**: [*GroupBy*](../interfaces/knex.knex.groupby.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[groupBy](../interfaces/knex.knex.queryinterface.md#groupby)

Defined in: node_modules/knex/types/index.d.ts:527

___

### groupByRaw

• **groupByRaw**: [*RawQueryBuilder*](../interfaces/knex.knex.rawquerybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[groupByRaw](../interfaces/knex.knex.queryinterface.md#groupbyraw)

Defined in: node_modules/knex/types/index.d.ts:528

___

### having

• **having**: [*Having*](../interfaces/knex.knex.having.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[having](../interfaces/knex.knex.queryinterface.md#having)

Defined in: node_modules/knex/types/index.d.ts:542

___

### havingBetween

• **havingBetween**: [*HavingRange*](../interfaces/knex.knex.havingrange.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[havingBetween](../interfaces/knex.knex.queryinterface.md#havingbetween)

Defined in: node_modules/knex/types/index.d.ts:551

___

### havingIn

• **havingIn**: [*HavingRange*](../interfaces/knex.knex.havingrange.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[havingIn](../interfaces/knex.knex.queryinterface.md#havingin)

Defined in: node_modules/knex/types/index.d.ts:547

___

### havingNotBetween

• **havingNotBetween**: [*HavingRange*](../interfaces/knex.knex.havingrange.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[havingNotBetween](../interfaces/knex.knex.queryinterface.md#havingnotbetween)

Defined in: node_modules/knex/types/index.d.ts:549

___

### havingRaw

• **havingRaw**: [*RawQueryBuilder*](../interfaces/knex.knex.rawquerybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[havingRaw](../interfaces/knex.knex.queryinterface.md#havingraw)

Defined in: node_modules/knex/types/index.d.ts:544

___

### havingWrapped

• **havingWrapped**: [*WhereWrapped*](../interfaces/knex.knex.wherewrapped.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[havingWrapped](../interfaces/knex.knex.queryinterface.md#havingwrapped)

Defined in: node_modules/knex/types/index.d.ts:506

___

### innerJoin

• **innerJoin**: [*Join*](../interfaces/knex.knex.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[innerJoin](../interfaces/knex.knex.queryinterface.md#innerjoin)

Defined in: node_modules/knex/types/index.d.ts:479

___

### intersect

• **intersect**: [*Intersect*](../interfaces/knex.knex.intersect.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[intersect](../interfaces/knex.knex.queryinterface.md#intersect)

Defined in: node_modules/knex/types/index.d.ts:535

___

### into

• **into**: [*Table*](../interfaces/knex.knex.table.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[into](../interfaces/knex.knex.queryinterface.md#into)

Defined in: node_modules/knex/types/index.d.ts:471

___

### join

• **join**: [*Join*](../interfaces/knex.knex.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[join](../interfaces/knex.knex.queryinterface.md#join)

Defined in: node_modules/knex/types/index.d.ts:477

___

### joinRaw

• **joinRaw**: [*JoinRaw*](../interfaces/knex.knex.joinraw.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[joinRaw](../interfaces/knex.knex.queryinterface.md#joinraw)

Defined in: node_modules/knex/types/index.d.ts:478

___

### leftJoin

• **leftJoin**: [*Join*](../interfaces/knex.knex.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[leftJoin](../interfaces/knex.knex.queryinterface.md#leftjoin)

Defined in: node_modules/knex/types/index.d.ts:480

___

### leftOuterJoin

• **leftOuterJoin**: [*Join*](../interfaces/knex.knex.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[leftOuterJoin](../interfaces/knex.knex.queryinterface.md#leftouterjoin)

Defined in: node_modules/knex/types/index.d.ts:481

___

### max

• **max**: [*TypePreservingAggregation*](../interfaces/knex.knex.typepreservingaggregation.md)<TRecord, TResult, *any*\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[max](../interfaces/knex.knex.queryinterface.md#max)

Defined in: node_modules/knex/types/index.d.ts:583

___

### min

• **min**: [*TypePreservingAggregation*](../interfaces/knex.knex.typepreservingaggregation.md)<TRecord, TResult, *any*\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[min](../interfaces/knex.knex.queryinterface.md#min)

Defined in: node_modules/knex/types/index.d.ts:582

___

### not

• **not**: [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1590

___

### or

• **or**: [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1589

___

### orHaving

• **orHaving**: [*Having*](../interfaces/knex.knex.having.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[orHaving](../interfaces/knex.knex.queryinterface.md#orhaving)

Defined in: node_modules/knex/types/index.d.ts:545

___

### orHavingBetween

• **orHavingBetween**: [*HavingRange*](../interfaces/knex.knex.havingrange.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[orHavingBetween](../interfaces/knex.knex.queryinterface.md#orhavingbetween)

Defined in: node_modules/knex/types/index.d.ts:550

___

### orHavingNotBetween

• **orHavingNotBetween**: [*HavingRange*](../interfaces/knex.knex.havingrange.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[orHavingNotBetween](../interfaces/knex.knex.queryinterface.md#orhavingnotbetween)

Defined in: node_modules/knex/types/index.d.ts:548

___

### orHavingRaw

• **orHavingRaw**: [*RawQueryBuilder*](../interfaces/knex.knex.rawquerybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[orHavingRaw](../interfaces/knex.knex.queryinterface.md#orhavingraw)

Defined in: node_modules/knex/types/index.d.ts:546

___

### orWhere

• **orWhere**: [*Where*](../interfaces/knex.knex.where.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[orWhere](../interfaces/knex.knex.queryinterface.md#orwhere)

Defined in: node_modules/knex/types/index.d.ts:498

___

### orWhereBetween

• **orWhereBetween**: [*WhereBetween*](../interfaces/knex.knex.wherebetween.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[orWhereBetween](../interfaces/knex.knex.queryinterface.md#orwherebetween)

Defined in: node_modules/knex/types/index.d.ts:520

___

### orWhereExists

• **orWhereExists**: [*WhereExists*](../interfaces/knex.knex.whereexists.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[orWhereExists](../interfaces/knex.knex.queryinterface.md#orwhereexists)

Defined in: node_modules/knex/types/index.d.ts:508

___

### orWhereIn

• **orWhereIn**: [*WhereIn*](../interfaces/knex.knex.wherein.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[orWhereIn](../interfaces/knex.knex.queryinterface.md#orwherein)

Defined in: node_modules/knex/types/index.d.ts:512

___

### orWhereNot

• **orWhereNot**: [*Where*](../interfaces/knex.knex.where.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[orWhereNot](../interfaces/knex.knex.queryinterface.md#orwherenot)

Defined in: node_modules/knex/types/index.d.ts:501

___

### orWhereNotBetween

• **orWhereNotBetween**: [*WhereBetween*](../interfaces/knex.knex.wherebetween.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[orWhereNotBetween](../interfaces/knex.knex.queryinterface.md#orwherenotbetween)

Defined in: node_modules/knex/types/index.d.ts:523

___

### orWhereNotExists

• **orWhereNotExists**: [*WhereExists*](../interfaces/knex.knex.whereexists.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[orWhereNotExists](../interfaces/knex.knex.queryinterface.md#orwherenotexists)

Defined in: node_modules/knex/types/index.d.ts:510

___

### orWhereNotIn

• **orWhereNotIn**: [*WhereIn*](../interfaces/knex.knex.wherein.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[orWhereNotIn](../interfaces/knex.knex.queryinterface.md#orwherenotin)

Defined in: node_modules/knex/types/index.d.ts:514

___

### orWhereNotNull

• **orWhereNotNull**: [*WhereNull*](../interfaces/knex.knex.wherenull.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[orWhereNotNull](../interfaces/knex.knex.queryinterface.md#orwherenotnull)

Defined in: node_modules/knex/types/index.d.ts:518

___

### orWhereNull

• **orWhereNull**: [*WhereNull*](../interfaces/knex.knex.wherenull.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[orWhereNull](../interfaces/knex.knex.queryinterface.md#orwherenull)

Defined in: node_modules/knex/types/index.d.ts:516

___

### orWhereRaw

• **orWhereRaw**: [*WhereRaw*](../interfaces/knex.knex.whereraw.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[orWhereRaw](../interfaces/knex.knex.queryinterface.md#orwhereraw)

Defined in: node_modules/knex/types/index.d.ts:503

___

### orderBy

• **orderBy**: [*OrderBy*](../interfaces/knex.knex.orderby.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[orderBy](../interfaces/knex.knex.queryinterface.md#orderby)

Defined in: node_modules/knex/types/index.d.ts:531

___

### orderByRaw

• **orderByRaw**: [*RawQueryBuilder*](../interfaces/knex.knex.rawquerybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[orderByRaw](../interfaces/knex.knex.queryinterface.md#orderbyraw)

Defined in: node_modules/knex/types/index.d.ts:532

___

### outerJoin

• **outerJoin**: [*Join*](../interfaces/knex.knex.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[outerJoin](../interfaces/knex.knex.queryinterface.md#outerjoin)

Defined in: node_modules/knex/types/index.d.ts:484

___

### rightJoin

• **rightJoin**: [*Join*](../interfaces/knex.knex.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[rightJoin](../interfaces/knex.knex.queryinterface.md#rightjoin)

Defined in: node_modules/knex/types/index.d.ts:482

___

### rightOuterJoin

• **rightOuterJoin**: [*Join*](../interfaces/knex.knex.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[rightOuterJoin](../interfaces/knex.knex.queryinterface.md#rightouterjoin)

Defined in: node_modules/knex/types/index.d.ts:483

___

### select

• **select**: [*Select*](../interfaces/knex.knex.select.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[select](../interfaces/knex.knex.queryinterface.md#select)

Defined in: node_modules/knex/types/index.d.ts:466

___

### sum

• **sum**: [*TypePreservingAggregation*](../interfaces/knex.knex.typepreservingaggregation.md)<TRecord, TResult, *any*\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[sum](../interfaces/knex.knex.queryinterface.md#sum)

Defined in: node_modules/knex/types/index.d.ts:584

___

### sumDistinct

• **sumDistinct**: [*TypePreservingAggregation*](../interfaces/knex.knex.typepreservingaggregation.md)<TRecord, TResult, *any*\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[sumDistinct](../interfaces/knex.knex.queryinterface.md#sumdistinct)

Defined in: node_modules/knex/types/index.d.ts:585

___

### table

• **table**: [*Table*](../interfaces/knex.knex.table.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[table](../interfaces/knex.knex.queryinterface.md#table)

Defined in: node_modules/knex/types/index.d.ts:472

___

### union

• **union**: [*Union*](../interfaces/knex.knex.union.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[union](../interfaces/knex.knex.queryinterface.md#union)

Defined in: node_modules/knex/types/index.d.ts:538

___

### unionAll

• **unionAll**: [*Union*](../interfaces/knex.knex.union.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[unionAll](../interfaces/knex.knex.queryinterface.md#unionall)

Defined in: node_modules/knex/types/index.d.ts:539

___

### where

• **where**: [*Where*](../interfaces/knex.knex.where.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[where](../interfaces/knex.knex.queryinterface.md#where)

Defined in: node_modules/knex/types/index.d.ts:496

___

### whereBetween

• **whereBetween**: [*WhereBetween*](../interfaces/knex.knex.wherebetween.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[whereBetween](../interfaces/knex.knex.queryinterface.md#wherebetween)

Defined in: node_modules/knex/types/index.d.ts:519

___

### whereExists

• **whereExists**: [*WhereExists*](../interfaces/knex.knex.whereexists.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[whereExists](../interfaces/knex.knex.queryinterface.md#whereexists)

Defined in: node_modules/knex/types/index.d.ts:507

___

### whereIn

• **whereIn**: [*WhereIn*](../interfaces/knex.knex.wherein.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[whereIn](../interfaces/knex.knex.queryinterface.md#wherein)

Defined in: node_modules/knex/types/index.d.ts:511

___

### whereNot

• **whereNot**: [*Where*](../interfaces/knex.knex.where.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[whereNot](../interfaces/knex.knex.queryinterface.md#wherenot)

Defined in: node_modules/knex/types/index.d.ts:499

___

### whereNotBetween

• **whereNotBetween**: [*WhereBetween*](../interfaces/knex.knex.wherebetween.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[whereNotBetween](../interfaces/knex.knex.queryinterface.md#wherenotbetween)

Defined in: node_modules/knex/types/index.d.ts:522

___

### whereNotExists

• **whereNotExists**: [*WhereExists*](../interfaces/knex.knex.whereexists.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[whereNotExists](../interfaces/knex.knex.queryinterface.md#wherenotexists)

Defined in: node_modules/knex/types/index.d.ts:509

___

### whereNotIn

• **whereNotIn**: [*WhereIn*](../interfaces/knex.knex.wherein.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[whereNotIn](../interfaces/knex.knex.queryinterface.md#wherenotin)

Defined in: node_modules/knex/types/index.d.ts:513

___

### whereNotNull

• **whereNotNull**: [*WhereNull*](../interfaces/knex.knex.wherenull.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[whereNotNull](../interfaces/knex.knex.queryinterface.md#wherenotnull)

Defined in: node_modules/knex/types/index.d.ts:517

___

### whereNull

• **whereNull**: [*WhereNull*](../interfaces/knex.knex.wherenull.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[whereNull](../interfaces/knex.knex.queryinterface.md#wherenull)

Defined in: node_modules/knex/types/index.d.ts:515

___

### whereRaw

• **whereRaw**: [*WhereRaw*](../interfaces/knex.knex.whereraw.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[whereRaw](../interfaces/knex.knex.queryinterface.md#whereraw)

Defined in: node_modules/knex/types/index.d.ts:502

___

### whereWrapped

• **whereWrapped**: [*WhereWrapped*](../interfaces/knex.knex.wherewrapped.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[whereWrapped](../interfaces/knex.knex.queryinterface.md#wherewrapped)

Defined in: node_modules/knex/types/index.d.ts:505

___

### with

• **with**: [*With*](../interfaces/knex.knex.with.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[with](../interfaces/knex.knex.queryinterface.md#with)

Defined in: node_modules/knex/types/index.d.ts:489

___

### withRaw

• **withRaw**: [*WithRaw*](../interfaces/knex.knex.withraw.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[withRaw](../interfaces/knex.knex.queryinterface.md#withraw)

Defined in: node_modules/knex/types/index.d.ts:491

___

### withRecursive

• **withRecursive**: [*With*](../interfaces/knex.knex.with.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[withRecursive](../interfaces/knex.knex.queryinterface.md#withrecursive)

Defined in: node_modules/knex/types/index.d.ts:490

___

### withSchema

• **withSchema**: [*WithSchema*](../interfaces/knex.knex.withschema.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[withSchema](../interfaces/knex.knex.queryinterface.md#withschema)

Defined in: node_modules/knex/types/index.d.ts:492

___

### withWrapped

• **withWrapped**: [*WithWrapped*](../interfaces/knex.knex.withwrapped.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md).[withWrapped](../interfaces/knex.knex.queryinterface.md#withwrapped)

Defined in: node_modules/knex/types/index.d.ts:493

## Methods

### asCallback

▸ **asCallback**(`callback`: Function): *Promise*<*Resolve*<TResult\>\>

#### Parameters:

Name | Type |
------ | ------ |
`callback` | Function |

**Returns:** *Promise*<*Resolve*<TResult\>\>

Inherited from: [ChainableInterface](../interfaces/knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1657

___

### catch

▸ **catch**<TResult\>(`onrejected?`: *null* \| (`reason`: *any*) => TResult \| *PromiseLike*<TResult\>): *Promise*<*Resolve*<TResult\> \| TResult\>

Attaches a callback for only the rejection of the Promise.

#### Type parameters:

Name | Default |
------ | ------ |
`TResult` | *never* |

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`onrejected?` | *null* \| (`reason`: *any*) => TResult \| *PromiseLike*<TResult\> | The callback to execute when the Promise is rejected.   |

**Returns:** *Promise*<*Resolve*<TResult\> \| TResult\>

A Promise for the completion of the callback.

Inherited from: [ChainableInterface](../interfaces/knex.knex.chainableinterface.md)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:1448

___

### clear

▸ **clear**(`statement`: [*ClearStatements*](../modules/knex.knex-1.md#clearstatements)): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`statement` | [*ClearStatements*](../modules/knex.knex-1.md#clearstatements) |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:573

___

### clearCounters

▸ **clearCounters**(): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:572

___

### clearGroup

▸ **clearGroup**(): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:569

___

### clearHaving

▸ **clearHaving**(): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:571

___

### clearOrder

▸ **clearOrder**(): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:570

___

### clearSelect

▸ **clearSelect**(): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, *UnwrapArrayMember*<TResult\> *extends* *DeferredKeySelection*<TBase, TKeys, *true*, *any*, *any*, *any*, *any*\> ? *DeferredKeySelection*<TBase, *never*, *false*, {}, *false*, {}, *never*\>[] : TResult\>

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, *UnwrapArrayMember*<TResult\> *extends* *DeferredKeySelection*<TBase, TKeys, *true*, *any*, *any*, *any*, *any*\> ? *DeferredKeySelection*<TBase, *never*, *false*, {}, *false*, {}, *never*\>[] : TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:554

___

### clearWhere

▸ **clearWhere**(): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:568

___

### clone

▸ **clone**(): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1612

___

### columnInfo

▸ **columnInfo**(`column?`: keyof TRecord): *Promise*<[*ColumnInfo*](../interfaces/knex.knex.columninfo.md)\>

#### Parameters:

Name | Type |
------ | ------ |
`column?` | keyof TRecord |

**Returns:** *Promise*<[*ColumnInfo*](../interfaces/knex.knex.columninfo.md)\>

Defined in: node_modules/knex/types/index.d.ts:1594

___

### connection

▸ **connection**(`connection`: *any*): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`connection` | *any* |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Inherited from: [ChainableInterface](../interfaces/knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1644

___

### debug

▸ **debug**(`enabled`: *boolean*): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`enabled` | *boolean* |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Inherited from: [ChainableInterface](../interfaces/knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1645

___

### decrement

▸ **decrement**(`columnName`: keyof TRecord, `amount?`: *number*): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, *number*\>

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | keyof TRecord |
`amount?` | *number* |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, *number*\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:598

▸ **decrement**(`columnName`: *string*, `amount?`: *number*): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, *number*\>

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`amount?` | *number* |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, *number*\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:602

___

### del

▸ **del**(`returning`: ***, `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, *DeferredKeySelection*<TRecord, *never*, *false*, {}, *false*, {}, *never*\>[]\>

#### Parameters:

Name | Type |
------ | ------ |
`returning` | *** |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, *DeferredKeySelection*<TRecord, *never*, *false*, {}, *false*, {}, *never*\>[]\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:832

▸ **del**<TKey, TResult2\>(`returning`: TKey, `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, TRecord\\>, TKey\\>, *true*\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`returning` | TKey |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:836

▸ **del**<TKey, TResult2\>(`returning`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2[]\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TKey` | *string* | - |
`TResult2` | - | *AddAliases*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, TRecord\\>, TKey\\>, {}\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`returning` | readonly TKey[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2[]\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:847

▸ **del**<TResult2\>(`returning`: *string* \| readonly *string*[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | *Partial*<*AnyOrUnknownToOther*<TRecord, {}\\>\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`returning` | *string* \| readonly *string*[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:858

▸ **del**<TResult2\>(): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | *number* |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:862

___

### delete

▸ **delete**(`returning`: ***, `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, *DeferredKeySelection*<TRecord, *never*, *false*, {}, *false*, {}, *never*\>[]\>

#### Parameters:

Name | Type |
------ | ------ |
`returning` | *** |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, *DeferredKeySelection*<TRecord, *never*, *false*, {}, *false*, {}, *never*\>[]\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:864

▸ **delete**<TKey, TResult2\>(`returning`: TKey, `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\\>\\>, TKey\\>, *true*\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`returning` | TKey |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:868

▸ **delete**<TKey, TResult2\>(`returning`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TKey` | *string* | - |
`TResult2` | - | *AddAliases*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, TRecord\\>, TKey\\>, {}\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`returning` | readonly TKey[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:879

▸ **delete**<TResult2\>(`returning`: *string* \| readonly *string*[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | *any* |

#### Parameters:

Name | Type |
------ | ------ |
`returning` | *string* \| readonly *string*[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:890

▸ **delete**<TResult2\>(): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | *number* |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:894

___

### finally

▸ **finally**(`onfinally?`: *null* \| () => *void*): *Promise*<*Resolve*<TResult\>\>

Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
resolved value cannot be modified from the callback.

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`onfinally?` | *null* \| () => *void* | The callback to execute when the Promise is settled (fulfilled or rejected).   |

**Returns:** *Promise*<*Resolve*<TResult\>\>

A Promise for the completion of the callback.

Inherited from: [ChainableInterface](../interfaces/knex.knex.chainableinterface.md)

Defined in: docs/node_modules/typescript/lib/lib.es2018.promise.d.ts:31

___

### forShare

▸ **forShare**(...`tableNames`: *string*[]): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`...tableNames` | *string*[] |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1599

▸ **forShare**(`tableNames`: readonly *string*[]): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`tableNames` | readonly *string*[] |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1600

___

### forUpdate

▸ **forUpdate**(...`tableNames`: *string*[]): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`...tableNames` | *string*[] |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1596

▸ **forUpdate**(`tableNames`: readonly *string*[]): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`tableNames` | readonly *string*[] |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1597

___

### increment

▸ **increment**(`columnName`: keyof TRecord, `amount?`: *number*): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, *number*\>

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | keyof TRecord |
`amount?` | *number* |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, *number*\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:589

▸ **increment**(`columnName`: *string*, `amount?`: *number*): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, *number*\>

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`amount?` | *number* |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, *number*\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:593

___

### insert

▸ **insert**(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] \| readonly (*Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly Readonly<Partial<AnyOrUnknownToOther<MaybeRawRecord<TRecord\>, {}\>\>\>[])[], `returning`: ***, `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, *DeferredKeySelection*<TRecord, *never*, *false*, {}, *false*, {}, *never*\>[]\>

#### Parameters:

Name | Type |
------ | ------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] \| readonly (*Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly Readonly<Partial<AnyOrUnknownToOther<MaybeRawRecord<TRecord\>, {}\>\>\>[])[] |
`returning` | *** |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, *DeferredKeySelection*<TRecord, *never*, *false*, {}, *false*, {}, *never*\>[]\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:615

▸ **insert**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] \| readonly (*Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly Readonly<Partial<AnyOrUnknownToOther<MaybeRawRecord<TRecord\>, {}\>\>\>[])[], `returning`: TKey, `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\\>\\>, TKey\\>, *true*\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] \| readonly (*Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly Readonly<Partial<AnyOrUnknownToOther<MaybeRawRecord<TRecord\>, {}\>\>\>[])[] |
`returning` | TKey |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:622

▸ **insert**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] \| readonly (*Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly Readonly<Partial<AnyOrUnknownToOther<MaybeRawRecord<TRecord\>, {}\>\>\>[])[], `returning`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TKey` | *string* | - |
`TResult2` | - | *AddAliases*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\\>\\>, TKey\\>, {}\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] \| readonly (*Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly Readonly<Partial<AnyOrUnknownToOther<MaybeRawRecord<TRecord\>, {}\>\>\>[])[] |
`returning` | readonly TKey[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:636

▸ **insert**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] \| readonly (*Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly Readonly<Partial<AnyOrUnknownToOther<MaybeRawRecord<TRecord\>, {}\>\>\>[])[], `returning`: TKey, `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, TRecord\\>, TKey\\>, *true*\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] \| readonly (*Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly Readonly<Partial<AnyOrUnknownToOther<MaybeRawRecord<TRecord\>, {}\>\>\>[])[] |
`returning` | TKey |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:650

▸ **insert**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] \| readonly (*Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly Readonly<Partial<AnyOrUnknownToOther<MaybeRawRecord<TRecord\>, {}\>\>\>[])[], `returning`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, TRecord\\>, TKey\\>, *true*\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] \| readonly (*Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly Readonly<Partial<AnyOrUnknownToOther<MaybeRawRecord<TRecord\>, {}\>\>\>[])[] |
`returning` | readonly TKey[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:664

▸ **insert**<TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] \| readonly (*Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly Readonly<Partial<AnyOrUnknownToOther<MaybeRawRecord<TRecord\>, {}\>\>\>[])[]): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | *number*[] |

#### Parameters:

Name | Type |
------ | ------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] \| readonly (*Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly Readonly<Partial<AnyOrUnknownToOther<MaybeRawRecord<TRecord\>, {}\>\>\>[])[] |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:678

___

### limit

▸ **limit**(`limit`: *number*): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`limit` | *number* |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:577

___

### modify

▸ **modify**<TRecord2, TResult2\>(`callback`: [*QueryCallbackWithArgs*](../modules/knex.knex-1.md#querycallbackwithargs)<TRecord, *any*\>, ...`args`: *any*[]): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TRecord2` | {} | *any* |
`TResult2` | {} | *any* |

#### Parameters:

Name | Type |
------ | ------ |
`callback` | [*QueryCallbackWithArgs*](../modules/knex.knex-1.md#querycallbackwithargs)<TRecord, *any*\> |
`...args` | *any*[] |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord2, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:684

___

### noWait

▸ **noWait**(): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1603

___

### offset

▸ **offset**(`offset`: *number*): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`offset` | *number* |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:576

___

### on

▸ **on**(`event`: *string*, `callback`: Function): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* |
`callback` | Function |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1607

___

### onConflict

▸ **onConflict**<TKey, TResult2\>(`column`: TKey): [*OnConflictQueryBuilder*](../interfaces/knex.knex.onconflictquerybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, TRecord\\>, TKey\\>, *true*\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`column` | TKey |

**Returns:** [*OnConflictQueryBuilder*](../interfaces/knex.knex.onconflictquerybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:812

▸ **onConflict**<TKey, TResult2\>(`columns`: readonly TKey[]): [*OnConflictQueryBuilder*](../interfaces/knex.knex.onconflictquerybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<*AddAliases*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, TRecord\\>, TKey\\>, {}\\>, *false*\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`columns` | readonly TKey[] |

**Returns:** [*OnConflictQueryBuilder*](../interfaces/knex.knex.onconflictquerybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:822

___

### options

▸ **options**(`options`: *Readonly*<{ [key: string]: *any*;  }\>): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`options` | *Readonly*<{ [key: string]: *any*;  }\> |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Inherited from: [ChainableInterface](../interfaces/knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1643

___

### pipe

▸ **pipe**<T\>(`writable`: T, `options?`: *Readonly*<{ [key: string]: *any*;  }\>): *PassThrough*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | *WritableStream*<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`writable` | T |
`options?` | *Readonly*<{ [key: string]: *any*;  }\> |

**Returns:** *PassThrough*

Inherited from: [ChainableInterface](../interfaces/knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1653

___

### pluck

▸ **pluck**<K\>(`column`: K): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TRecord[K][]\>

#### Type parameters:

Name | Type |
------ | ------ |
`K` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
------ | ------ |
`column` | K |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TRecord[K][]\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:610

▸ **pluck**<TResult2\>(`column`: *string*): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type |
------ | ------ |
`TResult2` | {} |

#### Parameters:

Name | Type |
------ | ------ |
`column` | *string* |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:613

___

### queryContext

▸ **queryContext**(`context`: *any*): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`context` | *any* |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1609

▸ **queryContext**(): *any*

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:1610

___

### returning

▸ **returning**(`column`: ***, `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, *DeferredKeySelection*<TRecord, *never*, *false*, {}, *false*, {}, *never*\>[]\>

#### Parameters:

Name | Type |
------ | ------ |
`column` | *** |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, *DeferredKeySelection*<TRecord, *never*, *false*, {}, *false*, {}, *never*\>[]\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:785

▸ **returning**<TKey, TResult2\>(`column`: TKey, `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\\>\\>, TKey\\>, *true*\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`column` | TKey |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:786

▸ **returning**<TKey, TResult2\>(`columns`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<*AddAliases*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\\>\\>, TKey\\>, {}\\>, *false*\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`columns` | readonly TKey[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:797

▸ **returning**<TResult2\>(`column`: *string* \| readonly *string*[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | *Partial*<*AnyOrUnknownToOther*<TRecord, {}\\>\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`column` | *string* \| readonly *string*[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:807

___

### skipLocked

▸ **skipLocked**(): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1602

___

### stream

▸ **stream**(`handler`: (`readable`: *PassThrough*) => *any*): *Promise*<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`handler` | (`readable`: *PassThrough*) => *any* |

**Returns:** *Promise*<*any*\>

Inherited from: [ChainableInterface](../interfaces/knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1647

▸ **stream**(`options`: *Readonly*<{ [key: string]: *any*;  }\>, `handler`: (`readable`: *PassThrough*) => *any*): *Promise*<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`options` | *Readonly*<{ [key: string]: *any*;  }\> |
`handler` | (`readable`: *PassThrough*) => *any* |

**Returns:** *Promise*<*any*\>

Inherited from: [ChainableInterface](../interfaces/knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1648

▸ **stream**(`options?`: *Readonly*<{ [key: string]: *any*;  }\>): *PassThrough*

#### Parameters:

Name | Type |
------ | ------ |
`options?` | *Readonly*<{ [key: string]: *any*;  }\> |

**Returns:** *PassThrough*

Inherited from: [ChainableInterface](../interfaces/knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1652

___

### then

▸ **then**<TResult1, TResult2\>(`onfulfilled?`: *null* \| (`value`: *Resolve*<TResult\>) => TResult1 \| *PromiseLike*<TResult1\>, `onrejected?`: *null* \| (`reason`: *any*) => TResult2 \| *PromiseLike*<TResult2\>): *Promise*<TResult1 \| TResult2\>

Attaches callbacks for the resolution and/or rejection of the Promise.

#### Type parameters:

Name | Default |
------ | ------ |
`TResult1` | *Resolve*<TResult\\> |
`TResult2` | *never* |

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`onfulfilled?` | *null* \| (`value`: *Resolve*<TResult\>) => TResult1 \| *PromiseLike*<TResult1\> | The callback to execute when the Promise is resolved.   |
`onrejected?` | *null* \| (`reason`: *any*) => TResult2 \| *PromiseLike*<TResult2\> | The callback to execute when the Promise is rejected.   |

**Returns:** *Promise*<TResult1 \| TResult2\>

A Promise for the completion of which ever callback is executed.

Inherited from: [ChainableInterface](../interfaces/knex.knex.chainableinterface.md)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:1441

___

### timeout

▸ **timeout**(`ms`: *number*, `options?`: { `cancel?`: *undefined* \| *boolean*  }): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`ms` | *number* |
`options?` | { `cancel?`: *undefined* \| *boolean*  } |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1613

___

### toQuery

▸ **toQuery**(): *string*

**Returns:** *string*

Inherited from: [ChainableInterface](../interfaces/knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1642

___

### toSQL

▸ **toSQL**(): [*Sql*](../interfaces/knex.knex.sql.md)

**Returns:** [*Sql*](../interfaces/knex.knex.sql.md)

Defined in: node_modules/knex/types/index.d.ts:1605

___

### transacting

▸ **transacting**(`trx`: [*Transaction*](../interfaces/knex.knex.transaction.md)<*any*, *any*\>): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`trx` | [*Transaction*](../interfaces/knex.knex.transaction.md)<*any*, *any*\> |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>

Inherited from: [ChainableInterface](../interfaces/knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1646

___

### truncate

▸ **truncate**(): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, *void*\>

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, *void*\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:896

___

### update

▸ **update**<K1, K2, TResult2\>(`columnName`: K1, `value`: *Readonly*<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\>[K1]\> \| *Readonly*<[*Raw*](../interfaces/knex.knex.raw.md)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\>[K1]\>\>, `returning`: K2, `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`K1` | *string* | - |
`K2` | *string* | - |
`TResult2` | - | *SetSingle*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\\>\\>, K2\\>, *true*\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | K1 |
`value` | *Readonly*<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\>[K1]\> \| *Readonly*<[*Raw*](../interfaces/knex.knex.raw.md)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\>[K1]\>\> |
`returning` | K2 |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:688

▸ **update**<K1, K2, TResult2\>(`columnName`: K1, `value`: *Readonly*<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\>[K1]\> \| *Readonly*<[*Raw*](../interfaces/knex.knex.raw.md)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\>[K1]\>\>, `returning`: readonly K2[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`K1` | *string* | - |
`K2` | *string* | - |
`TResult2` | - | *AddAliases*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\\>\\>, K2\\>, {}\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | K1 |
`value` | *Readonly*<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\>[K1]\> \| *Readonly*<[*Raw*](../interfaces/knex.knex.raw.md)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\>[K1]\>\> |
`returning` | readonly K2[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:702

▸ **update**<K\>(`columnName`: K, `value`: *Readonly*<TRecord[K]\> \| *Readonly*<[*Raw*](../interfaces/knex.knex.raw.md)<TRecord[K]\>\>): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, *number*\>

#### Type parameters:

Name | Type |
------ | ------ |
`K` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | K |
`value` | *Readonly*<TRecord[K]\> \| *Readonly*<[*Raw*](../interfaces/knex.knex.raw.md)<TRecord[K]\>\> |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, *number*\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:716

▸ **update**<TResult2\>(`columnName`: *string*, `value`: [*Value*](../modules/knex.knex-1.md#value), `returning`: *string* \| readonly *string*[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | *Partial*<*AnyOrUnknownToOther*<TRecord, {}\\>\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`value` | [*Value*](../modules/knex.knex-1.md#value) |
`returning` | *string* \| readonly *string*[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:720

▸ **update**(`data`: *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[], `returning`: ***, `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, *DeferredKeySelection*<TRecord, *never*, *false*, {}, *false*, {}, *never*\>[]\>

#### Parameters:

Name | Type |
------ | ------ |
`data` | *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] |
`returning` | *** |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, *DeferredKeySelection*<TRecord, *never*, *false*, {}, *false*, {}, *never*\>[]\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:726

▸ **update**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[], `returning`: TKey, `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\\>\\>, TKey\\>, *true*\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] |
`returning` | TKey |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:731

▸ **update**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[], `returning`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TKey` | *string* | - |
`TResult2` | - | *AddAliases*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\\>\\>, TKey\\>, {}\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] |
`returning` | readonly TKey[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:743

▸ **update**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[], `returning`: TKey \| readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TKey` | *string* | *string* |
`TResult2` | {}[] | *AddAliases*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, TRecord\\>, TKey\\>, {}\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] |
`returning` | TKey \| readonly TKey[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:755

▸ **update**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[], `returning`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TKey` | *string* | - |
`TResult2` | {}[] | *AddAliases*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, TRecord\\>, TKey\\>, {}\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] |
`returning` | readonly TKey[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:767

▸ **update**<TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[]): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | *number* |

#### Parameters:

Name | Type |
------ | ------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:779

▸ **update**<TResult2\>(`columnName`: *string*, `value`: [*Value*](../modules/knex.knex-1.md#value)): [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | *number* |

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`value` | [*Value*](../modules/knex.knex-1.md#value) |

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:783

___

### extend

▸ `Static`**extend**(`methodName`: *string*, `fn`: <TRecord, TResult\>(...`args`: *any*[]) => [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`methodName` | *string* |
`fn` | <TRecord, TResult\>(...`args`: *any*[]) => [*QueryBuilder*](knex.knex.querybuilder.md)<TRecord, TResult\> |

**Returns:** *void*

Defined in: node_modules/knex/types/index.d.ts:2230
