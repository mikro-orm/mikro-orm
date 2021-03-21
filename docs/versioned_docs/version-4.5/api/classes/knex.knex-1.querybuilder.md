---
id: "knex.knex-1.querybuilder"
title: "Class: QueryBuilder<TRecord, TResult>"
sidebar_label: "QueryBuilder"
custom_edit_url: null
hide_title: true
---

# Class: QueryBuilder<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).QueryBuilder

## Type parameters

Name | Type | Default |
:------ | :------ | :------ |
`TRecord` | *object* | *any* |
`TResult` | - | *any* |

## Hierarchy

* [*QueryInterface*](../interfaces/knex.knex-1.queryinterface.md)<TRecord, TResult\>

* [*ChainableInterface*](../interfaces/knex.knex-1.chainableinterface.md)<ResolveResult<TResult\>\>

  ↳ **QueryBuilder**

## Constructors

### constructor

\+ **new QueryBuilder**<TRecord, TResult\>(): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TRecord` | *object* | *any* |
`TResult` | - | *any* |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Inherited from: void

## Properties

### [Symbol.toStringTag]

• `Readonly` **[Symbol.toStringTag]**: *string*

Inherited from: [ChainableInterface](../interfaces/knex.knex-1.chainableinterface.md).[[Symbol.toStringTag]](../interfaces/knex.knex-1.chainableinterface.md#[symbol.tostringtag])

Defined in: node_modules/knex/types/index.d.ts:1645

___

### and

• **and**: [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1597

___

### andHaving

• **andHaving**: [*Having*](../interfaces/knex.knex-1.having.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[andHaving](../interfaces/knex.knex-1.queryinterface.md#andhaving)

Defined in: node_modules/knex/types/index.d.ts:544

___

### andWhere

• **andWhere**: [*Where*](../interfaces/knex.knex-1.where.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[andWhere](../interfaces/knex.knex-1.queryinterface.md#andwhere)

Defined in: node_modules/knex/types/index.d.ts:498

___

### andWhereBetween

• **andWhereBetween**: [*WhereBetween*](../interfaces/knex.knex-1.wherebetween.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[andWhereBetween](../interfaces/knex.knex-1.queryinterface.md#andwherebetween)

Defined in: node_modules/knex/types/index.d.ts:522

___

### andWhereNot

• **andWhereNot**: [*Where*](../interfaces/knex.knex-1.where.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[andWhereNot](../interfaces/knex.knex-1.queryinterface.md#andwherenot)

Defined in: node_modules/knex/types/index.d.ts:501

___

### andWhereNotBetween

• **andWhereNotBetween**: [*WhereBetween*](../interfaces/knex.knex-1.wherebetween.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[andWhereNotBetween](../interfaces/knex.knex-1.queryinterface.md#andwherenotbetween)

Defined in: node_modules/knex/types/index.d.ts:525

___

### andWhereRaw

• **andWhereRaw**: [*WhereRaw*](../interfaces/knex.knex-1.whereraw.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[andWhereRaw](../interfaces/knex.knex-1.queryinterface.md#andwhereraw)

Defined in: node_modules/knex/types/index.d.ts:505

___

### as

• **as**: [*As*](../interfaces/knex.knex-1.as.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[as](../interfaces/knex.knex-1.queryinterface.md#as)

Defined in: node_modules/knex/types/index.d.ts:467

___

### avg

• **avg**: [*TypePreservingAggregation*](../interfaces/knex.knex-1.typepreservingaggregation.md)<TRecord, TResult, any\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[avg](../interfaces/knex.knex-1.queryinterface.md#avg)

Defined in: node_modules/knex/types/index.d.ts:587

___

### avgDistinct

• **avgDistinct**: [*TypePreservingAggregation*](../interfaces/knex.knex-1.typepreservingaggregation.md)<TRecord, TResult, any\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[avgDistinct](../interfaces/knex.knex-1.queryinterface.md#avgdistinct)

Defined in: node_modules/knex/types/index.d.ts:588

___

### client

• **client**: [*Client*](knex.knex-1.client.md)

Defined in: node_modules/knex/types/index.d.ts:1594

___

### column

• **column**: [*Select*](../interfaces/knex.knex-1.select.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[column](../interfaces/knex.knex-1.queryinterface.md#column)

Defined in: node_modules/knex/types/index.d.ts:469

___

### columns

• **columns**: [*Select*](../interfaces/knex.knex-1.select.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[columns](../interfaces/knex.knex-1.queryinterface.md#columns)

Defined in: node_modules/knex/types/index.d.ts:468

___

### count

• **count**: [*AsymmetricAggregation*](../interfaces/knex.knex-1.asymmetricaggregation.md)<TRecord, TResult, string \| number\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[count](../interfaces/knex.knex-1.queryinterface.md#count)

Defined in: node_modules/knex/types/index.d.ts:581

___

### countDistinct

• **countDistinct**: [*AsymmetricAggregation*](../interfaces/knex.knex-1.asymmetricaggregation.md)<TRecord, TResult, string \| number\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[countDistinct](../interfaces/knex.knex-1.queryinterface.md#countdistinct)

Defined in: node_modules/knex/types/index.d.ts:582

___

### crossJoin

• **crossJoin**: [*Join*](../interfaces/knex.knex-1.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[crossJoin](../interfaces/knex.knex-1.queryinterface.md#crossjoin)

Defined in: node_modules/knex/types/index.d.ts:487

___

### distinct

• **distinct**: [*Distinct*](../interfaces/knex.knex-1.distinct.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[distinct](../interfaces/knex.knex-1.queryinterface.md#distinct)

Defined in: node_modules/knex/types/index.d.ts:474

___

### distinctOn

• **distinctOn**: [*DistinctOn*](../interfaces/knex.knex-1.distincton.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[distinctOn](../interfaces/knex.knex-1.queryinterface.md#distincton)

Defined in: node_modules/knex/types/index.d.ts:475

___

### first

• **first**: [*Select*](../interfaces/knex.knex-1.select.md)<TRecord, AddUnionMember<UnwrapArrayMember<TResult\>, undefined\>\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[first](../interfaces/knex.knex-1.queryinterface.md#first)

Defined in: node_modules/knex/types/index.d.ts:609

___

### from

• **from**: [*Table*](../interfaces/knex.knex-1.table.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[from](../interfaces/knex.knex-1.queryinterface.md#from)

Defined in: node_modules/knex/types/index.d.ts:471

___

### fullOuterJoin

• **fullOuterJoin**: [*Join*](../interfaces/knex.knex-1.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[fullOuterJoin](../interfaces/knex.knex-1.queryinterface.md#fullouterjoin)

Defined in: node_modules/knex/types/index.d.ts:486

___

### groupBy

• **groupBy**: [*GroupBy*](../interfaces/knex.knex-1.groupby.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[groupBy](../interfaces/knex.knex-1.queryinterface.md#groupby)

Defined in: node_modules/knex/types/index.d.ts:528

___

### groupByRaw

• **groupByRaw**: [*RawQueryBuilder*](../interfaces/knex.knex-1.rawquerybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[groupByRaw](../interfaces/knex.knex-1.queryinterface.md#groupbyraw)

Defined in: node_modules/knex/types/index.d.ts:529

___

### having

• **having**: [*Having*](../interfaces/knex.knex-1.having.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[having](../interfaces/knex.knex-1.queryinterface.md#having)

Defined in: node_modules/knex/types/index.d.ts:543

___

### havingBetween

• **havingBetween**: [*HavingRange*](../interfaces/knex.knex-1.havingrange.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[havingBetween](../interfaces/knex.knex-1.queryinterface.md#havingbetween)

Defined in: node_modules/knex/types/index.d.ts:552

___

### havingIn

• **havingIn**: [*HavingRange*](../interfaces/knex.knex-1.havingrange.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[havingIn](../interfaces/knex.knex-1.queryinterface.md#havingin)

Defined in: node_modules/knex/types/index.d.ts:548

___

### havingNotBetween

• **havingNotBetween**: [*HavingRange*](../interfaces/knex.knex-1.havingrange.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[havingNotBetween](../interfaces/knex.knex-1.queryinterface.md#havingnotbetween)

Defined in: node_modules/knex/types/index.d.ts:550

___

### havingRaw

• **havingRaw**: [*RawQueryBuilder*](../interfaces/knex.knex-1.rawquerybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[havingRaw](../interfaces/knex.knex-1.queryinterface.md#havingraw)

Defined in: node_modules/knex/types/index.d.ts:545

___

### havingWrapped

• **havingWrapped**: [*WhereWrapped*](../interfaces/knex.knex-1.wherewrapped.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[havingWrapped](../interfaces/knex.knex-1.queryinterface.md#havingwrapped)

Defined in: node_modules/knex/types/index.d.ts:507

___

### hintComment

• **hintComment**: [*HintComment*](../interfaces/knex.knex-1.hintcomment.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[hintComment](../interfaces/knex.knex-1.queryinterface.md#hintcomment)

Defined in: node_modules/knex/types/index.d.ts:470

___

### innerJoin

• **innerJoin**: [*Join*](../interfaces/knex.knex-1.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[innerJoin](../interfaces/knex.knex-1.queryinterface.md#innerjoin)

Defined in: node_modules/knex/types/index.d.ts:480

___

### intersect

• **intersect**: [*Intersect*](../interfaces/knex.knex-1.intersect.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[intersect](../interfaces/knex.knex-1.queryinterface.md#intersect)

Defined in: node_modules/knex/types/index.d.ts:536

___

### into

• **into**: [*Table*](../interfaces/knex.knex-1.table.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[into](../interfaces/knex.knex-1.queryinterface.md#into)

Defined in: node_modules/knex/types/index.d.ts:472

___

### join

• **join**: [*Join*](../interfaces/knex.knex-1.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[join](../interfaces/knex.knex-1.queryinterface.md#join)

Defined in: node_modules/knex/types/index.d.ts:478

___

### joinRaw

• **joinRaw**: [*JoinRaw*](../interfaces/knex.knex-1.joinraw.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[joinRaw](../interfaces/knex.knex-1.queryinterface.md#joinraw)

Defined in: node_modules/knex/types/index.d.ts:479

___

### leftJoin

• **leftJoin**: [*Join*](../interfaces/knex.knex-1.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[leftJoin](../interfaces/knex.knex-1.queryinterface.md#leftjoin)

Defined in: node_modules/knex/types/index.d.ts:481

___

### leftOuterJoin

• **leftOuterJoin**: [*Join*](../interfaces/knex.knex-1.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[leftOuterJoin](../interfaces/knex.knex-1.queryinterface.md#leftouterjoin)

Defined in: node_modules/knex/types/index.d.ts:482

___

### max

• **max**: [*TypePreservingAggregation*](../interfaces/knex.knex-1.typepreservingaggregation.md)<TRecord, TResult, any\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[max](../interfaces/knex.knex-1.queryinterface.md#max)

Defined in: node_modules/knex/types/index.d.ts:584

___

### min

• **min**: [*TypePreservingAggregation*](../interfaces/knex.knex-1.typepreservingaggregation.md)<TRecord, TResult, any\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[min](../interfaces/knex.knex-1.queryinterface.md#min)

Defined in: node_modules/knex/types/index.d.ts:583

___

### not

• **not**: [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1596

___

### or

• **or**: [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1595

___

### orHaving

• **orHaving**: [*Having*](../interfaces/knex.knex-1.having.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[orHaving](../interfaces/knex.knex-1.queryinterface.md#orhaving)

Defined in: node_modules/knex/types/index.d.ts:546

___

### orHavingBetween

• **orHavingBetween**: [*HavingRange*](../interfaces/knex.knex-1.havingrange.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[orHavingBetween](../interfaces/knex.knex-1.queryinterface.md#orhavingbetween)

Defined in: node_modules/knex/types/index.d.ts:551

___

### orHavingNotBetween

• **orHavingNotBetween**: [*HavingRange*](../interfaces/knex.knex-1.havingrange.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[orHavingNotBetween](../interfaces/knex.knex-1.queryinterface.md#orhavingnotbetween)

Defined in: node_modules/knex/types/index.d.ts:549

___

### orHavingRaw

• **orHavingRaw**: [*RawQueryBuilder*](../interfaces/knex.knex-1.rawquerybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[orHavingRaw](../interfaces/knex.knex-1.queryinterface.md#orhavingraw)

Defined in: node_modules/knex/types/index.d.ts:547

___

### orWhere

• **orWhere**: [*Where*](../interfaces/knex.knex-1.where.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[orWhere](../interfaces/knex.knex-1.queryinterface.md#orwhere)

Defined in: node_modules/knex/types/index.d.ts:499

___

### orWhereBetween

• **orWhereBetween**: [*WhereBetween*](../interfaces/knex.knex-1.wherebetween.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[orWhereBetween](../interfaces/knex.knex-1.queryinterface.md#orwherebetween)

Defined in: node_modules/knex/types/index.d.ts:521

___

### orWhereExists

• **orWhereExists**: [*WhereExists*](../interfaces/knex.knex-1.whereexists.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[orWhereExists](../interfaces/knex.knex-1.queryinterface.md#orwhereexists)

Defined in: node_modules/knex/types/index.d.ts:509

___

### orWhereIn

• **orWhereIn**: [*WhereIn*](../interfaces/knex.knex-1.wherein.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[orWhereIn](../interfaces/knex.knex-1.queryinterface.md#orwherein)

Defined in: node_modules/knex/types/index.d.ts:513

___

### orWhereNot

• **orWhereNot**: [*Where*](../interfaces/knex.knex-1.where.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[orWhereNot](../interfaces/knex.knex-1.queryinterface.md#orwherenot)

Defined in: node_modules/knex/types/index.d.ts:502

___

### orWhereNotBetween

• **orWhereNotBetween**: [*WhereBetween*](../interfaces/knex.knex-1.wherebetween.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[orWhereNotBetween](../interfaces/knex.knex-1.queryinterface.md#orwherenotbetween)

Defined in: node_modules/knex/types/index.d.ts:524

___

### orWhereNotExists

• **orWhereNotExists**: [*WhereExists*](../interfaces/knex.knex-1.whereexists.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[orWhereNotExists](../interfaces/knex.knex-1.queryinterface.md#orwherenotexists)

Defined in: node_modules/knex/types/index.d.ts:511

___

### orWhereNotIn

• **orWhereNotIn**: [*WhereIn*](../interfaces/knex.knex-1.wherein.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[orWhereNotIn](../interfaces/knex.knex-1.queryinterface.md#orwherenotin)

Defined in: node_modules/knex/types/index.d.ts:515

___

### orWhereNotNull

• **orWhereNotNull**: [*WhereNull*](../interfaces/knex.knex-1.wherenull.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[orWhereNotNull](../interfaces/knex.knex-1.queryinterface.md#orwherenotnull)

Defined in: node_modules/knex/types/index.d.ts:519

___

### orWhereNull

• **orWhereNull**: [*WhereNull*](../interfaces/knex.knex-1.wherenull.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[orWhereNull](../interfaces/knex.knex-1.queryinterface.md#orwherenull)

Defined in: node_modules/knex/types/index.d.ts:517

___

### orWhereRaw

• **orWhereRaw**: [*WhereRaw*](../interfaces/knex.knex-1.whereraw.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[orWhereRaw](../interfaces/knex.knex-1.queryinterface.md#orwhereraw)

Defined in: node_modules/knex/types/index.d.ts:504

___

### orderBy

• **orderBy**: [*OrderBy*](../interfaces/knex.knex-1.orderby.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[orderBy](../interfaces/knex.knex-1.queryinterface.md#orderby)

Defined in: node_modules/knex/types/index.d.ts:532

___

### orderByRaw

• **orderByRaw**: [*RawQueryBuilder*](../interfaces/knex.knex-1.rawquerybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[orderByRaw](../interfaces/knex.knex-1.queryinterface.md#orderbyraw)

Defined in: node_modules/knex/types/index.d.ts:533

___

### outerJoin

• **outerJoin**: [*Join*](../interfaces/knex.knex-1.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[outerJoin](../interfaces/knex.knex-1.queryinterface.md#outerjoin)

Defined in: node_modules/knex/types/index.d.ts:485

___

### rightJoin

• **rightJoin**: [*Join*](../interfaces/knex.knex-1.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[rightJoin](../interfaces/knex.knex-1.queryinterface.md#rightjoin)

Defined in: node_modules/knex/types/index.d.ts:483

___

### rightOuterJoin

• **rightOuterJoin**: [*Join*](../interfaces/knex.knex-1.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[rightOuterJoin](../interfaces/knex.knex-1.queryinterface.md#rightouterjoin)

Defined in: node_modules/knex/types/index.d.ts:484

___

### select

• **select**: [*Select*](../interfaces/knex.knex-1.select.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[select](../interfaces/knex.knex-1.queryinterface.md#select)

Defined in: node_modules/knex/types/index.d.ts:466

___

### sum

• **sum**: [*TypePreservingAggregation*](../interfaces/knex.knex-1.typepreservingaggregation.md)<TRecord, TResult, any\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[sum](../interfaces/knex.knex-1.queryinterface.md#sum)

Defined in: node_modules/knex/types/index.d.ts:585

___

### sumDistinct

• **sumDistinct**: [*TypePreservingAggregation*](../interfaces/knex.knex-1.typepreservingaggregation.md)<TRecord, TResult, any\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[sumDistinct](../interfaces/knex.knex-1.queryinterface.md#sumdistinct)

Defined in: node_modules/knex/types/index.d.ts:586

___

### table

• **table**: [*Table*](../interfaces/knex.knex-1.table.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[table](../interfaces/knex.knex-1.queryinterface.md#table)

Defined in: node_modules/knex/types/index.d.ts:473

___

### union

• **union**: [*Union*](../interfaces/knex.knex-1.union.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[union](../interfaces/knex.knex-1.queryinterface.md#union)

Defined in: node_modules/knex/types/index.d.ts:539

___

### unionAll

• **unionAll**: [*Union*](../interfaces/knex.knex-1.union.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[unionAll](../interfaces/knex.knex-1.queryinterface.md#unionall)

Defined in: node_modules/knex/types/index.d.ts:540

___

### where

• **where**: [*Where*](../interfaces/knex.knex-1.where.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[where](../interfaces/knex.knex-1.queryinterface.md#where)

Defined in: node_modules/knex/types/index.d.ts:497

___

### whereBetween

• **whereBetween**: [*WhereBetween*](../interfaces/knex.knex-1.wherebetween.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[whereBetween](../interfaces/knex.knex-1.queryinterface.md#wherebetween)

Defined in: node_modules/knex/types/index.d.ts:520

___

### whereExists

• **whereExists**: [*WhereExists*](../interfaces/knex.knex-1.whereexists.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[whereExists](../interfaces/knex.knex-1.queryinterface.md#whereexists)

Defined in: node_modules/knex/types/index.d.ts:508

___

### whereIn

• **whereIn**: [*WhereIn*](../interfaces/knex.knex-1.wherein.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[whereIn](../interfaces/knex.knex-1.queryinterface.md#wherein)

Defined in: node_modules/knex/types/index.d.ts:512

___

### whereNot

• **whereNot**: [*Where*](../interfaces/knex.knex-1.where.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[whereNot](../interfaces/knex.knex-1.queryinterface.md#wherenot)

Defined in: node_modules/knex/types/index.d.ts:500

___

### whereNotBetween

• **whereNotBetween**: [*WhereBetween*](../interfaces/knex.knex-1.wherebetween.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[whereNotBetween](../interfaces/knex.knex-1.queryinterface.md#wherenotbetween)

Defined in: node_modules/knex/types/index.d.ts:523

___

### whereNotExists

• **whereNotExists**: [*WhereExists*](../interfaces/knex.knex-1.whereexists.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[whereNotExists](../interfaces/knex.knex-1.queryinterface.md#wherenotexists)

Defined in: node_modules/knex/types/index.d.ts:510

___

### whereNotIn

• **whereNotIn**: [*WhereIn*](../interfaces/knex.knex-1.wherein.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[whereNotIn](../interfaces/knex.knex-1.queryinterface.md#wherenotin)

Defined in: node_modules/knex/types/index.d.ts:514

___

### whereNotNull

• **whereNotNull**: [*WhereNull*](../interfaces/knex.knex-1.wherenull.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[whereNotNull](../interfaces/knex.knex-1.queryinterface.md#wherenotnull)

Defined in: node_modules/knex/types/index.d.ts:518

___

### whereNull

• **whereNull**: [*WhereNull*](../interfaces/knex.knex-1.wherenull.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[whereNull](../interfaces/knex.knex-1.queryinterface.md#wherenull)

Defined in: node_modules/knex/types/index.d.ts:516

___

### whereRaw

• **whereRaw**: [*WhereRaw*](../interfaces/knex.knex-1.whereraw.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[whereRaw](../interfaces/knex.knex-1.queryinterface.md#whereraw)

Defined in: node_modules/knex/types/index.d.ts:503

___

### whereWrapped

• **whereWrapped**: [*WhereWrapped*](../interfaces/knex.knex-1.wherewrapped.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[whereWrapped](../interfaces/knex.knex-1.queryinterface.md#wherewrapped)

Defined in: node_modules/knex/types/index.d.ts:506

___

### with

• **with**: [*With*](../interfaces/knex.knex-1.with.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[with](../interfaces/knex.knex-1.queryinterface.md#with)

Defined in: node_modules/knex/types/index.d.ts:490

___

### withRaw

• **withRaw**: [*WithRaw*](../interfaces/knex.knex-1.withraw.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[withRaw](../interfaces/knex.knex-1.queryinterface.md#withraw)

Defined in: node_modules/knex/types/index.d.ts:492

___

### withRecursive

• **withRecursive**: [*With*](../interfaces/knex.knex-1.with.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[withRecursive](../interfaces/knex.knex-1.queryinterface.md#withrecursive)

Defined in: node_modules/knex/types/index.d.ts:491

___

### withSchema

• **withSchema**: [*WithSchema*](../interfaces/knex.knex-1.withschema.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[withSchema](../interfaces/knex.knex-1.queryinterface.md#withschema)

Defined in: node_modules/knex/types/index.d.ts:493

___

### withWrapped

• **withWrapped**: [*WithWrapped*](../interfaces/knex.knex-1.withwrapped.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md).[withWrapped](../interfaces/knex.knex-1.queryinterface.md#withwrapped)

Defined in: node_modules/knex/types/index.d.ts:494

## Methods

### asCallback

▸ **asCallback**(`callback`: Function): *Promise*<Resolve<TResult\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`callback` | Function |

**Returns:** *Promise*<Resolve<TResult\>\>

Inherited from: [ChainableInterface](../interfaces/knex.knex-1.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1663

___

### catch

▸ **catch**<TResult\>(`onrejected?`: *null* \| (`reason`: *any*) => TResult \| *PromiseLike*<TResult\>): *Promise*<Resolve<TResult\> \| TResult\>

Attaches a callback for only the rejection of the Promise.

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult` | *never* |

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`onrejected?` | *null* \| (`reason`: *any*) => TResult \| *PromiseLike*<TResult\> | The callback to execute when the Promise is rejected.   |

