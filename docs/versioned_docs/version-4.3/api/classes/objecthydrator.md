---
id: "objecthydrator"
title: "Class: ObjectHydrator"
sidebar_label: "ObjectHydrator"
---

## Hierarchy

* [Hydrator](hydrator.md)

  ↳ **ObjectHydrator**

## Implements

* [IHydrator](../interfaces/ihydrator.md)

## Constructors

### constructor

\+ **new ObjectHydrator**(`metadata`: [MetadataStorage](metadatastorage.md), `platform`: [Platform](platform.md), `config`: [Configuration](configuration.md)): [ObjectHydrator](objecthydrator.md)

*Inherited from [Hydrator](hydrator.md).[constructor](hydrator.md#constructor)*

*Defined in [packages/core/src/hydration/Hydrator.ts:8](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/hydration/Hydrator.ts#L8)*

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | [MetadataStorage](metadatastorage.md) |
`platform` | [Platform](platform.md) |
`config` | [Configuration](configuration.md) |

**Returns:** [ObjectHydrator](objecthydrator.md)

## Properties

### config

• `Protected` `Readonly` **config**: [Configuration](configuration.md)

*Inherited from [Hydrator](hydrator.md).[config](hydrator.md#config)*

*Defined in [packages/core/src/hydration/Hydrator.ts:12](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/hydration/Hydrator.ts#L12)*

___

### metadata

• `Protected` `Readonly` **metadata**: [MetadataStorage](metadatastorage.md)

*Inherited from [Hydrator](hydrator.md).[metadata](hydrator.md#metadata)*

*Defined in [packages/core/src/hydration/Hydrator.ts:10](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/hydration/Hydrator.ts#L10)*

___

### platform

• `Protected` `Readonly` **platform**: [Platform](platform.md)

*Inherited from [Hydrator](hydrator.md).[platform](hydrator.md#platform)*

*Defined in [packages/core/src/hydration/Hydrator.ts:11](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/hydration/Hydrator.ts#L11)*

## Methods

### createCollectionItemMapper

▸ `Private`**createCollectionItemMapper**&#60;T>(`prop`: [EntityProperty](../interfaces/entityproperty.md)): string[]

*Defined in [packages/core/src/hydration/ObjectHydrator.ts:148](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/hydration/ObjectHydrator.ts#L148)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** string[]

___

### getEntityHydrator

▸ `Private`**getEntityHydrator**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `type`: &#34;full&#34; \| &#34;returning&#34; \| &#34;reference&#34;): [EntityHydrator](../index.md#entityhydrator)&#60;T>

*Defined in [packages/core/src/hydration/ObjectHydrator.ts:38](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/hydration/ObjectHydrator.ts#L38)*

**`internal`** Highly performance-sensitive method.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`type` | &#34;full&#34; \| &#34;returning&#34; \| &#34;reference&#34; |

**Returns:** [EntityHydrator](../index.md#entityhydrator)&#60;T>

___

### getProperties

▸ `Protected`**getProperties**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `type`: &#34;full&#34; \| &#34;returning&#34; \| &#34;reference&#34;): [EntityProperty](../interfaces/entityproperty.md)&#60;T>[]

*Inherited from [Hydrator](hydrator.md).[getProperties](hydrator.md#getproperties)*

*Defined in [packages/core/src/hydration/Hydrator.ts:34](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/hydration/Hydrator.ts#L34)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`type` | &#34;full&#34; \| &#34;returning&#34; \| &#34;reference&#34; |

**Returns:** [EntityProperty](../interfaces/entityproperty.md)&#60;T>[]

___

### hydrate

▸ **hydrate**&#60;T>(`entity`: T, `meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `data`: [EntityData](../index.md#entitydata)&#60;T>, `factory`: [EntityFactory](entityfactory.md), `type`: &#34;full&#34; \| &#34;returning&#34; \| &#34;reference&#34;, `newEntity?`: boolean, `convertCustomTypes?`: boolean): void

*Implementation of [IHydrator](../interfaces/ihydrator.md)*

*Overrides [Hydrator](hydrator.md).[hydrate](hydrator.md#hydrate)*

*Defined in [packages/core/src/hydration/ObjectHydrator.ts:22](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/hydration/ObjectHydrator.ts#L22)*

Hydrates the whole entity. This process handles custom type conversions, creating missing Collection instances,
mapping FKs to entity instances, as well as merging those entities.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entity` | T | - |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> | - |
`data` | [EntityData](../index.md#entitydata)&#60;T> | - |
`factory` | [EntityFactory](entityfactory.md) | - |
`type` | &#34;full&#34; \| &#34;returning&#34; \| &#34;reference&#34; | - |
`newEntity` | boolean | false |
`convertCustomTypes` | boolean | false |

**Returns:** void

___

### hydrateProperty

▸ `Protected`**hydrateProperty**&#60;T>(`entity`: T, `prop`: [EntityProperty](../interfaces/entityproperty.md), `data`: [EntityData](../index.md#entitydata)&#60;T>, `factory`: [EntityFactory](entityfactory.md), `newEntity?`: boolean, `convertCustomTypes?`: boolean): void

*Inherited from [Hydrator](hydrator.md).[hydrateProperty](hydrator.md#hydrateproperty)*

*Defined in [packages/core/src/hydration/Hydrator.ts:47](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/hydration/Hydrator.ts#L47)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`data` | [EntityData](../index.md#entitydata)&#60;T> |
`factory` | [EntityFactory](entityfactory.md) |
`newEntity?` | boolean |
`convertCustomTypes?` | boolean |

**Returns:** void

___

### hydrateReference

▸ **hydrateReference**&#60;T>(`entity`: T, `meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `data`: [EntityData](../index.md#entitydata)&#60;T>, `factory`: [EntityFactory](entityfactory.md), `convertCustomTypes?`: boolean): void

*Implementation of [IHydrator](../interfaces/ihydrator.md)*

*Overrides [Hydrator](hydrator.md).[hydrateReference](hydrator.md#hydratereference)*

*Defined in [packages/core/src/hydration/ObjectHydrator.ts:30](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/hydration/ObjectHydrator.ts#L30)*

Hydrates primary keys only

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entity` | T | - |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> | - |
`data` | [EntityData](../index.md#entitydata)&#60;T> | - |
`factory` | [EntityFactory](entityfactory.md) | - |
`convertCustomTypes` | boolean | false |

**Returns:** void

## Object literals

### hydrators

▪ `Private` `Readonly` **hydrators**: object

*Defined in [packages/core/src/hydration/ObjectHydrator.ts:13](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/hydration/ObjectHydrator.ts#L13)*

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`full` | Map&#60;string, [EntityHydrator](../index.md#entityhydrator)&#60;any>> | new Map&#60;string, EntityHydrator&#60;any>>() |
`reference` | Map&#60;string, [EntityHydrator](../index.md#entityhydrator)&#60;any>> | new Map&#60;string, EntityHydrator&#60;any>>() |
`returning` | Map&#60;string, [EntityHydrator](../index.md#entityhydrator)&#60;any>> | new Map&#60;string, EntityHydrator&#60;any>>() |
