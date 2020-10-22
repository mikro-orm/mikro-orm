---
id: "criterianodefactory"
title: "Class: CriteriaNodeFactory"
sidebar_label: "CriteriaNodeFactory"
---

## Hierarchy

* **CriteriaNodeFactory**

## Methods

### createArrayNode

▸ `Static`**createArrayNode**(`metadata`: MetadataStorage, `entityName`: string, `payload`: any[], `parent?`: [ICriteriaNode](../interfaces/icriterianode.md), `key?`: string): [ICriteriaNode](../interfaces/icriterianode.md)

*Defined in [packages/knex/src/query/CriteriaNodeFactory.ts:32](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/CriteriaNodeFactory.ts#L32)*

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | MetadataStorage |
`entityName` | string |
`payload` | any[] |
`parent?` | [ICriteriaNode](../interfaces/icriterianode.md) |
`key?` | string |

**Returns:** [ICriteriaNode](../interfaces/icriterianode.md)

___

### createNode

▸ `Static`**createNode**(`metadata`: MetadataStorage, `entityName`: string, `payload`: any, `parent?`: [ICriteriaNode](../interfaces/icriterianode.md), `key?`: string): [ICriteriaNode](../interfaces/icriterianode.md)

*Defined in [packages/knex/src/query/CriteriaNodeFactory.ts:10](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/CriteriaNodeFactory.ts#L10)*

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | MetadataStorage |
`entityName` | string |
`payload` | any |
`parent?` | [ICriteriaNode](../interfaces/icriterianode.md) |
`key?` | string |

**Returns:** [ICriteriaNode](../interfaces/icriterianode.md)

___

### createObjectItemNode

▸ `Static`**createObjectItemNode**(`metadata`: MetadataStorage, `entityName`: string, `node`: [ICriteriaNode](../interfaces/icriterianode.md), `payload`: [Dictionary](../index.md#dictionary), `item`: string, `meta?`: EntityMetadata): [ICriteriaNode](../interfaces/icriterianode.md)

*Defined in [packages/knex/src/query/CriteriaNodeFactory.ts:55](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/CriteriaNodeFactory.ts#L55)*

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | MetadataStorage |
`entityName` | string |
`node` | [ICriteriaNode](../interfaces/icriterianode.md) |
`payload` | [Dictionary](../index.md#dictionary) |
`item` | string |
`meta?` | EntityMetadata |

**Returns:** [ICriteriaNode](../interfaces/icriterianode.md)

___

### createObjectNode

▸ `Static`**createObjectNode**(`metadata`: MetadataStorage, `entityName`: string, `payload`: [Dictionary](../index.md#dictionary), `parent?`: [ICriteriaNode](../interfaces/icriterianode.md), `key?`: string): [ICriteriaNode](../interfaces/icriterianode.md)

*Defined in [packages/knex/src/query/CriteriaNodeFactory.ts:39](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/CriteriaNodeFactory.ts#L39)*

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | MetadataStorage |
`entityName` | string |
`payload` | [Dictionary](../index.md#dictionary) |
`parent?` | [ICriteriaNode](../interfaces/icriterianode.md) |
`key?` | string |

**Returns:** [ICriteriaNode](../interfaces/icriterianode.md)

___

### createScalarNode

▸ `Static`**createScalarNode**(`metadata`: MetadataStorage, `entityName`: string, `payload`: any, `parent?`: [ICriteriaNode](../interfaces/icriterianode.md), `key?`: string): [ICriteriaNode](../interfaces/icriterianode.md)

*Defined in [packages/knex/src/query/CriteriaNodeFactory.ts:25](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/knex/src/query/CriteriaNodeFactory.ts#L25)*

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | MetadataStorage |
`entityName` | string |
`payload` | any |
`parent?` | [ICriteriaNode](../interfaces/icriterianode.md) |
`key?` | string |

**Returns:** [ICriteriaNode](../interfaces/icriterianode.md)
