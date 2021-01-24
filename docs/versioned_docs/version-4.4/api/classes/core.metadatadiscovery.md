---
id: "core.metadatadiscovery"
title: "Class: MetadataDiscovery"
sidebar_label: "MetadataDiscovery"
hide_title: true
---

# Class: MetadataDiscovery

[core](../modules/core.md).MetadataDiscovery

## Hierarchy

* **MetadataDiscovery**

## Constructors

### constructor

\+ **new MetadataDiscovery**(`metadata`: [*MetadataStorage*](core.metadatastorage.md), `platform`: [*Platform*](core.platform.md), `config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>): [*MetadataDiscovery*](core.metadatadiscovery.md)

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |
`platform` | [*Platform*](core.platform.md) |
`config` | [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |

**Returns:** [*MetadataDiscovery*](core.metadatadiscovery.md)

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:24](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L24)

## Properties

### cache

• `Private` `Readonly` **cache**: [*CacheAdapter*](../interfaces/core.cacheadapter.md)

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:20](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L20)

___

### discovered

• `Private` `Readonly` **discovered**: [*EntityMetadata*](core.entitymetadata.md)<*any*\>[]

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:24](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L24)

___

### logger

• `Private` `Readonly` **logger**: [*Logger*](core.logger.md)

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:21](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L21)

___

### metadataProvider

• `Private` `Readonly` **metadataProvider**: [*MetadataProvider*](core.metadataprovider.md)

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:19](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L19)

___

### namingStrategy

• `Private` `Readonly` **namingStrategy**: [*NamingStrategy*](../interfaces/core.namingstrategy.md)

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:18](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L18)

___

### schemaHelper

• `Private` `Readonly` **schemaHelper**: *undefined* \| { `getTypeDefinition`: (`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `types?`: [*Dictionary*](../modules/core.md#dictionary)<*string*[]\>, `lengths?`: [*Dictionary*](../modules/core.md#dictionary)<*number*\>, `allowZero?`: *boolean*) => *string*  }

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:22](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L22)

___

### validator

• `Private` `Readonly` **validator**: [*MetadataValidator*](core.metadatavalidator.md)

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:23](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L23)

## Methods

### applyNamingStrategy

▸ `Private`**applyNamingStrategy**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:250](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L250)

___

### autoWireBidirectionalProperties

▸ `Private`**autoWireBidirectionalProperties**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:505](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L505)

___

### createDiscriminatorProperty

▸ `Private`**createDiscriminatorProperty**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:663](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L663)

___

### defineBaseEntityProperties

▸ `Private`**defineBaseEntityProperties**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>): *number*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |

**Returns:** *number*

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:518](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L518)

___

### defineFixedOrderProperty

▸ `Private`**defineFixedOrderProperty**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:440](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L440)

___

### definePivotProperty

▸ `Private`**definePivotProperty**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `name`: *string*, `type`: *string*, `inverse`: *string*, `owner`: *boolean*): [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`name` | *string* |
`type` | *string* |
`inverse` | *string* |
`owner` | *boolean* |

**Returns:** [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:463](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L463)

___

### definePivotTableEntity

▸ `Private`**definePivotTableEntity**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): [*EntityMetadata*](core.entitymetadata.md)<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** [*EntityMetadata*](core.entitymetadata.md)<*any*\>

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:405](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L405)

___

### discover

▸ **discover**(`preferTsNode?`: *boolean*): *Promise*<[*MetadataStorage*](core.metadatastorage.md)\>

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`preferTsNode` | *boolean* | true |

**Returns:** *Promise*<[*MetadataStorage*](core.metadatastorage.md)\>

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:30](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L30)

___

### discoverDirectories

▸ `Private`**discoverDirectories**(`paths`: *string*[]): *Promise*<*void*\>

#### Parameters:

Name | Type |
------ | ------ |
`paths` | *string*[] |

**Returns:** *Promise*<*void*\>

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:99](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L99)

___

### discoverEntity

▸ `Private`**discoverEntity**<T\>(`entity`: *EntityClass*<T\> \| *EntityClassGroup*<T\> \| [*EntitySchema*](core.entityschema.md)<T, *undefined*\>, `path?`: *string*): *Promise*<*void*\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | *EntityClass*<T\> \| *EntityClassGroup*<T\> \| [*EntitySchema*](core.entityschema.md)<T, *undefined*\> |
`path?` | *string* |

**Returns:** *Promise*<*void*\>

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:202](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L202)

___

### discoverReferences

