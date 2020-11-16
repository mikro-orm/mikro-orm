---
id: "metadatadiscovery"
title: "Class: MetadataDiscovery"
sidebar_label: "MetadataDiscovery"
---

## Hierarchy

* **MetadataDiscovery**

## Constructors

### constructor

\+ **new MetadataDiscovery**(`metadata`: [MetadataStorage](metadatastorage.md), `platform`: [Platform](platform.md), `config`: [Configuration](configuration.md)): [MetadataDiscovery](metadatadiscovery.md)

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:24](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L24)*

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | [MetadataStorage](metadatastorage.md) |
`platform` | [Platform](platform.md) |
`config` | [Configuration](configuration.md) |

**Returns:** [MetadataDiscovery](metadatadiscovery.md)

## Properties

### cache

• `Private` `Readonly` **cache**: [CacheAdapter](../interfaces/cacheadapter.md) = this.config.getCacheAdapter()

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:20](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L20)*

___

### config

• `Private` `Readonly` **config**: [Configuration](configuration.md)

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:28](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L28)*

___

### discovered

• `Private` `Readonly` **discovered**: [EntityMetadata](entitymetadata.md)[] = []

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:24](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L24)*

___

### logger

• `Private` `Readonly` **logger**: [Logger](logger.md) = this.config.getLogger()

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:21](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L21)*

___

### metadata

• `Private` `Readonly` **metadata**: [MetadataStorage](metadatastorage.md)

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:26](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L26)*

___

### metadataProvider

• `Private` `Readonly` **metadataProvider**: [MetadataProvider](metadataprovider.md) = this.config.getMetadataProvider()

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:19](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L19)*

___

### namingStrategy

• `Private` `Readonly` **namingStrategy**: [NamingStrategy](../interfaces/namingstrategy.md) = this.config.getNamingStrategy()

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:18](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L18)*

___

### platform

• `Private` `Readonly` **platform**: [Platform](platform.md)

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:27](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L27)*

___

### schemaHelper

• `Private` `Readonly` **schemaHelper**: { getTypeDefinition: (prop: [EntityProperty](../interfaces/entityproperty.md), types?: [Dictionary](../index.md#dictionary)&#60;string[]>, lengths?: [Dictionary](../index.md#dictionary)&#60;number>, allowZero?: boolean) => string  } = this.platform.getSchemaHelper()

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:22](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L22)*

#### Type declaration:

Name | Type |
------ | ------ |
`getTypeDefinition` | (prop: [EntityProperty](../interfaces/entityproperty.md), types?: [Dictionary](../index.md#dictionary)&#60;string[]>, lengths?: [Dictionary](../index.md#dictionary)&#60;number>, allowZero?: boolean) => string |

___

### validator

• `Private` `Readonly` **validator**: [MetadataValidator](metadatavalidator.md) = new MetadataValidator()

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:23](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L23)*

## Methods

### applyNamingStrategy

▸ `Private`**applyNamingStrategy**(`meta`: [EntityMetadata](entitymetadata.md), `prop`: [EntityProperty](../interfaces/entityproperty.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:237](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L237)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** void

___

### autoWireBidirectionalProperties

▸ `Private`**autoWireBidirectionalProperties**(`meta`: [EntityMetadata](entitymetadata.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:492](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L492)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |

**Returns:** void

___

### createDiscriminatorProperty

▸ `Private`**createDiscriminatorProperty**(`meta`: [EntityMetadata](entitymetadata.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:626](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L626)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |

**Returns:** void

___

### defineBaseEntityProperties

▸ `Private`**defineBaseEntityProperties**(`meta`: [EntityMetadata](entitymetadata.md)): number

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:505](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L505)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |

**Returns:** number

___

### defineFixedOrderProperty

▸ `Private`**defineFixedOrderProperty**(`prop`: [EntityProperty](../interfaces/entityproperty.md)): [EntityProperty](../interfaces/entityproperty.md)

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:427](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L427)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** [EntityProperty](../interfaces/entityproperty.md)

___

### definePivotProperty

▸ `Private`**definePivotProperty**(`prop`: [EntityProperty](../interfaces/entityproperty.md), `name`: string, `type`: string, `inverse`: string, `owner`: boolean): [EntityProperty](../interfaces/entityproperty.md)

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:450](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L450)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`name` | string |
`type` | string |
`inverse` | string |
`owner` | boolean |

**Returns:** [EntityProperty](../interfaces/entityproperty.md)

___

### definePivotTableEntity

▸ `Private`**definePivotTableEntity**(`meta`: [EntityMetadata](entitymetadata.md), `prop`: [EntityProperty](../interfaces/entityproperty.md)): [EntityMetadata](entitymetadata.md)

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:392](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L392)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** [EntityMetadata](entitymetadata.md)

___

### discover

▸ **discover**(`preferTsNode?`: boolean): Promise&#60;[MetadataStorage](metadatastorage.md)>

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:30](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L30)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`preferTsNode` | boolean | true |

**Returns:** Promise&#60;[MetadataStorage](metadatastorage.md)>

___

### discoverDirectories

▸ `Private`**discoverDirectories**(`paths`: string[]): Promise&#60;void>

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:86](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L86)*

