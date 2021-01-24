---
id: "core.entityschema"
title: "Class: EntitySchema<T, U>"
sidebar_label: "EntitySchema"
hide_title: true
---

# Class: EntitySchema<T, U\>

[core](../modules/core.md).EntitySchema

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | [*AnyEntity*](../modules/core.md#anyentity) |
`U` | [*AnyEntity*](../modules/core.md#anyentity)<U\> \| *undefined* | *undefined* |

## Hierarchy

* **EntitySchema**

## Constructors

### constructor

\+ **new EntitySchema**<T, U\>(`meta`: *Metadata*<T, U\>): [*EntitySchema*](core.entityschema.md)<T, U\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | [*AnyEntity*](../modules/core.md#anyentity)<*any*\\> |
`U` | *undefined* \| [*AnyEntity*](../modules/core.md#anyentity)<U\> | *undefined* |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | *Metadata*<T, U\> |

**Returns:** [*EntitySchema*](core.entityschema.md)<T, U\>

Defined in: [packages/core/src/metadata/EntitySchema.ts:32](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L32)

## Properties

### \_meta

• `Private` `Readonly` **\_meta**: [*EntityMetadata*](core.entitymetadata.md)<T\>

Defined in: [packages/core/src/metadata/EntitySchema.ts:30](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L30)

___

### initialized

• `Private` **initialized**: *boolean*= false

Defined in: [packages/core/src/metadata/EntitySchema.ts:32](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L32)

___

### internal

• `Private` **internal**: *boolean*= false

Defined in: [packages/core/src/metadata/EntitySchema.ts:31](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L31)

## Accessors

### meta

• **meta**(): [*EntityMetadata*](core.entitymetadata.md)<T\>

**Returns:** [*EntityMetadata*](core.entitymetadata.md)<T\>

Defined in: [packages/core/src/metadata/EntitySchema.ts:207](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L207)

___

### name

• **name**(): [*EntityName*](../modules/core.md#entityname)<T\>

**Returns:** [*EntityName*](../modules/core.md#entityname)<T\>

Defined in: [packages/core/src/metadata/EntitySchema.ts:211](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L211)

## Methods

### addEmbedded

▸ **addEmbedded**<K\>(`name`: *string* & keyof T, `options`: [*EmbeddedOptions*](../modules/core.md#embeddedoptions)): *void*

#### Type parameters:

Name | Default |
------ | ------ |
`K` | *unknown* |

#### Parameters:

Name | Type |
------ | ------ |
`name` | *string* & keyof T |
`options` | [*EmbeddedOptions*](../modules/core.md#embeddedoptions) |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:113](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L113)

___

### addEnum

▸ **addEnum**(`name`: *string* & keyof T, `type?`: *string* \| NumberConstructor \| StringConstructor \| BooleanConstructor \| DateConstructor \| ArrayConstructor \| [*Constructor*](../modules/core.md#constructor)<[*Type*](core.type.md)<*any*, *any*\>\>, `options?`: [*EnumOptions*](../interfaces/core.enumoptions.md)<T\>): *void*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`name` | *string* & keyof T | - |
`type?` | *string* \| NumberConstructor \| StringConstructor \| BooleanConstructor \| DateConstructor \| ArrayConstructor \| [*Constructor*](../modules/core.md#constructor)<[*Type*](core.type.md)<*any*, *any*\>\> | - |
`options` | [*EnumOptions*](../interfaces/core.enumoptions.md)<T\> | ... |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:85](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L85)

___

### addIndex

▸ **addIndex**<T\>(`options`: *Required*<*Pick*<[*IndexOptions*](../interfaces/core.indexoptions.md)<T\>, *properties*\>\> & { `name?`: *undefined* \| *string* ; `options?`: *undefined* \| [*Dictionary*](../modules/core.md#dictionary)<*any*\> ; `type?`: *undefined* \| *string*  }): *void*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`options` | *Required*<*Pick*<[*IndexOptions*](../interfaces/core.indexoptions.md)<T\>, *properties*\>\> & { `name?`: *undefined* \| *string* ; `options?`: *undefined* \| [*Dictionary*](../modules/core.md#dictionary)<*any*\> ; `type?`: *undefined* \| *string*  } |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:179](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L179)

___

### addManyToMany

▸ **addManyToMany**<K\>(`name`: *string* & keyof T, `type`: TypeType, `options`: [*ManyToManyOptions*](../interfaces/core.manytomanyoptions.md)<K, T\>): *void*

#### Type parameters:

Name | Default |
------ | ------ |
`K` | *unknown* |

#### Parameters:

Name | Type |
------ | ------ |
`name` | *string* & keyof T |
`type` | TypeType |
`options` | [*ManyToManyOptions*](../interfaces/core.manytomanyoptions.md)<K, T\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:138](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L138)

___

### addManyToOne

▸ **addManyToOne**<K\>(`name`: *string* & keyof T, `type`: TypeType, `options`: [*ManyToOneOptions*](../interfaces/core.manytooneoptions.md)<K, T\>): *void*

#### Type parameters:

Name | Default |
------ | ------ |
`K` | *unknown* |

#### Parameters:

Name | Type |
------ | ------ |
`name` | *string* & keyof T |
`type` | TypeType |
`options` | [*ManyToOneOptions*](../interfaces/core.manytooneoptions.md)<K, T\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:123](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L123)

___

### addOneToMany

▸ **addOneToMany**<K\>(`name`: *string* & keyof T, `type`: TypeType, `options`: [*OneToManyOptions*](../modules/core.md#onetomanyoptions)<K, T\>): *void*

#### Type parameters:

Name | Default |
------ | ------ |
`K` | *unknown* |

#### Parameters:

Name | Type |
------ | ------ |
`name` | *string* & keyof T |
`type` | TypeType |
`options` | [*OneToManyOptions*](../modules/core.md#onetomanyoptions)<K, T\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:153](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L153)

___

### addOneToOne

▸ **addOneToOne**<K\>(`name`: *string* & keyof T, `type`: TypeType, `options`: [*OneToOneOptions*](../interfaces/core.onetooneoptions.md)<K, T\>): *void*

#### Type parameters:

Name | Default |
------ | ------ |
`K` | *unknown* |

#### Parameters:

Name | Type |
------ | ------ |
`name` | *string* & keyof T |
`type` | TypeType |
`options` | [*OneToOneOptions*](../interfaces/core.onetooneoptions.md)<K, T\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:158](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L158)

___

### addPrimaryKey

▸ **addPrimaryKey**(`name`: *string* & keyof T, `type`: TypeType, `options?`: [*PrimaryKeyOptions*](../interfaces/core.primarykeyoptions.md)<T\>): *void*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`name` | *string* & keyof T | - |
`type` | TypeType | - |
`options` | [*PrimaryKeyOptions*](../interfaces/core.primarykeyoptions.md)<T\> | ... |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:104](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L104)

___

### addProperty

▸ **addProperty**(`name`: *string* & keyof T, `type?`: *string* \| NumberConstructor \| StringConstructor \| BooleanConstructor \| DateConstructor \| ArrayConstructor \| [*Constructor*](../modules/core.md#constructor)<[*Type*](core.type.md)<*any*, *any*\>\>, `options?`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> \| [*PropertyOptions*](../modules/core.md#propertyoptions)<T\>): *void*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`name` | *string* & keyof T | - |
`type?` | *string* \| NumberConstructor \| StringConstructor \| BooleanConstructor \| DateConstructor \| ArrayConstructor \| [*Constructor*](../modules/core.md#constructor)<[*Type*](core.type.md)<*any*, *any*\>\> | - |
`options` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> \| [*PropertyOptions*](../modules/core.md#propertyoptions)<T\> | ... |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:53](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L53)

___

### addSerializedPrimaryKey

▸ **addSerializedPrimaryKey**(`name`: *string* & keyof T, `type`: TypeType, `options?`: [*SerializedPrimaryKeyOptions*](../interfaces/core.serializedprimarykeyoptions.md)<T\>): *void*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`name` | *string* & keyof T | - |
`type` | TypeType | - |
`options` | [*SerializedPrimaryKeyOptions*](../interfaces/core.serializedprimarykeyoptions.md)<T\> | ... |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:108](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L108)

___

### addUnique

▸ **addUnique**<T\>(`options`: *Required*<*Pick*<[*UniqueOptions*](../interfaces/core.uniqueoptions.md)<T\>, *properties*\>\> & { `name?`: *undefined* \| *string* ; `options?`: *undefined* \| [*Dictionary*](../modules/core.md#dictionary)<*any*\>  }): *void*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`options` | *Required*<*Pick*<[*UniqueOptions*](../interfaces/core.uniqueoptions.md)<T\>, *properties*\>\> & { `name?`: *undefined* \| *string* ; `options?`: *undefined* \| [*Dictionary*](../modules/core.md#dictionary)<*any*\>  } |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:183](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L183)

___

### addVersion

▸ **addVersion**(`name`: *string* & keyof T, `type`: TypeType, `options?`: [*PropertyOptions*](../modules/core.md#propertyoptions)<T\>): *void*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`name` | *string* & keyof T | - |
`type` | TypeType | - |
`options` | [*PropertyOptions*](../modules/core.md#propertyoptions)<T\> | ... |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:100](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L100)

___

### createProperty

▸ `Private`**createProperty**<T\>(`reference`: [*ReferenceType*](../enums/core.referencetype.md), `options`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> \| [*PropertyOptions*](../modules/core.md#propertyoptions)<T\>): [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`reference` | [*ReferenceType*](../enums/core.referencetype.md) |
`options` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> \| [*PropertyOptions*](../modules/core.md#propertyoptions)<T\> |

**Returns:** [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>

Defined in: [packages/core/src/metadata/EntitySchema.ts:319](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L319)

___

### init

▸ **init**(): [*EntitySchema*](core.entityschema.md)<T, U\>

**`internal`** 

**Returns:** [*EntitySchema*](core.entityschema.md)<T, U\>

Defined in: [packages/core/src/metadata/EntitySchema.ts:218](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L218)

___

### initPrimaryKeys

▸ `Private`**initPrimaryKeys**(): *void*

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:279](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L279)

___

### initProperties

▸ `Private`**initProperties**(): *void*

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:243](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L243)

___

### normalizeType

▸ `Private`**normalizeType**(`options`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> \| [*PropertyOptions*](../modules/core.md#propertyoptions)<T\>, `type?`: *any*): *any*

#### Parameters:

Name | Type |
------ | ------ |
`options` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> \| [*PropertyOptions*](../modules/core.md#propertyoptions)<T\> |
`type?` | *any* |

**Returns:** *any*

Defined in: [packages/core/src/metadata/EntitySchema.ts:299](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L299)

___

### setClass

▸ **setClass**(`proto`: [*Constructor*](../modules/core.md#constructor)<T\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`proto` | [*Constructor*](../modules/core.md#constructor)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:195](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L195)

___

### setCustomRepository

▸ **setCustomRepository**(`repository`: () => [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](core.entityrepository.md)<T\>\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`repository` | () => [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](core.entityrepository.md)<T\>\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:187](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L187)

___

### setExtends

▸ **setExtends**(`base`: *string*): *void*

#### Parameters:

Name | Type |
------ | ------ |
`base` | *string* |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:191](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L191)

___

### fromMetadata

▸ `Static`**fromMetadata**<T, U\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\> \| [*DeepPartial*](../modules/core.md#deeppartial)<[*EntityMetadata*](core.entitymetadata.md)<T\>\>): [*EntitySchema*](core.entityschema.md)<T, U\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | [*AnyEntity*](../modules/core.md#anyentity)<*any*\\> |
`U` | *undefined* \| [*AnyEntity*](../modules/core.md#anyentity)<U\> | *undefined* |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> \| [*DeepPartial*](../modules/core.md#deeppartial)<[*EntityMetadata*](core.entitymetadata.md)<T\>\> |

**Returns:** [*EntitySchema*](core.entityschema.md)<T, U\>

Defined in: [packages/core/src/metadata/EntitySchema.ts:46](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/EntitySchema.ts#L46)
