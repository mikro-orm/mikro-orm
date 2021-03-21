---
id: "migrations.migration"
title: "Class: Migration"
sidebar_label: "Migration"
custom_edit_url: null
hide_title: true
---

# Class: Migration

[migrations](../modules/migrations.md).Migration

## Constructors

### constructor

\+ **new Migration**(`driver`: [*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>, `config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>): [*Migration*](migrations.migration.md)

#### Parameters:

Name | Type |
:------ | :------ |
`driver` | [*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\> |
`config` | [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |

**Returns:** [*Migration*](migrations.migration.md)

Defined in: [packages/migrations/src/Migration.ts:9](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/migrations/src/Migration.ts#L9)

## Properties

### config

• `Protected` `Readonly` **config**: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

___

### ctx

• `Protected` `Optional` **ctx**: [*Transaction*](../interfaces/knex.knex-1.transaction.md)<any, any\>

Defined in: [packages/migrations/src/Migration.ts:9](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/migrations/src/Migration.ts#L9)

___

### driver

• `Protected` `Readonly` **driver**: [*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>

___

### queries

• `Private` `Readonly` **queries**: [*Query*](../modules/migrations.md#query)[]

Defined in: [packages/migrations/src/Migration.ts:8](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/migrations/src/Migration.ts#L8)

## Methods

### addSql

▸ **addSql**(`sql`: [*Query*](../modules/migrations.md#query)): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`sql` | [*Query*](../modules/migrations.md#query) |

**Returns:** *void*

Defined in: [packages/migrations/src/Migration.ts:24](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/migrations/src/Migration.ts#L24)

___

### down

▸ **down**(): *Promise*<void\>

**Returns:** *Promise*<void\>

Defined in: [packages/migrations/src/Migration.ts:16](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/migrations/src/Migration.ts#L16)

___

### execute

▸ **execute**(`sql`: [*Query*](../modules/migrations.md#query)): *Promise*<[*EntityData*](../modules/core.md#entitydata)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`sql` | [*Query*](../modules/migrations.md#query) |

**Returns:** *Promise*<[*EntityData*](../modules/core.md#entitydata)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>[]\>

Defined in: [packages/migrations/src/Migration.ts:37](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/migrations/src/Migration.ts#L37)

___

### getKnex

▸ **getKnex**(): *Knex*<any, unknown[]\>

**Returns:** *Knex*<any, unknown[]\>

Defined in: [packages/migrations/src/Migration.ts:41](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/migrations/src/Migration.ts#L41)

___

### getQueries

▸ **getQueries**(): [*Query*](../modules/migrations.md#query)[]

**Returns:** [*Query*](../modules/migrations.md#query)[]

Defined in: [packages/migrations/src/Migration.ts:45](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/migrations/src/Migration.ts#L45)

___

### isTransactional

▸ **isTransactional**(): *boolean*

**Returns:** *boolean*

Defined in: [packages/migrations/src/Migration.ts:20](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/migrations/src/Migration.ts#L20)

___

### reset

▸ **reset**(): *void*

**Returns:** *void*

Defined in: [packages/migrations/src/Migration.ts:28](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/migrations/src/Migration.ts#L28)

___

### setTransactionContext

▸ **setTransactionContext**(`ctx`: *any*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`ctx` | *any* |

**Returns:** *void*

Defined in: [packages/migrations/src/Migration.ts:33](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/migrations/src/Migration.ts#L33)

___

### up

▸ `Abstract`**up**(): *Promise*<void\>

**Returns:** *Promise*<void\>

Defined in: [packages/migrations/src/Migration.ts:14](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/migrations/src/Migration.ts#L14)
