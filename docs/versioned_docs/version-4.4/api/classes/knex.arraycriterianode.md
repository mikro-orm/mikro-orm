---
id: "knex.arraycriterianode"
title: "Class: ArrayCriteriaNode"
sidebar_label: "ArrayCriteriaNode"
hide_title: true
---

# Class: ArrayCriteriaNode

[knex](../modules/knex.md).ArrayCriteriaNode

## Hierarchy

* [*CriteriaNode*](knex.criterianode.md)

  ↳ **ArrayCriteriaNode**

## Constructors

### constructor

\+ **new ArrayCriteriaNode**(`metadata`: [*MetadataStorage*](core.metadatastorage.md), `entityName`: *string*, `parent?`: [*ICriteriaNode*](../interfaces/knex.icriterianode.md), `key?`: *string*, `validate?`: *boolean*): [*ArrayCriteriaNode*](knex.arraycriterianode.md)

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) | - |
`entityName` | *string* | - |
`parent?` | [*ICriteriaNode*](../interfaces/knex.icriterianode.md) | - |
`key?` | *string* | - |
`validate` | *boolean* | true |

**Returns:** [*ArrayCriteriaNode*](knex.arraycriterianode.md)

Inherited from: [CriteriaNode](knex.criterianode.md)

Defined in: [packages/knex/src/query/CriteriaNode.ts:12](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNode.ts#L12)

## Properties

### entityName

• `Readonly` **entityName**: *string*

Inherited from: [CriteriaNode](knex.criterianode.md).[entityName](knex.criterianode.md#entityname)

___

### key

• `Optional` `Readonly` **key**: *undefined* \| *string*

Inherited from: [CriteriaNode](knex.criterianode.md).[key](knex.criterianode.md#key)

___

### metadata

• `Protected` `Readonly` **metadata**: [*MetadataStorage*](core.metadatastorage.md)

Inherited from: [CriteriaNode](knex.criterianode.md).[metadata](knex.criterianode.md#metadata)

___

### parent

• `Optional` `Readonly` **parent**: *undefined* \| [*ICriteriaNode*](../interfaces/knex.icriterianode.md)

Inherited from: [CriteriaNode](knex.criterianode.md).[parent](knex.criterianode.md#parent)

___

### payload

• **payload**: *any*

Inherited from: [CriteriaNode](knex.criterianode.md).[payload](knex.criterianode.md#payload)

Defined in: [packages/knex/src/query/CriteriaNode.ts:11](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNode.ts#L11)

___

### prop

• `Optional` **prop**: *undefined* \| [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>

Inherited from: [CriteriaNode](knex.criterianode.md).[prop](knex.criterianode.md#prop)

Defined in: [packages/knex/src/query/CriteriaNode.ts:12](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNode.ts#L12)

## Methods

### \_\_@custom@36825

▸ **__@custom@36825**(): *string*

**Returns:** *string*

Inherited from: [CriteriaNode](knex.criterianode.md)

Defined in: [packages/knex/src/query/CriteriaNode.ts:119](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNode.ts#L119)

___

### getPath

▸ **getPath**(): *string*

**Returns:** *string*

Overrides: [CriteriaNode](knex.criterianode.md)

Defined in: [packages/knex/src/query/ArrayCriteriaNode.ts:18](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/ArrayCriteriaNode.ts#L18)

___

### getPivotPath

▸ **getPivotPath**(`path`: *string*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`path` | *string* |

**Returns:** *string*

Inherited from: [CriteriaNode](knex.criterianode.md)

Defined in: [packages/knex/src/query/CriteriaNode.ts:115](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNode.ts#L115)

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

Overrides: [CriteriaNode](knex.criterianode.md)

Defined in: [packages/knex/src/query/ArrayCriteriaNode.ts:6](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/ArrayCriteriaNode.ts#L6)

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

Inherited from: [CriteriaNode](knex.criterianode.md)

Defined in: [packages/knex/src/query/CriteriaNode.ts:64](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNode.ts#L64)

___

### shouldInline

▸ **shouldInline**(`payload`: *any*): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`payload` | *any* |

**Returns:** *boolean*

Inherited from: [CriteriaNode](knex.criterianode.md)

Defined in: [packages/knex/src/query/CriteriaNode.ts:36](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNode.ts#L36)

___

### shouldRename

▸ **shouldRename**(`payload`: *any*): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`payload` | *any* |

**Returns:** *boolean*

Inherited from: [CriteriaNode](knex.criterianode.md)

Defined in: [packages/knex/src/query/CriteriaNode.ts:44](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNode.ts#L44)

___

### willAutoJoin

▸ **willAutoJoin**<T\>(`qb`: [*IQueryBuilder*](../interfaces/knex.iquerybuilder.md)<T\>, `alias?`: *string*): *any*

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

Overrides: [CriteriaNode](knex.criterianode.md)

Defined in: [packages/knex/src/query/ArrayCriteriaNode.ts:12](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/ArrayCriteriaNode.ts#L12)

___

### isCustomExpression

▸ `Static`**isCustomExpression**(`field`: *string*): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`field` | *string* |

**Returns:** *boolean*

Inherited from: [CriteriaNode](knex.criterianode.md)

Defined in: [packages/knex/src/query/CriteriaNode.ts:123](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNode.ts#L123)
