---
id: "core.formulaoptions"
title: "Interface: FormulaOptions<T>"
sidebar_label: "FormulaOptions"
custom_edit_url: null
hide_title: true
---

# Interface: FormulaOptions<T\>

[core](../modules/core.md).FormulaOptions

## Type parameters

Name |
:------ |
`T` |

## Hierarchy

* [*PropertyOptions*](../modules/core.md#propertyoptions)<T\>

  ↳ **FormulaOptions**

## Properties

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

• `Optional` **onCreate**: (`entity`: T) => *any*

#### Type declaration:

▸ (`entity`: T): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |

**Returns:** *any*

Defined in: [packages/core/src/decorators/Property.ts:45](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L45)

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:45](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L45)

___

### onUpdate

• `Optional` **onUpdate**: (`entity`: T) => *any*

#### Type declaration:

▸ (`entity`: T): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |

**Returns:** *any*

Defined in: [packages/core/src/decorators/Property.ts:46](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L46)

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:46](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L46)

___

### persist

• `Optional` **persist**: *boolean*

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:52](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L52)

___

### primary

• `Optional` **primary**: *boolean*

Inherited from: void

Defined in: [packages/core/src/decorators/Property.ts:58](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L58)

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
