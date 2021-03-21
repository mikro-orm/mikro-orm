---
id: "knex.knex-1.config"
title: "Interface: Config<SV>"
sidebar_label: "Config"
custom_edit_url: null
hide_title: true
---

# Interface: Config<SV\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).Config

## Type parameters

Name | Type | Default |
:------ | :------ | :------ |
`SV` | *object* | *any* |

## Properties

### acquireConnectionTimeout

• `Optional` **acquireConnectionTimeout**: *number*

Defined in: node_modules/knex/types/index.d.ts:1870

___

### asyncStackTraces

• `Optional` **asyncStackTraces**: *boolean*

Defined in: node_modules/knex/types/index.d.ts:1873

___

### client

• `Optional` **client**: *string* \| *typeof* [*Client*](../classes/knex.knex-1.client.md)

Defined in: node_modules/knex/types/index.d.ts:1857

___

### connection

• `Optional` **connection**: *string* \| [*StaticConnectionConfig*](../modules/knex.knex-1.md#staticconnectionconfig) \| [*ConnectionConfigProvider*](../modules/knex.knex-1.md#connectionconfigprovider)

Defined in: node_modules/knex/types/index.d.ts:1860

___

### debug

• `Optional` **debug**: *boolean*

Defined in: node_modules/knex/types/index.d.ts:1856

___

### dialect

• `Optional` **dialect**: *string*

Defined in: node_modules/knex/types/index.d.ts:1858

___

### log

• `Optional` **log**: [*Logger*](knex.knex-1.logger.md)

Defined in: node_modules/knex/types/index.d.ts:1874

___

### migrations

• `Optional` **migrations**: [*MigratorConfig*](knex.knex-1.migratorconfig.md)

Defined in: node_modules/knex/types/index.d.ts:1862

___

### pool

• `Optional` **pool**: [*PoolConfig*](knex.knex-1.poolconfig.md)

Defined in: node_modules/knex/types/index.d.ts:1861

___

### postProcessResponse

• `Optional` **postProcessResponse**: (`result`: *any*, `queryContext`: *any*) => *any*

#### Type declaration:

▸ (`result`: *any*, `queryContext`: *any*): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`result` | *any* |
`queryContext` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:1863

Defined in: node_modules/knex/types/index.d.ts:1863

___

### searchPath

• `Optional` **searchPath**: *string* \| readonly *string*[]

Defined in: node_modules/knex/types/index.d.ts:1872

___

### seeds

• `Optional` **seeds**: [*SeederConfig*](knex.knex-1.seederconfig.md)<SV\>

Defined in: node_modules/knex/types/index.d.ts:1869

___

### useNullAsDefault

• `Optional` **useNullAsDefault**: *boolean*

Defined in: node_modules/knex/types/index.d.ts:1871

___

### version

• `Optional` **version**: *string*

Defined in: node_modules/knex/types/index.d.ts:1859

___

### wrapIdentifier

• `Optional` **wrapIdentifier**: (`value`: *string*, `origImpl`: (`value`: *string*) => *string*, `queryContext`: *any*) => *string*

#### Type declaration:

▸ (`value`: *string*, `origImpl`: (`value`: *string*) => *string*, `queryContext`: *any*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`value` | *string* |
`origImpl` | (`value`: *string*) => *string* |
`queryContext` | *any* |

**Returns:** *string*

Defined in: node_modules/knex/types/index.d.ts:1864

Defined in: node_modules/knex/types/index.d.ts:1864
