---
id: "knex.knex-1.mysql2connectionconfig"
title: "Interface: MySql2ConnectionConfig"
sidebar_label: "MySql2ConnectionConfig"
custom_edit_url: null
hide_title: true
---

# Interface: MySql2ConnectionConfig

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).MySql2ConnectionConfig

## Hierarchy

* [*MySqlConnectionConfig*](knex.knex-1.mysqlconnectionconfig.md)

  ↳ **MySql2ConnectionConfig**

## Properties

### authPlugins

• `Optional` **authPlugins**: *object*

#### Type declaration:

Defined in: node_modules/knex/types/index.d.ts:2014

___

### authSwitchHandler

• `Optional` **authSwitchHandler**: (`data`: *any*, `callback`: () => *void*) => *any*

#### Type declaration:

▸ (`data`: *any*, `callback`: () => *void*): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`data` | *any* |
`callback` | () => *void* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2015

Defined in: node_modules/knex/types/index.d.ts:2015

___

### bigNumberStrings

• `Optional` **bigNumberStrings**: *boolean*

Inherited from: [MySqlConnectionConfig](knex.knex-1.mysqlconnectionconfig.md).[bigNumberStrings](knex.knex-1.mysqlconnectionconfig.md#bignumberstrings)

Defined in: node_modules/knex/types/index.d.ts:2000

___

### charset

• `Optional` **charset**: *string*

Inherited from: [MySqlConnectionConfig](knex.knex-1.mysqlconnectionconfig.md).[charset](knex.knex-1.mysqlconnectionconfig.md#charset)

Defined in: node_modules/knex/types/index.d.ts:1992

___

### charsetNumber

• `Optional` **charsetNumber**: *number*

Defined in: node_modules/knex/types/index.d.ts:2016

___

### compress

• `Optional` **compress**: *boolean*

Defined in: node_modules/knex/types/index.d.ts:2017

___

### connectAttributes

• `Optional` **connectAttributes**: *object*

#### Type declaration:

Defined in: node_modules/knex/types/index.d.ts:2018

___

### connectTimeout

• `Optional` **connectTimeout**: *number*

Inherited from: [MySqlConnectionConfig](knex.knex-1.mysqlconnectionconfig.md).[connectTimeout](knex.knex-1.mysqlconnectionconfig.md#connecttimeout)

Defined in: node_modules/knex/types/index.d.ts:1994

___

### database

• `Optional` **database**: *string*

Inherited from: [MySqlConnectionConfig](knex.knex-1.mysqlconnectionconfig.md).[database](knex.knex-1.mysqlconnectionconfig.md#database)

Defined in: node_modules/knex/types/index.d.ts:1991

___

### dateStrings

• `Optional` **dateStrings**: *boolean*

Inherited from: [MySqlConnectionConfig](knex.knex-1.mysqlconnectionconfig.md).[dateStrings](knex.knex-1.mysqlconnectionconfig.md#datestrings)

Defined in: node_modules/knex/types/index.d.ts:2001

___

### debug

• `Optional` **debug**: *boolean*

Inherited from: [MySqlConnectionConfig](knex.knex-1.mysqlconnectionconfig.md).[debug](knex.knex-1.mysqlconnectionconfig.md#debug)

Defined in: node_modules/knex/types/index.d.ts:2002

___

### decimalNumbers

• `Optional` **decimalNumbers**: *boolean*

Inherited from: [MySqlConnectionConfig](knex.knex-1.mysqlconnectionconfig.md).[decimalNumbers](knex.knex-1.mysqlconnectionconfig.md#decimalnumbers)

Defined in: node_modules/knex/types/index.d.ts:2007

___

### enableKeepAlive

• `Optional` **enableKeepAlive**: *boolean*

Defined in: node_modules/knex/types/index.d.ts:2019

___

### flags

• `Optional` **flags**: *string*

Inherited from: [MySqlConnectionConfig](knex.knex-1.mysqlconnectionconfig.md).[flags](knex.knex-1.mysqlconnectionconfig.md#flags)

Defined in: node_modules/knex/types/index.d.ts:2005

___

### host

• `Optional` **host**: *string*

Inherited from: [MySqlConnectionConfig](knex.knex-1.mysqlconnectionconfig.md).[host](knex.knex-1.mysqlconnectionconfig.md#host)

Defined in: node_modules/knex/types/index.d.ts:1985

___

### insecureAuth

• `Optional` **insecureAuth**: *boolean*

Inherited from: [MySqlConnectionConfig](knex.knex-1.mysqlconnectionconfig.md).[insecureAuth](knex.knex-1.mysqlconnectionconfig.md#insecureauth)

Defined in: node_modules/knex/types/index.d.ts:1996

___

### keepAliveInitialDelay

• `Optional` **keepAliveInitialDelay**: *number*

Defined in: node_modules/knex/types/index.d.ts:2020

___

### localAddress

• `Optional` **localAddress**: *string*

Inherited from: [MySqlConnectionConfig](knex.knex-1.mysqlconnectionconfig.md).[localAddress](knex.knex-1.mysqlconnectionconfig.md#localaddress)

Defined in: node_modules/knex/types/index.d.ts:1987

___

### maxPreparedStatements

• `Optional` **maxPreparedStatements**: *number*

Defined in: node_modules/knex/types/index.d.ts:2021

___

### multipleStatements

• `Optional` **multipleStatements**: *boolean*

Inherited from: [MySqlConnectionConfig](knex.knex-1.mysqlconnectionconfig.md).[multipleStatements](knex.knex-1.mysqlconnectionconfig.md#multiplestatements)

Defined in: node_modules/knex/types/index.d.ts:2004

___

### namedPlaceholders

• `Optional` **namedPlaceholders**: *boolean*

Defined in: node_modules/knex/types/index.d.ts:2022

___

### nestTables

• `Optional` **nestTables**: *string* \| *boolean*

Defined in: node_modules/knex/types/index.d.ts:2023

___

### password

• `Optional` **password**: *string*

Inherited from: [MySqlConnectionConfig](knex.knex-1.mysqlconnectionconfig.md).[password](knex.knex-1.mysqlconnectionconfig.md#password)

Defined in: node_modules/knex/types/index.d.ts:1990

___

### passwordSha1

• `Optional` **passwordSha1**: *string*

Defined in: node_modules/knex/types/index.d.ts:2024

___

### port

• `Optional` **port**: *number*

Inherited from: [MySqlConnectionConfig](knex.knex-1.mysqlconnectionconfig.md).[port](knex.knex-1.mysqlconnectionconfig.md#port)

Defined in: node_modules/knex/types/index.d.ts:1986

___

### queryFormat

• `Optional` **queryFormat**: (`query`: *string*, `values`: *any*) => *string*

#### Type declaration:

▸ (`query`: *string*, `values`: *any*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`query` | *string* |
`values` | *any* |

**Returns:** *string*

Defined in: node_modules/knex/types/index.d.ts:1998

Inherited from: [MySqlConnectionConfig](knex.knex-1.mysqlconnectionconfig.md).[queryFormat](knex.knex-1.mysqlconnectionconfig.md#queryformat)

Defined in: node_modules/knex/types/index.d.ts:1998

___

### rowsAsArray

• `Optional` **rowsAsArray**: *boolean*

Defined in: node_modules/knex/types/index.d.ts:2025

___

### socketPath

• `Optional` **socketPath**: *string*

Inherited from: [MySqlConnectionConfig](knex.knex-1.mysqlconnectionconfig.md).[socketPath](knex.knex-1.mysqlconnectionconfig.md#socketpath)

Defined in: node_modules/knex/types/index.d.ts:1988

___

### ssl

• `Optional` **ssl**: *string* \| [*MariaSslConfiguration*](knex.knex-1.mariasslconfiguration.md)

Inherited from: [MySqlConnectionConfig](knex.knex-1.mysqlconnectionconfig.md).[ssl](knex.knex-1.mysqlconnectionconfig.md#ssl)

Defined in: node_modules/knex/types/index.d.ts:2006

___

### stream

• `Optional` **stream**: *boolean* \| (`opts`: *any*) => *Stream* \| *Stream*

Defined in: node_modules/knex/types/index.d.ts:2026

___

### stringifyObjects

• `Optional` **stringifyObjects**: *boolean*

Inherited from: [MySqlConnectionConfig](knex.knex-1.mysqlconnectionconfig.md).[stringifyObjects](knex.knex-1.mysqlconnectionconfig.md#stringifyobjects)

Defined in: node_modules/knex/types/index.d.ts:1995

___

### supportBigNumbers

• `Optional` **supportBigNumbers**: *boolean*

Inherited from: [MySqlConnectionConfig](knex.knex-1.mysqlconnectionconfig.md).[supportBigNumbers](knex.knex-1.mysqlconnectionconfig.md#supportbignumbers)

Defined in: node_modules/knex/types/index.d.ts:1999

___

### timezone

• `Optional` **timezone**: *string*

Inherited from: [MySqlConnectionConfig](knex.knex-1.mysqlconnectionconfig.md).[timezone](knex.knex-1.mysqlconnectionconfig.md#timezone)

Defined in: node_modules/knex/types/index.d.ts:1993

___

### trace

• `Optional` **trace**: *boolean*

Inherited from: [MySqlConnectionConfig](knex.knex-1.mysqlconnectionconfig.md).[trace](knex.knex-1.mysqlconnectionconfig.md#trace)

Defined in: node_modules/knex/types/index.d.ts:2003

___

### typeCast

• `Optional` **typeCast**: *any*

Inherited from: [MySqlConnectionConfig](knex.knex-1.mysqlconnectionconfig.md).[typeCast](knex.knex-1.mysqlconnectionconfig.md#typecast)

Defined in: node_modules/knex/types/index.d.ts:1997

___

### uri

• `Optional` **uri**: *string*

Defined in: node_modules/knex/types/index.d.ts:2027

___

### user

• `Optional` **user**: *string*

Inherited from: [MySqlConnectionConfig](knex.knex-1.mysqlconnectionconfig.md).[user](knex.knex-1.mysqlconnectionconfig.md#user)

Defined in: node_modules/knex/types/index.d.ts:1989

## Methods

### expirationChecker

▸ `Optional`**expirationChecker**(): *boolean*

**Returns:** *boolean*

Inherited from: [MySqlConnectionConfig](knex.knex-1.mysqlconnectionconfig.md)

Defined in: node_modules/knex/types/index.d.ts:2008
