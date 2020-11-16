---
id: "hydrator"
title: "Class: Hydrator"
sidebar_label: "Hydrator"
---

## Hierarchy

* **Hydrator**

  ↳ [ObjectHydrator](objecthydrator.md)

## Implements

* [IHydrator](../interfaces/ihydrator.md)

## Constructors

### constructor

\+ **new Hydrator**(`metadata`: [MetadataStorage](metadatastorage.md), `platform`: [Platform](platform.md), `config`: [Configuration](configuration.md)): [Hydrator](hydrator.md)

*Defined in [packages/core/src/hydration/Hydrator.ts:8](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/hydration/Hydrator.ts#L8)*

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | [MetadataStorage](metadatastorage.md) |
`platform` | [Platform](platform.md) |
`config` | [Configuration](configuration.md) |

**Returns:** [Hydrator](hydrator.md)

## Properties

### config

• `Protected` `Readonly` **config**: [Configuration](configuration.md)

*Defined in [packages/core/src/hydration/Hydrator.ts:12](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/hydration/Hydrator.ts#L12)*

___

### metadata

• `Protected` `Readonly` **metadata**: [MetadataStorage](metadatastorage.md)

*Defined in [packages/core/src/hydration/Hydrator.ts:10](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/hydration/Hydrator.ts#L10)*

___

### platform

• `Protected` `Readonly` **platform**: [Platform](platform.md)

*Defined in [packages/core/src/hydration/Hydrator.ts:11](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/hydration/Hydrator.ts#L11)*

## Methods

### getProperties

▸ `Protected`**getProperties**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `type`: &#34;full&#34; \| &#34;returning&#34; \| &#34;reference&#34;): [EntityProperty](../interfaces/entityproperty.md)&#60;T>[]

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

*Defined in [packages/core/src/hydration/Hydrator.ts:17](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/hydration/Hydrator.ts#L17)*

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

*Defined in [packages/core/src/hydration/Hydrator.ts:28](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/hydration/Hydrator.ts#L28)*

Hydrates primary keys only

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`data` | [EntityData](../index.md#entitydata)&#60;T> |
`factory` | [EntityFactory](entityfactory.md) |
`convertCustomTypes?` | boolean |

**Returns:** void