**Returns:** *Promise*<Resolve<TResult\> \| TResult\>

A Promise for the completion of the callback.

Inherited from: [ChainableInterface](../interfaces/knex.knex-1.chainableinterface.md)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:1460

___

### clear

▸ **clear**(`statement`: [*ClearStatements*](../modules/knex.knex-1.md#clearstatements)): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`statement` | [*ClearStatements*](../modules/knex.knex-1.md#clearstatements) |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:574

___

### clearCounters

▸ **clearCounters**(): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:573

___

### clearGroup

▸ **clearGroup**(): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:570

___

### clearHaving

▸ **clearHaving**(): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:572

___

### clearOrder

▸ **clearOrder**(): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:571

___

### clearSelect

▸ **clearSelect**(): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, *UnwrapArrayMember*<TResult\> *extends* *DeferredKeySelection*<TBase, TKeys, *true*, any, any, any, any\> ? *DeferredKeySelection*<TBase, never, *false*, {}, *false*, {}, never\>[] : TResult\>

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, *UnwrapArrayMember*<TResult\> *extends* *DeferredKeySelection*<TBase, TKeys, *true*, any, any, any, any\> ? *DeferredKeySelection*<TBase, never, *false*, {}, *false*, {}, never\>[] : TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:555

___

### clearWhere

▸ **clearWhere**(): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:569

___

### clone

▸ **clone**(): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1618

___

### columnInfo

▸ **columnInfo**(`column?`: keyof TRecord): *Promise*<[*ColumnInfo*](../interfaces/knex.knex-1.columninfo.md)\>

#### Parameters:

Name | Type |
:------ | :------ |
`column?` | keyof TRecord |

**Returns:** *Promise*<[*ColumnInfo*](../interfaces/knex.knex-1.columninfo.md)\>

Defined in: node_modules/knex/types/index.d.ts:1600

___

### connection

▸ **connection**(`connection`: *any*): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`connection` | *any* |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Inherited from: [ChainableInterface](../interfaces/knex.knex-1.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1650

___

### debug

▸ **debug**(`enabled`: *boolean*): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`enabled` | *boolean* |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Inherited from: [ChainableInterface](../interfaces/knex.knex-1.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1651

___

### decrement

▸ **decrement**(`columnName`: keyof TRecord, `amount?`: *number*): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, number\>

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | keyof TRecord |
`amount?` | *number* |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, number\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:599

▸ **decrement**(`columnName`: *string*, `amount?`: *number*): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, number\>

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`amount?` | *number* |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, number\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:603

___

### del

▸ **del**(`returning`: ***, `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, DeferredKeySelection<TRecord, never, *false*, {}, *false*, {}, never\>[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`returning` | *** |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, DeferredKeySelection<TRecord, never, *false*, {}, *false*, {}, never\>[]\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:833

▸ **del**<TKey, TResult2\>(`returning`: TKey, `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:837

▸ **del**<TKey, TResult2\>(`returning`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2[]\>

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

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2[]\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:848

▸ **del**<TResult2\>(`returning`: *string* \| readonly *string*[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *Partial*<AnyOrUnknownToOther<TRecord, {}\>\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`returning` | *string* \| readonly *string*[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:859

▸ **del**<TResult2\>(): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *number* |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:863

___

### delete

▸ **delete**(`returning`: ***, `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, DeferredKeySelection<TRecord, never, *false*, {}, *false*, {}, never\>[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`returning` | *** |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, DeferredKeySelection<TRecord, never, *false*, {}, *false*, {}, never\>[]\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:865

▸ **delete**<TKey, TResult2\>(`returning`: TKey, `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:869

▸ **delete**<TKey, TResult2\>(`returning`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:880

▸ **delete**<TResult2\>(`returning`: *string* \| readonly *string*[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`returning` | *string* \| readonly *string*[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:891

▸ **delete**<TResult2\>(): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *number* |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:895

___

### finally

▸ **finally**(`onfinally?`: *null* \| () => *void*): *Promise*<Resolve<TResult\>\>

Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
resolved value cannot be modified from the callback.

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`onfinally?` | *null* \| () => *void* | The callback to execute when the Promise is settled (fulfilled or rejected).   |

**Returns:** *Promise*<Resolve<TResult\>\>

A Promise for the completion of the callback.

Inherited from: [ChainableInterface](../interfaces/knex.knex-1.chainableinterface.md)

Defined in: docs/node_modules/typescript/lib/lib.es2018.promise.d.ts:31

___

### forShare

▸ **forShare**(...`tableNames`: *string*[]): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`...tableNames` | *string*[] |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1605

▸ **forShare**(`tableNames`: readonly *string*[]): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`tableNames` | readonly *string*[] |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1606

___

### forUpdate

▸ **forUpdate**(...`tableNames`: *string*[]): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`...tableNames` | *string*[] |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1602

▸ **forUpdate**(`tableNames`: readonly *string*[]): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`tableNames` | readonly *string*[] |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1603

___

### increment

▸ **increment**(`columnName`: keyof TRecord, `amount?`: *number*): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, number\>

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | keyof TRecord |
`amount?` | *number* |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, number\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:590

▸ **increment**(`columnName`: *string*, `amount?`: *number*): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, number\>

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`amount?` | *number* |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, number\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:594

___

### insert

▸ **insert**(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> \| readonly [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>[], `returning`: ***, `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, DeferredKeySelection<TRecord, never, *false*, {}, *false*, {}, never\>[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> \| readonly [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>[] |
`returning` | *** |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, DeferredKeySelection<TRecord, never, *false*, {}, *false*, {}, never\>[]\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:616

▸ **insert**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> \| readonly [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>[], `returning`: TKey, `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:623

▸ **insert**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> \| readonly [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>[], `returning`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:637

▸ **insert**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> \| readonly [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>[], `returning`: TKey, `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:651

▸ **insert**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> \| readonly [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>[], `returning`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:665

▸ **insert**<TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> \| readonly [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>[]): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *number*[] |

#### Parameters:

Name | Type |
:------ | :------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> \| readonly [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>[] |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:679

___

### limit

▸ **limit**(`limit`: *number*): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`limit` | *number* |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:578

___

### modify

▸ **modify**<TRecord2, TResult2\>(`callback`: [*QueryCallbackWithArgs*](../modules/knex.knex-1.md#querycallbackwithargs)<TRecord, any\>, ...`args`: *any*[]): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord2, TResult2\>

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

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord2, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:685

___

### noWait

▸ **noWait**(): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1609

___

### offset

▸ **offset**(`offset`: *number*): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`offset` | *number* |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:577

___

### on

▸ **on**(`event`: *string*, `callback`: Function): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`event` | *string* |
`callback` | Function |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1613

___

### onConflict

▸ **onConflict**<TKey, TResult2\>(`column`: TKey): [*OnConflictQueryBuilder*](../interfaces/knex.knex-1.onconflictquerybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<AddKey<SetBase<UnwrapArrayMember<TResult\>, TRecord\>, TKey\>, *true*\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`column` | TKey |

**Returns:** [*OnConflictQueryBuilder*](../interfaces/knex.knex-1.onconflictquerybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:813

▸ **onConflict**<TKey, TResult2\>(`columns`: readonly TKey[]): [*OnConflictQueryBuilder*](../interfaces/knex.knex-1.onconflictquerybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<AddAliases<AddKey<SetBase<UnwrapArrayMember<TResult\>, TRecord\>, TKey\>, {}\>, *false*\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`columns` | readonly TKey[] |

**Returns:** [*OnConflictQueryBuilder*](../interfaces/knex.knex-1.onconflictquerybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:823

___

### options

▸ **options**(`options`: *Readonly*<{ [key: string]: *any*;  }\>): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`options` | *Readonly*<{ [key: string]: *any*;  }\> |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Inherited from: [ChainableInterface](../interfaces/knex.knex-1.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1649

___

### pipe

▸ **pipe**<T\>(`writable`: T, `options?`: *Readonly*<{ [key: string]: *any*;  }\>): *PassThrough*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | *WritableStream*<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`writable` | T |
`options?` | *Readonly*<{ [key: string]: *any*;  }\> |

**Returns:** *PassThrough*

Inherited from: [ChainableInterface](../interfaces/knex.knex-1.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1659

___

### pluck

▸ **pluck**<K\>(`column`: K): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TRecord[K][]\>

#### Type parameters:

Name | Type |
:------ | :------ |
`K` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
:------ | :------ |
`column` | K |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TRecord[K][]\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:611

▸ **pluck**<TResult2\>(`column`: *string*): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type |
:------ | :------ |
`TResult2` | *object* |

#### Parameters:

Name | Type |
:------ | :------ |
`column` | *string* |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:614

___

### queryContext

▸ **queryContext**(`context`: *any*): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`context` | *any* |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1615

▸ **queryContext**(): *any*

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:1616

___

### returning

▸ **returning**(`column`: ***, `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, DeferredKeySelection<TRecord, never, *false*, {}, *false*, {}, never\>[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`column` | *** |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, DeferredKeySelection<TRecord, never, *false*, {}, *false*, {}, never\>[]\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:786

▸ **returning**<TKey, TResult2\>(`column`: TKey, `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:787

▸ **returning**<TKey, TResult2\>(`columns`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:798

▸ **returning**<TResult2\>(`column`: *string* \| readonly *string*[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *Partial*<AnyOrUnknownToOther<TRecord, {}\>\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`column` | *string* \| readonly *string*[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:808

___

### skipLocked

▸ **skipLocked**(): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1608

___

### stream

▸ **stream**(`handler`: (`readable`: *PassThrough*) => *any*): *Promise*<any\>

#### Parameters:

Name | Type |
:------ | :------ |
`handler` | (`readable`: *PassThrough*) => *any* |

**Returns:** *Promise*<any\>

Inherited from: [ChainableInterface](../interfaces/knex.knex-1.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1653

▸ **stream**(`options`: *Readonly*<{ [key: string]: *any*;  }\>, `handler`: (`readable`: *PassThrough*) => *any*): *Promise*<any\>

#### Parameters:

Name | Type |
:------ | :------ |
`options` | *Readonly*<{ [key: string]: *any*;  }\> |
`handler` | (`readable`: *PassThrough*) => *any* |

**Returns:** *Promise*<any\>

Inherited from: [ChainableInterface](../interfaces/knex.knex-1.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1654

▸ **stream**(`options?`: *Readonly*<{ [key: string]: *any*;  }\>): *PassThrough*

#### Parameters:

Name | Type |
:------ | :------ |
`options?` | *Readonly*<{ [key: string]: *any*;  }\> |

**Returns:** *PassThrough*

Inherited from: [ChainableInterface](../interfaces/knex.knex-1.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1658

___

### then

▸ **then**<TResult1, TResult2\>(`onfulfilled?`: *null* \| (`value`: *Resolve*<TResult\>) => TResult1 \| *PromiseLike*<TResult1\>, `onrejected?`: *null* \| (`reason`: *any*) => TResult2 \| *PromiseLike*<TResult2\>): *Promise*<TResult1 \| TResult2\>

Attaches callbacks for the resolution and/or rejection of the Promise.

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult1` | *Resolve*<TResult\> |
`TResult2` | *never* |

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`onfulfilled?` | *null* \| (`value`: *Resolve*<TResult\>) => TResult1 \| *PromiseLike*<TResult1\> | The callback to execute when the Promise is resolved.   |
`onrejected?` | *null* \| (`reason`: *any*) => TResult2 \| *PromiseLike*<TResult2\> | The callback to execute when the Promise is rejected.   |

**Returns:** *Promise*<TResult1 \| TResult2\>

A Promise for the completion of which ever callback is executed.

Inherited from: [ChainableInterface](../interfaces/knex.knex-1.chainableinterface.md)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:1453

___

### timeout

▸ **timeout**(`ms`: *number*, `options?`: { `cancel?`: *boolean*  }): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`ms` | *number* |
`options?` | *object* |
`options.cancel?` | *boolean* |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1619

___

### toQuery

▸ **toQuery**(): *string*

**Returns:** *string*

Inherited from: [ChainableInterface](../interfaces/knex.knex-1.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1648

___

### toSQL

▸ **toSQL**(): [*Sql*](../interfaces/knex.knex-1.sql.md)

**Returns:** [*Sql*](../interfaces/knex.knex-1.sql.md)

Defined in: node_modules/knex/types/index.d.ts:1611

___

### transacting

▸ **transacting**(`trx`: [*Transaction*](../interfaces/knex.knex-1.transaction.md)<any, any\>): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`trx` | [*Transaction*](../interfaces/knex.knex-1.transaction.md)<any, any\> |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>

Inherited from: [ChainableInterface](../interfaces/knex.knex-1.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1652

___

### truncate

▸ **truncate**(): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, void\>

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, void\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:897

___

### update

▸ **update**<K1, K2, TResult2\>(`columnName`: K1, `value`: [*DbColumn*](../modules/knex.knex-1.md#dbcolumn)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\>[K1]\>, `returning`: K2, `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:689

▸ **update**<K1, K2, TResult2\>(`columnName`: K1, `value`: [*DbColumn*](../modules/knex.knex-1.md#dbcolumn)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\>[K1]\>, `returning`: readonly K2[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:703

▸ **update**<K\>(`columnName`: K, `value`: [*DbColumn*](../modules/knex.knex-1.md#dbcolumn)<TRecord[K]\>): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, number\>

#### Type parameters:

Name | Type |
:------ | :------ |
`K` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | K |
`value` | [*DbColumn*](../modules/knex.knex-1.md#dbcolumn)<TRecord[K]\> |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, number\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:717

▸ **update**<TResult2\>(`columnName`: *string*, `value`: [*Value*](../modules/knex.knex-1.md#value), `returning`: *string* \| readonly *string*[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:721

▸ **update**(`data`: [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>, `returning`: ***, `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, DeferredKeySelection<TRecord, never, *false*, {}, *false*, {}, never\>[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`data` | [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> |
`returning` | *** |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, DeferredKeySelection<TRecord, never, *false*, {}, *false*, {}, never\>[]\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:727

▸ **update**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>, `returning`: TKey, `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:732

▸ **update**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>, `returning`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:744

▸ **update**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>, `returning`: TKey \| readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:756

▸ **update**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>, `returning`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:768

▸ **update**<TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\>): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *number* |

#### Parameters:

Name | Type |
:------ | :------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<unknown, unknown, Partial<unknown\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : [*DbRecordArr*](../modules/knex.knex-1.md#dbrecordarr)<TRecord\> |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:780

▸ **update**<TResult2\>(`columnName`: *string*, `value`: [*Value*](../modules/knex.knex-1.md#value)): [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *number* |

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`value` | [*Value*](../modules/knex.knex-1.md#value) |

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](../interfaces/knex.knex-1.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:784

___

### extend

▸ `Static`**extend**(`methodName`: *string*, `fn`: <TRecord, TResult\>(...`args`: *any*[]) => [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`methodName` | *string* |
`fn` | <TRecord, TResult\>(...`args`: *any*[]) => [*QueryBuilder*](knex.knex-1.querybuilder.md)<TRecord, TResult\> |

**Returns:** *void*

Defined in: node_modules/knex/types/index.d.ts:2236
