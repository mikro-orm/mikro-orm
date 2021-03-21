---
id: "core.manytomanyoptions"
title: "Interface: ManyToManyOptions<T, O>"
sidebar_label: "ManyToManyOptions"
custom_edit_url: null
hide_title: true
---

# Interface: ManyToManyOptions<T, O\>

[core](../modules/core.md).ManyToManyOptions

## Type parameters

Name |
:------ |
`T` |
`O` |

## Hierarchy

* [*ReferenceOptions*](core.referenceoptions.md)<T, O\>

  ↳ **ManyToManyOptions**

## Properties

### cascade

• `Optional` **cascade**: [*Cascade*](../enums/core.cascade.md)[]

Inherited from: [ReferenceOptions](core.referenceoptions.md).[cascade](core.referenceoptions.md#cascade)

Defined in: [packages/core/src/decorators/Property.ts:67](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L67)

___

### columnType

• `Optional` **columnType**: *string*

Inherited from: [ReferenceOptions](core.referenceoptions.md).[columnType](core.referenceoptions.md#columntype)

Defined in: [packages/core/src/decorators/Property.ts:42](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L42)

___

### comment

• `Optional` **comment**: *string*

Inherited from: [ReferenceOptions](core.referenceoptions.md).[comment](core.referenceoptions.md#comment)

Defined in: [packages/core/src/decorators/Property.ts:62](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L62)

___

### customType

• `Optional` **customType**: [*Type*](../classes/core.type.md)<any, any\>

Inherited from: [ReferenceOptions](core.referenceoptions.md).[customType](core.referenceoptions.md#customtype)

Defined in: [packages/core/src/decorators/Property.ts:41](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L41)

___

### default

• `Optional` **default**: *null* \| *string* \| *number* \| *boolean* \| *string*[] \| *number*[]

Inherited from: [ReferenceOptions](core.referenceoptions.md).[default](core.referenceoptions.md#default)

Defined in: [packages/core/src/decorators/Property.ts:47](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L47)

___

### defaultRaw

• `Optional` **defaultRaw**: *string*

Inherited from: [ReferenceOptions](core.referenceoptions.md).[defaultRaw](core.referenceoptions.md#defaultraw)

Defined in: [packages/core/src/decorators/Property.ts:48](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L48)

___

### eager

• `Optional` **eager**: *boolean*

Inherited from: [ReferenceOptions](core.referenceoptions.md).[eager](core.referenceoptions.md#eager)

Defined in: [packages/core/src/decorators/Property.ts:68](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L68)

___

### entity

• `Optional` **entity**: *string* \| () => [*EntityName*](../modules/core.md#entityname)<T\>

Inherited from: [ReferenceOptions](core.referenceoptions.md).[entity](core.referenceoptions.md#entity)

Defined in: [packages/core/src/decorators/Property.ts:66](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L66)

___

### fieldName

• `Optional` **fieldName**: *string*

Inherited from: [ReferenceOptions](core.referenceoptions.md).[fieldName](core.referenceoptions.md#fieldname)

Defined in: [packages/core/src/decorators/Property.ts:39](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L39)

___

### fieldNames

• `Optional` **fieldNames**: *string*[]

Inherited from: [ReferenceOptions](core.referenceoptions.md).[fieldNames](core.referenceoptions.md#fieldnames)

Defined in: [packages/core/src/decorators/Property.ts:40](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L40)

___

### fixedOrder

• `Optional` **fixedOrder**: *boolean*

Defined in: [packages/core/src/decorators/ManyToMany.ts:28](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/ManyToMany.ts#L28)

___

### fixedOrderColumn

• `Optional` **fixedOrderColumn**: *string*

Defined in: [packages/core/src/decorators/ManyToMany.ts:29](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/ManyToMany.ts#L29)

___

### formula

• `Optional` **formula**: *string* \| (`alias`: *string*) => *string*

Inherited from: [ReferenceOptions](core.referenceoptions.md).[formula](core.referenceoptions.md#formula)

Defined in: [packages/core/src/decorators/Property.ts:49](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L49)

___

### hidden

• `Optional` **hidden**: *boolean*

Inherited from: [ReferenceOptions](core.referenceoptions.md).[hidden](core.referenceoptions.md#hidden)

Defined in: [packages/core/src/decorators/Property.ts:53](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L53)

___

### index

• `Optional` **index**: *string* \| *boolean*

Inherited from: [ReferenceOptions](core.referenceoptions.md).[index](core.referenceoptions.md#index)

Defined in: [packages/core/src/decorators/Property.ts:55](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L55)

___

### inverseJoinColumn

• `Optional` **inverseJoinColumn**: *string*

Defined in: [packages/core/src/decorators/ManyToMany.ts:33](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/ManyToMany.ts#L33)

___

### inverseJoinColumns

• `Optional` **inverseJoinColumns**: *string*[]

Defined in: [packages/core/src/decorators/ManyToMany.ts:34](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/ManyToMany.ts#L34)

___

### inversedBy

• `Optional` **inversedBy**: *string* & keyof T \| (`e`: T) => *any*

Defined in: [packages/core/src/decorators/ManyToMany.ts:25](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/ManyToMany.ts#L25)

___

### joinColumn

• `Optional` **joinColumn**: *string*

Defined in: [packages/core/src/decorators/ManyToMany.ts:31](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/ManyToMany.ts#L31)

___

### joinColumns

• `Optional` **joinColumns**: *string*[]

Defined in: [packages/core/src/decorators/ManyToMany.ts:32](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/ManyToMany.ts#L32)

___

### lazy

• `Optional` **lazy**: *boolean*

Inherited from: [ReferenceOptions](core.referenceoptions.md).[lazy](core.referenceoptions.md#lazy)

Defined in: [packages/core/src/decorators/Property.ts:57](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L57)

___

### length

• `Optional` **length**: *number*

Inherited from: [ReferenceOptions](core.referenceoptions.md).[length](core.referenceoptions.md#length)

Defined in: [packages/core/src/decorators/Property.ts:44](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L44)

___

### mappedBy

• `Optional` **mappedBy**: *string* & keyof T \| (`e`: T) => *any*

Defined in: [packages/core/src/decorators/ManyToMany.ts:26](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/ManyToMany.ts#L26)

___

### name

• `Optional` **name**: *string*

Inherited from: [ReferenceOptions](core.referenceoptions.md).[name](core.referenceoptions.md#name)

Defined in: [packages/core/src/decorators/Property.ts:38](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L38)

___

### nullable

• `Optional` **nullable**: *boolean*

Inherited from: [ReferenceOptions](core.referenceoptions.md).[nullable](core.referenceoptions.md#nullable)

Defined in: [packages/core/src/decorators/Property.ts:50](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L50)

___

### onCreate

• `Optional` **onCreate**: (`entity`: O) => *any*

#### Type declaration:

▸ (`entity`: O): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | O |

**Returns:** *any*

Defined in: [packages/core/src/decorators/Property.ts:45](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L45)

Inherited from: [ReferenceOptions](core.referenceoptions.md).[onCreate](core.referenceoptions.md#oncreate)

Defined in: [packages/core/src/decorators/Property.ts:45](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L45)

___

### onUpdate

• `Optional` **onUpdate**: (`entity`: O) => *any*

#### Type declaration:

▸ (`entity`: O): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | O |

**Returns:** *any*

Defined in: [packages/core/src/decorators/Property.ts:46](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L46)

Inherited from: [ReferenceOptions](core.referenceoptions.md).[onUpdate](core.referenceoptions.md#onupdate)

Defined in: [packages/core/src/decorators/Property.ts:46](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L46)

___

### orderBy

• `Optional` **orderBy**: *object*

#### Type declaration:

Defined in: [packages/core/src/decorators/ManyToMany.ts:27](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/ManyToMany.ts#L27)

___

### owner

• `Optional` **owner**: *boolean*

Defined in: [packages/core/src/decorators/ManyToMany.ts:24](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/ManyToMany.ts#L24)

___

### persist

• `Optional` **persist**: *boolean*

Inherited from: [ReferenceOptions](core.referenceoptions.md).[persist](core.referenceoptions.md#persist)

Defined in: [packages/core/src/decorators/Property.ts:52](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L52)

___

### pivotTable

• `Optional` **pivotTable**: *string*

Defined in: [packages/core/src/decorators/ManyToMany.ts:30](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/ManyToMany.ts#L30)

___

### primary

• `Optional` **primary**: *boolean*

Inherited from: [ReferenceOptions](core.referenceoptions.md).[primary](core.referenceoptions.md#primary)

Defined in: [packages/core/src/decorators/Property.ts:58](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L58)

___

### referenceColumnName

• `Optional` **referenceColumnName**: *string*

Defined in: [packages/core/src/decorators/ManyToMany.ts:35](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/ManyToMany.ts#L35)

___

### serializedName

• `Optional` **serializedName**: *string*

Inherited from: [ReferenceOptions](core.referenceoptions.md).[serializedName](core.referenceoptions.md#serializedname)

Defined in: [packages/core/src/decorators/Property.ts:61](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L61)

___

### serializedPrimaryKey

• `Optional` **serializedPrimaryKey**: *boolean*

Inherited from: [ReferenceOptions](core.referenceoptions.md).[serializedPrimaryKey](core.referenceoptions.md#serializedprimarykey)

Defined in: [packages/core/src/decorators/Property.ts:59](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L59)

___

### serializer

• `Optional` **serializer**: (`value`: *any*) => *any*

#### Type declaration:

▸ (`value`: *any*): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`value` | *any* |

**Returns:** *any*

Defined in: [packages/core/src/decorators/Property.ts:60](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L60)

Inherited from: [ReferenceOptions](core.referenceoptions.md).[serializer](core.referenceoptions.md#serializer)

Defined in: [packages/core/src/decorators/Property.ts:60](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L60)

___

### strategy

• `Optional` **strategy**: [*LoadStrategy*](../enums/core.loadstrategy.md)

Inherited from: [ReferenceOptions](core.referenceoptions.md).[strategy](core.referenceoptions.md#strategy)

Defined in: [packages/core/src/decorators/Property.ts:69](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L69)

___

### type

• `Optional` **type**: *unknown*

Inherited from: [ReferenceOptions](core.referenceoptions.md).[type](core.referenceoptions.md#type)

Defined in: [packages/core/src/decorators/Property.ts:43](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L43)

___

### unique

• `Optional` **unique**: *string* \| *boolean*

Inherited from: [ReferenceOptions](core.referenceoptions.md).[unique](core.referenceoptions.md#unique)

Defined in: [packages/core/src/decorators/Property.ts:56](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L56)

___

### unsigned

• `Optional` **unsigned**: *boolean*

Inherited from: [ReferenceOptions](core.referenceoptions.md).[unsigned](core.referenceoptions.md#unsigned)

Defined in: [packages/core/src/decorators/Property.ts:51](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L51)

___

### version

• `Optional` **version**: *boolean*

Inherited from: [ReferenceOptions](core.referenceoptions.md).[version](core.referenceoptions.md#version)

Defined in: [packages/core/src/decorators/Property.ts:54](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L54)
