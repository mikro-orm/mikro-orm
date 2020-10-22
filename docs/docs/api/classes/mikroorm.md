---
id: "mikroorm"
title: "Class: MikroORM<D>"
sidebar_label: "MikroORM"
---

Helper class for bootstrapping the MikroORM.

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`D` | [IDatabaseDriver](../interfaces/idatabasedriver.md) | IDatabaseDriver |

## Hierarchy

* **MikroORM**

## Constructors

### constructor

\+ **new MikroORM**(`options`: [Options](../index.md#options)&#60;D> \| [Configuration](configuration.md)&#60;D>): [MikroORM](mikroorm.md)

*Defined in [packages/core/src/MikroORM.ts:47](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/MikroORM.ts#L47)*

#### Parameters:

Name | Type |
------ | ------ |
`options` | [Options](../index.md#options)&#60;D> \| [Configuration](configuration.md)&#60;D> |

**Returns:** [MikroORM](mikroorm.md)

## Properties

### config

• `Readonly` **config**: [Configuration](configuration.md)&#60;D>

*Defined in [packages/core/src/MikroORM.ts:16](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/MikroORM.ts#L16)*

___

### driver

• `Private` `Readonly` **driver**: D

*Defined in [packages/core/src/MikroORM.ts:18](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/MikroORM.ts#L18)*

___

### em

•  **em**: D[*typeof* EntityManagerType] & [EntityManager](entitymanager.md)

*Defined in [packages/core/src/MikroORM.ts:15](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/MikroORM.ts#L15)*

___

### logger

• `Private` `Readonly` **logger**: [Logger](logger.md)

*Defined in [packages/core/src/MikroORM.ts:19](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/MikroORM.ts#L19)*

___

### metadata

• `Private` **metadata**: [MetadataStorage](metadatastorage.md)

*Defined in [packages/core/src/MikroORM.ts:17](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/MikroORM.ts#L17)*

## Methods

### close

▸ **close**(`force?`: boolean): Promise&#60;void>

*Defined in [packages/core/src/MikroORM.ts:94](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/MikroORM.ts#L94)*

Closes the database connection.

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`force` | boolean | false |

**Returns:** Promise&#60;void>

___

### connect

▸ **connect**(): Promise&#60;D>

*Defined in [packages/core/src/MikroORM.ts:69](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/MikroORM.ts#L69)*

Connects to the database.

**Returns:** Promise&#60;D>

___

### getEntityGenerator

▸ **getEntityGenerator**&#60;T>(): T

*Defined in [packages/core/src/MikroORM.ts:115](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/MikroORM.ts#L115)*

Gets the EntityGenerator.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [IEntityGenerator](../interfaces/ientitygenerator.md) | IEntityGenerator |

**Returns:** T

___

### getMetadata

▸ **getMetadata**(): [MetadataStorage](metadatastorage.md)

*Defined in [packages/core/src/MikroORM.ts:101](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/MikroORM.ts#L101)*

Gets the MetadataStorage.

**Returns:** [MetadataStorage](metadatastorage.md)

___

### getMigrator

▸ **getMigrator**&#60;T>(): T

*Defined in [packages/core/src/MikroORM.ts:124](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/MikroORM.ts#L124)*

Gets the Migrator.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [IMigrator](../interfaces/imigrator.md) | IMigrator |

**Returns:** T

___

### getSchemaGenerator

▸ **getSchemaGenerator**&#60;T>(): T

*Defined in [packages/core/src/MikroORM.ts:108](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/MikroORM.ts#L108)*

Gets the SchemaGenerator.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [ISchemaGenerator](../interfaces/ischemagenerator.md) | ISchemaGenerator |

**Returns:** T

___

### isConnected

▸ **isConnected**(): Promise&#60;boolean>

*Defined in [packages/core/src/MikroORM.ts:87](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/MikroORM.ts#L87)*

Checks whether the database connection is active.

**Returns:** Promise&#60;boolean>

___

### init

▸ `Static`**init**&#60;D>(`options?`: [Options](../index.md#options)&#60;D> \| [Configuration](configuration.md)&#60;D>, `connect?`: boolean): Promise&#60;[MikroORM](mikroorm.md)&#60;D>>

*Defined in [packages/core/src/MikroORM.ts:25](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/MikroORM.ts#L25)*

Initialize the ORM, load entity metadata, create EntityManager and connect to the database.
If you omit the `options` parameter, your CLI config will be used.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`D` | [IDatabaseDriver](../interfaces/idatabasedriver.md) | IDatabaseDriver |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`options?` | [Options](../index.md#options)&#60;D> \| [Configuration](configuration.md)&#60;D> | - |
`connect` | boolean | true |

**Returns:** Promise&#60;[MikroORM](mikroorm.md)&#60;D>>
