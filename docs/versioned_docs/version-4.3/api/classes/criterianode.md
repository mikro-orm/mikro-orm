---
id: "criterianode"
title: "Class: CriteriaNode"
sidebar_label: "CriteriaNode"
---

Helper for working with deeply nested where/orderBy/having criteria. Uses composite pattern to build tree from the payload.
Auto-joins relations and converts payload from { books: { publisher: { name: '...' } } } to { 'publisher_alias.name': '...' }

## Hierarchy

* **CriteriaNode**

  ↳ [ObjectCriteriaNode](objectcriterianode.md)

  ↳ [ArrayCriteriaNode](arraycriterianode.md)

  ↳ [ScalarCriteriaNode](scalarcriterianode.md)

## Constructors

### constructor

\+ **new CriteriaNode**(`metadata`: MetadataStorage, `entityName`: string, `parent?`: [ICriteriaNode](../interfaces/icriterianode.md), `key?`: string, `validate?`: boolean): [CriteriaNode](criterianode.md)

*Defined in [packages/knex/src/query/CriteriaNode.ts:12](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L12)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`metadata` | MetadataStorage | - |
`entityName` | string | - |
`parent?` | [ICriteriaNode](../interfaces/icriterianode.md) | - |
`key?` | string | - |
`validate` | boolean | true |

**Returns:** [CriteriaNode](criterianode.md)

## Properties

### entityName

• `Readonly` **entityName**: string

*Defined in [packages/knex/src/query/CriteriaNode.ts:15](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L15)*

___

### key

• `Optional` `Readonly` **key**: string

*Defined in [packages/knex/src/query/CriteriaNode.ts:17](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L17)*

___

### metadata

• `Protected` `Readonly` **metadata**: MetadataStorage

*Defined in [packages/knex/src/query/CriteriaNode.ts:14](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L14)*

___

### parent

• `Optional` `Readonly` **parent**: [ICriteriaNode](../interfaces/icriterianode.md)

*Defined in [packages/knex/src/query/CriteriaNode.ts:16](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L16)*

___

### payload

•  **payload**: any

*Defined in [packages/knex/src/query/CriteriaNode.ts:11](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L11)*

___

### prop

• `Optional` **prop**: EntityProperty

*Defined in [packages/knex/src/query/CriteriaNode.ts:12](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L12)*

## Methods

### [inspect.custom]

▸ **[inspect.custom]**(): string

*Defined in [packages/knex/src/query/CriteriaNode.ts:119](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L119)*

**Returns:** string

___

### getPath

▸ **getPath**(): string

*Defined in [packages/knex/src/query/CriteriaNode.ts:78](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L78)*

**Returns:** string

___

### getPivotPath

▸ **getPivotPath**(`path`: string): string

*Defined in [packages/knex/src/query/CriteriaNode.ts:115](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L115)*

#### Parameters:

Name | Type |
------ | ------ |
`path` | string |

**Returns:** string

___

### isPivotJoin

▸ `Private`**isPivotJoin**(): boolean

*Defined in [packages/knex/src/query/CriteriaNode.ts:103](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L103)*

**Returns:** boolean

___

### process

▸ **process**&#60;T>(`qb`: [IQueryBuilder](../interfaces/iquerybuilder.md)&#60;T>, `alias?`: string): any

*Defined in [packages/knex/src/query/CriteriaNode.ts:32](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L32)*

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

*Defined in [packages/knex/src/query/CriteriaNode.ts:36](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L36)*

#### Parameters:

Name | Type |
------ | ------ |
`payload` | any |

**Returns:** boolean

___

### shouldRename

▸ **shouldRename**(`payload`: any): boolean

*Defined in [packages/knex/src/query/CriteriaNode.ts:44](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L44)*

#### Parameters:

Name | Type |
------ | ------ |
`payload` | any |

**Returns:** boolean

___

### willAutoJoin

▸ **willAutoJoin**&#60;T>(`qb`: [IQueryBuilder](../interfaces/iquerybuilder.md)&#60;T>, `alias?`: string): boolean

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

*Defined in [packages/knex/src/query/CriteriaNode.ts:123](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/knex/src/query/CriteriaNode.ts#L123)*

#### Parameters:

Name | Type |
------ | ------ |
`field` | string |

**Returns:** boolean
