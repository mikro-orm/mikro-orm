---
id: "core.entityproperty"
title: "Interface: EntityProperty<T>"
sidebar_label: "EntityProperty"
custom_edit_url: null
hide_title: true
---

# Interface: EntityProperty<T\>

[core](../modules/core.md).EntityProperty

## Type parameters

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | *any* |

## Properties

### array

• `Optional` **array**: *boolean*

Defined in: [packages/core/src/typings.ts:135](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L135)

___

### cascade

• **cascade**: [*Cascade*](../enums/core.cascade.md)[]

Defined in: [packages/core/src/typings.ts:164](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L164)

___

### columnTypes

• **columnTypes**: *string*[]

Defined in: [packages/core/src/typings.ts:130](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L130)

___

### comment

• `Optional` **comment**: *string*

Defined in: [packages/core/src/typings.ts:185](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L185)

___

### customType

• **customType**: [*Type*](../classes/core.type.md)<any, any\>

Defined in: [packages/core/src/typings.ts:131](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L131)

___

### default

• `Optional` **default**: *null* \| *string* \| *number* \| *boolean*

Defined in: [packages/core/src/typings.ts:141](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L141)

___

### defaultRaw

• `Optional` **defaultRaw**: *string*

Defined in: [packages/core/src/typings.ts:142](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L142)

___

### eager

• `Optional` **eager**: *boolean*

Defined in: [packages/core/src/typings.ts:160](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L160)

___

### embeddable