#### Parameters:

Name | Type |
------ | ------ |
`paths` | string[] |

**Returns:** Promise&#60;void>

___

### discoverEntity

▸ `Private`**discoverEntity**&#60;T>(`entity`: [EntityClass](../index.md#entityclass)&#60;T> \| [EntityClassGroup](../index.md#entityclassgroup)&#60;T> \| [EntitySchema](entityschema.md)&#60;T>, `path?`: string): Promise&#60;void>

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:189](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L189)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [EntityClass](../index.md#entityclass)&#60;T> \| [EntityClassGroup](../index.md#entityclassgroup)&#60;T> \| [EntitySchema](entityschema.md)&#60;T> |
`path?` | string |

**Returns:** Promise&#60;void>

___

### discoverReferences

▸ `Private`**discoverReferences**(`refs`: [Constructor](../index.md#constructor)&#60;[AnyEntity](../index.md#anyentity)>[]): Promise&#60;void>

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:135](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L135)*

#### Parameters:

Name | Type |
------ | ------ |
`refs` | [Constructor](../index.md#constructor)&#60;[AnyEntity](../index.md#anyentity)>[] |

**Returns:** Promise&#60;void>

___

### findEntities

▸ `Private`**findEntities**(`preferTsNode`: boolean): Promise&#60;[EntityMetadata](entitymetadata.md)[]>

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:68](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L68)*

#### Parameters:

Name | Type |
------ | ------ |
`preferTsNode` | boolean |

**Returns:** Promise&#60;[EntityMetadata](entitymetadata.md)[]>

___

### getDefaultVersionValue

▸ `Private`**getDefaultVersionValue**(`prop`: [EntityProperty](../interfaces/entityproperty.md)): string

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:636](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L636)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** string

___

### getEntityClassOrSchema

▸ `Private`**getEntityClassOrSchema**(`path`: string, `name`: string): any[]

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:783](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L783)*

#### Parameters:

Name | Type |
------ | ------ |
`path` | string |
`name` | string |

**Returns:** any[]

___

### getSchema

▸ `Private`**getSchema**&#60;T>(`entity`: [Constructor](../index.md#constructor)&#60;T> \| [EntitySchema](entityschema.md)&#60;T>): [EntitySchema](entityschema.md)&#60;T>

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:166](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L166)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [Constructor](../index.md#constructor)&#60;T> \| [EntitySchema](entityschema.md)&#60;T> |

**Returns:** [EntitySchema](entityschema.md)&#60;T>

___

### initColumnType

▸ `Private`**initColumnType**(`prop`: [EntityProperty](../interfaces/entityproperty.md), `path?`: string): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:718](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L718)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`path?` | string |

**Returns:** void

___

### initCustomType

