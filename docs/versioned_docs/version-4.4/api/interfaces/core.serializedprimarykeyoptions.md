---
id: "core.serializedprimarykeyoptions"
title: "Interface: SerializedPrimaryKeyOptions<T>"
sidebar_label: "SerializedPrimaryKeyOptions"
hide_title: true
---

# Interface: SerializedPrimaryKeyOptions<T\>

[core](../modules/core.md).SerializedPrimaryKeyOptions

## Type parameters

Name |
------ |
`T` |

## Hierarchy

* [*PropertyOptions*](../modules/core.md#propertyoptions)<T\>

  ↳ **SerializedPrimaryKeyOptions**

## Properties

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

### lazy

• `Optional` **lazy**: *undefined* \| *boolean*

Defined in: [packages/core/src/decorators/Property.ts:57](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L57)

___

### length

• `Optional` **length**: *undefined* \| *number*

Defined in: [packages/core/src/decorators/Property.ts:44](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L44)

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

• `Optional` **onCreate**: *undefined* \| (`entity`: T) => *any*

Defined in: [packages/core/src/decorators/Property.ts:45](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L45)

___

### onUpdate

• `Optional` **onUpdate**: *undefined* \| (`entity`: T) => *any*

Defined in: [packages/core/src/decorators/Property.ts:46](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L46)

___

### persist

• `Optional` **persist**: *undefined* \| *boolean*

Defined in: [packages/core/src/decorators/Property.ts:52](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L52)

___

### primary

• `Optional` **primary**: *undefined* \| *boolean*

Defined in: [packages/core/src/decorators/Property.ts:58](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/Property.ts#L58)

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

### type

• `Optional` **type**: *any*

Defined in: [packages/core/src/decorators/PrimaryKey.ts:30](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/decorators/PrimaryKey.ts#L30)

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
