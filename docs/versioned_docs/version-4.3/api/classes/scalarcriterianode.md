---
id: "scalarcriterianode"
title: "Class: ScalarCriteriaNode"
sidebar_label: "ScalarCriteriaNode"
---

## Hierarchy

* [CriteriaNode](criterianode.md)

  ↳ **ScalarCriteriaNode**

## Constructors

### constructor

\+ **new ScalarCriteriaNode**(`metadata`: MetadataStorage, `entityName`: string, `parent?`: [ICriteriaNode](../interfaces/icriterianode.md), `key?`: string, `validate?`: boolean): [ScalarCriteriaNode](scalarcriterianode.md)

*Inherited from [CriteriaNode](criterianode.md).[constructor](criterianode.md#constructor)*

*Defined in [packages/knex/src/query/CriteriaNode.ts:12](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L12)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`metadata` | MetadataStorage | - |
`entityName` | string | - |
`parent?` | [ICriteriaNode](../interfaces/icriterianode.md) | - |
`key?` | string | - |
`validate` | boolean | true |

**Returns:** [ScalarCriteriaNode](scalarcriterianode.md)

## Properties

### entityName

• `Readonly` **entityName**: string

*Inherited from [CriteriaNode](criterianode.md).[entityName](criterianode.md#entityname)*

*Defined in [packages/knex/src/query/CriteriaNode.ts:15](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L15)*

___

### key

• `Optional` `Readonly` **key**: string

*Inherited from [CriteriaNode](criterianode.md).[key](criterianode.md#key)*

*Defined in [packages/knex/src/query/CriteriaNode.ts:17](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L17)*

___

### metadata

• `Protected` `Readonly` **metadata**: MetadataStorage

*Inherited from [CriteriaNode](criterianode.md).[metadata](criterianode.md#metadata)*

*Defined in [packages/knex/src/query/CriteriaNode.ts:14](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L14)*

___

### parent

• `Optional` `Readonly` **parent**: [ICriteriaNode](../interfaces/icriterianode.md)

*Inherited from [CriteriaNode](criterianode.md).[parent](criterianode.md#parent)*

*Defined in [packages/knex/src/query/CriteriaNode.ts:16](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L16)*

___

### payload

•  **payload**: any

*Inherited from [CriteriaNode](criterianode.md).[payload](criterianode.md#payload)*

*Defined in [packages/knex/src/query/CriteriaNode.ts:11](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L11)*

___

### prop

• `Optional` **prop**: EntityProperty

*Inherited from [CriteriaNode](criterianode.md).[prop](criterianode.md#prop)*

*Defined in [packages/knex/src/query/CriteriaNode.ts:12](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L12)*

## Methods

### [inspect.custom]

▸ **[inspect.custom]**(): string

*Inherited from [CriteriaNode](criterianode.md).[[inspect.custom]](criterianode.md#[inspect.custom])*

*Defined in [packages/knex/src/query/CriteriaNode.ts:119](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L119)*

**Returns:** string

___

### getPath

▸ **getPath**(): string

*Inherited from [CriteriaNode](criterianode.md).[getPath](criterianode.md#getpath)*

*Defined in [packages/knex/src/query/CriteriaNode.ts:78](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L78)*

**Returns:** string

___

### getPivotPath

▸ **getPivotPath**(`path`: string): string

*Inherited from [CriteriaNode](criterianode.md).[getPivotPath](criterianode.md#getpivotpath)*

*Defined in [packages/knex/src/query/CriteriaNode.ts:115](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L115)*

#### Parameters:

Name | Type |
------ | ------ |
`path` | string |

**Returns:** string

___

### process

▸ **process**&#60;T>(`qb`: [IQueryBuilder](../interfaces/iquerybuilder.md)&#60;T>, `alias?`: string): any

*Overrides [CriteriaNode](criterianode.md).[process](criterianode.md#process)*

*Defined in [packages/knex/src/query/ScalarCriteriaNode.ts:7](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/ScalarCriteriaNode.ts#L7)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`qb` | [IQueryBuilder](../interfaces/iquerybuilder.md)&#60;T> |
`alias?` | string |

**Returns:** any

___

### renameFieldToPK

▸ **renameFieldToPK**&#60;T>(`qb`: [IQueryBuilder](../interfaces/iquerybuilder.md)&#60;T>): string

*Inherited from [CriteriaNode](criterianode.md).[renameFieldToPK](criterianode.md#renamefieldtopk)*

*Defined in [packages/knex/src/query/CriteriaNode.ts:64](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L64)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`qb` | [IQueryBuilder](../interfaces/iquerybuilder.md)&#60;T> |

**Returns:** string

___

### shouldInline

▸ **shouldInline**(`payload`: any): boolean

*Inherited from [CriteriaNode](criterianode.md).[shouldInline](criterianode.md#shouldinline)*

*Defined in [packages/knex/src/query/CriteriaNode.ts:36](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L36)*

#### Parameters:

Name | Type |
------ | ------ |
`payload` | any |

**Returns:** boolean

___

### shouldJoin

▸ **shouldJoin**(): boolean

*Defined in [packages/knex/src/query/ScalarCriteriaNode.ts:25](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/ScalarCriteriaNode.ts#L25)*

**Returns:** boolean

___

### shouldRename

▸ **shouldRename**(`payload`: any): boolean

*Inherited from [CriteriaNode](criterianode.md).[shouldRename](criterianode.md#shouldrename)*

*Defined in [packages/knex/src/query/CriteriaNode.ts:44](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L44)*

#### Parameters:

Name | Type |
------ | ------ |
`payload` | any |

**Returns:** boolean

___

### willAutoJoin

▸ **willAutoJoin**&#60;T>(`qb`: [IQueryBuilder](../interfaces/iquerybuilder.md)&#60;T>, `alias?`: string): boolean

*Inherited from [CriteriaNode](criterianode.md).[willAutoJoin](criterianode.md#willautojoin)*

*Defined in [packages/knex/src/query/CriteriaNode.ts:40](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L40)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`qb` | [IQueryBuilder](../interfaces/iquerybuilder.md)&#60;T> |
`alias?` | string |

**Returns:** boolean

___

### isCustomExpression

▸ `Static`**isCustomExpression**(`field`: string): boolean

*Inherited from [CriteriaNode](criterianode.md).[isCustomExpression](criterianode.md#iscustomexpression)*

*Defined in [packages/knex/src/query/CriteriaNode.ts:123](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L123)*

#### Parameters:

Name | Type |
------ | ------ |
`field` | string |

**Returns:** boolean
