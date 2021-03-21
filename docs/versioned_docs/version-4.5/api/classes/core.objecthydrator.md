---
id: "core.objecthydrator"
title: "Class: ObjectHydrator"
sidebar_label: "ObjectHydrator"
custom_edit_url: null
hide_title: true
---

# Class: ObjectHydrator

[core](../modules/core.md).ObjectHydrator

## Hierarchy

* [*Hydrator*](core.hydrator.md)

  ↳ **ObjectHydrator**

## Constructors

### constructor

\+ **new ObjectHydrator**(`metadata`: [*MetadataStorage*](core.metadatastorage.md), `platform`: [*Platform*](core.platform.md), `config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>): [*ObjectHydrator*](core.objecthydrator.md)

#### Parameters:

Name | Type |
:------ | :------ |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |
`platform` | [*Platform*](core.platform.md) |
`config` | [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |

**Returns:** [*ObjectHydrator*](core.objecthydrator.md)

Inherited from: [Hydrator](core.hydrator.md)

Defined in: [packages/core/src/hydration/Hydrator.ts:8](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/hydration/Hydrator.ts#L8)

## Properties

### config

• `Protected` `Readonly` **config**: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

Inherited from: [Hydrator](core.hydrator.md).[config](core.hydrator.md#config)

___

### hydrators

• `Private` `Readonly` **hydrators**: *object*

#### Type declaration:

Name | Type |
:------ | :------ |
`full` | *Map*<string, EntityHydrator<any\>\> |
`reference` | *Map*<string, EntityHydrator<any\>\> |
`returning` | *Map*<string, EntityHydrator<any\>\> |

Defined in: [packages/core/src/hydration/ObjectHydrator.ts:13](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/hydration/ObjectHydrator.ts#L13)

___

### metadata

• `Protected` `Readonly` **metadata**: [*MetadataStorage*](core.metadatastorage.md)

Inherited from: [Hydrator](core.hydrator.md).[metadata](core.hydrator.md#metadata)

___

### platform

• `Protected` `Readonly` **platform**: [*Platform*](core.platform.md)

Inherited from: [Hydrator](core.hydrator.md).[platform](core.hydrator.md#platform)

## Methods

### createCollectionItemMapper

▸ `Private`**createCollectionItemMapper**<T\>(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>): *string*[]

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |

**Returns:** *string*[]

Defined in: [packages/core/src/hydration/ObjectHydrator.ts:263](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/hydration/ObjectHydrator.ts#L263)

___

### getEntityHydrator

▸ `Private`**getEntityHydrator**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `type`: *reference* \| *full* \| *returning*): *EntityHydrator*<T\>

**`internal`** Highly performance-sensitive method.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`type` | *reference* \| *full* \| *returning* |

**Returns:** *EntityHydrator*<T\>

Defined in: [packages/core/src/hydration/ObjectHydrator.ts:38](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/hydration/ObjectHydrator.ts#L38)

___

### getProperties

▸ `Protected`**getProperties**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `type`: *reference* \| *full* \| *returning*): [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>[]

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`type` | *reference* \| *full* \| *returning* |

**Returns:** [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>[]

Inherited from: [Hydrator](core.hydrator.md)

Defined in: [packages/core/src/hydration/Hydrator.ts:34](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/hydration/Hydrator.ts#L34)

___

### hydrate

▸ **hydrate**<T\>(`entity`: T, `meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `factory`: [*EntityFactory*](core.entityfactory.md), `type`: *reference* \| *full* \| *returning*, `newEntity?`: *boolean*, `convertCustomTypes?`: *boolean*): *void*

**`inheritdoc`** 

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`entity` | T | - |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> | - |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> | - |
`factory` | [*EntityFactory*](core.entityfactory.md) | - |
`type` | *reference* \| *full* \| *returning* | - |
`newEntity` | *boolean* | false |
`convertCustomTypes` | *boolean* | false |

**Returns:** *void*

Overrides: [Hydrator](core.hydrator.md)

Defined in: [packages/core/src/hydration/ObjectHydrator.ts:22](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/hydration/ObjectHydrator.ts#L22)

___

### hydrateProperty

▸ `Protected`**hydrateProperty**<T\>(`entity`: T, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `factory`: [*EntityFactory*](core.entityfactory.md), `newEntity?`: *boolean*, `convertCustomTypes?`: *boolean*): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`factory` | [*EntityFactory*](core.entityfactory.md) |
`newEntity?` | *boolean* |
`convertCustomTypes?` | *boolean* |

**Returns:** *void*

Inherited from: [Hydrator](core.hydrator.md)

Defined in: [packages/core/src/hydration/Hydrator.ts:47](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/hydration/Hydrator.ts#L47)

___

### hydrateReference

▸ **hydrateReference**<T\>(`entity`: T, `meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `factory`: [*EntityFactory*](core.entityfactory.md), `convertCustomTypes?`: *boolean*): *void*

**`inheritdoc`** 

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`entity` | T | - |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> | - |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> | - |
`factory` | [*EntityFactory*](core.entityfactory.md) | - |
`convertCustomTypes` | *boolean* | false |

**Returns:** *void*

Overrides: [Hydrator](core.hydrator.md)

Defined in: [packages/core/src/hydration/ObjectHydrator.ts:30](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/hydration/ObjectHydrator.ts#L30)
