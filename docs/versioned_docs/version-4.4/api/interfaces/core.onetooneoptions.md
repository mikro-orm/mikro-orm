---
id: "core.onetooneoptions"
title: "Interface: OneToOneOptions<T, O>"
sidebar_label: "OneToOneOptions"
hide_title: true
---

# Interface: OneToOneOptions<T, O\>

[core](../modules/core.md).OneToOneOptions

## Type parameters

Name |
------ |
`T` |
`O` |

## Hierarchy

* *Partial*<*Omit*<[*OneToManyOptions*](../modules/core.md#onetomanyoptions)<T, O\>, *orderBy*\>\>

  ↳ **OneToOneOptions**

## Properties

### cascade

• `Optional` **cascade**: *undefined* \| [*Cascade*](../enums/core.cascade.md)[]

Defined in: [packages/core/src/decorators/Property.ts:67](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L67)

___

### columnType

• `Optional` **columnType**: *undefined* \| *string*

Defined in: [packages/core/src/decorators/Property.ts:42](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L42)

___

### comment

• `Optional` **comment**: *undefined* \| *string*

Defined in: [packages/core/src/decorators/Property.ts:62](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L62)

___

### customType

• `Optional` **customType**: *undefined* \| [*Type*](../classes/core.type.md)<*any*, *any*\>

Defined in: [packages/core/src/decorators/Property.ts:41](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L41)

___

### default

• `Optional` **default**: *undefined* \| *null* \| *string* \| *number* \| *boolean* \| *string*[] \| *number*[]

Defined in: [packages/core/src/decorators/Property.ts:47](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L47)

___

### defaultRaw

• `Optional` **defaultRaw**: *undefined* \| *string*

Defined in: [packages/core/src/decorators/Property.ts:48](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L48)

___

### eager

• `Optional` **eager**: *undefined* \| *boolean*

Defined in: [packages/core/src/decorators/Property.ts:68](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L68)

___

### entity

• `Optional` **entity**: *undefined* \| *string* \| *string* & () => [*EntityName*](../modules/core.md#entityname)<T\> \| () => [*EntityName*](../modules/core.md#entityname)<T\> & *string* \| () => [*EntityName*](../modules/core.md#entityname)<T\> & () => [*EntityName*](../modules/core.md#entityname)<T\>

Defined in: [packages/core/src/decorators/Property.ts:66](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L66)

___

### fieldName

• `Optional` **fieldName**: *undefined* \| *string*

Defined in: [packages/core/src/decorators/Property.ts:39](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L39)

___

### fieldNames

• `Optional` **fieldNames**: *undefined* \| *string*[]

Defined in: [packages/core/src/decorators/Property.ts:40](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L40)

___

### formula

• `Optional` **formula**: *undefined* \| *string* \| (`alias`: *string*) => *string*

Defined in: [packages/core/src/decorators/Property.ts:49](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L49)

___

### hidden

• `Optional` **hidden**: *undefined* \| *boolean*

Defined in: [packages/core/src/decorators/Property.ts:53](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L53)

___

### index

• `Optional` **index**: *undefined* \| *string* \| *boolean*

Defined in: [packages/core/src/decorators/Property.ts:55](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L55)

___

### inverseJoinColumn

• `Optional` **inverseJoinColumn**: *undefined* \| *string*

Defined in: [packages/core/src/decorators/OneToMany.ts:46](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/OneToMany.ts#L46)

___

### inverseJoinColumns

• `Optional` **inverseJoinColumns**: *undefined* \| *string*[]

Defined in: [packages/core/src/decorators/OneToMany.ts:47](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/OneToMany.ts#L47)

___

### inversedBy

• `Optional` **inversedBy**: *undefined* \| *string* & keyof T \| (`e`: T) => *any*

Defined in: [packages/core/src/decorators/OneToOne.ts:15](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/OneToOne.ts#L15)

___

### joinColumn

• `Optional` **joinColumn**: *undefined* \| *string*

Defined in: [packages/core/src/decorators/OneToMany.ts:44](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/OneToMany.ts#L44)

___

### joinColumns

• `Optional` **joinColumns**: *undefined* \| *string*[]

Defined in: [packages/core/src/decorators/OneToMany.ts:45](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/OneToMany.ts#L45)

___

### lazy

• `Optional` **lazy**: *undefined* \| *boolean*

Defined in: [packages/core/src/decorators/Property.ts:57](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L57)

___

### length

• `Optional` **length**: *undefined* \| *number*

Defined in: [packages/core/src/decorators/Property.ts:44](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L44)

___

### mapToPk

• `Optional` **mapToPk**: *undefined* \| *boolean*

Defined in: [packages/core/src/decorators/OneToOne.ts:18](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/OneToOne.ts#L18)

___

### mappedBy

• **mappedBy**: *undefined* \| *string* & keyof T \| (`e`: T) => *any*

Defined in: [packages/core/src/decorators/OneToMany.ts:49](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/OneToMany.ts#L49)

___

### name

• `Optional` **name**: *undefined* \| *string*

Defined in: [packages/core/src/decorators/Property.ts:38](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L38)

___

### nullable

• `Optional` **nullable**: *undefined* \| *boolean*

Defined in: [packages/core/src/decorators/Property.ts:50](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L50)

___

### onCreate

• `Optional` **onCreate**: *undefined* \| (`entity`: O) => *any*

Defined in: [packages/core/src/decorators/Property.ts:45](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L45)

___

### onDelete

• `Optional` **onDelete**: *undefined* \| *string*

Defined in: [packages/core/src/decorators/OneToOne.ts:19](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/OneToOne.ts#L19)

___

### onUpdate

• `Optional` **onUpdate**: *undefined* \| (`entity`: O) => *any*

Defined in: [packages/core/src/decorators/Property.ts:46](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L46)

___

### onUpdateIntegrity

• `Optional` **onUpdateIntegrity**: *undefined* \| *string*

Defined in: [packages/core/src/decorators/OneToOne.ts:20](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/OneToOne.ts#L20)

___

### orphanRemoval

• `Optional` **orphanRemoval**: *undefined* \| *boolean*

Defined in: [packages/core/src/decorators/OneToMany.ts:42](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/OneToMany.ts#L42)

___

### owner

• `Optional` **owner**: *undefined* \| *boolean*

Defined in: [packages/core/src/decorators/OneToOne.ts:14](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/OneToOne.ts#L14)

___

### persist

• `Optional` **persist**: *undefined* \| *boolean*

Defined in: [packages/core/src/decorators/Property.ts:52](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L52)

___

### primary

• `Optional` **primary**: *undefined* \| *boolean*

Defined in: [packages/core/src/decorators/OneToOne.ts:17](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/OneToOne.ts#L17)

___

### referenceColumnName

• `Optional` **referenceColumnName**: *undefined* \| *string*

Defined in: [packages/core/src/decorators/OneToMany.ts:48](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/OneToMany.ts#L48)

___

### serializedName

• `Optional` **serializedName**: *undefined* \| *string*

Defined in: [packages/core/src/decorators/Property.ts:61](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L61)

___

### serializedPrimaryKey

• `Optional` **serializedPrimaryKey**: *undefined* \| *boolean*

Defined in: [packages/core/src/decorators/Property.ts:59](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L59)

___

### serializer

• `Optional` **serializer**: *undefined* \| (`value`: *any*) => *any*

Defined in: [packages/core/src/decorators/Property.ts:60](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L60)

___

### strategy

• `Optional` **strategy**: *undefined* \| [*SELECT\_IN*](../enums/core.loadstrategy.md#select_in) \| [*JOINED*](../enums/core.loadstrategy.md#joined)

Defined in: [packages/core/src/decorators/Property.ts:69](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L69)

___

### type

• `Optional` **type**: *unknown*

Defined in: [packages/core/src/decorators/Property.ts:43](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L43)

___

### unique

• `Optional` **unique**: *undefined* \| *string* \| *boolean*

Defined in: [packages/core/src/decorators/Property.ts:56](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L56)

___

### unsigned

• `Optional` **unsigned**: *undefined* \| *boolean*

Defined in: [packages/core/src/decorators/Property.ts:51](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L51)

___

### version

• `Optional` **version**: *undefined* \| *boolean*

Defined in: [packages/core/src/decorators/Property.ts:54](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L54)

___

### wrappedReference

• `Optional` **wrappedReference**: *undefined* \| *boolean*

Defined in: [packages/core/src/decorators/OneToOne.ts:16](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/OneToOne.ts#L16)
