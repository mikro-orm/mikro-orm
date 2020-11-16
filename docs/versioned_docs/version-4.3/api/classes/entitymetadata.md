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

*Defined in [packages/core/src/typings.ts:190](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L190)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`meta` | Partial&#60;[EntityMetadata](entitymetadata.md)> | {} |

**Returns:** [EntityMetadata](entitymetadata.md)

## Properties

### abstract

•  **abstract**: boolean

*Defined in [packages/core/src/typings.ts:305](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L305)*

___

### class

•  **class**: [Constructor](../index.md#constructor)&#60;T>

*Defined in [packages/core/src/typings.ts:304](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L304)*

___

### className

•  **className**: string

*Defined in [packages/core/src/typings.ts:278](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L278)*

___

### collection

•  **collection**: string

*Defined in [packages/core/src/typings.ts:288](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L288)*

___

### comment

• `Optional` **comment**: string

*Defined in [packages/core/src/typings.ts:308](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L308)*

___

### comparableProps

•  **comparableProps**: [EntityProperty](../interfaces/entityproperty.md)&#60;T>[]

*Defined in [packages/core/src/typings.ts:297](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L297)*

___

### compositePK

•  **compositePK**: boolean

*Defined in [packages/core/src/typings.ts:291](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L291)*

___

### constructorParams

•  **constructorParams**: string[]

*Defined in [packages/core/src/typings.ts:285](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L285)*

___

### customRepository

•  **customRepository**: () => [Constructor](../index.md#constructor)&#60;[EntityRepository](entityrepository.md)&#60;T>>

*Defined in [packages/core/src/typings.ts:301](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L301)*

___

### discriminatorColumn

• `Optional` **discriminatorColumn**: string

*Defined in [packages/core/src/typings.ts:281](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L281)*

___

### discriminatorMap

• `Optional` **discriminatorMap**: [Dictionary](../index.md#dictionary)&#60;string>

*Defined in [packages/core/src/typings.ts:283](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L283)*

___

### discriminatorValue

• `Optional` **discriminatorValue**: string

*Defined in [packages/core/src/typings.ts:282](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L282)*

___

### embeddable

•  **embeddable**: boolean

*Defined in [packages/core/src/typings.ts:284](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L284)*

___

### extends

•  **extends**: string

*Defined in [packages/core/src/typings.ts:287](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L287)*

___

### filters

•  **filters**: [Dictionary](../index.md#dictionary)&#60;[FilterDef](../index.md#filterdef)&#60;T>>

*Defined in [packages/core/src/typings.ts:307](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L307)*

___

### hooks

•  **hooks**: Partial&#60;Record&#60;keyof *typeof* EventType, string & keyof T[]>>

*Defined in [packages/core/src/typings.ts:302](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L302)*

___

### hydrateProps

•  **hydrateProps**: [EntityProperty](../interfaces/entityproperty.md)&#60;T>[]

*Defined in [packages/core/src/typings.ts:298](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L298)*

___

### indexes

•  **indexes**: { name?: string ; options?: [Dictionary](../index.md#dictionary) ; properties: keyof T & string \| keyof T & string[] ; type?: string  }[]

*Defined in [packages/core/src/typings.ts:299](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L299)*

___

### name

• `Optional` **name**: string

*Defined in [packages/core/src/typings.ts:277](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L277)*

___

### path

•  **path**: string

*Defined in [packages/core/src/typings.ts:289](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L289)*

___

### pivotTable

•  **pivotTable**: boolean

*Defined in [packages/core/src/typings.ts:280](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L280)*

___

### primaryKeys

•  **primaryKeys**: keyof T & string[]

*Defined in [packages/core/src/typings.ts:290](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L290)*

___

### properties

•  **properties**: {}

*Defined in [packages/core/src/typings.ts:294](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L294)*

___

### propertyOrder

• `Readonly` **propertyOrder**: Map&#60;string, number> = new Map&#60;string, number>()

*Defined in [packages/core/src/typings.ts:190](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L190)*

___

### props

•  **props**: [EntityProperty](../interfaces/entityproperty.md)&#60;T>[]

*Defined in [packages/core/src/typings.ts:295](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L295)*

___

### prototype

•  **prototype**: T

*Defined in [packages/core/src/typings.ts:303](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L303)*

___

### readonly

• `Optional` **readonly**: boolean

*Defined in [packages/core/src/typings.ts:310](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L310)*

___

### relations

•  **relations**: [EntityProperty](../interfaces/entityproperty.md)&#60;T>[]

*Defined in [packages/core/src/typings.ts:296](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L296)*

___

### root

•  **root**: [EntityMetadata](entitymetadata.md)&#60;T>

*Defined in [packages/core/src/typings.ts:311](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L311)*

___

### selfReferencing

• `Optional` **selfReferencing**: boolean

*Defined in [packages/core/src/typings.ts:309](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L309)*

___

### serializedPrimaryKey

•  **serializedPrimaryKey**: keyof T & string

*Defined in [packages/core/src/typings.ts:293](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L293)*

___

### tableName

•  **tableName**: string

*Defined in [packages/core/src/typings.ts:279](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L279)*

___

### toJsonParams

•  **toJsonParams**: string[]

*Defined in [packages/core/src/typings.ts:286](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L286)*

___

### uniques

•  **uniques**: { name?: string ; options?: [Dictionary](../index.md#dictionary) ; properties: keyof T & string \| keyof T & string[]  }[]

*Defined in [packages/core/src/typings.ts:300](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L300)*

___

### useCache

•  **useCache**: boolean

*Defined in [packages/core/src/typings.ts:306](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L306)*

___

### versionProperty

•  **versionProperty**: keyof T & string

*Defined in [packages/core/src/typings.ts:292](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L292)*

## Methods

### addProperty

▸ **addProperty**(`prop`: [EntityProperty](../interfaces/entityproperty.md)&#60;T>, `sync?`: boolean): void

*Defined in [packages/core/src/typings.ts:203](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L203)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md)&#60;T> | - |
`sync` | boolean | true |

**Returns:** void

___

### getPrimaryProps

▸ **getPrimaryProps**(): [EntityProperty](../interfaces/entityproperty.md)&#60;T>[]

*Defined in [packages/core/src/typings.ts:223](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L223)*

**Returns:** [EntityProperty](../interfaces/entityproperty.md)&#60;T>[]

___

### initIndexes

▸ `Private`**initIndexes**(`prop`: [EntityProperty](../interfaces/entityproperty.md)&#60;T>): void

*Defined in [packages/core/src/typings.ts:246](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L246)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md)&#60;T> |

**Returns:** void

___

### removeProperty

▸ **removeProperty**(`name`: string, `sync?`: boolean): void

*Defined in [packages/core/src/typings.ts:213](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L213)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`name` | string | - |
`sync` | boolean | true |

**Returns:** void

___

### sync

▸ **sync**(`initIndexes?`: boolean): void

*Defined in [packages/core/src/typings.ts:227](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L227)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`initIndexes` | boolean | false |

**Returns:** void