▸ `Private`**initCustomType**(`prop`: [EntityProperty](../interfaces/entityproperty.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:672](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L672)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** void

___

### initDefaultValue

▸ `Private`**initDefaultValue**(`prop`: [EntityProperty](../interfaces/entityproperty.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:649](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L649)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** void

___

### initEmbeddables

▸ `Private`**initEmbeddables**(`meta`: [EntityMetadata](entitymetadata.md), `embeddedProp`: [EntityProperty](../interfaces/entityproperty.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:545](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L545)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`embeddedProp` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** void

___

### initEnumValues

▸ `Private`**initEnumValues**(`prop`: [EntityProperty](../interfaces/entityproperty.md), `path`: string): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:754](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L754)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`path` | string |

**Returns:** void

___

### initFactoryField

▸ `Private`**initFactoryField**&#60;T>(`prop`: [EntityProperty](../interfaces/entityproperty.md)&#60;T>): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:381](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L381)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md)&#60;T> |

**Returns:** void

___

### initFieldName

▸ `Private`**initFieldName**(`prop`: [EntityProperty](../interfaces/entityproperty.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:255](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L255)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** void

___

### initManyToManyFieldName

▸ `Private`**initManyToManyFieldName**(`prop`: [EntityProperty](../interfaces/entityproperty.md), `name`: string): string[]

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:284](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L284)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`name` | string |

**Returns:** string[]

___

### initManyToManyFields

▸ `Private`**initManyToManyFields**(`meta`: [EntityMetadata](entitymetadata.md), `prop`: [EntityProperty](../interfaces/entityproperty.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:289](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L289)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** void

___

### initManyToOneFieldName

▸ `Private`**initManyToOneFieldName**(`prop`: [EntityProperty](../interfaces/entityproperty.md), `name`: string): string[]

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:269](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L269)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`name` | string |

**Returns:** string[]

___

### initManyToOneFields

▸ `Private`**initManyToOneFields**(`prop`: [EntityProperty](../interfaces/entityproperty.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:319](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L319)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** void

___

### initOneToManyFields

▸ `Private`**initOneToManyFields**(`prop`: [EntityProperty](../interfaces/entityproperty.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:333](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L333)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** void

___

### initRelation

▸ `Private`**initRelation**(`prop`: [EntityProperty](../interfaces/entityproperty.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:708](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L708)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** void

___

### initSingleTableInheritance

▸ `Private`**initSingleTableInheritance**(`meta`: [EntityMetadata](entitymetadata.md), `metadata`: [EntityMetadata](entitymetadata.md)[]): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:576](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L576)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`metadata` | [EntityMetadata](entitymetadata.md)[] |

**Returns:** void

___

### initUnsigned

▸ `Private`**initUnsigned**(`prop`: [EntityProperty](../interfaces/entityproperty.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:768](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L768)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** void

___

### initVersionProperty

▸ `Private`**initVersionProperty**(`meta`: [EntityMetadata](entitymetadata.md), `prop`: [EntityProperty](../interfaces/entityproperty.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:663](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L663)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** void

___

### prepare

▸ `Private`**prepare**&#60;T>(`entity`: [EntityClass](../index.md#entityclass)&#60;T> \| [EntityClassGroup](../index.md#entityclassgroup)&#60;T> \| [EntitySchema](entityschema.md)&#60;T>): [EntityClass](../index.md#entityclass)&#60;T> \| [EntitySchema](entityschema.md)&#60;T>

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:150](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L150)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [EntityClass](../index.md#entityclass)&#60;T> \| [EntityClassGroup](../index.md#entityclassgroup)&#60;T> \| [EntitySchema](entityschema.md)&#60;T> |

**Returns:** [EntityClass](../index.md#entityclass)&#60;T> \| [EntitySchema](entityschema.md)&#60;T>

___

### processEntity

▸ `Private`**processEntity**(`meta`: [EntityMetadata](entitymetadata.md)): [EntityMetadata](entitymetadata.md)[]

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:346](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L346)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |

**Returns:** [EntityMetadata](entitymetadata.md)[]

___

### saveToCache

▸ `Private`**saveToCache**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)): Promise&#60;void>

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:223](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataDiscovery.ts#L223)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |

**Returns:** Promise&#60;void>
