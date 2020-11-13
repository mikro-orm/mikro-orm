---
id: "entityschema"
title: "Class: EntitySchema<T, U>"
sidebar_label: "EntitySchema"
---

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | AnyEntity |
`U` | [AnyEntity](../index.md#anyentity)&#60;U> \| undefined | undefined |

## Hierarchy

* **EntitySchema**

## Constructors

### constructor

\+ **new EntitySchema**(`meta`: [Metadata](../index.md#metadata)&#60;T, U>): [EntitySchema](entityschema.md)

*Defined in [packages/core/src/metadata/EntitySchema.ts:32](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L32)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [Metadata](../index.md#metadata)&#60;T, U> |

**Returns:** [EntitySchema](entityschema.md)

## Properties

### \_meta

• `Private` `Readonly` **\_meta**: [EntityMetadata](entitymetadata.md)&#60;T> = new EntityMetadata&#60;T>()

*Defined in [packages/core/src/metadata/EntitySchema.ts:30](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L30)*

___

### initialized

• `Private` **initialized**: boolean = false

*Defined in [packages/core/src/metadata/EntitySchema.ts:32](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L32)*

___

### internal

• `Private` **internal**: boolean = false

*Defined in [packages/core/src/metadata/EntitySchema.ts:31](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L31)*

## Accessors

### meta

• get **meta**(): [EntityMetadata](entitymetadata.md)&#60;T>

*Defined in [packages/core/src/metadata/EntitySchema.ts:207](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L207)*

**Returns:** [EntityMetadata](entitymetadata.md)&#60;T>

___

### name

• get **name**(): [EntityName](../index.md#entityname)&#60;T>

*Defined in [packages/core/src/metadata/EntitySchema.ts:211](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L211)*

**Returns:** [EntityName](../index.md#entityname)&#60;T>

## Methods

### addEmbedded

▸ **addEmbedded**&#60;K>(`name`: string & keyof T, `options`: [EmbeddedOptions](../index.md#embeddedoptions)): void

*Defined in [packages/core/src/metadata/EntitySchema.ts:113](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L113)*

#### Type parameters:

Name | Default |
------ | ------ |
`K` | unknown |

#### Parameters:

Name | Type |
------ | ------ |
`name` | string & keyof T |
`options` | [EmbeddedOptions](../index.md#embeddedoptions) |

**Returns:** void

___

### addEnum

▸ **addEnum**(`name`: string & keyof T, `type?`: [TypeType](../index.md#typetype), `options?`: [EnumOptions](../interfaces/enumoptions.md)&#60;T>): void

*Defined in [packages/core/src/metadata/EntitySchema.ts:85](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L85)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`name` | string & keyof T | - |
`type?` | [TypeType](../index.md#typetype) | - |
`options` | [EnumOptions](../interfaces/enumoptions.md)&#60;T> | {} |

**Returns:** void

___

### addIndex

▸ **addIndex**&#60;T>(`options`: Required&#60;Omit&#60;[IndexOptions](../interfaces/indexoptions.md)&#60;T>, &#34;name&#34; \| &#34;type&#34; \| &#34;options&#34;>> & { name?: string ; options?: [Dictionary](../index.md#dictionary) ; type?: string  }): void

*Defined in [packages/core/src/metadata/EntitySchema.ts:179](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L179)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`options` | Required&#60;Omit&#60;[IndexOptions](../interfaces/indexoptions.md)&#60;T>, &#34;name&#34; \| &#34;type&#34; \| &#34;options&#34;>> & { name?: string ; options?: [Dictionary](../index.md#dictionary) ; type?: string  } |

**Returns:** void

___

### addManyToMany

▸ **addManyToMany**&#60;K>(`name`: string & keyof T, `type`: [TypeType](../index.md#typetype), `options`: [ManyToManyOptions](../interfaces/manytomanyoptions.md)&#60;K, T>): void

*Defined in [packages/core/src/metadata/EntitySchema.ts:138](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L138)*

#### Type parameters:

Name | Default |
------ | ------ |
`K` | unknown |

#### Parameters:

Name | Type |
------ | ------ |
`name` | string & keyof T |
`type` | [TypeType](../index.md#typetype) |
`options` | [ManyToManyOptions](../interfaces/manytomanyoptions.md)&#60;K, T> |

**Returns:** void

___

### addManyToOne

▸ **addManyToOne**&#60;K>(`name`: string & keyof T, `type`: [TypeType](../index.md#typetype), `options`: [ManyToOneOptions](../interfaces/manytooneoptions.md)&#60;K, T>): void

*Defined in [packages/core/src/metadata/EntitySchema.ts:123](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L123)*

#### Type parameters:

Name | Default |
------ | ------ |
`K` | unknown |

#### Parameters:

Name | Type |
------ | ------ |
`name` | string & keyof T |
`type` | [TypeType](../index.md#typetype) |
`options` | [ManyToOneOptions](../interfaces/manytooneoptions.md)&#60;K, T> |

**Returns:** void

___

### addOneToMany

▸ **addOneToMany**&#60;K>(`name`: string & keyof T, `type`: [TypeType](../index.md#typetype), `options`: [OneToManyOptions](../index.md#onetomanyoptions)&#60;K, T>): void

*Defined in [packages/core/src/metadata/EntitySchema.ts:153](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L153)*

#### Type parameters:

Name | Default |
------ | ------ |
`K` | unknown |

#### Parameters:

Name | Type |
------ | ------ |
`name` | string & keyof T |
`type` | [TypeType](../index.md#typetype) |
`options` | [OneToManyOptions](../index.md#onetomanyoptions)&#60;K, T> |

**Returns:** void

___

### addOneToOne

▸ **addOneToOne**&#60;K>(`name`: string & keyof T, `type`: [TypeType](../index.md#typetype), `options`: [OneToOneOptions](../interfaces/onetooneoptions.md)&#60;K, T>): void

*Defined in [packages/core/src/metadata/EntitySchema.ts:158](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L158)*

#### Type parameters:

Name | Default |
------ | ------ |
`K` | unknown |

#### Parameters:

Name | Type |
------ | ------ |
`name` | string & keyof T |
`type` | [TypeType](../index.md#typetype) |
`options` | [OneToOneOptions](../interfaces/onetooneoptions.md)&#60;K, T> |

**Returns:** void

___

### addPrimaryKey

▸ **addPrimaryKey**(`name`: string & keyof T, `type`: [TypeType](../index.md#typetype), `options?`: [PrimaryKeyOptions](../interfaces/primarykeyoptions.md)&#60;T>): void

*Defined in [packages/core/src/metadata/EntitySchema.ts:104](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L104)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`name` | string & keyof T | - |
`type` | [TypeType](../index.md#typetype) | - |
`options` | [PrimaryKeyOptions](../interfaces/primarykeyoptions.md)&#60;T> | {} |

**Returns:** void

___

### addProperty

▸ **addProperty**(`name`: string & keyof T, `type?`: [TypeType](../index.md#typetype), `options?`: [PropertyOptions](../index.md#propertyoptions)&#60;T> \| [EntityProperty](../interfaces/entityproperty.md)): void

*Defined in [packages/core/src/metadata/EntitySchema.ts:53](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L53)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`name` | string & keyof T | - |
`type?` | [TypeType](../index.md#typetype) | - |
`options` | [PropertyOptions](../index.md#propertyoptions)&#60;T> \| [EntityProperty](../interfaces/entityproperty.md) | {} |

**Returns:** void

___

### addSerializedPrimaryKey

▸ **addSerializedPrimaryKey**(`name`: string & keyof T, `type`: [TypeType](../index.md#typetype), `options?`: [SerializedPrimaryKeyOptions](../interfaces/serializedprimarykeyoptions.md)&#60;T>): void

*Defined in [packages/core/src/metadata/EntitySchema.ts:108](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L108)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`name` | string & keyof T | - |
`type` | [TypeType](../index.md#typetype) | - |
`options` | [SerializedPrimaryKeyOptions](../interfaces/serializedprimarykeyoptions.md)&#60;T> | {} |

**Returns:** void

___

### addUnique

▸ **addUnique**&#60;T>(`options`: Required&#60;Omit&#60;[UniqueOptions](../interfaces/uniqueoptions.md)&#60;T>, &#34;name&#34; \| &#34;options&#34;>> & { name?: string ; options?: [Dictionary](../index.md#dictionary)  }): void

*Defined in [packages/core/src/metadata/EntitySchema.ts:183](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L183)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`options` | Required&#60;Omit&#60;[UniqueOptions](../interfaces/uniqueoptions.md)&#60;T>, &#34;name&#34; \| &#34;options&#34;>> & { name?: string ; options?: [Dictionary](../index.md#dictionary)  } |

**Returns:** void

___

### addVersion

▸ **addVersion**(`name`: string & keyof T, `type`: [TypeType](../index.md#typetype), `options?`: [PropertyOptions](../index.md#propertyoptions)&#60;T>): void

*Defined in [packages/core/src/metadata/EntitySchema.ts:100](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L100)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`name` | string & keyof T | - |
`type` | [TypeType](../index.md#typetype) | - |
`options` | [PropertyOptions](../index.md#propertyoptions)&#60;T> | {} |

**Returns:** void

___

### createProperty

▸ `Private`**createProperty**&#60;T>(`reference`: [ReferenceType](../enums/referencetype.md), `options`: [PropertyOptions](../index.md#propertyoptions)&#60;T> \| [EntityProperty](../interfaces/entityproperty.md)): { cascade: [Cascade](../enums/cascade.md)[] = [Cascade.PERSIST]; reference: [ReferenceType](../enums/referencetype.md)  } \| { cascade: [Cascade](../enums/cascade.md)[] = [Cascade.PERSIST]; reference: [ReferenceType](../enums/referencetype.md)  }

*Defined in [packages/core/src/metadata/EntitySchema.ts:319](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L319)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`reference` | [ReferenceType](../enums/referencetype.md) |
`options` | [PropertyOptions](../index.md#propertyoptions)&#60;T> \| [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** { cascade: [Cascade](../enums/cascade.md)[] = [Cascade.PERSIST]; reference: [ReferenceType](../enums/referencetype.md)  } \| { cascade: [Cascade](../enums/cascade.md)[] = [Cascade.PERSIST]; reference: [ReferenceType](../enums/referencetype.md)  }

___

### init

▸ **init**(): this

*Defined in [packages/core/src/metadata/EntitySchema.ts:218](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L218)*

**`internal`** 

**Returns:** this

___

### initPrimaryKeys

▸ `Private`**initPrimaryKeys**(): void

*Defined in [packages/core/src/metadata/EntitySchema.ts:279](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L279)*

**Returns:** void

___

### initProperties

▸ `Private`**initProperties**(): void

*Defined in [packages/core/src/metadata/EntitySchema.ts:243](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L243)*

**Returns:** void

___

### normalizeType

▸ `Private`**normalizeType**(`options`: [PropertyOptions](../index.md#propertyoptions)&#60;T> \| [EntityProperty](../interfaces/entityproperty.md), `type?`: string \| any \| [Constructor](../index.md#constructor)&#60;[Type](type.md)>): any

*Defined in [packages/core/src/metadata/EntitySchema.ts:299](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L299)*

#### Parameters:

Name | Type |
------ | ------ |
`options` | [PropertyOptions](../index.md#propertyoptions)&#60;T> \| [EntityProperty](../interfaces/entityproperty.md) |
`type?` | string \| any \| [Constructor](../index.md#constructor)&#60;[Type](type.md)> |

**Returns:** any

___

### setClass

▸ **setClass**(`proto`: [Constructor](../index.md#constructor)&#60;T>): void

*Defined in [packages/core/src/metadata/EntitySchema.ts:195](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L195)*

#### Parameters:

Name | Type |
------ | ------ |
`proto` | [Constructor](../index.md#constructor)&#60;T> |

**Returns:** void

___

### setCustomRepository

▸ **setCustomRepository**(`repository`: () => [Constructor](../index.md#constructor)&#60;[EntityRepository](entityrepository.md)&#60;T>>): void

*Defined in [packages/core/src/metadata/EntitySchema.ts:187](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L187)*

#### Parameters:

Name | Type |
------ | ------ |
`repository` | () => [Constructor](../index.md#constructor)&#60;[EntityRepository](entityrepository.md)&#60;T>> |

**Returns:** void

___

### setExtends

▸ **setExtends**(`base`: string): void

*Defined in [packages/core/src/metadata/EntitySchema.ts:191](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L191)*

#### Parameters:

Name | Type |
------ | ------ |
`base` | string |

**Returns:** void

___

### fromMetadata

▸ `Static`**fromMetadata**&#60;T, U>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T> \| [DeepPartial](../index.md#deeppartial)&#60;[EntityMetadata](entitymetadata.md)&#60;T>>): [EntitySchema](entityschema.md)&#60;T, U>

*Defined in [packages/core/src/metadata/EntitySchema.ts:46](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/EntitySchema.ts#L46)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | AnyEntity |
`U` | [AnyEntity](../index.md#anyentity)&#60;U> \| undefined | undefined |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> \| [DeepPartial](../index.md#deeppartial)&#60;[EntityMetadata](entitymetadata.md)&#60;T>> |

**Returns:** [EntitySchema](entityschema.md)&#60;T, U>
