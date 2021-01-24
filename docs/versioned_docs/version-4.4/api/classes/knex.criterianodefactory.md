---
id: "knex.criterianodefactory"
title: "Class: CriteriaNodeFactory"
sidebar_label: "CriteriaNodeFactory"
hide_title: true
---

# Class: CriteriaNodeFactory

[knex](../modules/knex.md).CriteriaNodeFactory

## Hierarchy

* **CriteriaNodeFactory**

## Constructors

### constructor

\+ **new CriteriaNodeFactory**(): [*CriteriaNodeFactory*](knex.criterianodefactory.md)

**Returns:** [*CriteriaNodeFactory*](knex.criterianodefactory.md)

## Methods

### createArrayNode

▸ `Static`**createArrayNode**(`metadata`: [*MetadataStorage*](core.metadatastorage.md), `entityName`: *string*, `payload`: *any*[], `parent?`: [*ICriteriaNode*](../interfaces/knex.icriterianode.md), `key?`: *string*): [*ICriteriaNode*](../interfaces/knex.icriterianode.md)

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |
`entityName` | *string* |
`payload` | *any*[] |
`parent?` | [*ICriteriaNode*](../interfaces/knex.icriterianode.md) |
`key?` | *string* |

**Returns:** [*ICriteriaNode*](../interfaces/knex.icriterianode.md)

Defined in: [packages/knex/src/query/CriteriaNodeFactory.ts:32](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNodeFactory.ts#L32)

___

### createNode

▸ `Static`**createNode**(`metadata`: [*MetadataStorage*](core.metadatastorage.md), `entityName`: *string*, `payload`: *any*, `parent?`: [*ICriteriaNode*](../interfaces/knex.icriterianode.md), `key?`: *string*): [*ICriteriaNode*](../interfaces/knex.icriterianode.md)

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |
`entityName` | *string* |
`payload` | *any* |
`parent?` | [*ICriteriaNode*](../interfaces/knex.icriterianode.md) |
`key?` | *string* |

**Returns:** [*ICriteriaNode*](../interfaces/knex.icriterianode.md)

Defined in: [packages/knex/src/query/CriteriaNodeFactory.ts:10](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNodeFactory.ts#L10)

___

### createObjectItemNode

▸ `Static`**createObjectItemNode**(`metadata`: [*MetadataStorage*](core.metadatastorage.md), `entityName`: *string*, `node`: [*ICriteriaNode*](../interfaces/knex.icriterianode.md), `payload`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>, `item`: *string*, `meta?`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>): [*ICriteriaNode*](../interfaces/knex.icriterianode.md)

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |
`entityName` | *string* |
`node` | [*ICriteriaNode*](../interfaces/knex.icriterianode.md) |
`payload` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> |
`item` | *string* |
`meta?` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |

**Returns:** [*ICriteriaNode*](../interfaces/knex.icriterianode.md)

Defined in: [packages/knex/src/query/CriteriaNodeFactory.ts:55](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNodeFactory.ts#L55)

___

### createObjectNode

▸ `Static`**createObjectNode**(`metadata`: [*MetadataStorage*](core.metadatastorage.md), `entityName`: *string*, `payload`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>, `parent?`: [*ICriteriaNode*](../interfaces/knex.icriterianode.md), `key?`: *string*): [*ICriteriaNode*](../interfaces/knex.icriterianode.md)

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |
`entityName` | *string* |
`payload` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> |
`parent?` | [*ICriteriaNode*](../interfaces/knex.icriterianode.md) |
`key?` | *string* |

**Returns:** [*ICriteriaNode*](../interfaces/knex.icriterianode.md)

Defined in: [packages/knex/src/query/CriteriaNodeFactory.ts:39](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNodeFactory.ts#L39)

___

### createScalarNode

▸ `Static`**createScalarNode**(`metadata`: [*MetadataStorage*](core.metadatastorage.md), `entityName`: *string*, `payload`: *any*, `parent?`: [*ICriteriaNode*](../interfaces/knex.icriterianode.md), `key?`: *string*): [*ICriteriaNode*](../interfaces/knex.icriterianode.md)

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |
`entityName` | *string* |
`payload` | *any* |
`parent?` | [*ICriteriaNode*](../interfaces/knex.icriterianode.md) |
`key?` | *string* |

**Returns:** [*ICriteriaNode*](../interfaces/knex.icriterianode.md)

Defined in: [packages/knex/src/query/CriteriaNodeFactory.ts:25](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/query/CriteriaNodeFactory.ts#L25)
