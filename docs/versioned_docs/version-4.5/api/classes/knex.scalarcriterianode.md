---
id: "knex.scalarcriterianode"
title: "Class: ScalarCriteriaNode"
sidebar_label: "ScalarCriteriaNode"
custom_edit_url: null
hide_title: true
---

# Class: ScalarCriteriaNode

[knex](../modules/knex.md).ScalarCriteriaNode

## Hierarchy

* [*CriteriaNode*](knex.criterianode.md)

  ↳ **ScalarCriteriaNode**

## Constructors

### constructor

\+ **new ScalarCriteriaNode**(`metadata`: [*MetadataStorage*](core.metadatastorage.md), `entityName`: *string*, `parent?`: [*ICriteriaNode*](../interfaces/knex.icriterianode.md), `key?`: *string*, `validate?`: *boolean*): [*ScalarCriteriaNode*](knex.scalarcriterianode.md)

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) | - |
`entityName` | *string* | - |
`parent?` | [*ICriteriaNode*](../interfaces/knex.icriterianode.md) | - |
`key?` | *string* | - |
`validate` | *boolean* | true |

**Returns:** [*ScalarCriteriaNode*](knex.scalarcriterianode.md)

Inherited from: [CriteriaNode](knex.criterianode.md)

Defined in: [packages/knex/src/query/CriteriaNode.ts:12](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/CriteriaNode.ts#L12)

## Properties

### entityName

• `Readonly` **entityName**: *string*

Inherited from: [CriteriaNode](knex.criterianode.md).[entityName](knex.criterianode.md#entityname)

___

### key

• `Optional` `Readonly` **key**: *string*

Inherited from: [CriteriaNode](knex.criterianode.md).[key](knex.criterianode.md#key)

___

### metadata

• `Protected` `Readonly` **metadata**: [*MetadataStorage*](core.metadatastorage.md)

Inherited from: [CriteriaNode](knex.criterianode.md).[metadata](knex.criterianode.md#metadata)

___

### parent

• `Optional` `Readonly` **parent**: [*ICriteriaNode*](../interfaces/knex.icriterianode.md)

Inherited from: [CriteriaNode](knex.criterianode.md).[parent](knex.criterianode.md#parent)

___

### payload

• **payload**: *any*

Inherited from: [CriteriaNode](knex.criterianode.md).[payload](knex.criterianode.md#payload)

Defined in: [packages/knex/src/query/CriteriaNode.ts:11](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/CriteriaNode.ts#L11)

___

### prop

• `Optional` **prop**: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>

Inherited from: [CriteriaNode](knex.criterianode.md).[prop](knex.criterianode.md#prop)

Defined in: [packages/knex/src/query/CriteriaNode.ts:12](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/CriteriaNode.ts#L12)

## Methods

### [custom]

▸ **[custom]**(): *string*

**Returns:** *string*

Inherited from: [CriteriaNode](knex.criterianode.md)

Defined in: [packages/knex/src/query/CriteriaNode.ts:119](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/CriteriaNode.ts#L119)

___

### getPath

▸ **getPath**(): *string*

**Returns:** *string*

Inherited from: [CriteriaNode](knex.criterianode.md)

Defined in: [packages/knex/src/query/CriteriaNode.ts:78](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/CriteriaNode.ts#L78)

___

### getPivotPath

▸ **getPivotPath**(`path`: *string*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`path` | *string* |

**Returns:** *string*

Inherited from: [CriteriaNode](knex.criterianode.md)

Defined in: [packages/knex/src/query/CriteriaNode.ts:115](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/CriteriaNode.ts#L115)

___

### process

▸ **process**<T\>(`qb`: [*IQueryBuilder*](../interfaces/knex.iquerybuilder.md)<T\>, `alias?`: *string*): *any*

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`qb` | [*IQueryBuilder*](../interfaces/knex.iquerybuilder.md)<T\> |
`alias?` | *string* |

**Returns:** *any*

Overrides: [CriteriaNode](knex.criterianode.md)

Defined in: [packages/knex/src/query/ScalarCriteriaNode.ts:7](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/ScalarCriteriaNode.ts#L7)

___

### renameFieldToPK

▸ **renameFieldToPK**<T\>(`qb`: [*IQueryBuilder*](../interfaces/knex.iquerybuilder.md)<T\>): *string*

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`qb` | [*IQueryBuilder*](../interfaces/knex.iquerybuilder.md)<T\> |

**Returns:** *string*

Inherited from: [CriteriaNode](knex.criterianode.md)

Defined in: [packages/knex/src/query/CriteriaNode.ts:64](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/CriteriaNode.ts#L64)

___

### shouldInline

▸ **shouldInline**(`payload`: *any*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`payload` | *any* |

**Returns:** *boolean*

Inherited from: [CriteriaNode](knex.criterianode.md)

Defined in: [packages/knex/src/query/CriteriaNode.ts:36](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/CriteriaNode.ts#L36)

___

### shouldJoin

▸ **shouldJoin**(): *boolean*

**Returns:** *boolean*

Defined in: [packages/knex/src/query/ScalarCriteriaNode.ts:25](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/ScalarCriteriaNode.ts#L25)

___

### shouldRename

▸ **shouldRename**(`payload`: *any*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`payload` | *any* |

**Returns:** *boolean*

Inherited from: [CriteriaNode](knex.criterianode.md)

Defined in: [packages/knex/src/query/CriteriaNode.ts:44](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/CriteriaNode.ts#L44)

___

### willAutoJoin

▸ **willAutoJoin**<T\>(`qb`: [*IQueryBuilder*](../interfaces/knex.iquerybuilder.md)<T\>, `alias?`: *string*): *boolean*

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`qb` | [*IQueryBuilder*](../interfaces/knex.iquerybuilder.md)<T\> |
`alias?` | *string* |

**Returns:** *boolean*

Inherited from: [CriteriaNode](knex.criterianode.md)

Defined in: [packages/knex/src/query/CriteriaNode.ts:40](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/CriteriaNode.ts#L40)

___

### isCustomExpression

▸ `Static`**isCustomExpression**(`field`: *string*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`field` | *string* |

**Returns:** *boolean*

Inherited from: [CriteriaNode](knex.criterianode.md)

Defined in: [packages/knex/src/query/CriteriaNode.ts:123](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/query/CriteriaNode.ts#L123)