• **embeddable**: [*Constructor*](../modules/core.md#constructor)<T\>

Defined in: [packages/core/src/typings.ts:146](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L146)

___

### embedded

• `Optional` **embedded**: [*string*, *string*]

Defined in: [packages/core/src/typings.ts:145](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L145)

___

### embeddedProps

• **embeddedProps**: [*Dictionary*](../modules/core.md#dictionary)<[*EntityProperty*](core.entityproperty.md)<any\>\>

Defined in: [packages/core/src/typings.ts:147](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L147)

___

### entity

• **entity**: () => [*EntityName*](../modules/core.md#entityname)<T\>

#### Type declaration:

▸ (): [*EntityName*](../modules/core.md#entityname)<T\>

**Returns:** [*EntityName*](../modules/core.md#entityname)<T\>

Defined in: [packages/core/src/typings.ts:127](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L127)

Defined in: [packages/core/src/typings.ts:127](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L127)

___

### enum

• `Optional` **enum**: *boolean*

Defined in: [packages/core/src/typings.ts:157](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L157)

___

### fieldNameRaw

• `Optional` **fieldNameRaw**: *string*

Defined in: [packages/core/src/typings.ts:140](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L140)

___

### fieldNames

• **fieldNames**: *string*[]

Defined in: [packages/core/src/typings.ts:139](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L139)

___

### fixedOrder

• `Optional` **fixedOrder**: *boolean*

Defined in: [packages/core/src/typings.ts:175](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L175)

___

### fixedOrderColumn

• `Optional` **fixedOrderColumn**: *string*

Defined in: [packages/core/src/typings.ts:176](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L176)

___

### formula

• `Optional` **formula**: (`alias`: *string*) => *string*

#### Type declaration:

▸ (`alias`: *string*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`alias` | *string* |

**Returns:** *string*

Defined in: [packages/core/src/typings.ts:143](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L143)

Defined in: [packages/core/src/typings.ts:143](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L143)

___

### getter

• `Optional` **getter**: *boolean*

Defined in: [packages/core/src/typings.ts:162](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L162)

___

### getterName

• `Optional` **getterName**: keyof T

Defined in: [packages/core/src/typings.ts:163](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L163)

___

### hidden

• `Optional` **hidden**: *boolean*

Defined in: [packages/core/src/typings.ts:156](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L156)

___

### index

• `Optional` **index**: *string* \| *boolean*

Defined in: [packages/core/src/typings.ts:149](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L149)

___

### inherited

• `Optional` **inherited**: *boolean*

Defined in: [packages/core/src/typings.ts:152](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L152)

___

### inverseJoinColumns

• **inverseJoinColumns**: *string*[]

Defined in: [packages/core/src/typings.ts:179](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L179)

___

### inversedBy

• **inversedBy**: *string*

Defined in: [packages/core/src/typings.ts:172](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L172)

___

### items

• `Optional` **items**: (*string* \| *number*)[]

Defined in: [packages/core/src/typings.ts:158](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L158)

___

### joinColumns

• **joinColumns**: *string*[]

Defined in: [packages/core/src/typings.ts:178](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L178)

___

### lazy

• `Optional` **lazy**: *boolean*

Defined in: [packages/core/src/typings.ts:134](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L134)

___

### length

• `Optional` **length**: *any*

Defined in: [packages/core/src/typings.ts:136](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L136)

___

### mapToPk

• `Optional` **mapToPk**: *boolean*

Defined in: [packages/core/src/typings.ts:154](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L154)

___

### mappedBy

• **mappedBy**: *string*

Defined in: [packages/core/src/typings.ts:173](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L173)

___

### name

• **name**: *string* & keyof T

Defined in: [packages/core/src/typings.ts:126](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L126)

___

### nullable

• `Optional` **nullable**: *boolean*

Defined in: [packages/core/src/typings.ts:151](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L151)

___

### object

• `Optional` **object**: *boolean*

Defined in: [packages/core/src/typings.ts:148](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L148)

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

Defined in: [packages/core/src/typings.ts:166](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L166)

Defined in: [packages/core/src/typings.ts:166](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L166)

___

### onDelete

• `Optional` **onDelete**: *string*

Defined in: [packages/core/src/typings.ts:168](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L168)

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

Defined in: [packages/core/src/typings.ts:167](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L167)

Defined in: [packages/core/src/typings.ts:167](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L167)

___

### onUpdateIntegrity

• `Optional` **onUpdateIntegrity**: *string*

Defined in: [packages/core/src/typings.ts:169](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L169)

___

### orderBy

• `Optional` **orderBy**: *object*

#### Type declaration:

Defined in: [packages/core/src/typings.ts:174](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L174)

___

### orphanRemoval

• `Optional` **orphanRemoval**: *boolean*

Defined in: [packages/core/src/typings.ts:165](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L165)

___

### owner

• **owner**: *boolean*

Defined in: [packages/core/src/typings.ts:171](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L171)

___

### persist

• `Optional` **persist**: *boolean*

Defined in: [packages/core/src/typings.ts:155](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L155)

___

### pivotTable

• **pivotTable**: *string*

Defined in: [packages/core/src/typings.ts:177](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L177)

___

### prefix

• `Optional` **prefix**: *string* \| *boolean*

Defined in: [packages/core/src/typings.ts:144](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L144)

___

### primary

• **primary**: *boolean*

Defined in: [packages/core/src/typings.ts:132](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L132)

___

### reference

• **reference**: [*ReferenceType*](../enums/core.referencetype.md)

Defined in: [packages/core/src/typings.ts:137](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L137)

___

### referencedColumnNames

• **referencedColumnNames**: *string*[]

Defined in: [packages/core/src/typings.ts:180](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L180)

___

### referencedPKs

• **referencedPKs**: *string*[]

Defined in: [packages/core/src/typings.ts:182](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L182)

___

### referencedTableName

• **referencedTableName**: *string*

Defined in: [packages/core/src/typings.ts:181](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L181)

___

### serializedName

• `Optional` **serializedName**: *string*

Defined in: [packages/core/src/typings.ts:184](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L184)

___

### serializedPrimaryKey

• **serializedPrimaryKey**: *boolean*

Defined in: [packages/core/src/typings.ts:133](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L133)

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

Defined in: [packages/core/src/typings.ts:183](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L183)

Defined in: [packages/core/src/typings.ts:183](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L183)

___

### setter

• `Optional` **setter**: *boolean*

Defined in: [packages/core/src/typings.ts:161](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L161)

___

### strategy

• `Optional` **strategy**: [*LoadStrategy*](../enums/core.loadstrategy.md)

Defined in: [packages/core/src/typings.ts:170](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L170)

___

### targetMeta

• `Optional` **targetMeta**: [*EntityMetadata*](../classes/core.entitymetadata.md)<any\>

Defined in: [packages/core/src/typings.ts:129](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L129)

___

### type

• **type**: *string*

Defined in: [packages/core/src/typings.ts:128](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L128)

___

### unique

• `Optional` **unique**: *string* \| *boolean*

Defined in: [packages/core/src/typings.ts:150](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L150)

___

### unsigned

• **unsigned**: *boolean*

Defined in: [packages/core/src/typings.ts:153](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L153)

___

### userDefined

• `Optional` **userDefined**: *boolean*

Defined in: [packages/core/src/typings.ts:186](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L186)

___

### version

• `Optional` **version**: *boolean*

Defined in: [packages/core/src/typings.ts:159](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L159)

___

### wrappedReference

• `Optional` **wrappedReference**: *boolean*

Defined in: [packages/core/src/typings.ts:138](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L138)
