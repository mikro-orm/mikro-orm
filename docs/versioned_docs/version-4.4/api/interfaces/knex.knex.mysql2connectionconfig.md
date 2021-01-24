---
id: "knex.knex.mysql2connectionconfig"
title: "Interface: MySql2ConnectionConfig"
sidebar_label: "MySql2ConnectionConfig"
hide_title: true
---

# Interface: MySql2ConnectionConfig

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).MySql2ConnectionConfig

## Hierarchy

* [*MySqlConnectionConfig*](knex.knex.mysqlconnectionconfig.md)

  ↳ **MySql2ConnectionConfig**

## Properties

### authPlugins

• `Optional` **authPlugins**: *undefined* \| { [pluginName: string]: (`pluginMetadata`: *any*) => (`pluginData`: *any*) => *any*;  }

Defined in: node_modules/knex/types/index.d.ts:2008

___

### authSwitchHandler

• `Optional` **authSwitchHandler**: *undefined* \| (`data`: *any*, `callback`: () => *void*) => *any*

Defined in: node_modules/knex/types/index.d.ts:2009

___

### bigNumberStrings

• `Optional` **bigNumberStrings**: *undefined* \| *boolean*

Inherited from: [MySqlConnectionConfig](knex.knex.mysqlconnectionconfig.md).[bigNumberStrings](knex.knex.mysqlconnectionconfig.md#bignumberstrings)

Defined in: node_modules/knex/types/index.d.ts:1994

___

### charset

• `Optional` **charset**: *undefined* \| *string*

Inherited from: [MySqlConnectionConfig](knex.knex.mysqlconnectionconfig.md).[charset](knex.knex.mysqlconnectionconfig.md#charset)

Defined in: node_modules/knex/types/index.d.ts:1986

___

### charsetNumber

• `Optional` **charsetNumber**: *undefined* \| *number*

Defined in: node_modules/knex/types/index.d.ts:2010

___

### compress

• `Optional` **compress**: *undefined* \| *boolean*

Defined in: node_modules/knex/types/index.d.ts:2011

___

### connectAttributes

• `Optional` **connectAttributes**: *undefined* \| { [attrNames: string]: *any*;  }

Defined in: node_modules/knex/types/index.d.ts:2012

___

### connectTimeout

• `Optional` **connectTimeout**: *undefined* \| *number*

Inherited from: [MySqlConnectionConfig](knex.knex.mysqlconnectionconfig.md).[connectTimeout](knex.knex.mysqlconnectionconfig.md#connecttimeout)

Defined in: node_modules/knex/types/index.d.ts:1988

___

### database

• `Optional` **database**: *undefined* \| *string*

Inherited from: [MySqlConnectionConfig](knex.knex.mysqlconnectionconfig.md).[database](knex.knex.mysqlconnectionconfig.md#database)

Defined in: node_modules/knex/types/index.d.ts:1985

___

### dateStrings

• `Optional` **dateStrings**: *undefined* \| *boolean*

Inherited from: [MySqlConnectionConfig](knex.knex.mysqlconnectionconfig.md).[dateStrings](knex.knex.mysqlconnectionconfig.md#datestrings)

Defined in: node_modules/knex/types/index.d.ts:1995

___

### debug

• `Optional` **debug**: *undefined* \| *boolean*

Inherited from: [MySqlConnectionConfig](knex.knex.mysqlconnectionconfig.md).[debug](knex.knex.mysqlconnectionconfig.md#debug)

Defined in: node_modules/knex/types/index.d.ts:1996

___

### decimalNumbers

• `Optional` **decimalNumbers**: *undefined* \| *boolean*

Inherited from: [MySqlConnectionConfig](knex.knex.mysqlconnectionconfig.md).[decimalNumbers](knex.knex.mysqlconnectionconfig.md#decimalnumbers)

Defined in: node_modules/knex/types/index.d.ts:2001

___

### enableKeepAlive

• `Optional` **enableKeepAlive**: *undefined* \| *boolean*

Defined in: node_modules/knex/types/index.d.ts:2013

___

### flags

• `Optional` **flags**: *undefined* \| *string*

Inherited from: [MySqlConnectionConfig](knex.knex.mysqlconnectionconfig.md).[flags](knex.knex.mysqlconnectionconfig.md#flags)

Defined in: node_modules/knex/types/index.d.ts:1999

___

### host

• `Optional` **host**: *undefined* \| *string*

Inherited from: [MySqlConnectionConfig](knex.knex.mysqlconnectionconfig.md).[host](knex.knex.mysqlconnectionconfig.md#host)

Defined in: node_modules/knex/types/index.d.ts:1979

___

### insecureAuth

• `Optional` **insecureAuth**: *undefined* \| *boolean*

Inherited from: [MySqlConnectionConfig](knex.knex.mysqlconnectionconfig.md).[insecureAuth](knex.knex.mysqlconnectionconfig.md#insecureauth)

Defined in: node_modules/knex/types/index.d.ts:1990

___

### keepAliveInitialDelay

• `Optional` **keepAliveInitialDelay**: *undefined* \| *number*

Defined in: node_modules/knex/types/index.d.ts:2014

___

### localAddress

• `Optional` **localAddress**: *undefined* \| *string*

Inherited from: [MySqlConnectionConfig](knex.knex.mysqlconnectionconfig.md).[localAddress](knex.knex.mysqlconnectionconfig.md#localaddress)

Defined in: node_modules/knex/types/index.d.ts:1981

___

### maxPreparedStatements

• `Optional` **maxPreparedStatements**: *undefined* \| *number*

Defined in: node_modules/knex/types/index.d.ts:2015

___

### multipleStatements

• `Optional` **multipleStatements**: *undefined* \| *boolean*

Inherited from: [MySqlConnectionConfig](knex.knex.mysqlconnectionconfig.md).[multipleStatements](knex.knex.mysqlconnectionconfig.md#multiplestatements)

Defined in: node_modules/knex/types/index.d.ts:1998

___

### namedPlaceholders

• `Optional` **namedPlaceholders**: *undefined* \| *boolean*

Defined in: node_modules/knex/types/index.d.ts:2016

___

### nestTables

• `Optional` **nestTables**: *undefined* \| *string* \| *boolean*

Defined in: node_modules/knex/types/index.d.ts:2017

___

### password

• `Optional` **password**: *undefined* \| *string*

Inherited from: [MySqlConnectionConfig](knex.knex.mysqlconnectionconfig.md).[password](knex.knex.mysqlconnectionconfig.md#password)

Defined in: node_modules/knex/types/index.d.ts:1984

___

### passwordSha1

• `Optional` **passwordSha1**: *undefined* \| *string*

Defined in: node_modules/knex/types/index.d.ts:2018

___

### port

• `Optional` **port**: *undefined* \| *number*

Inherited from: [MySqlConnectionConfig](knex.knex.mysqlconnectionconfig.md).[port](knex.knex.mysqlconnectionconfig.md#port)

Defined in: node_modules/knex/types/index.d.ts:1980

___

### queryFormat

• `Optional` **queryFormat**: *undefined* \| (`query`: *string*, `values`: *any*) => *string*

Inherited from: [MySqlConnectionConfig](knex.knex.mysqlconnectionconfig.md).[queryFormat](knex.knex.mysqlconnectionconfig.md#queryformat)

Defined in: node_modules/knex/types/index.d.ts:1992

___

### rowsAsArray

• `Optional` **rowsAsArray**: *undefined* \| *boolean*

Defined in: node_modules/knex/types/index.d.ts:2019

___

### socketPath

• `Optional` **socketPath**: *undefined* \| *string*

Inherited from: [MySqlConnectionConfig](knex.knex.mysqlconnectionconfig.md).[socketPath](knex.knex.mysqlconnectionconfig.md#socketpath)

Defined in: node_modules/knex/types/index.d.ts:1982

___

### ssl

• `Optional` **ssl**: *undefined* \| *string* \| [*MariaSslConfiguration*](knex.knex.mariasslconfiguration.md)

Inherited from: [MySqlConnectionConfig](knex.knex.mysqlconnectionconfig.md).[ssl](knex.knex.mysqlconnectionconfig.md#ssl)

Defined in: node_modules/knex/types/index.d.ts:2000

___

### stream

• `Optional` **stream**: *undefined* \| *boolean* \| (`opts`: *any*) => *Stream* \| *Stream*

Defined in: node_modules/knex/types/index.d.ts:2020

___

### stringifyObjects

• `Optional` **stringifyObjects**: *undefined* \| *boolean*

Inherited from: [MySqlConnectionConfig](knex.knex.mysqlconnectionconfig.md).[stringifyObjects](knex.knex.mysqlconnectionconfig.md#stringifyobjects)

Defined in: node_modules/knex/types/index.d.ts:1989

___

### supportBigNumbers

• `Optional` **supportBigNumbers**: *undefined* \| *boolean*

Inherited from: [MySqlConnectionConfig](knex.knex.mysqlconnectionconfig.md).[supportBigNumbers](knex.knex.mysqlconnectionconfig.md#supportbignumbers)

Defined in: node_modules/knex/types/index.d.ts:1993

___

### timezone

• `Optional` **timezone**: *undefined* \| *string*

Inherited from: [MySqlConnectionConfig](knex.knex.mysqlconnectionconfig.md).[timezone](knex.knex.mysqlconnectionconfig.md#timezone)

Defined in: node_modules/knex/types/index.d.ts:1987

___

### trace

• `Optional` **trace**: *undefined* \| *boolean*

Inherited from: [MySqlConnectionConfig](knex.knex.mysqlconnectionconfig.md).[trace](knex.knex.mysqlconnectionconfig.md#trace)

Defined in: node_modules/knex/types/index.d.ts:1997

___

### typeCast

• `Optional` **typeCast**: *any*

Inherited from: [MySqlConnectionConfig](knex.knex.mysqlconnectionconfig.md).[typeCast](knex.knex.mysqlconnectionconfig.md#typecast)

Defined in: node_modules/knex/types/index.d.ts:1991

___

### uri

• `Optional` **uri**: *undefined* \| *string*

Defined in: node_modules/knex/types/index.d.ts:2021

___

### user

• `Optional` **user**: *undefined* \| *string*

Inherited from: [MySqlConnectionConfig](knex.knex.mysqlconnectionconfig.md).[user](knex.knex.mysqlconnectionconfig.md#user)

Defined in: node_modules/knex/types/index.d.ts:1983

## Methods

### expirationChecker

• `Optional` **expirationChecker**: 

Inherited from: [MySqlConnectionConfig](knex.knex.mysqlconnectionconfig.md).[expirationChecker](knex.knex.mysqlconnectionconfig.md#expirationchecker)
