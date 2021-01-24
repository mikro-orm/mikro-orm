---
id: "knex.knex-1"
title: "Namespace: Knex"
sidebar_label: "Knex"
hide_title: true
---

# Namespace: Knex

[knex](knex.md).Knex

## Table of contents

### Classes

- [Client](../classes/knex.knex.client.md)
- [KnexTimeoutError](../classes/knex.knex.knextimeouterror.md)
- [QueryBuilder](../classes/knex.knex.querybuilder.md)
- [Seeder](../classes/knex.knex.seeder.md)

### Interfaces

- [AliasDict](../interfaces/knex.knex.aliasdict.md)
- [AliasQueryBuilder](../interfaces/knex.knex.aliasquerybuilder.md)
- [AlterColumnBuilder](../interfaces/knex.knex.altercolumnbuilder.md)
- [AlterTableBuilder](../interfaces/knex.knex.altertablebuilder.md)
- [As](../interfaces/knex.knex.as.md)
- [AsymmetricAggregation](../interfaces/knex.knex.asymmetricaggregation.md)
- [BatchInsertBuilder](../interfaces/knex.knex.batchinsertbuilder.md)
- [ChainableInterface](../interfaces/knex.knex.chainableinterface.md)
- [ColumnBuilder](../interfaces/knex.knex.columnbuilder.md)
- [ColumnInfo](../interfaces/knex.knex.columninfo.md)
- [ColumnNameQueryBuilder](../interfaces/knex.knex.columnnamequerybuilder.md)
- [Config](../interfaces/knex.knex.config.md)
- [ConnectionConfig](../interfaces/knex.knex.connectionconfig.md)
- [CreateTableBuilder](../interfaces/knex.knex.createtablebuilder.md)
- [Distinct](../interfaces/knex.knex.distinct.md)
- [DistinctOn](../interfaces/knex.knex.distincton.md)
- [EnumOptions](../interfaces/knex.knex.enumoptions.md)
- [ForeignConstraintBuilder](../interfaces/knex.knex.foreignconstraintbuilder.md)
- [FunctionHelper](../interfaces/knex.knex.functionhelper.md)
- [GroupBy](../interfaces/knex.knex.groupby.md)
- [Having](../interfaces/knex.knex.having.md)
- [HavingRange](../interfaces/knex.knex.havingrange.md)
- [Intersect](../interfaces/knex.knex.intersect.md)
- [Join](../interfaces/knex.knex.join.md)
- [JoinCallback](../interfaces/knex.knex.joincallback.md)
- [JoinClause](../interfaces/knex.knex.joinclause.md)
- [JoinRaw](../interfaces/knex.knex.joinraw.md)
- [Logger](../interfaces/knex.knex.logger.md)
- [MariaSqlConnectionConfig](../interfaces/knex.knex.mariasqlconnectionconfig.md)
- [MariaSslConfiguration](../interfaces/knex.knex.mariasslconfiguration.md)
- [Migration](../interfaces/knex.knex.migration.md)
- [MigrationSource](../interfaces/knex.knex.migrationsource.md)
- [Migrator](../interfaces/knex.knex.migrator.md)
- [MigratorConfig](../interfaces/knex.knex.migratorconfig.md)
- [MsSqlConnectionConfig](../interfaces/knex.knex.mssqlconnectionconfig.md)
- [MultikeyForeignConstraintBuilder](../interfaces/knex.knex.multikeyforeignconstraintbuilder.md)
- [MySql2ConnectionConfig](../interfaces/knex.knex.mysql2connectionconfig.md)
- [MySqlAlterColumnBuilder](../interfaces/knex.knex.mysqlaltercolumnbuilder.md)
- [MySqlConnectionConfig](../interfaces/knex.knex.mysqlconnectionconfig.md)
- [OnConflictQueryBuilder](../interfaces/knex.knex.onconflictquerybuilder.md)
- [OracleDbConnectionConfig](../interfaces/knex.knex.oracledbconnectionconfig.md)
- [OrderBy](../interfaces/knex.knex.orderby.md)
- [PgConnectionConfig](../interfaces/knex.knex.pgconnectionconfig.md)
- [PoolConfig](../interfaces/knex.knex.poolconfig.md)
- [PostgreSqlColumnBuilder](../interfaces/knex.knex.postgresqlcolumnbuilder.md)
- [QueryInterface](../interfaces/knex.knex.queryinterface.md)
- [Raw](../interfaces/knex.knex.raw.md)
- [RawBuilder](../interfaces/knex.knex.rawbuilder.md)
- [RawQueryBuilder](../interfaces/knex.knex.rawquerybuilder.md)
- [Ref](../interfaces/knex.knex.ref.md)
- [RefBuilder](../interfaces/knex.knex.refbuilder.md)
- [ReferencingColumnBuilder](../interfaces/knex.knex.referencingcolumnbuilder.md)
- [SchemaBuilder](../interfaces/knex.knex.schemabuilder.md)
- [SeederConfig](../interfaces/knex.knex.seederconfig.md)
- [Select](../interfaces/knex.knex.select.md)
- [SocketConnectionConfig](../interfaces/knex.knex.socketconnectionconfig.md)
- [Sql](../interfaces/knex.knex.sql.md)
- [SqlNative](../interfaces/knex.knex.sqlnative.md)
- [Sqlite3ConnectionConfig](../interfaces/knex.knex.sqlite3connectionconfig.md)
- [StringTagSupport](../interfaces/knex.knex.stringtagsupport.md)
- [Table](../interfaces/knex.knex.table.md)
- [TableBuilder](../interfaces/knex.knex.tablebuilder.md)
- [Transaction](../interfaces/knex.knex.transaction.md)
- [TypePreservingAggregation](../interfaces/knex.knex.typepreservingaggregation.md)
- [Union](../interfaces/knex.knex.union.md)
- [ValueDict](../interfaces/knex.knex.valuedict.md)
- [Where](../interfaces/knex.knex.where.md)
- [WhereBetween](../interfaces/knex.knex.wherebetween.md)
- [WhereExists](../interfaces/knex.knex.whereexists.md)
- [WhereIn](../interfaces/knex.knex.wherein.md)
- [WhereNull](../interfaces/knex.knex.wherenull.md)
- [WhereRaw](../interfaces/knex.knex.whereraw.md)
- [WhereWrapped](../interfaces/knex.knex.wherewrapped.md)
- [With](../interfaces/knex.knex.with.md)
- [WithRaw](../interfaces/knex.knex.withraw.md)
- [WithSchema](../interfaces/knex.knex.withschema.md)
- [WithWrapped](../interfaces/knex.knex.withwrapped.md)

