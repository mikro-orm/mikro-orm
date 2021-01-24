---
id: "knex.criterianode"
title: "Class: CriteriaNode"
sidebar_label: "CriteriaNode"
hide_title: true
---

# Class: CriteriaNode

[knex](../modules/knex.md).CriteriaNode

Helper for working with deeply nested where/orderBy/having criteria. Uses composite pattern to build tree from the payload.
Auto-joins relations and converts payload from { books: { publisher: { name: '...' } } } to { 'publisher_alias.name': '...' }

## Hierarchy

* **CriteriaNode**

  ↳ [*ArrayCriteriaNode*](knex.arraycriterianode.md)

  ↳ [*ObjectCriteriaNode*](knex.objectcriterianode.md)

  ↳ [*ScalarCriteriaNode*](knex.scalarcriterianode.md)

## Constructors

### constructor

\+ **new CriteriaNode**(`metadata`: [*MetadataStorage*](core.metadatastorage.md), `entityName`: *string*, `parent?`: [*ICriteriaNode*](../interfaces/knex.icriterianode.md), `key?`: *string*, `validate?`: *boolean*): [*CriteriaNode*](knex.criterianode.md)

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) | - |
`entityName` | *string* | - |
`parent?` | [*ICriteriaNode*](../interfaces/knex.icriterianode.md) | - |
`key?` | *string* | - |
`validate` | *boolean* | true |

**Returns:** [*CriteriaNode*](knex.criterianode.md)

Defined in: [packages/knex/src/query/CriteriaNode.ts:12](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNode.ts#L12)

## Properties

### entityName

• `Readonly` **entityName**: *string*

___

### key

• `Optional` `Readonly` **key**: *undefined* \| *string*

___

### metadata

• `Protected` `Readonly` **metadata**: [*MetadataStorage*](core.metadatastorage.md)

___

### parent

• `Optional` `Readonly` **parent**: *undefined* \| [*ICriteriaNode*](../interfaces/knex.icriterianode.md)

___

### payload

• **payload**: *any*

Defined in: [packages/knex/src/query/CriteriaNode.ts:11](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNode.ts#L11)

___

### prop

• `Optional` **prop**: *undefined* \| [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>

Defined in: [packages/knex/src/query/CriteriaNode.ts:12](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNode.ts#L12)

## Methods

### \_\_@custom@36825

▸ **__@custom@36825**(): *string*

**Returns:** *string*

Defined in: [packages/knex/src/query/CriteriaNode.ts:119](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNode.ts#L119)

___

### getPath

▸ **getPath**(): *string*

**Returns:** *string*

Defined in: [packages/knex/src/query/CriteriaNode.ts:78](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNode.ts#L78)

___

### getPivotPath

▸ **getPivotPath**(`path`: *string*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`path` | *string* |

**Returns:** *string*

Defined in: [packages/knex/src/query/CriteriaNode.ts:115](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNode.ts#L115)

___

### isPivotJoin

▸ `Private`**isPivotJoin**(): *boolean*

**Returns:** *boolean*

Defined in: [packages/knex/src/query/CriteriaNode.ts:103](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNode.ts#L103)

___

### process

▸ **process**<T\>(`qb`: [*IQueryBuilder*](../interfaces/knex.iquerybuilder.md)<T\>, `alias?`: *string*): *any*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`qb` | [*IQueryBuilder*](../interfaces/knex.iquerybuilder.md)<T\> |
`alias?` | *string* |

**Returns:** *any*

Defined in: [packages/knex/src/query/CriteriaNode.ts:32](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNode.ts#L32)

___

### renameFieldToPK

▸ **renameFieldToPK**<T\>(`qb`: [*IQueryBuilder*](../interfaces/knex.iquerybuilder.md)<T\>): *string*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`qb` | [*IQueryBuilder*](../interfaces/knex.iquerybuilder.md)<T\> |

**Returns:** *string*

Defined in: [packages/knex/src/query/CriteriaNode.ts:64](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNode.ts#L64)

___

### shouldInline

▸ **shouldInline**(`payload`: *any*): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`payload` | *any* |

**Returns:** *boolean*

Defined in: [packages/knex/src/query/CriteriaNode.ts:36](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNode.ts#L36)

___

### shouldRename

▸ **shouldRename**(`payload`: *any*): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`payload` | *any* |

**Returns:** *boolean*

Defined in: [packages/knex/src/query/CriteriaNode.ts:44](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNode.ts#L44)

___

### willAutoJoin

▸ **willAutoJoin**<T\>(`qb`: [*IQueryBuilder*](../interfaces/knex.iquerybuilder.md)<T\>, `alias?`: *string*): *boolean*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`qb` | [*IQueryBuilder*](../interfaces/knex.iquerybuilder.md)<T\> |
`alias?` | *string* |

**Returns:** *boolean*

Defined in: [packages/knex/src/query/CriteriaNode.ts:40](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNode.ts#L40)

___

### isCustomExpression

▸ `Static`**isCustomExpression**(`field`: *string*): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`field` | *string* |

**Returns:** *boolean*

Defined in: [packages/knex/src/query/CriteriaNode.ts:123](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNode.ts#L123)
