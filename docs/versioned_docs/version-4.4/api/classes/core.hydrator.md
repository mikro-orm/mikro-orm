---
id: "core.hydrator"
title: "Class: Hydrator"
sidebar_label: "Hydrator"
hide_title: true
---

# Class: Hydrator

[core](../modules/core.md).Hydrator

## Hierarchy

* **Hydrator**

  ↳ [*ObjectHydrator*](core.objecthydrator.md)

## Implements

* *IHydrator*

## Constructors

### constructor

\+ **new Hydrator**(`metadata`: [*MetadataStorage*](core.metadatastorage.md), `platform`: [*Platform*](core.platform.md), `config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>): [*Hydrator*](core.hydrator.md)

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |
`platform` | [*Platform*](core.platform.md) |
`config` | [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |

**Returns:** [*Hydrator*](core.hydrator.md)

Defined in: [packages/core/src/hydration/Hydrator.ts:8](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/hydration/Hydrator.ts#L8)

## Properties

### config

• `Protected` `Readonly` **config**: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

___

### metadata

• `Protected` `Readonly` **metadata**: [*MetadataStorage*](core.metadatastorage.md)

___

### platform

• `Protected` `Readonly` **platform**: [*Platform*](core.platform.md)

## Methods

### getProperties

▸ `Protected`**getProperties**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `type`: *reference* \| *full* \| *returning*): [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>[]

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`type` | *reference* \| *full* \| *returning* |

**Returns:** [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>[]

Defined in: [packages/core/src/hydration/Hydrator.ts:34](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/hydration/Hydrator.ts#L34)

___

### hydrate

▸ **hydrate**<T\>(`entity`: T, `meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `factory`: [*EntityFactory*](core.entityfactory.md), `type`: *reference* \| *full* \| *returning*, `newEntity?`: *boolean*, `convertCustomTypes?`: *boolean*): *void*

**`inheritdoc`** 

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entity` | T | - |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> | - |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> | - |
`factory` | [*EntityFactory*](core.entityfactory.md) | - |
`type` | *reference* \| *full* \| *returning* | - |
`newEntity` | *boolean* | false |
`convertCustomTypes` | *boolean* | false |

**Returns:** *void*

Defined in: [packages/core/src/hydration/Hydrator.ts:17](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/hydration/Hydrator.ts#L17)

___

### hydrateProperty

▸ `Protected`**hydrateProperty**<T\>(`entity`: T, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `factory`: [*EntityFactory*](core.entityfactory.md), `newEntity?`: *boolean*, `convertCustomTypes?`: *boolean*): *void*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`factory` | [*EntityFactory*](core.entityfactory.md) |
`newEntity?` | *boolean* |
`convertCustomTypes?` | *boolean* |

**Returns:** *void*

Defined in: [packages/core/src/hydration/Hydrator.ts:47](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/hydration/Hydrator.ts#L47)

___

### hydrateReference

▸ **hydrateReference**<T\>(`entity`: T, `meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `factory`: [*EntityFactory*](core.entityfactory.md), `convertCustomTypes?`: *boolean*): *void*

**`inheritdoc`** 

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`factory` | [*EntityFactory*](core.entityfactory.md) |
`convertCustomTypes?` | *boolean* |

**Returns:** *void*

Defined in: [packages/core/src/hydration/Hydrator.ts:28](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/hydration/Hydrator.ts#L28)
