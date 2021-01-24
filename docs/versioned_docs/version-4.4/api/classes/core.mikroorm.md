---
id: "core.mikroorm"
title: "Class: MikroORM<D>"
sidebar_label: "MikroORM"
hide_title: true
---

# Class: MikroORM<D\>

[core](../modules/core.md).MikroORM

Helper class for bootstrapping the MikroORM.

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`D` | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md) | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md) |

## Hierarchy

* **MikroORM**

## Constructors

### constructor

\+ **new MikroORM**<D\>(`options`: [*Options*](../modules/core.md#options)<D\> \| [*Configuration*](core.configuration.md)<D\>): [*MikroORM*](core.mikroorm.md)<D\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`D` | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md), D\> | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\\> |

#### Parameters:

Name | Type |
------ | ------ |
`options` | [*Options*](../modules/core.md#options)<D\> \| [*Configuration*](core.configuration.md)<D\> |

**Returns:** [*MikroORM*](core.mikroorm.md)<D\>

Defined in: [packages/core/src/MikroORM.ts:47](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/MikroORM.ts#L47)

## Properties

### config

• `Readonly` **config**: [*Configuration*](core.configuration.md)<D\>

Defined in: [packages/core/src/MikroORM.ts:16](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/MikroORM.ts#L16)

___

### driver

• `Private` `Readonly` **driver**: D

Defined in: [packages/core/src/MikroORM.ts:18](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/MikroORM.ts#L18)

___

### em

• **em**: D[*typeof* [*EntityManagerType*](../modules/core.md#entitymanagertype)] & [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

Defined in: [packages/core/src/MikroORM.ts:15](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/MikroORM.ts#L15)

___

### logger

• `Private` `Readonly` **logger**: [*Logger*](core.logger.md)

Defined in: [packages/core/src/MikroORM.ts:19](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/MikroORM.ts#L19)

___

### metadata

• `Private` **metadata**: [*MetadataStorage*](core.metadatastorage.md)

Defined in: [packages/core/src/MikroORM.ts:17](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/MikroORM.ts#L17)

## Methods

### close

▸ **close**(`force?`: *boolean*): *Promise*<*void*\>

Closes the database connection.

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`force` | *boolean* | false |

**Returns:** *Promise*<*void*\>

Defined in: [packages/core/src/MikroORM.ts:94](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/MikroORM.ts#L94)

___

### connect

▸ **connect**(): *Promise*<D\>

Connects to the database.

**Returns:** *Promise*<D\>

Defined in: [packages/core/src/MikroORM.ts:69](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/MikroORM.ts#L69)

___

### getEntityGenerator

▸ **getEntityGenerator**<T\>(): T

Gets the EntityGenerator.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | IEntityGenerator | IEntityGenerator |

**Returns:** T

Defined in: [packages/core/src/MikroORM.ts:115](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/MikroORM.ts#L115)

___

### getMetadata

▸ **getMetadata**(): [*MetadataStorage*](core.metadatastorage.md)

Gets the MetadataStorage.

**Returns:** [*MetadataStorage*](core.metadatastorage.md)

Defined in: [packages/core/src/MikroORM.ts:101](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/MikroORM.ts#L101)

___

### getMigrator

▸ **getMigrator**<T\>(): T

Gets the Migrator.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | IMigrator | IMigrator |

**Returns:** T

Defined in: [packages/core/src/MikroORM.ts:124](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/MikroORM.ts#L124)

___

### getSchemaGenerator

▸ **getSchemaGenerator**<T\>(): T

Gets the SchemaGenerator.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | ISchemaGenerator | ISchemaGenerator |

**Returns:** T

Defined in: [packages/core/src/MikroORM.ts:108](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/MikroORM.ts#L108)

___

### isConnected

▸ **isConnected**(): *Promise*<*boolean*\>

Checks whether the database connection is active.

**Returns:** *Promise*<*boolean*\>

Defined in: [packages/core/src/MikroORM.ts:87](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/MikroORM.ts#L87)

___

### init

▸ `Static`**init**<D\>(`options?`: [*Options*](../modules/core.md#options)<D\> \| [*Configuration*](core.configuration.md)<D\>, `connect?`: *boolean*): *Promise*<[*MikroORM*](core.mikroorm.md)<D\>\>

Initialize the ORM, load entity metadata, create EntityManager and connect to the database.
If you omit the `options` parameter, your CLI config will be used.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`D` | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md), D\> | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\\> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`options?` | [*Options*](../modules/core.md#options)<D\> \| [*Configuration*](core.configuration.md)<D\> | - |
`connect` | *boolean* | true |

**Returns:** *Promise*<[*MikroORM*](core.mikroorm.md)<D\>\>

Defined in: [packages/core/src/MikroORM.ts:25](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/MikroORM.ts#L25)