## Type aliases

### AsyncConnectionConfigProvider

Ƭ **AsyncConnectionConfigProvider**: () => *Promise*<[*StaticConnectionConfig*](knex.knex-1.md#staticconnectionconfig)\>

Defined in: node_modules/knex/types/index.d.ts:1885

___

### ClearStatements

Ƭ **ClearStatements**: *with* \| *select* \| *columns* \| *where* \| *union* \| *join* \| *group* \| *order* \| *having* \| *limit* \| *offset* \| *counter* \| *counters*

Defined in: node_modules/knex/types/index.d.ts:463

___

### ColumnDescriptor

Ƭ **ColumnDescriptor**<TRecord, TResult\>: *string* \| [*Raw*](../interfaces/knex.knex.raw.md) \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\> \| *Dict*<*string*\>

#### Type parameters:

Name |
------ |
`TRecord` |
`TResult` |

Defined in: node_modules/knex/types/index.d.ts:409

___

### CompositeTableType

Ƭ **CompositeTableType**<TBase, TInsert, TUpdate\>: { `base`: TBase ; `insert`: TInsert ; `update`: TUpdate  }

#### Type parameters:

Name | Default |
------ | ------ |
`TBase` | - |
`TInsert` | TBase |
`TUpdate` | *Partial*<TInsert\\> |

#### Type declaration:

Name | Type |
------ | ------ |
`base` | TBase |
`insert` | TInsert |
`update` | TUpdate |

Defined in: node_modules/knex/types/index.d.ts:439

___

### ConnectionConfigProvider

Ƭ **ConnectionConfigProvider**: [*SyncConnectionConfigProvider*](knex.knex-1.md#syncconnectionconfigprovider) \| [*AsyncConnectionConfigProvider*](knex.knex-1.md#asyncconnectionconfigprovider)

Defined in: node_modules/knex/types/index.d.ts:1883

___

### DbColumn

Ƭ **DbColumn**<TColumn\>: *Readonly*<[*MaybeRawColumn*](knex.knex-1.md#mayberawcolumn)<TColumn\>\>

#### Type parameters:

Name |
------ |
`TColumn` |

Defined in: node_modules/knex/types/index.d.ts:433

___

### DbRecord

Ƭ **DbRecord**<TRecord\>: *Readonly*<*SafePartial*<[*MaybeRawRecord*](knex.knex-1.md#mayberawrecord)<TRecord\>\>\>

#### Type parameters:

Name |
------ |
`TRecord` |

Defined in: node_modules/knex/types/index.d.ts:435

___

### DbRecordArr

Ƭ **DbRecordArr**<TRecord\>: *Readonly*<*MaybeArray*<[*DbRecord*](knex.knex-1.md#dbrecord)<TRecord\>\>\>

#### Type parameters:

Name |
------ |
`TRecord` |

Defined in: node_modules/knex/types/index.d.ts:437

___

### ExposedPromiseKeys

Ƭ **ExposedPromiseKeys**: *then* \| *catch* \| *finally*

Defined in: node_modules/knex/types/index.d.ts:1633

___

### InferrableColumnDescriptor

Ƭ **InferrableColumnDescriptor**<TRecord\>: keyof TRecord \| [*Ref*](../interfaces/knex.knex.ref.md)<*any*, *any*\> \| *Dict*<keyof TRecord\>

#### Type parameters:

Name | Type |
------ | ------ |
`TRecord` | {} |

Defined in: node_modules/knex/types/index.d.ts:415

___

### IntersectAliases

Ƭ **IntersectAliases**<AliasUT\>: *UnionToIntersection*<*IncompatibleToAlt*<AliasUT *extends* *infer* I[] ? I *extends* [*Ref*](../interfaces/knex.knex.ref.md)<*any*, *infer* TMapping\> ? TMapping : I : *never*, Dict, {}\>\>

#### Type parameters:

Name |
------ |
`AliasUT` |

Defined in: node_modules/knex/types/index.d.ts:904

___

### LogFn

Ƭ **LogFn**: (`message`: *any*) => *void*

Defined in: node_modules/knex/types/index.d.ts:2092

___

### Lookup

Ƭ **Lookup**<TRegistry, TKey, TDefault\>: TKey *extends* keyof TRegistry ? TRegistry[TKey] : TDefault

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TRegistry` | {} | - |
`TKey` | *string* | - |
`TDefault` | - | *never* |

Defined in: node_modules/knex/types/index.d.ts:422

___

### MaybeRawColumn

Ƭ **MaybeRawColumn**<TColumn\>: TColumn \| [*Raw*](../interfaces/knex.knex.raw.md)<TColumn\>

#### Type parameters:

Name |
------ |
`TColumn` |

Defined in: node_modules/knex/types/index.d.ts:427

___

### MaybeRawRecord

Ƭ **MaybeRawRecord**<TRecord\>: { [K in keyof TRecord]: MaybeRawColumn<TRecord[K]\>}

#### Type parameters:

Name |
------ |
`TRecord` |

Defined in: node_modules/knex/types/index.d.ts:429

___

### QueryCallback

Ƭ **QueryCallback**<TRecord, TResult\>: (`this`: [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>, `builder`: [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>) => *void*

#### Type parameters:

Name | Default |
------ | ------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

Defined in: node_modules/knex/types/index.d.ts:1571

___

### QueryCallbackWithArgs

Ƭ **QueryCallbackWithArgs**<TRecord, TResult\>: (`this`: [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>, `builder`: [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>, ...`args`: *any*[]) => *void*

#### Type parameters:

Name | Default |
------ | ------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

Defined in: node_modules/knex/types/index.d.ts:1576

___

### RawBinding

Ƭ **RawBinding**: [*Value*](knex.knex-1.md#value) \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1481

___

### RedshiftConnectionConfig

Ƭ **RedshiftConnectionConfig**: [*PgConnectionConfig*](../interfaces/knex.knex.pgconnectionconfig.md)

Defined in: node_modules/knex/types/index.d.ts:2054

___

### ResolveTableType

Ƭ **ResolveTableType**<TCompositeTableType, TScope\>: TCompositeTableType *extends* [*CompositeTableType*](knex.knex-1.md#compositetabletype)<*unknown*\> ? TCompositeTableType[TScope] : TCompositeTableType

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TCompositeTableType` | - | - |
`TScope` | [*TableInterfaceScope*](knex.knex-1.md#tableinterfacescope) | *base* |

Defined in: node_modules/knex/types/index.d.ts:451

___

### StaticConnectionConfig

Ƭ **StaticConnectionConfig**: [*ConnectionConfig*](../interfaces/knex.knex.connectionconfig.md) \| [*MariaSqlConnectionConfig*](../interfaces/knex.knex.mariasqlconnectionconfig.md) \| [*MySqlConnectionConfig*](../interfaces/knex.knex.mysqlconnectionconfig.md) \| [*MySql2ConnectionConfig*](../interfaces/knex.knex.mysql2connectionconfig.md) \| [*MsSqlConnectionConfig*](../interfaces/knex.knex.mssqlconnectionconfig.md) \| [*OracleDbConnectionConfig*](../interfaces/knex.knex.oracledbconnectionconfig.md) \| [*PgConnectionConfig*](../interfaces/knex.knex.pgconnectionconfig.md) \| [*RedshiftConnectionConfig*](knex.knex-1.md#redshiftconnectionconfig) \| [*Sqlite3ConnectionConfig*](../interfaces/knex.knex.sqlite3connectionconfig.md) \| [*SocketConnectionConfig*](../interfaces/knex.knex.socketconnectionconfig.md)

Defined in: node_modules/knex/types/index.d.ts:1871

___

### SyncConnectionConfigProvider

Ƭ **SyncConnectionConfigProvider**: () => [*StaticConnectionConfig*](knex.knex-1.md#staticconnectionconfig)

Defined in: node_modules/knex/types/index.d.ts:1884

___

### TableDescriptor

Ƭ **TableDescriptor**: *string* \| [*Raw*](../interfaces/knex.knex.raw.md) \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)

Defined in: node_modules/knex/types/index.d.ts:420

___

### TableInterfaceScope

Ƭ **TableInterfaceScope**: keyof [*CompositeTableType*](knex.knex-1.md#compositetabletype)<*unknown*\>

Defined in: node_modules/knex/types/index.d.ts:447

___

### TableNames

Ƭ **TableNames**: keyof Tables

Defined in: node_modules/knex/types/index.d.ts:445

___

### TableType

Ƭ **TableType**<TTable\>: Tables[TTable]

#### Type parameters:

Name | Type |
------ | ------ |
`TTable` | keyof Tables |

Defined in: node_modules/knex/types/index.d.ts:449

___

### Value

Ƭ **Value**: *string* \| *number* \| *boolean* \| *null* \| Date \| *string*[] \| *number*[] \| Date[] \| *boolean*[] \| Buffer \| [*Raw*](../interfaces/knex.knex.raw.md)

Defined in: node_modules/knex/types/index.d.ts:393

## Variables

### RefMemberTag

• `Const` **RefMemberTag**: unique *symbol*

Defined in: node_modules/knex/types/index.d.ts:1512
