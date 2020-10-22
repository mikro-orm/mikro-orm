---
id: "entitymetadata"
title: "Class: EntityMetadata<T, T>"
sidebar_label: "EntityMetadata"
---

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | any |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | any |

## Hierarchy

* **EntityMetadata**

## Constructors

### constructor

\+ **new EntityMetadata**(`meta?`: Partial&#60;[EntityMetadata](entitymetadata.md)>): [EntityMetadata](entitymetadata.md)

*Defined in [packages/core/src/typings.ts:180](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L180)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`meta` | Partial&#60;[EntityMetadata](entitymetadata.md)> | {} |

**Returns:** [EntityMetadata](entitymetadata.md)

## Properties

### abstract

•  **abstract**: boolean

*Defined in [packages/core/src/typings.ts:291](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L291)*

___

### class

•  **class**: [Constructor](../index.md#constructor)&#60;T>

*Defined in [packages/core/src/typings.ts:290](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L290)*

___

### className

•  **className**: string

*Defined in [packages/core/src/typings.ts:264](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L264)*

___

### collection

•  **collection**: string

*Defined in [packages/core/src/typings.ts:274](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L274)*

___

### comment

• `Optional` **comment**: string

*Defined in [packages/core/src/typings.ts:294](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L294)*

___

### comparableProps

•  **comparableProps**: [EntityProperty](../interfaces/entityproperty.md)&#60;T>[]

*Defined in [packages/core/src/typings.ts:283](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L283)*

___

### compositePK

•  **compositePK**: boolean

*Defined in [packages/core/src/typings.ts:277](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L277)*

___

### constructorParams

•  **constructorParams**: string[]

*Defined in [packages/core/src/typings.ts:271](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L271)*

___

### customRepository

•  **customRepository**: () => [Constructor](../index.md#constructor)&#60;[EntityRepository](entityrepository.md)&#60;T>>

*Defined in [packages/core/src/typings.ts:287](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L287)*

___

### discriminatorColumn

• `Optional` **discriminatorColumn**: string

*Defined in [packages/core/src/typings.ts:267](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L267)*

___

### discriminatorMap

• `Optional` **discriminatorMap**: [Dictionary](../index.md#dictionary)&#60;string>

*Defined in [packages/core/src/typings.ts:269](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L269)*

___

### discriminatorValue

• `Optional` **discriminatorValue**: string

*Defined in [packages/core/src/typings.ts:268](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L268)*

___

### embeddable

•  **embeddable**: boolean

*Defined in [packages/core/src/typings.ts:270](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L270)*

___

### extends

•  **extends**: string

*Defined in [packages/core/src/typings.ts:273](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L273)*

___

### filters

•  **filters**: [Dictionary](../index.md#dictionary)&#60;[FilterDef](../index.md#filterdef)&#60;T>>

*Defined in [packages/core/src/typings.ts:293](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L293)*

___

### hooks

•  **hooks**: Partial&#60;Record&#60;keyof *typeof* EventType, string & keyof T[]>>

*Defined in [packages/core/src/typings.ts:288](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L288)*

___

### hydrateProps

•  **hydrateProps**: [EntityProperty](../interfaces/entityproperty.md)&#60;T>[]

*Defined in [packages/core/src/typings.ts:284](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L284)*

___

### indexes

•  **indexes**: { name?: string ; options?: [Dictionary](../index.md#dictionary) ; properties: keyof T & string \| keyof T & string[] ; type?: string  }[]

*Defined in [packages/core/src/typings.ts:285](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L285)*

___

### name

• `Optional` **name**: string

*Defined in [packages/core/src/typings.ts:263](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L263)*

___

### path

•  **path**: string

*Defined in [packages/core/src/typings.ts:275](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L275)*

___

### pivotTable

•  **pivotTable**: boolean

*Defined in [packages/core/src/typings.ts:266](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L266)*

___

### primaryKeys

•  **primaryKeys**: keyof T & string[]

*Defined in [packages/core/src/typings.ts:276](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L276)*

___

### properties

•  **properties**: {}

*Defined in [packages/core/src/typings.ts:280](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L280)*

___

### propertyOrder

• `Readonly` **propertyOrder**: Map&#60;string, number> = new Map&#60;string, number>()

*Defined in [packages/core/src/typings.ts:180](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L180)*

___

### props

•  **props**: [EntityProperty](../interfaces/entityproperty.md)&#60;T>[]

*Defined in [packages/core/src/typings.ts:281](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L281)*

___

### prototype

•  **prototype**: T

*Defined in [packages/core/src/typings.ts:289](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L289)*

___

### readonly

• `Optional` **readonly**: boolean

*Defined in [packages/core/src/typings.ts:296](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L296)*

___

### relations

•  **relations**: [EntityProperty](../interfaces/entityproperty.md)&#60;T>[]

*Defined in [packages/core/src/typings.ts:282](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L282)*

___

### root

•  **root**: [EntityMetadata](entitymetadata.md)&#60;T>

*Defined in [packages/core/src/typings.ts:297](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L297)*

___

### selfReferencing

• `Optional` **selfReferencing**: boolean

*Defined in [packages/core/src/typings.ts:295](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L295)*

___

### serializedPrimaryKey

•  **serializedPrimaryKey**: keyof T & string

*Defined in [packages/core/src/typings.ts:279](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L279)*

___

### tableName

•  **tableName**: string

*Defined in [packages/core/src/typings.ts:265](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L265)*

___

### toJsonParams

•  **toJsonParams**: string[]

*Defined in [packages/core/src/typings.ts:272](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L272)*

___

### uniques

•  **uniques**: { name?: string ; options?: [Dictionary](../index.md#dictionary) ; properties: keyof T & string \| keyof T & string[]  }[]

*Defined in [packages/core/src/typings.ts:286](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L286)*

___

### useCache

•  **useCache**: boolean

*Defined in [packages/core/src/typings.ts:292](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L292)*

___

### versionProperty

•  **versionProperty**: keyof T & string

*Defined in [packages/core/src/typings.ts:278](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L278)*

## Methods

### addProperty

▸ **addProperty**(`prop`: [EntityProperty](../interfaces/entityproperty.md)&#60;T>, `sync?`: boolean): void

*Defined in [packages/core/src/typings.ts:193](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L193)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md)&#60;T> | - |
`sync` | boolean | true |

**Returns:** void

___

### initIndexes

▸ `Private`**initIndexes**(`prop`: [EntityProperty](../interfaces/entityproperty.md)&#60;T>): void

*Defined in [packages/core/src/typings.ts:232](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L232)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md)&#60;T> |

**Returns:** void

___

### removeProperty

▸ **removeProperty**(`name`: string, `sync?`: boolean): void

*Defined in [packages/core/src/typings.ts:203](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L203)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`name` | string | - |
`sync` | boolean | true |

**Returns:** void

___

### sync

▸ **sync**(`initIndexes?`: boolean): void

*Defined in [packages/core/src/typings.ts:213](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L213)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`initIndexes` | boolean | false |

**Returns:** void