▸ `Private`**discoverReferences**(`refs`: [*Constructor*](../modules/core.md#constructor)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>[]): *Promise*<*void*\>

#### Parameters:

Name | Type |
------ | ------ |
`refs` | [*Constructor*](../modules/core.md#constructor)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>[] |

**Returns:** *Promise*<*void*\>

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:148](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L148)

___

### findEntities

▸ `Private`**findEntities**(`preferTsNode`: *boolean*): *Promise*<[*EntityMetadata*](core.entitymetadata.md)<*any*\>[]\>

#### Parameters:

Name | Type |
------ | ------ |
`preferTsNode` | *boolean* |

**Returns:** *Promise*<[*EntityMetadata*](core.entitymetadata.md)<*any*\>[]\>

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:68](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L68)

___

### getDefaultVersionValue

▸ `Private`**getDefaultVersionValue**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): *string*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** *string*

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:673](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L673)

___

### getEntityClassOrSchema

▸ `Private`**getEntityClassOrSchema**(`path`: *string*, `name`: *string*): *any*[]

#### Parameters:

Name | Type |
------ | ------ |
`path` | *string* |
`name` | *string* |

**Returns:** *any*[]

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:822](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L822)

___

### getSchema

▸ `Private`**getSchema**<T\>(`entity`: [*Constructor*](../modules/core.md#constructor)<T\> \| [*EntitySchema*](core.entityschema.md)<T, *undefined*\>): [*EntitySchema*](core.entityschema.md)<T, *undefined*\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [*Constructor*](../modules/core.md#constructor)<T\> \| [*EntitySchema*](core.entityschema.md)<T, *undefined*\> |

**Returns:** [*EntitySchema*](core.entityschema.md)<T, *undefined*\>

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:179](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L179)

___

### initColumnType

▸ `Private`**initColumnType**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `path?`: *string*): *void*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`path?` | *string* |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:755](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L755)

___

### initCustomType

▸ `Private`**initCustomType**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:709](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L709)

___

### initDefaultValue

▸ `Private`**initDefaultValue**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:686](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L686)

___

### initEmbeddables

▸ `Private`**initEmbeddables**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `embeddedProp`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `visited?`: *WeakSet*<[*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>\>): *void*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> | - |
`embeddedProp` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> | - |
`visited` | *WeakSet*<[*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>\> | ... |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:558](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L558)

___

### initEnumValues

▸ `Private`**initEnumValues**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `path`: *string*): *void*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`path` | *string* |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:793](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L793)

___

### initFactoryField

▸ `Private`**initFactoryField**<T\>(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>): *void*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:394](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L394)

___

### initFieldName

▸ `Private`**initFieldName**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:268](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L268)

___

### initManyToManyFieldName

▸ `Private`**initManyToManyFieldName**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `name`: *string*): *string*[]

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`name` | *string* |

**Returns:** *string*[]

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:297](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L297)

___

### initManyToManyFields

▸ `Private`**initManyToManyFields**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:302](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L302)

___

### initManyToOneFieldName

▸ `Private`**initManyToOneFieldName**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `name`: *string*): *string*[]

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`name` | *string* |

**Returns:** *string*[]

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:282](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L282)

___

### initManyToOneFields

▸ `Private`**initManyToOneFields**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:332](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L332)

___

### initOneToManyFields

▸ `Private`**initOneToManyFields**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:346](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L346)

___

### initRelation

▸ `Private`**initRelation**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:745](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L745)

___

### initSingleTableInheritance

▸ `Private`**initSingleTableInheritance**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `metadata`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>[]): *void*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`metadata` | [*EntityMetadata*](core.entitymetadata.md)<*any*\>[] |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:613](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L613)

___

### initUnsigned

▸ `Private`**initUnsigned**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:807](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L807)

___

### initVersionProperty

▸ `Private`**initVersionProperty**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:700](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L700)

___

### prepare

▸ `Private`**prepare**<T\>(`entity`: *EntityClass*<T\> \| *EntityClassGroup*<T\> \| [*EntitySchema*](core.entityschema.md)<T, *undefined*\>): *EntityClass*<T\> \| [*EntitySchema*](core.entityschema.md)<T, *undefined*\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | *EntityClass*<T\> \| *EntityClassGroup*<T\> \| [*EntitySchema*](core.entityschema.md)<T, *undefined*\> |

**Returns:** *EntityClass*<T\> \| [*EntitySchema*](core.entityschema.md)<T, *undefined*\>

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:163](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L163)

___

### processEntity

▸ `Private`**processEntity**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>): [*EntityMetadata*](core.entitymetadata.md)<*any*\>[]

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |

**Returns:** [*EntityMetadata*](core.entitymetadata.md)<*any*\>[]

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:359](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L359)

___

### saveToCache

▸ `Private`**saveToCache**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>): *Promise*<*void*\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |

**Returns:** *Promise*<*void*\>

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:236](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L236)

___

### shouldForceConstructorUsage

▸ `Private`**shouldForceConstructorUsage**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>): *boolean*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |

**Returns:** *boolean*

Defined in: [packages/core/src/metadata/MetadataDiscovery.ts:853](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataDiscovery.ts#L853)
