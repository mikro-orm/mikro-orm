---
id: "knex.knex-2"
title: "Interface: Knex<TRecord, TResult>"
sidebar_label: "Knex"
hide_title: true
---

# Interface: Knex<TRecord, TResult\>

[knex](../modules/knex.md).Knex

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`TRecord` | {} | *any* |
`TResult` | - | *unknown*[] |

## Hierarchy

* [*QueryInterface*](knex.knex.queryinterface.md)<TRecord, TResult\>

* *EventEmitter*

  ↳ **Knex**

## Callable

▸ **Knex**<TTable\>(`tableName`: TTable, `options?`: PgTableOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<[*TableType*](../modules/knex.knex-1.md#tabletype)<TTable\>, *DeferredKeySelection*<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<[*TableType*](../modules/knex.knex-1.md#tabletype)<TTable\>, *base*\>, *never*, *false*, {}, *false*, {}, *never*\>[]\>

#### Type parameters:

Name | Type |
------ | ------ |
`TTable` | *never* |

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | TTable |
`options?` | PgTableOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<[*TableType*](../modules/knex.knex-1.md#tabletype)<TTable\>, *DeferredKeySelection*<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<[*TableType*](../modules/knex.knex-1.md#tabletype)<TTable\>, *base*\>, *never*, *false*, {}, *false*, {}, *never*\>[]\>

Defined in: node_modules/knex/types/index.d.ts:332

▸ **Knex**<TRecord2, TResult2\>(`tableName?`: *string* \| [*Raw*](knex.knex.raw.md)<*any*\> \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| [*AliasDict*](knex.knex.aliasdict.md), `options?`: PgTableOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TRecord2` | TRecord |
`TResult2` | *DeferredKeySelection*<TRecord2, *never*, *false*, {}, *false*, {}, *never*\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`tableName?` | *string* \| [*Raw*](knex.knex.raw.md)<*any*\> \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| [*AliasDict*](knex.knex.aliasdict.md) |
`options?` | PgTableOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:336

## Properties

### VERSION

• **VERSION**: *string*

Defined in: node_modules/knex/types/index.d.ts:341

___

### \_\_knex\_\_

• **\_\_knex\_\_**: *string*

Defined in: node_modules/knex/types/index.d.ts:342

___

### andHaving

• **andHaving**: [*Having*](knex.knex.having.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[andHaving](knex.knex.queryinterface.md#andhaving)

Defined in: node_modules/knex/types/index.d.ts:543

___

### andWhere

• **andWhere**: [*Where*](knex.knex.where.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[andWhere](knex.knex.queryinterface.md#andwhere)

Defined in: node_modules/knex/types/index.d.ts:497

___

### andWhereBetween

• **andWhereBetween**: [*WhereBetween*](knex.knex.wherebetween.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[andWhereBetween](knex.knex.queryinterface.md#andwherebetween)

Defined in: node_modules/knex/types/index.d.ts:521

___

### andWhereNot

• **andWhereNot**: [*Where*](knex.knex.where.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[andWhereNot](knex.knex.queryinterface.md#andwherenot)

Defined in: node_modules/knex/types/index.d.ts:500

___

### andWhereNotBetween

• **andWhereNotBetween**: [*WhereBetween*](knex.knex.wherebetween.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[andWhereNotBetween](knex.knex.queryinterface.md#andwherenotbetween)

Defined in: node_modules/knex/types/index.d.ts:524

___

### andWhereRaw

• **andWhereRaw**: [*WhereRaw*](knex.knex.whereraw.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[andWhereRaw](knex.knex.queryinterface.md#andwhereraw)

Defined in: node_modules/knex/types/index.d.ts:504

___

### as

• **as**: [*As*](knex.knex.as.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[as](knex.knex.queryinterface.md#as)

Defined in: node_modules/knex/types/index.d.ts:467

___

### avg

• **avg**: [*TypePreservingAggregation*](knex.knex.typepreservingaggregation.md)<TRecord, TResult, *any*\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[avg](knex.knex.queryinterface.md#avg)

Defined in: node_modules/knex/types/index.d.ts:586

___

### avgDistinct

• **avgDistinct**: [*TypePreservingAggregation*](knex.knex.typepreservingaggregation.md)<TRecord, TResult, *any*\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[avgDistinct](knex.knex.queryinterface.md#avgdistinct)

Defined in: node_modules/knex/types/index.d.ts:587

___

### client

• **client**: *any*

Defined in: node_modules/knex/types/index.d.ts:375

___

### column

• **column**: [*Select*](knex.knex.select.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[column](knex.knex.queryinterface.md#column)

Defined in: node_modules/knex/types/index.d.ts:469

___

### columns

• **columns**: [*Select*](knex.knex.select.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[columns](knex.knex.queryinterface.md#columns)

Defined in: node_modules/knex/types/index.d.ts:468

___

### count

• **count**: [*AsymmetricAggregation*](knex.knex.asymmetricaggregation.md)<TRecord, TResult, *string* \| *number*\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[count](knex.knex.queryinterface.md#count)

Defined in: node_modules/knex/types/index.d.ts:580

___

### countDistinct

• **countDistinct**: [*AsymmetricAggregation*](knex.knex.asymmetricaggregation.md)<TRecord, TResult, *string* \| *number*\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[countDistinct](knex.knex.queryinterface.md#countdistinct)

Defined in: node_modules/knex/types/index.d.ts:581

___

### crossJoin

• **crossJoin**: [*Join*](knex.knex.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[crossJoin](knex.knex.queryinterface.md#crossjoin)

Defined in: node_modules/knex/types/index.d.ts:486

___

### distinct

• **distinct**: [*Distinct*](knex.knex.distinct.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[distinct](knex.knex.queryinterface.md#distinct)

Defined in: node_modules/knex/types/index.d.ts:473

___

### distinctOn

• **distinctOn**: [*DistinctOn*](knex.knex.distincton.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[distinctOn](knex.knex.queryinterface.md#distincton)

Defined in: node_modules/knex/types/index.d.ts:474

___

### first

• **first**: [*Select*](knex.knex.select.md)<TRecord, *AddUnionMember*<*UnwrapArrayMember*<TResult\>, *undefined*\>\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[first](knex.knex.queryinterface.md#first)

Defined in: node_modules/knex/types/index.d.ts:608

___

### fn

• **fn**: [*FunctionHelper*](knex.knex.functionhelper.md)

Defined in: node_modules/knex/types/index.d.ts:378

___

### from

• **from**: [*Table*](knex.knex.table.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[from](knex.knex.queryinterface.md#from)

Defined in: node_modules/knex/types/index.d.ts:470

___

### fullOuterJoin

• **fullOuterJoin**: [*Join*](knex.knex.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[fullOuterJoin](knex.knex.queryinterface.md#fullouterjoin)

Defined in: node_modules/knex/types/index.d.ts:485

___

### groupBy

• **groupBy**: [*GroupBy*](knex.knex.groupby.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[groupBy](knex.knex.queryinterface.md#groupby)

Defined in: node_modules/knex/types/index.d.ts:527

___

### groupByRaw

• **groupByRaw**: [*RawQueryBuilder*](knex.knex.rawquerybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[groupByRaw](knex.knex.queryinterface.md#groupbyraw)

Defined in: node_modules/knex/types/index.d.ts:528

___

### having

• **having**: [*Having*](knex.knex.having.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[having](knex.knex.queryinterface.md#having)

Defined in: node_modules/knex/types/index.d.ts:542

___

### havingBetween

• **havingBetween**: [*HavingRange*](knex.knex.havingrange.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[havingBetween](knex.knex.queryinterface.md#havingbetween)

Defined in: node_modules/knex/types/index.d.ts:551

___

### havingIn

• **havingIn**: [*HavingRange*](knex.knex.havingrange.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[havingIn](knex.knex.queryinterface.md#havingin)

Defined in: node_modules/knex/types/index.d.ts:547

___

### havingNotBetween

• **havingNotBetween**: [*HavingRange*](knex.knex.havingrange.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[havingNotBetween](knex.knex.queryinterface.md#havingnotbetween)

Defined in: node_modules/knex/types/index.d.ts:549

___

### havingRaw

• **havingRaw**: [*RawQueryBuilder*](knex.knex.rawquerybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[havingRaw](knex.knex.queryinterface.md#havingraw)

Defined in: node_modules/knex/types/index.d.ts:544

___

### havingWrapped

• **havingWrapped**: [*WhereWrapped*](knex.knex.wherewrapped.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[havingWrapped](knex.knex.queryinterface.md#havingwrapped)

Defined in: node_modules/knex/types/index.d.ts:506

___

### innerJoin

• **innerJoin**: [*Join*](knex.knex.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[innerJoin](knex.knex.queryinterface.md#innerjoin)

Defined in: node_modules/knex/types/index.d.ts:479

___

### intersect

• **intersect**: [*Intersect*](knex.knex.intersect.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[intersect](knex.knex.queryinterface.md#intersect)

Defined in: node_modules/knex/types/index.d.ts:535

___

### into

• **into**: [*Table*](knex.knex.table.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[into](knex.knex.queryinterface.md#into)

Defined in: node_modules/knex/types/index.d.ts:471

___

### join

• **join**: [*Join*](knex.knex.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[join](knex.knex.queryinterface.md#join)

Defined in: node_modules/knex/types/index.d.ts:477

___

### joinRaw

• **joinRaw**: [*JoinRaw*](knex.knex.joinraw.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[joinRaw](knex.knex.queryinterface.md#joinraw)

Defined in: node_modules/knex/types/index.d.ts:478

___

### leftJoin

• **leftJoin**: [*Join*](knex.knex.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[leftJoin](knex.knex.queryinterface.md#leftjoin)

Defined in: node_modules/knex/types/index.d.ts:480

___

### leftOuterJoin

• **leftOuterJoin**: [*Join*](knex.knex.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[leftOuterJoin](knex.knex.queryinterface.md#leftouterjoin)

Defined in: node_modules/knex/types/index.d.ts:481

___

### max

• **max**: [*TypePreservingAggregation*](knex.knex.typepreservingaggregation.md)<TRecord, TResult, *any*\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[max](knex.knex.queryinterface.md#max)

Defined in: node_modules/knex/types/index.d.ts:583

___

### migrate

• **migrate**: [*Migrator*](knex.knex.migrator.md)

Defined in: node_modules/knex/types/index.d.ts:376

___

### min

• **min**: [*TypePreservingAggregation*](knex.knex.typepreservingaggregation.md)<TRecord, TResult, *any*\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[min](knex.knex.queryinterface.md#min)

Defined in: node_modules/knex/types/index.d.ts:582

___

### orHaving

• **orHaving**: [*Having*](knex.knex.having.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[orHaving](knex.knex.queryinterface.md#orhaving)

Defined in: node_modules/knex/types/index.d.ts:545

___

### orHavingBetween

• **orHavingBetween**: [*HavingRange*](knex.knex.havingrange.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[orHavingBetween](knex.knex.queryinterface.md#orhavingbetween)

Defined in: node_modules/knex/types/index.d.ts:550

___

### orHavingNotBetween

• **orHavingNotBetween**: [*HavingRange*](knex.knex.havingrange.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[orHavingNotBetween](knex.knex.queryinterface.md#orhavingnotbetween)

Defined in: node_modules/knex/types/index.d.ts:548

___

### orHavingRaw

• **orHavingRaw**: [*RawQueryBuilder*](knex.knex.rawquerybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[orHavingRaw](knex.knex.queryinterface.md#orhavingraw)

Defined in: node_modules/knex/types/index.d.ts:546

___

### orWhere

• **orWhere**: [*Where*](knex.knex.where.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[orWhere](knex.knex.queryinterface.md#orwhere)

Defined in: node_modules/knex/types/index.d.ts:498

___

### orWhereBetween

• **orWhereBetween**: [*WhereBetween*](knex.knex.wherebetween.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[orWhereBetween](knex.knex.queryinterface.md#orwherebetween)

Defined in: node_modules/knex/types/index.d.ts:520

___

### orWhereExists

• **orWhereExists**: [*WhereExists*](knex.knex.whereexists.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[orWhereExists](knex.knex.queryinterface.md#orwhereexists)

Defined in: node_modules/knex/types/index.d.ts:508

___

### orWhereIn

• **orWhereIn**: [*WhereIn*](knex.knex.wherein.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[orWhereIn](knex.knex.queryinterface.md#orwherein)

Defined in: node_modules/knex/types/index.d.ts:512

___

### orWhereNot

• **orWhereNot**: [*Where*](knex.knex.where.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[orWhereNot](knex.knex.queryinterface.md#orwherenot)

Defined in: node_modules/knex/types/index.d.ts:501

___

### orWhereNotBetween

• **orWhereNotBetween**: [*WhereBetween*](knex.knex.wherebetween.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[orWhereNotBetween](knex.knex.queryinterface.md#orwherenotbetween)

Defined in: node_modules/knex/types/index.d.ts:523

___

### orWhereNotExists

• **orWhereNotExists**: [*WhereExists*](knex.knex.whereexists.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[orWhereNotExists](knex.knex.queryinterface.md#orwherenotexists)

Defined in: node_modules/knex/types/index.d.ts:510

___

### orWhereNotIn

• **orWhereNotIn**: [*WhereIn*](knex.knex.wherein.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[orWhereNotIn](knex.knex.queryinterface.md#orwherenotin)

Defined in: node_modules/knex/types/index.d.ts:514

___

### orWhereNotNull

• **orWhereNotNull**: [*WhereNull*](knex.knex.wherenull.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[orWhereNotNull](knex.knex.queryinterface.md#orwherenotnull)

Defined in: node_modules/knex/types/index.d.ts:518

___

### orWhereNull

• **orWhereNull**: [*WhereNull*](knex.knex.wherenull.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[orWhereNull](knex.knex.queryinterface.md#orwherenull)

Defined in: node_modules/knex/types/index.d.ts:516

___

### orWhereRaw

• **orWhereRaw**: [*WhereRaw*](knex.knex.whereraw.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[orWhereRaw](knex.knex.queryinterface.md#orwhereraw)

Defined in: node_modules/knex/types/index.d.ts:503

___

### orderBy

• **orderBy**: [*OrderBy*](knex.knex.orderby.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[orderBy](knex.knex.queryinterface.md#orderby)

Defined in: node_modules/knex/types/index.d.ts:531

___

### orderByRaw

• **orderByRaw**: [*RawQueryBuilder*](knex.knex.rawquerybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[orderByRaw](knex.knex.queryinterface.md#orderbyraw)

Defined in: node_modules/knex/types/index.d.ts:532

___

### outerJoin

• **outerJoin**: [*Join*](knex.knex.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[outerJoin](knex.knex.queryinterface.md#outerjoin)

Defined in: node_modules/knex/types/index.d.ts:484

___

### raw

• **raw**: [*RawBuilder*](knex.knex.rawbuilder.md)<TRecord, *any*\>

Defined in: node_modules/knex/types/index.d.ts:344

___

### ref

• **ref**: [*RefBuilder*](knex.knex.refbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:379

___

### rightJoin

• **rightJoin**: [*Join*](knex.knex.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[rightJoin](knex.knex.queryinterface.md#rightjoin)

Defined in: node_modules/knex/types/index.d.ts:482

___

### rightOuterJoin

• **rightOuterJoin**: [*Join*](knex.knex.join.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[rightOuterJoin](knex.knex.queryinterface.md#rightouterjoin)

Defined in: node_modules/knex/types/index.d.ts:483

___

### schema

• **schema**: [*SchemaBuilder*](knex.knex.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:369

___

### seed

• **seed**: [*Seeder*](../classes/knex.knex.seeder.md)

Defined in: node_modules/knex/types/index.d.ts:377

___

### select

• **select**: [*Select*](knex.knex.select.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[select](knex.knex.queryinterface.md#select)

Defined in: node_modules/knex/types/index.d.ts:466

___

### sum

• **sum**: [*TypePreservingAggregation*](knex.knex.typepreservingaggregation.md)<TRecord, TResult, *any*\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[sum](knex.knex.queryinterface.md#sum)

Defined in: node_modules/knex/types/index.d.ts:584

___

### sumDistinct

• **sumDistinct**: [*TypePreservingAggregation*](knex.knex.typepreservingaggregation.md)<TRecord, TResult, *any*\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[sumDistinct](knex.knex.queryinterface.md#sumdistinct)

Defined in: node_modules/knex/types/index.d.ts:585

___

### table

• **table**: [*Table*](knex.knex.table.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[table](knex.knex.queryinterface.md#table)

Defined in: node_modules/knex/types/index.d.ts:472

___

### union

• **union**: [*Union*](knex.knex.union.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[union](knex.knex.queryinterface.md#union)

Defined in: node_modules/knex/types/index.d.ts:538

___

### unionAll

• **unionAll**: [*Union*](knex.knex.union.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[unionAll](knex.knex.queryinterface.md#unionall)

Defined in: node_modules/knex/types/index.d.ts:539

___

### userParams

• **userParams**: *Record*<*string*, *any*\>

Defined in: node_modules/knex/types/index.d.ts:380

___

### where

• **where**: [*Where*](knex.knex.where.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[where](knex.knex.queryinterface.md#where)

Defined in: node_modules/knex/types/index.d.ts:496

___

### whereBetween

• **whereBetween**: [*WhereBetween*](knex.knex.wherebetween.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[whereBetween](knex.knex.queryinterface.md#wherebetween)

Defined in: node_modules/knex/types/index.d.ts:519

___

### whereExists

• **whereExists**: [*WhereExists*](knex.knex.whereexists.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[whereExists](knex.knex.queryinterface.md#whereexists)

Defined in: node_modules/knex/types/index.d.ts:507

___

### whereIn

• **whereIn**: [*WhereIn*](knex.knex.wherein.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[whereIn](knex.knex.queryinterface.md#wherein)

Defined in: node_modules/knex/types/index.d.ts:511

___

### whereNot

• **whereNot**: [*Where*](knex.knex.where.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[whereNot](knex.knex.queryinterface.md#wherenot)

Defined in: node_modules/knex/types/index.d.ts:499

___

### whereNotBetween

• **whereNotBetween**: [*WhereBetween*](knex.knex.wherebetween.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[whereNotBetween](knex.knex.queryinterface.md#wherenotbetween)

Defined in: node_modules/knex/types/index.d.ts:522

___

### whereNotExists

• **whereNotExists**: [*WhereExists*](knex.knex.whereexists.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[whereNotExists](knex.knex.queryinterface.md#wherenotexists)

Defined in: node_modules/knex/types/index.d.ts:509

___

### whereNotIn

• **whereNotIn**: [*WhereIn*](knex.knex.wherein.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[whereNotIn](knex.knex.queryinterface.md#wherenotin)

Defined in: node_modules/knex/types/index.d.ts:513

___

### whereNotNull

• **whereNotNull**: [*WhereNull*](knex.knex.wherenull.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[whereNotNull](knex.knex.queryinterface.md#wherenotnull)

Defined in: node_modules/knex/types/index.d.ts:517

___

### whereNull

• **whereNull**: [*WhereNull*](knex.knex.wherenull.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[whereNull](knex.knex.queryinterface.md#wherenull)

Defined in: node_modules/knex/types/index.d.ts:515

___

### whereRaw

• **whereRaw**: [*WhereRaw*](knex.knex.whereraw.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[whereRaw](knex.knex.queryinterface.md#whereraw)

Defined in: node_modules/knex/types/index.d.ts:502

___

### whereWrapped

• **whereWrapped**: [*WhereWrapped*](knex.knex.wherewrapped.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[whereWrapped](knex.knex.queryinterface.md#wherewrapped)

Defined in: node_modules/knex/types/index.d.ts:505

___

### with

• **with**: [*With*](knex.knex.with.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[with](knex.knex.queryinterface.md#with)

Defined in: node_modules/knex/types/index.d.ts:489

___

### withRaw

• **withRaw**: [*WithRaw*](knex.knex.withraw.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[withRaw](knex.knex.queryinterface.md#withraw)

Defined in: node_modules/knex/types/index.d.ts:491

___

### withRecursive

• **withRecursive**: [*With*](knex.knex.with.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[withRecursive](knex.knex.queryinterface.md#withrecursive)

Defined in: node_modules/knex/types/index.d.ts:490

___

### withSchema

• **withSchema**: [*WithSchema*](knex.knex.withschema.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[withSchema](knex.knex.queryinterface.md#withschema)

Defined in: node_modules/knex/types/index.d.ts:492

___

### withWrapped

• **withWrapped**: [*WithWrapped*](knex.knex.withwrapped.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md).[withWrapped](knex.knex.queryinterface.md#withwrapped)

Defined in: node_modules/knex/types/index.d.ts:493

## Methods

### addListener

▸ **addListener**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Knex*](../modules/knex.md#knex)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Knex*](../modules/knex.md#knex)<TRecord, TResult\>

Defined in: node_modules/@types/node/events.d.ts:57

___

### batchInsert

▸ **batchInsert**<TRecord2, TResult2\>(`tableName`: [*TableDescriptor*](../modules/knex.knex-1.md#tabledescriptor), `data`: TRecord2 *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord2, *insert*\>[] : readonly (*Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord2\>, {}\>\>\>\> \| readonly Readonly<Partial<AnyOrUnknownToOther<MaybeRawRecord<TRecord2\>, {}\>\>\>[])[], `chunkSize?`: *number*): [*BatchInsertBuilder*](knex.knex.batchinsertbuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TRecord2` | TRecord |
`TResult2` | *number*[] |

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | [*TableDescriptor*](../modules/knex.knex-1.md#tabledescriptor) |
`data` | TRecord2 *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord2, *insert*\>[] : readonly (*Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord2\>, {}\>\>\>\> \| readonly Readonly<Partial<AnyOrUnknownToOther<MaybeRawRecord<TRecord2\>, {}\>\>\>[])[] |
`chunkSize?` | *number* |

**Returns:** [*BatchInsertBuilder*](knex.knex.batchinsertbuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:361

___

### clear

▸ **clear**(`statement`: [*ClearStatements*](../modules/knex.knex-1.md#clearstatements)): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`statement` | [*ClearStatements*](../modules/knex.knex-1.md#clearstatements) |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:573

___

### clearCounters

▸ **clearCounters**(): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:572

___

### clearGroup

▸ **clearGroup**(): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:569

___

### clearHaving

▸ **clearHaving**(): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:571

___

### clearOrder

▸ **clearOrder**(): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:570

___

### clearSelect

▸ **clearSelect**(): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *UnwrapArrayMember*<TResult\> *extends* *DeferredKeySelection*<TBase, TKeys, *true*, *any*, *any*, *any*, *any*\> ? *DeferredKeySelection*<TBase, *never*, *false*, {}, *false*, {}, *never*\>[] : TResult\>

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *UnwrapArrayMember*<TResult\> *extends* *DeferredKeySelection*<TBase, TKeys, *true*, *any*, *any*, *any*, *any*\> ? *DeferredKeySelection*<TBase, *never*, *false*, {}, *false*, {}, *never*\>[] : TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:554

___

### clearWhere

▸ **clearWhere**(): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:568

___

### decrement

▸ **decrement**(`columnName`: keyof TRecord, `amount?`: *number*): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *number*\>

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | keyof TRecord |
`amount?` | *number* |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *number*\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:598

▸ **decrement**(`columnName`: *string*, `amount?`: *number*): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *number*\>

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`amount?` | *number* |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *number*\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:602

___

### del

▸ **del**(`returning`: ***, `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *DeferredKeySelection*<TRecord, *never*, *false*, {}, *false*, {}, *never*\>[]\>

#### Parameters:

Name | Type |
------ | ------ |
`returning` | *** |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *DeferredKeySelection*<TRecord, *never*, *false*, {}, *false*, {}, *never*\>[]\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:832

▸ **del**<TKey, TResult2\>(`returning`: TKey, `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:836

▸ **del**<TKey, TResult2\>(`returning`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2[]\>

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

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2[]\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:847

▸ **del**<TResult2\>(`returning`: *string* \| readonly *string*[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | *Partial*<*AnyOrUnknownToOther*<TRecord, {}\\>\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`returning` | *string* \| readonly *string*[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:858

▸ **del**<TResult2\>(): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | *number* |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:862

___

### delete

▸ **delete**(`returning`: ***, `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *DeferredKeySelection*<TRecord, *never*, *false*, {}, *false*, {}, *never*\>[]\>

#### Parameters:

Name | Type |
------ | ------ |
`returning` | *** |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *DeferredKeySelection*<TRecord, *never*, *false*, {}, *false*, {}, *never*\>[]\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:864

▸ **delete**<TKey, TResult2\>(`returning`: TKey, `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:868

▸ **delete**<TKey, TResult2\>(`returning`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:879

▸ **delete**<TResult2\>(`returning`: *string* \| readonly *string*[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | *any* |

#### Parameters:

Name | Type |
------ | ------ |
`returning` | *string* \| readonly *string*[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:890

▸ **delete**<TResult2\>(): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | *number* |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:894

___

### destroy

▸ **destroy**(`callback`: Function): *void*

#### Parameters:

Name | Type |
------ | ------ |
`callback` | Function |

**Returns:** *void*

Defined in: node_modules/knex/types/index.d.ts:358

▸ **destroy**(): *Promise*<*void*\>

**Returns:** *Promise*<*void*\>

Defined in: node_modules/knex/types/index.d.ts:359

___

### emit

▸ **emit**(`event`: *string* \| *symbol*, ...`args`: *any*[]): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |
`...args` | *any*[] |

**Returns:** *boolean*

Defined in: node_modules/@types/node/events.d.ts:67

___

### eventNames

▸ **eventNames**(): (*string* \| *symbol*)[]

**Returns:** (*string* \| *symbol*)[]

Defined in: node_modules/@types/node/events.d.ts:72

___

### getMaxListeners

▸ **getMaxListeners**(): *number*

**Returns:** *number*

Defined in: node_modules/@types/node/events.d.ts:64

___

### increment

▸ **increment**(`columnName`: keyof TRecord, `amount?`: *number*): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *number*\>

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | keyof TRecord |
`amount?` | *number* |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *number*\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:589

▸ **increment**(`columnName`: *string*, `amount?`: *number*): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *number*\>

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`amount?` | *number* |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *number*\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:593

___

### initialize

▸ **initialize**(`config?`: [*Config*](knex.knex.config.md)<*any*\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`config?` | [*Config*](knex.knex.config.md)<*any*\> |

**Returns:** *void*

Defined in: node_modules/knex/types/index.d.ts:357

___

### insert

▸ **insert**(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] \| readonly (*Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly Readonly<Partial<AnyOrUnknownToOther<MaybeRawRecord<TRecord\>, {}\>\>\>[])[], `returning`: ***, `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *DeferredKeySelection*<TRecord, *never*, *false*, {}, *false*, {}, *never*\>[]\>

#### Parameters:

Name | Type |
------ | ------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] \| readonly (*Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly Readonly<Partial<AnyOrUnknownToOther<MaybeRawRecord<TRecord\>, {}\>\>\>[])[] |
`returning` | *** |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *DeferredKeySelection*<TRecord, *never*, *false*, {}, *false*, {}, *never*\>[]\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:615

▸ **insert**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] \| readonly (*Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly Readonly<Partial<AnyOrUnknownToOther<MaybeRawRecord<TRecord\>, {}\>\>\>[])[], `returning`: TKey, `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:622

▸ **insert**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] \| readonly (*Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly Readonly<Partial<AnyOrUnknownToOther<MaybeRawRecord<TRecord\>, {}\>\>\>[])[], `returning`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:636

▸ **insert**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] \| readonly (*Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly Readonly<Partial<AnyOrUnknownToOther<MaybeRawRecord<TRecord\>, {}\>\>\>[])[], `returning`: TKey, `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:650

▸ **insert**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] \| readonly (*Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly Readonly<Partial<AnyOrUnknownToOther<MaybeRawRecord<TRecord\>, {}\>\>\>[])[], `returning`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:664

▸ **insert**<TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] \| readonly (*Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly Readonly<Partial<AnyOrUnknownToOther<MaybeRawRecord<TRecord\>, {}\>\>\>[])[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | *number*[] |

#### Parameters:

Name | Type |
------ | ------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\> \| readonly [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *insert*\>[] : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] \| readonly (*Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly Readonly<Partial<AnyOrUnknownToOther<MaybeRawRecord<TRecord\>, {}\>\>\>[])[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:678

___

### limit

▸ **limit**(`limit`: *number*): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`limit` | *number* |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:577

___

### listenerCount

▸ **listenerCount**(`event`: *string* \| *symbol*): *number*

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |

**Returns:** *number*

Defined in: node_modules/@types/node/events.d.ts:68

___

### listeners

▸ **listeners**(`event`: *string* \| *symbol*): Function[]

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |

**Returns:** Function[]

Defined in: node_modules/@types/node/events.d.ts:65

___

### modify

▸ **modify**<TRecord2, TResult2\>(`callback`: [*QueryCallbackWithArgs*](../modules/knex.knex-1.md#querycallbackwithargs)<TRecord, *any*\>, ...`args`: *any*[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

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

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:684

___

### off

▸ **off**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Knex*](../modules/knex.md#knex)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Knex*](../modules/knex.md#knex)<TRecord, TResult\>

Defined in: node_modules/@types/node/events.d.ts:61

___

### offset

▸ **offset**(`offset`: *number*): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`offset` | *number* |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:576

___

### on

▸ **on**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Knex*](../modules/knex.md#knex)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Knex*](../modules/knex.md#knex)<TRecord, TResult\>

Defined in: node_modules/@types/node/events.d.ts:58

___

### onConflict

▸ **onConflict**<TKey, TResult2\>(`column`: TKey): [*OnConflictQueryBuilder*](knex.knex.onconflictquerybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, TRecord\\>, TKey\\>, *true*\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`column` | TKey |

**Returns:** [*OnConflictQueryBuilder*](knex.knex.onconflictquerybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:812

▸ **onConflict**<TKey, TResult2\>(`columns`: readonly TKey[]): [*OnConflictQueryBuilder*](knex.knex.onconflictquerybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<*AddAliases*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, TRecord\\>, TKey\\>, {}\\>, *false*\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`columns` | readonly TKey[] |

**Returns:** [*OnConflictQueryBuilder*](knex.knex.onconflictquerybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:822

___

### once

▸ **once**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Knex*](../modules/knex.md#knex)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Knex*](../modules/knex.md#knex)<TRecord, TResult\>

Defined in: node_modules/@types/node/events.d.ts:59

___

### pluck

▸ **pluck**<K\>(`column`: K): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TRecord[K][]\>

#### Type parameters:

Name | Type |
------ | ------ |
`K` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
------ | ------ |
`column` | K |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TRecord[K][]\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:610

▸ **pluck**<TResult2\>(`column`: *string*): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type |
------ | ------ |
`TResult2` | {} |

#### Parameters:

Name | Type |
------ | ------ |
`column` | *string* |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:613

___

### prependListener

▸ **prependListener**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Knex*](../modules/knex.md#knex)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Knex*](../modules/knex.md#knex)<TRecord, TResult\>

Defined in: node_modules/@types/node/events.d.ts:70

___

### prependOnceListener

▸ **prependOnceListener**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Knex*](../modules/knex.md#knex)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Knex*](../modules/knex.md#knex)<TRecord, TResult\>

Defined in: node_modules/@types/node/events.d.ts:71

___

### queryBuilder

▸ **queryBuilder**<TRecord2, TResult2\>(): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TRecord2` | TRecord |
`TResult2` | TResult |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:370

___

### rawListeners

▸ **rawListeners**(`event`: *string* \| *symbol*): Function[]

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |

**Returns:** Function[]

Defined in: node_modules/@types/node/events.d.ts:66

___

### removeAllListeners

▸ **removeAllListeners**(`event?`: *string* \| *symbol*): [*Knex*](../modules/knex.md#knex)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`event?` | *string* \| *symbol* |

**Returns:** [*Knex*](../modules/knex.md#knex)<TRecord, TResult\>

Defined in: node_modules/@types/node/events.d.ts:62

___

### removeListener

▸ **removeListener**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Knex*](../modules/knex.md#knex)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Knex*](../modules/knex.md#knex)<TRecord, TResult\>

Defined in: node_modules/@types/node/events.d.ts:60

___

### returning

▸ **returning**(`column`: ***, `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *DeferredKeySelection*<TRecord, *never*, *false*, {}, *false*, {}, *never*\>[]\>

#### Parameters:

Name | Type |
------ | ------ |
`column` | *** |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *DeferredKeySelection*<TRecord, *never*, *false*, {}, *false*, {}, *never*\>[]\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:785

▸ **returning**<TKey, TResult2\>(`column`: TKey, `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:786

▸ **returning**<TKey, TResult2\>(`columns`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:797

▸ **returning**<TResult2\>(`column`: *string* \| readonly *string*[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | *Partial*<*AnyOrUnknownToOther*<TRecord, {}\\>\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`column` | *string* \| readonly *string*[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:807

___

### setMaxListeners

▸ **setMaxListeners**(`n`: *number*): [*Knex*](../modules/knex.md#knex)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`n` | *number* |

**Returns:** [*Knex*](../modules/knex.md#knex)<TRecord, TResult\>

Defined in: node_modules/@types/node/events.d.ts:63

___

### transaction

▸ **transaction**(`transactionScope?`: *null*, `config?`: *any*): *Promise*<[*Transaction*](knex.knex.transaction.md)<*any*, *any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`transactionScope?` | *null* |
`config?` | *any* |

**Returns:** *Promise*<[*Transaction*](knex.knex.transaction.md)<*any*, *any*\>\>

Defined in: node_modules/knex/types/index.d.ts:349

▸ **transaction**<T\>(`transactionScope`: (`trx`: [*Transaction*](knex.knex.transaction.md)<*any*, *any*\>) => *void* \| *Promise*<T\>, `config?`: *any*): *Promise*<T\>

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`transactionScope` | (`trx`: [*Transaction*](knex.knex.transaction.md)<*any*, *any*\>) => *void* \| *Promise*<T\> |
`config?` | *any* |

**Returns:** *Promise*<T\>

Defined in: node_modules/knex/types/index.d.ts:353

___

### transactionProvider

▸ **transactionProvider**(`config?`: *any*): *function*

#### Parameters:

Name | Type |
------ | ------ |
`config?` | *any* |

**Returns:** *function*

Defined in: node_modules/knex/types/index.d.ts:346

___

### truncate

▸ **truncate**(): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *void*\>

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *void*\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:896

___

### update

▸ **update**<K1, K2, TResult2\>(`columnName`: K1, `value`: *Readonly*<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\>[K1]\> \| *Readonly*<[*Raw*](knex.knex.raw.md)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\>[K1]\>\>, `returning`: K2, `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

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
`value` | *Readonly*<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\>[K1]\> \| *Readonly*<[*Raw*](knex.knex.raw.md)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\>[K1]\>\> |
`returning` | K2 |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:688

▸ **update**<K1, K2, TResult2\>(`columnName`: K1, `value`: *Readonly*<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\>[K1]\> \| *Readonly*<[*Raw*](knex.knex.raw.md)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\>[K1]\>\>, `returning`: readonly K2[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

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
`value` | *Readonly*<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\>[K1]\> \| *Readonly*<[*Raw*](knex.knex.raw.md)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\>[K1]\>\> |
`returning` | readonly K2[] |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:702

▸ **update**<K\>(`columnName`: K, `value`: *Readonly*<TRecord[K]\> \| *Readonly*<[*Raw*](knex.knex.raw.md)<TRecord[K]\>\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *number*\>

#### Type parameters:

Name | Type |
------ | ------ |
`K` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | K |
`value` | *Readonly*<TRecord[K]\> \| *Readonly*<[*Raw*](knex.knex.raw.md)<TRecord[K]\>\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *number*\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:716

▸ **update**<TResult2\>(`columnName`: *string*, `value`: [*Value*](../modules/knex.knex-1.md#value), `returning`: *string* \| readonly *string*[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:720

▸ **update**(`data`: *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[], `returning`: ***, `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *DeferredKeySelection*<TRecord, *never*, *false*, {}, *false*, {}, *never*\>[]\>

#### Parameters:

Name | Type |
------ | ------ |
`data` | *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] |
`returning` | *** |
`options?` | DMLOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *DeferredKeySelection*<TRecord, *never*, *false*, {}, *false*, {}, *never*\>[]\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:726

▸ **update**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[], `returning`: TKey, `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:731

▸ **update**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[], `returning`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:743

▸ **update**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[], `returning`: TKey \| readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:755

▸ **update**<TKey, TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[], `returning`: readonly TKey[], `options?`: DMLOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

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

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:767

▸ **update**<TResult2\>(`data`: TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | *number* |

#### Parameters:

Name | Type |
------ | ------ |
`data` | TRecord *extends* [*CompositeTableType*](../modules/knex.knex-1.md#compositetabletype)<*unknown*, *unknown*, *Partial*<*unknown*\>\> ? [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *update*\> : *Readonly*<*Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>\> \| readonly *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:779

▸ **update**<TResult2\>(`columnName`: *string*, `value`: [*Value*](../modules/knex.knex-1.md#value)): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | *number* |

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`value` | [*Value*](../modules/knex.knex-1.md#value) |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Inherited from: [QueryInterface](knex.knex.queryinterface.md)

Defined in: node_modules/knex/types/index.d.ts:783

___

### withUserParams

▸ **withUserParams**(`params`: *Record*<*string*, *any*\>): *Knex*<*any*, *unknown*[]\>

#### Parameters:

Name | Type |
------ | ------ |
`params` | *Record*<*string*, *any*\> |

**Returns:** *Knex*<*any*, *unknown*[]\>

Defined in: node_modules/knex/types/index.d.ts:381
