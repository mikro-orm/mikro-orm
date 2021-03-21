---
id: "knex.knex-1.mysqlconnectionconfig"
title: "Interface: MySqlConnectionConfig"
sidebar_label: "MySqlConnectionConfig"
custom_edit_url: null
hide_title: true
---

# Interface: MySqlConnectionConfig

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).MySqlConnectionConfig

## Hierarchy

* **MySqlConnectionConfig**

  ↳ [*MySql2ConnectionConfig*](knex.knex-1.mysql2connectionconfig.md)

## Properties

### bigNumberStrings

• `Optional` **bigNumberStrings**: *boolean*

Defined in: node_modules/knex/types/index.d.ts:2000

___

### charset

• `Optional` **charset**: *string*

Defined in: node_modules/knex/types/index.d.ts:1992

___

### connectTimeout

• `Optional` **connectTimeout**: *number*

Defined in: node_modules/knex/types/index.d.ts:1994

___

### database

• `Optional` **database**: *string*

Defined in: node_modules/knex/types/index.d.ts:1991

___

### dateStrings

• `Optional` **dateStrings**: *boolean*

Defined in: node_modules/knex/types/index.d.ts:2001

___

### debug

• `Optional` **debug**: *boolean*

Defined in: node_modules/knex/types/index.d.ts:2002

___

### decimalNumbers

• `Optional` **decimalNumbers**: *boolean*

Defined in: node_modules/knex/types/index.d.ts:2007

___

### flags

• `Optional` **flags**: *string*

Defined in: node_modules/knex/types/index.d.ts:2005

___

### host

• `Optional` **host**: *string*

Defined in: node_modules/knex/types/index.d.ts:1985

___

### insecureAuth

• `Optional` **insecureAuth**: *boolean*

Defined in: node_modules/knex/types/index.d.ts:1996

___

### localAddress

• `Optional` **localAddress**: *string*

Defined in: node_modules/knex/types/index.d.ts:1987

___

### multipleStatements

• `Optional` **multipleStatements**: *boolean*

Defined in: node_modules/knex/types/index.d.ts:2004

___

### password

• `Optional` **password**: *string*

Defined in: node_modules/knex/types/index.d.ts:1990

___

### port

• `Optional` **port**: *number*

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

Defined in: node_modules/knex/types/index.d.ts:1998

___

### socketPath

• `Optional` **socketPath**: *string*

Defined in: node_modules/knex/types/index.d.ts:1988

___

### ssl

• `Optional` **ssl**: *string* \| [*MariaSslConfiguration*](knex.knex-1.mariasslconfiguration.md)

Defined in: node_modules/knex/types/index.d.ts:2006

___

### stringifyObjects

• `Optional` **stringifyObjects**: *boolean*

Defined in: node_modules/knex/types/index.d.ts:1995

___

### supportBigNumbers

• `Optional` **supportBigNumbers**: *boolean*

Defined in: node_modules/knex/types/index.d.ts:1999

___

### timezone

• `Optional` **timezone**: *string*

Defined in: node_modules/knex/types/index.d.ts:1993

___

### trace

• `Optional` **trace**: *boolean*

Defined in: node_modules/knex/types/index.d.ts:2003

___

### typeCast

• `Optional` **typeCast**: *any*

Defined in: node_modules/knex/types/index.d.ts:1997

___

### user

• `Optional` **user**: *string*

Defined in: node_modules/knex/types/index.d.ts:1989

## Methods

### expirationChecker

▸ `Optional`**expirationChecker**(): *boolean*

**Returns:** *boolean*

Defined in: node_modules/knex/types/index.d.ts:2008
