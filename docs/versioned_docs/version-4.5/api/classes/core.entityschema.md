---
id: "core.entityschema"
title: "Class: EntitySchema<T, U>"
sidebar_label: "EntitySchema"
custom_edit_url: null
hide_title: true
---

# Class: EntitySchema<T, U\>

[core](../modules/core.md).EntitySchema

## Type parameters

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | [*AnyEntity*](../modules/core.md#anyentity) |
`U` | [*AnyEntity*](../modules/core.md#anyentity)<U\> \| *undefined* | *undefined* |

## Constructors

### constructor

\+ **new EntitySchema**<T, U\>(`meta`: *Omit*<Partial<[*EntityMetadata*](core.entitymetadata.md)<T\>\>, *name* \| *properties*\> & { `name`: *string*  } \| { `class`: [*Constructor*](../modules/core.md#constructor)<T\> ; `name?`: *string*  } & { `properties?`: { [K in string]-?: object & TypeDef<ExpandProperty<NonNullable<T[K]\>\>\> & ManyToOneOptions<ExpandProperty<NonNullable<T[K]\>\>, T\> \| object & TypeDef<ExpandProperty<NonNullable<T[K]\>\>\> & OneToOneOptions<ExpandProperty<NonNullable<T[K]\>\>, T\> \| object & TypeDef<ExpandProperty<NonNullable<T[K]\>\>\> & ReferenceOptions<ExpandProperty<NonNullable<T[K]\>\>, T\> & object \| object & TypeDef<ExpandProperty<NonNullable<T[K]\>\>\> & ManyToManyOptions<ExpandProperty<NonNullable<T[K]\>\>, T\> \| object & TypeDef<ExpandProperty<NonNullable<T[K]\>\>\> & EmbeddedOptions & PropertyOptions<T\> \| object & EnumOptions<T\> \| TypeDef<ExpandProperty<NonNullable<T[K]\>\>\> & PropertyOptions<T\>}  }): [*EntitySchema*](core.entityschema.md)<T, U\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | [*AnyEntity*](../modules/core.md#anyentity)<any\> |
`U` | *undefined* \| [*AnyEntity*](../modules/core.md#anyentity)<U\> | *undefined* |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | *Omit*<Partial<[*EntityMetadata*](core.entitymetadata.md)<T\>\>, *name* \| *properties*\> & { `name`: *string*  } \| { `class`: [*Constructor*](../modules/core.md#constructor)<T\> ; `name?`: *string*  } & { `properties?`: { [K in string]-?: object & TypeDef<ExpandProperty<NonNullable<T[K]\>\>\> & ManyToOneOptions<ExpandProperty<NonNullable<T[K]\>\>, T\> \| object & TypeDef<ExpandProperty<NonNullable<T[K]\>\>\> & OneToOneOptions<ExpandProperty<NonNullable<T[K]\>\>, T\> \| object & TypeDef<ExpandProperty<NonNullable<T[K]\>\>\> & ReferenceOptions<ExpandProperty<NonNullable<T[K]\>\>, T\> & object \| object & TypeDef<ExpandProperty<NonNullable<T[K]\>\>\> & ManyToManyOptions<ExpandProperty<NonNullable<T[K]\>\>, T\> \| object & TypeDef<ExpandProperty<NonNullable<T[K]\>\>\> & EmbeddedOptions & PropertyOptions<T\> \| object & EnumOptions<T\> \| TypeDef<ExpandProperty<NonNullable<T[K]\>\>\> & PropertyOptions<T\>}  } |

**Returns:** [*EntitySchema*](core.entityschema.md)<T, U\>

Defined in: [packages/core/src/metadata/EntitySchema.ts:32](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L32)

## Properties

### \_meta

• `Private` `Readonly` **\_meta**: [*EntityMetadata*](core.entitymetadata.md)<T\>

Defined in: [packages/core/src/metadata/EntitySchema.ts:30](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L30)

___

### initialized

• `Private` **initialized**: *boolean*= false

Defined in: [packages/core/src/metadata/EntitySchema.ts:32](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L32)

___

### internal

• `Private` **internal**: *boolean*= false

Defined in: [packages/core/src/metadata/EntitySchema.ts:31](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L31)

## Accessors

### meta

• get **meta**(): [*EntityMetadata*](core.entitymetadata.md)<T\>

**Returns:** [*EntityMetadata*](core.entitymetadata.md)<T\>

Defined in: [packages/core/src/metadata/EntitySchema.ts:218](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L218)

___

### name

• get **name**(): [*EntityName*](../modules/core.md#entityname)<T\>

**Returns:** [*EntityName*](../modules/core.md#entityname)<T\>

Defined in: [packages/core/src/metadata/EntitySchema.ts:222](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L222)

## Methods

### addEmbedded

▸ **addEmbedded**<K\>(`name`: *string* & keyof T, `options`: [*EmbeddedOptions*](../modules/core.md#embeddedoptions)): *void*

#### Type parameters:

Name | Default |
:------ | :------ |
`K` | *unknown* |

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* & keyof T |
`options` | [*EmbeddedOptions*](../modules/core.md#embeddedoptions) |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:119](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L119)

___

### addEnum

▸ **addEnum**(`name`: *string* & keyof T, `type?`: TypeType, `options?`: [*EnumOptions*](../interfaces/core.enumoptions.md)<T\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* & keyof T |
`type?` | TypeType |
`options` | [*EnumOptions*](../interfaces/core.enumoptions.md)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:86](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L86)

___

### addIndex

▸ **addIndex**<T\>(`options`: *Required*<Omit<[*IndexOptions*](../interfaces/core.indexoptions.md)<T\>, *name* \| *type* \| *options*\>\> & { `name?`: *string* ; `options?`: [*Dictionary*](../modules/core.md#dictionary)<any\> ; `type?`: *string*  }): *void*

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`options` | *Required*<Omit<[*IndexOptions*](../interfaces/core.indexoptions.md)<T\>, *name* \| *type* \| *options*\>\> & { `name?`: *string* ; `options?`: [*Dictionary*](../modules/core.md#dictionary)<any\> ; `type?`: *string*  } |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:190](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L190)

___

### addManyToMany

▸ **addManyToMany**<K\>(`name`: *string* & keyof T, `type`: TypeType, `options`: [*ManyToManyOptions*](../interfaces/core.manytomanyoptions.md)<K, T\>): *void*

#### Type parameters:

Name | Default |
:------ | :------ |
`K` | *unknown* |

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* & keyof T |
`type` | TypeType |
`options` | [*ManyToManyOptions*](../interfaces/core.manytomanyoptions.md)<K, T\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:149](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L149)

___

### addManyToOne

▸ **addManyToOne**<K\>(`name`: *string* & keyof T, `type`: TypeType, `options`: [*ManyToOneOptions*](../interfaces/core.manytooneoptions.md)<K, T\>): *void*

#### Type parameters:

Name | Default |
:------ | :------ |
`K` | *unknown* |

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* & keyof T |
`type` | TypeType |
`options` | [*ManyToOneOptions*](../interfaces/core.manytooneoptions.md)<K, T\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:134](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L134)

___

### addOneToMany

▸ **addOneToMany**<K\>(`name`: *string* & keyof T, `type`: TypeType, `options`: [*OneToManyOptions*](../modules/core.md#onetomanyoptions)<K, T\>): *void*

#### Type parameters:

Name | Default |
:------ | :------ |
`K` | *unknown* |

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* & keyof T |
`type` | TypeType |
`options` | [*OneToManyOptions*](../modules/core.md#onetomanyoptions)<K, T\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:164](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L164)

___

### addOneToOne

▸ **addOneToOne**<K\>(`name`: *string* & keyof T, `type`: TypeType, `options`: [*OneToOneOptions*](../interfaces/core.onetooneoptions.md)<K, T\>): *void*

#### Type parameters:

Name | Default |
:------ | :------ |
`K` | *unknown* |

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* & keyof T |
`type` | TypeType |
`options` | [*OneToOneOptions*](../interfaces/core.onetooneoptions.md)<K, T\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:169](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L169)

___

### addPrimaryKey

▸ **addPrimaryKey**(`name`: *string* & keyof T, `type`: TypeType, `options?`: [*PrimaryKeyOptions*](../interfaces/core.primarykeyoptions.md)<T\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* & keyof T |
`type` | TypeType |
`options` | [*PrimaryKeyOptions*](../interfaces/core.primarykeyoptions.md)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:110](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L110)

___

### addProperty

▸ **addProperty**(`name`: *string* & keyof T, `type?`: TypeType, `options?`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> \| [*PropertyOptions*](../modules/core.md#propertyoptions)<T\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* & keyof T |
`type?` | TypeType |
`options` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> \| [*PropertyOptions*](../modules/core.md#propertyoptions)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:53](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L53)

___

### addSerializedPrimaryKey

▸ **addSerializedPrimaryKey**(`name`: *string* & keyof T, `type`: TypeType, `options?`: [*SerializedPrimaryKeyOptions*](../interfaces/core.serializedprimarykeyoptions.md)<T\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* & keyof T |
`type` | TypeType |
`options` | [*SerializedPrimaryKeyOptions*](../interfaces/core.serializedprimarykeyoptions.md)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:114](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L114)

___

### addUnique

▸ **addUnique**<T\>(`options`: *Required*<Omit<[*UniqueOptions*](../interfaces/core.uniqueoptions.md)<T\>, *name* \| *options*\>\> & { `name?`: *string* ; `options?`: [*Dictionary*](../modules/core.md#dictionary)<any\>  }): *void*

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`options` | *Required*<Omit<[*UniqueOptions*](../interfaces/core.uniqueoptions.md)<T\>, *name* \| *options*\>\> & { `name?`: *string* ; `options?`: [*Dictionary*](../modules/core.md#dictionary)<any\>  } |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:194](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L194)

___

### addVersion

▸ **addVersion**(`name`: *string* & keyof T, `type`: TypeType, `options?`: [*PropertyOptions*](../modules/core.md#propertyoptions)<T\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* & keyof T |
`type` | TypeType |
`options` | [*PropertyOptions*](../modules/core.md#propertyoptions)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:106](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L106)

___

### createProperty

▸ `Private`**createProperty**<T\>(`reference`: [*ReferenceType*](../enums/core.referencetype.md), `options`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> \| [*PropertyOptions*](../modules/core.md#propertyoptions)<T\>): [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`reference` | [*ReferenceType*](../enums/core.referencetype.md) |
`options` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> \| [*PropertyOptions*](../modules/core.md#propertyoptions)<T\> |

**Returns:** [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>

Defined in: [packages/core/src/metadata/EntitySchema.ts:330](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L330)

___

### init

▸ **init**(): [*EntitySchema*](core.entityschema.md)<T, U\>

**`internal`** 

**Returns:** [*EntitySchema*](core.entityschema.md)<T, U\>

Defined in: [packages/core/src/metadata/EntitySchema.ts:229](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L229)

___

### initPrimaryKeys

▸ `Private`**initPrimaryKeys**(): *void*

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:290](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L290)

___

### initProperties

▸ `Private`**initProperties**(): *void*

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:254](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L254)

___

### normalizeType

▸ `Private`**normalizeType**(`options`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> \| [*PropertyOptions*](../modules/core.md#propertyoptions)<T\>, `type?`: *any*): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`options` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> \| [*PropertyOptions*](../modules/core.md#propertyoptions)<T\> |
`type?` | *any* |

**Returns:** *any*

Defined in: [packages/core/src/metadata/EntitySchema.ts:310](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L310)

___

### setClass

▸ **setClass**(`proto`: [*Constructor*](../modules/core.md#constructor)<T\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`proto` | [*Constructor*](../modules/core.md#constructor)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:206](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L206)

___

### setCustomRepository

▸ **setCustomRepository**(`repository`: () => [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](core.entityrepository.md)<T\>\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`repository` | () => [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](core.entityrepository.md)<T\>\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:198](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L198)

___

### setExtends

▸ **setExtends**(`base`: *string*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`base` | *string* |

**Returns:** *void*

Defined in: [packages/core/src/metadata/EntitySchema.ts:202](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L202)

___

### fromMetadata

▸ `Static`**fromMetadata**<T, U\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\> \| [*DeepPartial*](../modules/core.md#deeppartial)<[*EntityMetadata*](core.entitymetadata.md)<T\>\>): [*EntitySchema*](core.entityschema.md)<T, U\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | [*AnyEntity*](../modules/core.md#anyentity)<any\> |
`U` | *undefined* \| [*AnyEntity*](../modules/core.md#anyentity)<U\> | *undefined* |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> \| [*DeepPartial*](../modules/core.md#deeppartial)<[*EntityMetadata*](core.entitymetadata.md)<T\>\> |

**Returns:** [*EntitySchema*](core.entityschema.md)<T, U\>

Defined in: [packages/core/src/metadata/EntitySchema.ts:46](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/EntitySchema.ts#L46)
