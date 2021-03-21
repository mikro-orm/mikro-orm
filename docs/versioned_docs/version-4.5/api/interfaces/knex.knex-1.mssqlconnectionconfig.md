---
id: "knex.knex-1.mssqlconnectionconfig"
title: "Interface: MsSqlConnectionConfig"
sidebar_label: "MsSqlConnectionConfig"
custom_edit_url: null
hide_title: true
---

# Interface: MsSqlConnectionConfig

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).MsSqlConnectionConfig

## Properties

### connectionTimeout

• `Optional` **connectionTimeout**: *number*

Defined in: node_modules/knex/types/index.d.ts:1913

___

### database

• **database**: *string*

Defined in: node_modules/knex/types/index.d.ts:1912

___

### domain

• `Optional` **domain**: *string*

Defined in: node_modules/knex/types/index.d.ts:1911

___

### driver

• `Optional` **driver**: *string*

Defined in: node_modules/knex/types/index.d.ts:1906

___

### options

• `Optional` **options**: *Readonly*<{ `abortTransactionOnError?`: *boolean* ; `appName?`: *string* ; `enableArithAbort?`: *boolean* ; `encrypt?`: *boolean* ; `instanceName?`: *string* ; `isolationLevel?`: *READ_UNCOMMITTED* \| *READ_COMMITTED* \| *REPEATABLE_READ* \| *SERIALIZABLE* \| *SNAPSHOT* ; `maxRetriesOnTransientErrors?`: *number* ; `multiSubnetFailover?`: *boolean* ; `packetSize?`: *number* ; `tdsVersion?`: *string* ; `trustedConnection?`: *boolean* ; `useUTC?`: *boolean*  }\>

Defined in: node_modules/knex/types/index.d.ts:1918

___

### parseJSON

• `Optional` **parseJSON**: *boolean*

Defined in: node_modules/knex/types/index.d.ts:1916

___

### password

• `Optional` **password**: *string*

Defined in: node_modules/knex/types/index.d.ts:1908

___

### pool

• `Optional` **pool**: *Readonly*<{ `Promise?`: *any* ; `acquireTimeoutMillis?`: *number* ; `autostart?`: *boolean* ; `evictionRunIntervalMillis?`: *number* ; `fifo?`: *boolean* ; `idleTimeoutMillis?`: *number* ; `max?`: *number* ; `maxWaitingClients?`: *number* ; `min?`: *number* ; `numTestsPerRun?`: *number* ; `priorityRange?`: *number* ; `softIdleTimeoutMillis?`: *number* ; `testOnBorrow?`: *boolean*  }\>

Defined in: node_modules/knex/types/index.d.ts:1932

___

### port

• `Optional` **port**: *number*

Defined in: node_modules/knex/types/index.d.ts:1910

___

### requestTimeout

• `Optional` **requestTimeout**: *number*

Defined in: node_modules/knex/types/index.d.ts:1914

___

### server

• **server**: *string*

Defined in: node_modules/knex/types/index.d.ts:1909

___

### stream

• `Optional` **stream**: *boolean*

Defined in: node_modules/knex/types/index.d.ts:1915

___

### user

• `Optional` **user**: *string*

Defined in: node_modules/knex/types/index.d.ts:1907

## Methods

### expirationChecker

▸ `Optional`**expirationChecker**(): *boolean*

**Returns:** *boolean*

Defined in: node_modules/knex/types/index.d.ts:1917
