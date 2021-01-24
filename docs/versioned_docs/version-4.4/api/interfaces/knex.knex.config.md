---
id: "knex.knex.config"
title: "Interface: Config<SV>"
sidebar_label: "Config"
hide_title: true
---

# Interface: Config<SV\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).Config

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`SV` | {} | *any* |

## Hierarchy

* **Config**

## Properties

### acquireConnectionTimeout

• `Optional` **acquireConnectionTimeout**: *undefined* \| *number*

Defined in: node_modules/knex/types/index.d.ts:1864

___

### asyncStackTraces

• `Optional` **asyncStackTraces**: *undefined* \| *boolean*

Defined in: node_modules/knex/types/index.d.ts:1867

___

### client

• `Optional` **client**: *undefined* \| *string* \| *typeof* [*Client*](../classes/knex.knex.client.md)

Defined in: node_modules/knex/types/index.d.ts:1851

___

### connection

• `Optional` **connection**: *undefined* \| *string* \| [*ConnectionConfig*](knex.knex.connectionconfig.md) \| [*MariaSqlConnectionConfig*](knex.knex.mariasqlconnectionconfig.md) \| [*MySqlConnectionConfig*](knex.knex.mysqlconnectionconfig.md) \| [*MySql2ConnectionConfig*](knex.knex.mysql2connectionconfig.md) \| [*MsSqlConnectionConfig*](knex.knex.mssqlconnectionconfig.md) \| [*OracleDbConnectionConfig*](knex.knex.oracledbconnectionconfig.md) \| [*PgConnectionConfig*](knex.knex.pgconnectionconfig.md) \| [*Sqlite3ConnectionConfig*](knex.knex.sqlite3connectionconfig.md) \| [*SocketConnectionConfig*](knex.knex.socketconnectionconfig.md) \| [*SyncConnectionConfigProvider*](../modules/knex.knex-1.md#syncconnectionconfigprovider) \| [*AsyncConnectionConfigProvider*](../modules/knex.knex-1.md#asyncconnectionconfigprovider)

Defined in: node_modules/knex/types/index.d.ts:1854

___

### debug

• `Optional` **debug**: *undefined* \| *boolean*

Defined in: node_modules/knex/types/index.d.ts:1850

___

### dialect

• `Optional` **dialect**: *undefined* \| *string*

Defined in: node_modules/knex/types/index.d.ts:1852

___

### log

• `Optional` **log**: *undefined* \| [*Logger*](knex.knex.logger.md)

Defined in: node_modules/knex/types/index.d.ts:1868

___

### migrations

• `Optional` **migrations**: *undefined* \| [*MigratorConfig*](knex.knex.migratorconfig.md)

Defined in: node_modules/knex/types/index.d.ts:1856

___

### pool

• `Optional` **pool**: *undefined* \| [*PoolConfig*](knex.knex.poolconfig.md)

Defined in: node_modules/knex/types/index.d.ts:1855

___

### postProcessResponse

• `Optional` **postProcessResponse**: *undefined* \| (`result`: *any*, `queryContext`: *any*) => *any*

Defined in: node_modules/knex/types/index.d.ts:1857

___

### searchPath

• `Optional` **searchPath**: *undefined* \| *string* \| readonly *string*[]

Defined in: node_modules/knex/types/index.d.ts:1866

___

### seeds

• `Optional` **seeds**: *undefined* \| [*SeederConfig*](knex.knex.seederconfig.md)<SV\>

Defined in: node_modules/knex/types/index.d.ts:1863

___

### useNullAsDefault

• `Optional` **useNullAsDefault**: *undefined* \| *boolean*

Defined in: node_modules/knex/types/index.d.ts:1865

___

### version

• `Optional` **version**: *undefined* \| *string*

Defined in: node_modules/knex/types/index.d.ts:1853

___

### wrapIdentifier

• `Optional` **wrapIdentifier**: *undefined* \| (`value`: *string*, `origImpl`: (`value`: *string*) => *string*, `queryContext`: *any*) => *string*

Defined in: node_modules/knex/types/index.d.ts:1858
