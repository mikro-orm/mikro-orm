---
id: "knex"
title: "Module: knex"
sidebar_label: "knex"
custom_edit_url: null
hide_title: true
---

# Module: knex

## Table of contents

### Namespaces

- [Knex](knex.knex-1.md)

### Enumerations

- [QueryType](../enums/knex.querytype.md)

### Classes

- [AbstractSqlConnection](../classes/knex.abstractsqlconnection.md)
- [AbstractSqlDriver](../classes/knex.abstractsqldriver.md)
- [AbstractSqlPlatform](../classes/knex.abstractsqlplatform.md)
- [ArrayCriteriaNode](../classes/knex.arraycriterianode.md)
- [CriteriaNode](../classes/knex.criterianode.md)
- [CriteriaNodeFactory](../classes/knex.criterianodefactory.md)
- [DatabaseSchema](../classes/knex.databaseschema.md)
- [DatabaseTable](../classes/knex.databasetable.md)
- [EntityManager](../classes/knex.entitymanager.md)
- [EntityRepository](../classes/knex.entityrepository.md)
- [ObjectCriteriaNode](../classes/knex.objectcriterianode.md)
- [QueryBuilder](../classes/knex.querybuilder.md)
- [QueryBuilderHelper](../classes/knex.querybuilderhelper.md)
- [ScalarCriteriaNode](../classes/knex.scalarcriterianode.md)
- [SchemaGenerator](../classes/knex.schemagenerator.md)
- [SchemaHelper](../classes/knex.schemahelper.md)
- [SqlEntityManager](../classes/knex.sqlentitymanager.md)
- [SqlEntityRepository](../classes/knex.sqlentityrepository.md)

### Interfaces

- [Column](../interfaces/knex.column.md)
- [ForeignKey](../interfaces/knex.foreignkey.md)
- [ICriteriaNode](../interfaces/knex.icriterianode.md)
- [IQueryBuilder](../interfaces/knex.iquerybuilder.md)
- [Index](../interfaces/knex.index.md)
- [IndexDef](../interfaces/knex.indexdef.md)
- [IsSame](../interfaces/knex.issame.md)
- [JoinOptions](../interfaces/knex.joinoptions.md)
- [Knex](../interfaces/knex.knex-2.md)
- [Table](../interfaces/knex.table.md)
- [TableDifference](../interfaces/knex.tabledifference.md)

## Type aliases

### Field

Ƭ **Field**<T\>: *string* \| keyof T \| [*KnexStringRef*](knex.md#knexstringref) \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)

#### Type parameters:

Name |
:------ |
`T` |

Defined in: [packages/knex/src/typings.ts:14](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L14)

___

### KnexStringRef

Ƭ **KnexStringRef**: [*Ref*](../interfaces/knex.knex-1.ref.md)<string, { [alias: string]: *string*;  }\>

Defined in: [packages/knex/src/typings.ts:10](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L10)

## Variables

### MonkeyPatchable

• `Const` **MonkeyPatchable**: *object*

#### Type declaration:

Name | Type |
:------ | :------ |
`MySqlDialect` | *any* |
`PostgresDialectTableCompiler` | *any* |
`Sqlite3Dialect` | *any* |
`TableCompiler` | *any* |

Defined in: [packages/knex/src/MonkeyPatchable.ts:14](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/MonkeyPatchable.ts#L14)

## Functions

### Knex

• **Knex**: 

Defined in: node_modules/knex/types/index.d.ts:384
