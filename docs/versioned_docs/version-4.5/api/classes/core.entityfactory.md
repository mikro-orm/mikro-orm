---
id: "core.entityfactory"
title: "Class: EntityFactory"
sidebar_label: "EntityFactory"
custom_edit_url: null
hide_title: true
---

# Class: EntityFactory

[core](../modules/core.md).EntityFactory

## Constructors

### constructor

\+ **new EntityFactory**(`unitOfWork`: [*UnitOfWork*](core.unitofwork.md), `em`: [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>): [*EntityFactory*](core.entityfactory.md)

#### Parameters:

Name | Type |
:------ | :------ |
`unitOfWork` | [*UnitOfWork*](core.unitofwork.md) |
`em` | [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |

**Returns:** [*EntityFactory*](core.entityfactory.md)

Defined in: [packages/core/src/entity/EntityFactory.ts:22](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityFactory.ts#L22)

## Properties

### config

• `Private` `Readonly` **config**: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

Defined in: [packages/core/src/entity/EntityFactory.ts:19](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityFactory.ts#L19)

___

### driver

• `Private` `Readonly` **driver**: [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>

Defined in: [packages/core/src/entity/EntityFactory.ts:17](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityFactory.ts#L17)

___

### eventManager

• `Private` `Readonly` **eventManager**: [*EventManager*](core.eventmanager.md)

Defined in: [packages/core/src/entity/EntityFactory.ts:22](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityFactory.ts#L22)

___

### hydrator

• `Private` `Readonly` **hydrator**: IHydrator

Defined in: [packages/core/src/entity/EntityFactory.ts:21](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityFactory.ts#L21)

___

### metadata

• `Private` `Readonly` **metadata**: [*MetadataStorage*](core.metadatastorage.md)

Defined in: [packages/core/src/entity/EntityFactory.ts:20](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityFactory.ts#L20)

___

### platform

• `Private` `Readonly` **platform**: [*Platform*](core.platform.md)

Defined in: [packages/core/src/entity/EntityFactory.ts:18](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityFactory.ts#L18)

## Methods

### create

▸ **create**<T, P\>(`entityName`: [*EntityName*](../modules/core.md#entityname)<T\>, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `options?`: [*FactoryOptions*](../interfaces/core.factoryoptions.md)): [*Loaded*](../modules/core.md#loaded)<T, P\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | - |
`P` | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | [*EntityName*](../modules/core.md#entityname)<T\> |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`options` | [*FactoryOptions*](../interfaces/core.factoryoptions.md) |

**Returns:** [*Loaded*](../modules/core.md#loaded)<T, P\>

Defined in: [packages/core/src/entity/EntityFactory.ts:27](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityFactory.ts#L27)

___

### createEntity

▸ `Private`**createEntity**<T\>(`data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `options`: [*FactoryOptions*](../interfaces/core.factoryoptions.md)): T

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`options` | [*FactoryOptions*](../interfaces/core.factoryoptions.md) |

**Returns:** T

Defined in: [packages/core/src/entity/EntityFactory.ts:88](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityFactory.ts#L88)

___

### createReference

▸ **createReference**<T\>(`entityName`: [*EntityName*](../modules/core.md#entityname)<T\>, `id`: [*Primary*](../modules/core.md#primary)<T\> \| [*Primary*](../modules/core.md#primary)<T\>[] \| *Record*<string, [*Primary*](../modules/core.md#primary)<T\>\>, `options?`: *Pick*<[*FactoryOptions*](../interfaces/core.factoryoptions.md), *convertCustomTypes* \| *merge*\>): T

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | [*EntityName*](../modules/core.md#entityname)<T\> |
`id` | [*Primary*](../modules/core.md#primary)<T\> \| [*Primary*](../modules/core.md#primary)<T\>[] \| *Record*<string, [*Primary*](../modules/core.md#primary)<T\>\> |
`options` | *Pick*<[*FactoryOptions*](../interfaces/core.factoryoptions.md), *convertCustomTypes* \| *merge*\> |

**Returns:** T

Defined in: [packages/core/src/entity/EntityFactory.ts:64](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityFactory.ts#L64)

___

### denormalizePrimaryKey

▸ `Private`**denormalizePrimaryKey**<T\>(`data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `primaryKey`: *string*, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>): *void*

denormalize PK to value required by driver (e.g. ObjectId)

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`primaryKey` | *string* |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/entity/EntityFactory.ts:153](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityFactory.ts#L153)

___

### extractConstructorParams

▸ `Private`**extractConstructorParams**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>): T[keyof T][]

returns parameters for entity constructor, creating references from plain ids

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |

**Returns:** T[keyof T][]

Defined in: [packages/core/src/entity/EntityFactory.ts:171](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityFactory.ts#L171)

___

### findEntity

▸ `Private`**findEntity**<T\>(`data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `convertCustomTypes?`: *boolean*): *undefined* \| T

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`convertCustomTypes?` | *boolean* |

**Returns:** *undefined* \| T

Defined in: [packages/core/src/entity/EntityFactory.ts:118](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityFactory.ts#L118)

___

### hydrate

▸ `Private`**hydrate**<T\>(`entity`: T, `meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `options`: [*FactoryOptions*](../interfaces/core.factoryoptions.md)): *void*

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`options` | [*FactoryOptions*](../interfaces/core.factoryoptions.md) |

**Returns:** *void*

Defined in: [packages/core/src/entity/EntityFactory.ts:110](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityFactory.ts#L110)

___

### processDiscriminatorColumn

▸ `Private`**processDiscriminatorColumn**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>): [*EntityMetadata*](core.entitymetadata.md)<T\>

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |

**Returns:** [*EntityMetadata*](core.entitymetadata.md)<T\>

Defined in: [packages/core/src/entity/EntityFactory.ts:132](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityFactory.ts#L132)
