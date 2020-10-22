---
id: "manytomanyoptions"
title: "Interface: ManyToManyOptions<T, O>"
sidebar_label: "ManyToManyOptions"
---

## Type parameters

Name |
------ |
`T` |
`O` |

## Hierarchy

* [ReferenceOptions](referenceoptions.md)&#60;T, O>

  ↳ **ManyToManyOptions**

## Properties

### cascade

• `Optional` **cascade**: [Cascade](../enums/cascade.md)[]

*Inherited from [ReferenceOptions](referenceoptions.md).[cascade](referenceoptions.md#cascade)*

*Defined in [packages/core/src/decorators/Property.ts:67](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L67)*

___

### columnType

• `Optional` **columnType**: string

*Inherited from __type.columnType*

*Defined in [packages/core/src/decorators/Property.ts:42](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L42)*

___

### comment

• `Optional` **comment**: string

*Inherited from __type.comment*

*Defined in [packages/core/src/decorators/Property.ts:62](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L62)*

___

### customType

• `Optional` **customType**: [Type](../classes/type.md)&#60;any>

*Inherited from __type.customType*

*Defined in [packages/core/src/decorators/Property.ts:41](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L41)*

___

### default

• `Optional` **default**: string \| string[] \| number \| number[] \| boolean \| null

*Inherited from __type.default*

*Defined in [packages/core/src/decorators/Property.ts:47](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L47)*

___

### defaultRaw

• `Optional` **defaultRaw**: string

*Inherited from __type.defaultRaw*

*Defined in [packages/core/src/decorators/Property.ts:48](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L48)*

___

### eager

• `Optional` **eager**: boolean

*Inherited from [ReferenceOptions](referenceoptions.md).[eager](referenceoptions.md#eager)*

*Defined in [packages/core/src/decorators/Property.ts:68](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L68)*

___

### entity

• `Optional` **entity**: string \| () => [EntityName](../index.md#entityname)&#60;T>

*Inherited from [ReferenceOptions](referenceoptions.md).[entity](referenceoptions.md#entity)*

*Defined in [packages/core/src/decorators/Property.ts:66](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L66)*

___

### fieldName

• `Optional` **fieldName**: string

*Inherited from __type.fieldName*

*Defined in [packages/core/src/decorators/Property.ts:39](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L39)*

___

### fieldNames

• `Optional` **fieldNames**: string[]

*Inherited from __type.fieldNames*

*Defined in [packages/core/src/decorators/Property.ts:40](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L40)*

___

### fixedOrder

• `Optional` **fixedOrder**: boolean

*Defined in [packages/core/src/decorators/ManyToMany.ts:28](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/ManyToMany.ts#L28)*

___

### fixedOrderColumn

• `Optional` **fixedOrderColumn**: string

*Defined in [packages/core/src/decorators/ManyToMany.ts:29](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/ManyToMany.ts#L29)*

___

### formula

• `Optional` **formula**: string \| (alias: string) => string

*Inherited from __type.formula*

*Defined in [packages/core/src/decorators/Property.ts:49](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L49)*

___

### hidden

• `Optional` **hidden**: boolean

*Inherited from __type.hidden*

*Defined in [packages/core/src/decorators/Property.ts:53](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L53)*

___

### index

• `Optional` **index**: boolean \| string

*Inherited from __type.index*

*Defined in [packages/core/src/decorators/Property.ts:55](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L55)*

___

### inverseJoinColumn

• `Optional` **inverseJoinColumn**: string

*Defined in [packages/core/src/decorators/ManyToMany.ts:33](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/ManyToMany.ts#L33)*

___

### inverseJoinColumns

• `Optional` **inverseJoinColumns**: string[]

*Defined in [packages/core/src/decorators/ManyToMany.ts:34](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/ManyToMany.ts#L34)*

___

### inversedBy

• `Optional` **inversedBy**: string & keyof T \| (e: T) => any

*Defined in [packages/core/src/decorators/ManyToMany.ts:25](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/ManyToMany.ts#L25)*

___

### joinColumn

• `Optional` **joinColumn**: string

*Defined in [packages/core/src/decorators/ManyToMany.ts:31](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/ManyToMany.ts#L31)*

___

### joinColumns

• `Optional` **joinColumns**: string[]

*Defined in [packages/core/src/decorators/ManyToMany.ts:32](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/ManyToMany.ts#L32)*

___

### lazy

• `Optional` **lazy**: boolean

*Inherited from __type.lazy*

*Defined in [packages/core/src/decorators/Property.ts:57](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L57)*

___

### length

• `Optional` **length**: number

*Inherited from __type.length*

*Defined in [packages/core/src/decorators/Property.ts:44](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L44)*

___

### mappedBy

• `Optional` **mappedBy**: string & keyof T \| (e: T) => any

*Defined in [packages/core/src/decorators/ManyToMany.ts:26](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/ManyToMany.ts#L26)*

___

### name

• `Optional` **name**: string

*Inherited from __type.name*

*Defined in [packages/core/src/decorators/Property.ts:38](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L38)*

___

### nullable

• `Optional` **nullable**: boolean

*Inherited from __type.nullable*

*Defined in [packages/core/src/decorators/Property.ts:50](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L50)*

___

### onCreate

• `Optional` **onCreate**: (entity: T) => any

*Inherited from __type.onCreate*

*Defined in [packages/core/src/decorators/Property.ts:45](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L45)*

___

### onUpdate

• `Optional` **onUpdate**: (entity: T) => any

*Inherited from __type.onUpdate*

*Defined in [packages/core/src/decorators/Property.ts:46](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L46)*

___

### orderBy

• `Optional` **orderBy**: { [field:string]: [QueryOrder](../enums/queryorder.md);  }

*Defined in [packages/core/src/decorators/ManyToMany.ts:27](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/ManyToMany.ts#L27)*

___

### owner

• `Optional` **owner**: boolean

*Defined in [packages/core/src/decorators/ManyToMany.ts:24](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/ManyToMany.ts#L24)*

___

### persist

• `Optional` **persist**: boolean

*Inherited from __type.persist*

*Defined in [packages/core/src/decorators/Property.ts:52](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L52)*

___

### pivotTable

• `Optional` **pivotTable**: string

*Defined in [packages/core/src/decorators/ManyToMany.ts:30](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/ManyToMany.ts#L30)*

___

### primary

• `Optional` **primary**: boolean

*Inherited from __type.primary*

*Defined in [packages/core/src/decorators/Property.ts:58](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L58)*

___

### referenceColumnName

• `Optional` **referenceColumnName**: string

*Defined in [packages/core/src/decorators/ManyToMany.ts:35](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/ManyToMany.ts#L35)*

___

### serializedName

• `Optional` **serializedName**: string

*Inherited from __type.serializedName*

*Defined in [packages/core/src/decorators/Property.ts:61](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L61)*

___

### serializedPrimaryKey

• `Optional` **serializedPrimaryKey**: boolean

*Inherited from __type.serializedPrimaryKey*

*Defined in [packages/core/src/decorators/Property.ts:59](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L59)*

___

### serializer

• `Optional` **serializer**: (value: any) => any

*Inherited from __type.serializer*

*Defined in [packages/core/src/decorators/Property.ts:60](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L60)*

___

### strategy

• `Optional` **strategy**: [LoadStrategy](../enums/loadstrategy.md)

*Inherited from [ReferenceOptions](referenceoptions.md).[strategy](referenceoptions.md#strategy)*

*Defined in [packages/core/src/decorators/Property.ts:69](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L69)*

___

### type

• `Optional` **type**: &#34;string&#34; \| &#34;number&#34; \| &#34;boolean&#34; \| &#34;bigint&#34; \| &#34;ObjectId&#34; \| string \| unknown \| bigint \| Date \| [Constructor](../index.md#constructor)&#60;[Type](../classes/type.md)&#60;any>> \| [Type](../classes/type.md)&#60;any>

*Inherited from __type.type*

*Defined in [packages/core/src/decorators/Property.ts:43](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L43)*

___

### unique

• `Optional` **unique**: boolean \| string

*Inherited from __type.unique*

*Defined in [packages/core/src/decorators/Property.ts:56](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L56)*

___

### unsigned

• `Optional` **unsigned**: boolean

*Inherited from __type.unsigned*

*Defined in [packages/core/src/decorators/Property.ts:51](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L51)*

___

### version

• `Optional` **version**: boolean

*Inherited from __type.version*

*Defined in [packages/core/src/decorators/Property.ts:54](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/decorators/Property.ts#L54)*
