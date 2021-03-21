---
id: "core.entitymetadata"
title: "Class: EntityMetadata<T>"
sidebar_label: "EntityMetadata"
custom_edit_url: null
hide_title: true
---

# Class: EntityMetadata<T\>

[core](../modules/core.md).EntityMetadata

## Type parameters

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | *any* |

## Constructors

### constructor

\+ **new EntityMetadata**<T\>(`meta?`: *Partial*<[*EntityMetadata*](core.entitymetadata.md)<any\>\>): [*EntityMetadata*](core.entitymetadata.md)<T\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | *Partial*<[*EntityMetadata*](core.entitymetadata.md)<any\>\> |

**Returns:** [*EntityMetadata*](core.entitymetadata.md)<T\>

Defined in: [packages/core/src/typings.ts:191](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L191)

## Properties

### abstract

• **abstract**: *boolean*

Defined in: [packages/core/src/typings.ts:307](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L307)

___

### class

• **class**: [*Constructor*](../modules/core.md#constructor)<T\>

Defined in: [packages/core/src/typings.ts:306](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L306)

___

### className

• **className**: *string*

Defined in: [packages/core/src/typings.ts:279](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L279)

___

### collection

• **collection**: *string*

Defined in: [packages/core/src/typings.ts:290](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L290)

___

### comment

• `Optional` **comment**: *string*

Defined in: [packages/core/src/typings.ts:310](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L310)

___

### comparableProps

• **comparableProps**: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>[]

Defined in: [packages/core/src/typings.ts:299](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L299)

___

### compositePK

• **compositePK**: *boolean*

Defined in: [packages/core/src/typings.ts:293](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L293)

___

### constructorParams

• **constructorParams**: *string*[]

Defined in: [packages/core/src/typings.ts:286](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L286)

___

### customRepository

• **customRepository**: () => [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](core.entityrepository.md)<T\>\>

#### Type declaration:

▸ (): [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](core.entityrepository.md)<T\>\>

**Returns:** [*Constructor*](../modules/core.md#constructor)<[*EntityRepository*](core.entityrepository.md)<T\>\>

Defined in: [packages/core/src/typings.ts:303](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L303)

Defined in: [packages/core/src/typings.ts:303](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L303)

___

### discriminatorColumn

• `Optional` **discriminatorColumn**: *string*

Defined in: [packages/core/src/typings.ts:282](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L282)

___

### discriminatorMap

• `Optional` **discriminatorMap**: [*Dictionary*](../modules/core.md#dictionary)<string\>

Defined in: [packages/core/src/typings.ts:284](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L284)

___

### discriminatorValue

• `Optional` **discriminatorValue**: *string*

Defined in: [packages/core/src/typings.ts:283](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L283)

___

### embeddable

• **embeddable**: *boolean*

Defined in: [packages/core/src/typings.ts:285](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L285)

___

### extends

• **extends**: *string*

Defined in: [packages/core/src/typings.ts:289](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L289)

___

### filters

• **filters**: [*Dictionary*](../modules/core.md#dictionary)<FilterDef<T\>\>

Defined in: [packages/core/src/typings.ts:309](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L309)

___

### forceConstructor

• **forceConstructor**: *boolean*

Defined in: [packages/core/src/typings.ts:287](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L287)

___

### hooks

• **hooks**: *Partial*<Record<*onInit* \| *beforeCreate* \| *afterCreate* \| *beforeUpdate* \| *afterUpdate* \| *beforeDelete* \| *afterDelete* \| *beforeFlush* \| *onFlush* \| *afterFlush* \| *beforeTransactionStart* \| *afterTransactionStart* \| *beforeTransactionCommit* \| *afterTransactionCommit* \| *beforeTransactionRollback* \| *afterTransactionRollback*, *string* & keyof T[]\>\>

Defined in: [packages/core/src/typings.ts:304](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L304)

___

### hydrateProps

• **hydrateProps**: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>[]

Defined in: [packages/core/src/typings.ts:300](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L300)

___

### indexes

• **indexes**: { `name?`: *string* ; `options?`: [*Dictionary*](../modules/core.md#dictionary)<any\> ; `properties`: keyof T & *string* \| keyof T & *string*[] ; `type?`: *string*  }[]

Defined in: [packages/core/src/typings.ts:301](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L301)

___

### name

• `Optional` **name**: *string*

Defined in: [packages/core/src/typings.ts:278](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L278)

___

### path

• **path**: *string*

Defined in: [packages/core/src/typings.ts:291](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L291)

___

### pivotTable

• **pivotTable**: *boolean*

Defined in: [packages/core/src/typings.ts:281](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L281)

___

### primaryKeys

• **primaryKeys**: keyof T & *string*[]

Defined in: [packages/core/src/typings.ts:292](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L292)

___

### properties

• **properties**: { [K in string]: EntityProperty<T\>}

Defined in: [packages/core/src/typings.ts:296](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L296)

___

### propertyOrder

• `Readonly` **propertyOrder**: *Map*<string, number\>

Defined in: [packages/core/src/typings.ts:191](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L191)

___

### props

• **props**: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>[]

Defined in: [packages/core/src/typings.ts:297](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L297)

___

### prototype

• **prototype**: T

Defined in: [packages/core/src/typings.ts:305](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L305)

___

### readonly

• `Optional` **readonly**: *boolean*

Defined in: [packages/core/src/typings.ts:312](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L312)

___

### relations

• **relations**: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>[]

Defined in: [packages/core/src/typings.ts:298](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L298)

___

### root

• **root**: [*EntityMetadata*](core.entitymetadata.md)<T\>

Defined in: [packages/core/src/typings.ts:313](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L313)

___

### selfReferencing

• `Optional` **selfReferencing**: *boolean*

Defined in: [packages/core/src/typings.ts:311](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L311)

___

### serializedPrimaryKey

• **serializedPrimaryKey**: keyof T & *string*

Defined in: [packages/core/src/typings.ts:295](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L295)

___

### tableName

• **tableName**: *string*

Defined in: [packages/core/src/typings.ts:280](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L280)

___

### toJsonParams

• **toJsonParams**: *string*[]

Defined in: [packages/core/src/typings.ts:288](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L288)

___

### uniques

• **uniques**: { `name?`: *string* ; `options?`: [*Dictionary*](../modules/core.md#dictionary)<any\> ; `properties`: keyof T & *string* \| keyof T & *string*[]  }[]

Defined in: [packages/core/src/typings.ts:302](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L302)

___

### useCache

• **useCache**: *boolean*

Defined in: [packages/core/src/typings.ts:308](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L308)

___

### versionProperty

• **versionProperty**: keyof T & *string*

Defined in: [packages/core/src/typings.ts:294](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L294)

## Methods

### addProperty

▸ **addProperty**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>, `sync?`: *boolean*): *void*

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> | - |
`sync` | *boolean* | true |

**Returns:** *void*

Defined in: [packages/core/src/typings.ts:204](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L204)

___

### getPrimaryProps

▸ **getPrimaryProps**(): [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>[]

**Returns:** [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>[]

Defined in: [packages/core/src/typings.ts:224](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L224)

___

### initIndexes

▸ `Private`**initIndexes**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/typings.ts:247](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L247)

___

### removeProperty

▸ **removeProperty**(`name`: *string*, `sync?`: *boolean*): *void*

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`name` | *string* | - |
`sync` | *boolean* | true |

**Returns:** *void*

Defined in: [packages/core/src/typings.ts:214](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L214)

___

### sync

▸ **sync**(`initIndexes?`: *boolean*): *void*

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`initIndexes` | *boolean* | false |

**Returns:** *void*

Defined in: [packages/core/src/typings.ts:228](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L228)
