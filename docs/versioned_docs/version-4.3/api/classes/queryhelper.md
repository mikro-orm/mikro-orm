---
id: "queryhelper"
title: "Class: QueryHelper"
sidebar_label: "QueryHelper"
---

## Hierarchy

* **QueryHelper**

## Properties

### SUPPORTED\_OPERATORS

▪ `Static` `Readonly` **SUPPORTED\_OPERATORS**: string[] = ['>', '&#60;', '&#60;=', '>=', '!', '!=', ':in', ':nin', ':gt', ':gte', ':lt', ':lte', ':ne', ':not']

*Defined in [packages/core/src/utils/QueryHelper.ts:10](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/QueryHelper.ts#L10)*

## Methods

### getActiveFilters

▸ `Static`**getActiveFilters**(`entityName`: string, `options`: [Dictionary](../index.md#dictionary)&#60;boolean \| [Dictionary](../index.md#dictionary)> \| string[] \| boolean, `filters`: [Dictionary](../index.md#dictionary)&#60;[FilterDef](../index.md#filterdef)&#60;any>>): [FilterDef](../index.md#filterdef)&#60;any>[]

*Defined in [packages/core/src/utils/QueryHelper.ts:144](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/QueryHelper.ts#L144)*

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`options` | [Dictionary](../index.md#dictionary)&#60;boolean \| [Dictionary](../index.md#dictionary)> \| string[] \| boolean |
`filters` | [Dictionary](../index.md#dictionary)&#60;[FilterDef](../index.md#filterdef)&#60;any>> |

**Returns:** [FilterDef](../index.md#filterdef)&#60;any>[]

___

### inlinePrimaryKeyObjects

▸ `Static`**inlinePrimaryKeyObjects**&#60;T>(`where`: [Dictionary](../index.md#dictionary), `meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `metadata`: [MetadataStorage](metadatastorage.md), `key?`: string): boolean

*Defined in [packages/core/src/utils/QueryHelper.ts:44](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/QueryHelper.ts#L44)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`where` | [Dictionary](../index.md#dictionary) |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`metadata` | [MetadataStorage](metadatastorage.md) |
`key?` | string |

**Returns:** boolean

___

### isFilterActive

▸ `Static`**isFilterActive**(`entityName`: string, `filterName`: string, `filter`: [FilterDef](../index.md#filterdef)&#60;any>, `options`: [Dictionary](../index.md#dictionary)&#60;boolean \| [Dictionary](../index.md#dictionary)>): boolean

*Defined in [packages/core/src/utils/QueryHelper.ts:165](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/QueryHelper.ts#L165)*

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`filterName` | string |
`filter` | [FilterDef](../index.md#filterdef)&#60;any> |
`options` | [Dictionary](../index.md#dictionary)&#60;boolean \| [Dictionary](../index.md#dictionary)> |

**Returns:** boolean

___

### isSupportedOperator

▸ `Static` `Private`**isSupportedOperator**(`key`: string): boolean

*Defined in [packages/core/src/utils/QueryHelper.ts:219](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/QueryHelper.ts#L219)*

#### Parameters:

Name | Type |
------ | ------ |
`key` | string |

**Returns:** boolean

___

### processCustomType

▸ `Static`**processCustomType**&#60;T>(`prop`: [EntityProperty](../interfaces/entityproperty.md)&#60;T>, `cond`: [FilterQuery](../index.md#filterquery)&#60;T>, `platform`: [Platform](platform.md), `key?`: string, `fromQuery?`: boolean): [FilterQuery](../index.md#filterquery)&#60;T>

*Defined in [packages/core/src/utils/QueryHelper.ts:177](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/QueryHelper.ts#L177)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md)&#60;T> |
`cond` | [FilterQuery](../index.md#filterquery)&#60;T> |
`platform` | [Platform](platform.md) |
`key?` | string |
`fromQuery?` | boolean |

**Returns:** [FilterQuery](../index.md#filterquery)&#60;T>

___

### processEntity

▸ `Static` `Private`**processEntity**(`entity`: [AnyEntity](../index.md#anyentity), `root?`: boolean): any

*Defined in [packages/core/src/utils/QueryHelper.ts:197](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/QueryHelper.ts#L197)*

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [AnyEntity](../index.md#anyentity) |
`root?` | boolean |

**Returns:** any

___

### processExpression

▸ `Static` `Private`**processExpression**&#60;T>(`expr`: string, `value`: T): [Dictionary](../index.md#dictionary)&#60;T>

*Defined in [packages/core/src/utils/QueryHelper.ts:207](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/QueryHelper.ts#L207)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`expr` | string |
`value` | T |

**Returns:** [Dictionary](../index.md#dictionary)&#60;T>

___

### processObjectParams

▸ `Static`**processObjectParams**(`params?`: [Dictionary](../index.md#dictionary)): any

*Defined in [packages/core/src/utils/QueryHelper.ts:36](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/QueryHelper.ts#L36)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`params` | [Dictionary](../index.md#dictionary) | {} |

**Returns:** any

___

### processParams

▸ `Static`**processParams**(`params`: any, `root?`: boolean): any

*Defined in [packages/core/src/utils/QueryHelper.ts:12](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/QueryHelper.ts#L12)*

#### Parameters:

Name | Type |
------ | ------ |
`params` | any |
`root?` | boolean |

**Returns:** any

___

### processWhere

▸ `Static`**processWhere**&#60;T>(`where`: [FilterQuery](../index.md#filterquery)&#60;T>, `entityName`: string, `metadata`: [MetadataStorage](metadatastorage.md), `platform`: [Platform](platform.md), `convertCustomTypes?`: boolean, `root?`: boolean): [FilterQuery](../index.md#filterquery)&#60;T>

*Defined in [packages/core/src/utils/QueryHelper.ts:72](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/utils/QueryHelper.ts#L72)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> | - |
`entityName` | string | - |
`metadata` | [MetadataStorage](metadatastorage.md) | - |
`platform` | [Platform](platform.md) | - |
`convertCustomTypes` | boolean | true |
`root` | boolean | true |

**Returns:** [FilterQuery](../index.md#filterquery)&#60;T>
