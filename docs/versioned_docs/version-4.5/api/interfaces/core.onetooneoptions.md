---
id: "core.onetooneoptions"
title: "Interface: OneToOneOptions<T, O>"
sidebar_label: "OneToOneOptions"
custom_edit_url: null
hide_title: true
---

# Interface: OneToOneOptions<T, O\>

[core](../modules/core.md).OneToOneOptions

## Type parameters

Name |
:------ |
`T` |
`O` |

## Hierarchy

* *Partial*<Omit<[*OneToManyOptions*](../modules/core.md#onetomanyoptions)<T, O\>, *orderBy*\>\>

  ↳ **OneToOneOptions**

## Properties

### cascade

• `Optional` **cascade**: [*Cascade*](../enums/core.cascade.md)[]

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:67](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L67)

___

### columnType

• `Optional` **columnType**: *string*

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:42](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L42)

___

### comment

• `Optional` **comment**: *string*

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:62](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L62)

___

### customType

• `Optional` **customType**: [*Type*](../classes/core.type.md)<any, any\>

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:41](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L41)

___

### default

• `Optional` **default**: *null* \| *string* \| *number* \| *boolean* \| *string*[] \| *number*[]

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:47](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L47)

___

### defaultRaw

• `Optional` **defaultRaw**: *string*

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:48](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L48)

___

### eager

• `Optional` **eager**: *boolean*

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:68](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L68)

___

### entity

• `Optional` **entity**: *string* \| () => [*EntityName*](../modules/core.md#entityname)<T\> & *string* \| () => [*EntityName*](../modules/core.md#entityname)<T\>

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:66](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L66)

___

### fieldName

• `Optional` **fieldName**: *string*

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:39](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L39)

___

### fieldNames

• `Optional` **fieldNames**: *string*[]

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:40](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L40)

___

### formula

• `Optional` **formula**: *string* \| (`alias`: *string*) => *string*

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:49](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L49)

___

### hidden

• `Optional` **hidden**: *boolean*

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:53](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L53)

___

### index

• `Optional` **index**: *string* \| *boolean*

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:55](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L55)

___

### inverseJoinColumn

• `Optional` **inverseJoinColumn**: *string*

Inherited from: void

Defined in: [packages/core/src/decorators/OneToMany.ts:46](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/OneToMany.ts#L46)

___

### inverseJoinColumns

• `Optional` **inverseJoinColumns**: *string*[]

Inherited from: void

Defined in: [packages/core/src/decorators/OneToMany.ts:47](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/OneToMany.ts#L47)

___

### inversedBy

• `Optional` **inversedBy**: *string* & keyof T \| (`e`: T) => *any*

Defined in: [packages/core/src/decorators/OneToOne.ts:15](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/OneToOne.ts#L15)

___

### joinColumn

• `Optional` **joinColumn**: *string*

Inherited from: void

Defined in: [packages/core/src/decorators/OneToMany.ts:44](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/OneToMany.ts#L44)

___

### joinColumns

• `Optional` **joinColumns**: *string*[]

Inherited from: void

Defined in: [packages/core/src/decorators/OneToMany.ts:45](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/OneToMany.ts#L45)

___

### lazy

• `Optional` **lazy**: *boolean*

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:57](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L57)

___

### length

• `Optional` **length**: *number*

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:44](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L44)

___

### mapToPk

• `Optional` **mapToPk**: *boolean*

Defined in: [packages/core/src/decorators/OneToOne.ts:18](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/OneToOne.ts#L18)

___

### mappedBy

• `Optional` **mappedBy**: *string* & keyof T \| (`e`: T) => *any*

Inherited from: void

Defined in: [packages/core/src/decorators/OneToMany.ts:49](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/OneToMany.ts#L49)

___

### name

• `Optional` **name**: *string*

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:38](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L38)

___

### nullable

• `Optional` **nullable**: *boolean*

Inherited from: void

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

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:45](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L45)

___

### onDelete

• `Optional` **onDelete**: *string*

Defined in: [packages/core/src/decorators/OneToOne.ts:19](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/OneToOne.ts#L19)

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

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:46](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L46)

___

### onUpdateIntegrity

• `Optional` **onUpdateIntegrity**: *string*

Defined in: [packages/core/src/decorators/OneToOne.ts:20](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/OneToOne.ts#L20)

___

### orphanRemoval

• `Optional` **orphanRemoval**: *boolean*

Inherited from: void

Defined in: [packages/core/src/decorators/OneToMany.ts:42](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/OneToMany.ts#L42)

___

### owner

• `Optional` **owner**: *boolean*

Defined in: [packages/core/src/decorators/OneToOne.ts:14](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/OneToOne.ts#L14)

___

### persist

• `Optional` **persist**: *boolean*

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:52](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L52)

___

### primary

• `Optional` **primary**: *boolean*

Overrides: void

Defined in: [packages/core/src/decorators/OneToOne.ts:17](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/OneToOne.ts#L17)

___

### referenceColumnName

• `Optional` **referenceColumnName**: *string*

Inherited from: void

Defined in: [packages/core/src/decorators/OneToMany.ts:48](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/OneToMany.ts#L48)

___

### serializedName

• `Optional` **serializedName**: *string*

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:61](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L61)

___

### serializedPrimaryKey

• `Optional` **serializedPrimaryKey**: *boolean*

Inherited from: void

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

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:60](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L60)

___

### strategy

• `Optional` **strategy**: [*LoadStrategy*](../enums/core.loadstrategy.md)

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:69](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L69)

___

### type

• `Optional` **type**: *unknown*

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:43](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L43)

___

### unique

• `Optional` **unique**: *string* \| *boolean*

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:56](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L56)

___

### unsigned

• `Optional` **unsigned**: *boolean*

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:51](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L51)

___

### version

• `Optional` **version**: *boolean*

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:54](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L54)

___

### wrappedReference

• `Optional` **wrappedReference**: *boolean*

Defined in: [packages/core/src/decorators/OneToOne.ts:16](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/OneToOne.ts#L16)
