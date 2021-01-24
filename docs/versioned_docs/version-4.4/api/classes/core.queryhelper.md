---
id: "core.queryhelper"
title: "Class: QueryHelper"
sidebar_label: "QueryHelper"
hide_title: true
---

# Class: QueryHelper

[core](../modules/core.md).QueryHelper

## Hierarchy

* **QueryHelper**

## Constructors

### constructor

\+ **new QueryHelper**(): [*QueryHelper*](core.queryhelper.md)

**Returns:** [*QueryHelper*](core.queryhelper.md)

## Properties

### SUPPORTED\_OPERATORS

▪ `Readonly` `Static` **SUPPORTED\_OPERATORS**: *string*[]

Defined in: [packages/core/src/utils/QueryHelper.ts:10](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/QueryHelper.ts#L10)

## Methods

### getActiveFilters

▸ `Static`**getActiveFilters**(`entityName`: *string*, `options`: *boolean* \| *string*[] \| [*Dictionary*](../modules/core.md#dictionary)<*boolean* \| [*Dictionary*](../modules/core.md#dictionary)<*any*\>\>, `filters`: [*Dictionary*](../modules/core.md#dictionary)<*FilterDef*<*any*\>\>): *FilterDef*<*any*\>[]

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |
`options` | *boolean* \| *string*[] \| [*Dictionary*](../modules/core.md#dictionary)<*boolean* \| [*Dictionary*](../modules/core.md#dictionary)<*any*\>\> |
`filters` | [*Dictionary*](../modules/core.md#dictionary)<*FilterDef*<*any*\>\> |

**Returns:** *FilterDef*<*any*\>[]

Defined in: [packages/core/src/utils/QueryHelper.ts:160](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/QueryHelper.ts#L160)

___

### inlinePrimaryKeyObjects

▸ `Static`**inlinePrimaryKeyObjects**<T\>(`where`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>, `meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `metadata`: [*MetadataStorage*](core.metadatastorage.md), `key?`: *string*): *boolean*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`where` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |
`key?` | *string* |

**Returns:** *boolean*

Defined in: [packages/core/src/utils/QueryHelper.ts:44](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/QueryHelper.ts#L44)

___

### isFilterActive

▸ `Static`**isFilterActive**(`entityName`: *string*, `filterName`: *string*, `filter`: *FilterDef*<*any*\>, `options`: [*Dictionary*](../modules/core.md#dictionary)<*boolean* \| [*Dictionary*](../modules/core.md#dictionary)<*any*\>\>): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |
`filterName` | *string* |
`filter` | *FilterDef*<*any*\> |
`options` | [*Dictionary*](../modules/core.md#dictionary)<*boolean* \| [*Dictionary*](../modules/core.md#dictionary)<*any*\>\> |

**Returns:** *boolean*

Defined in: [packages/core/src/utils/QueryHelper.ts:181](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/QueryHelper.ts#L181)

___

### isSupportedOperator

▸ `Private` `Static`**isSupportedOperator**(`key`: *string*): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`key` | *string* |

**Returns:** *boolean*

Defined in: [packages/core/src/utils/QueryHelper.ts:235](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/QueryHelper.ts#L235)

___

### processCustomType

▸ `Static`**processCustomType**<T\>(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>, `cond`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `platform`: [*Platform*](core.platform.md), `key?`: *string*, `fromQuery?`: *boolean*): [*FilterQuery*](../modules/core.md#filterquery)<T\>

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |
`cond` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`platform` | [*Platform*](core.platform.md) |
`key?` | *string* |
`fromQuery?` | *boolean* |

**Returns:** [*FilterQuery*](../modules/core.md#filterquery)<T\>

Defined in: [packages/core/src/utils/QueryHelper.ts:193](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/QueryHelper.ts#L193)

___

### processEntity

▸ `Private` `Static`**processEntity**(`entity`: [*AnyEntity*](../modules/core.md#anyentity)<*any*\>, `root?`: *boolean*): *any*

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [*AnyEntity*](../modules/core.md#anyentity)<*any*\> |
`root?` | *boolean* |

**Returns:** *any*

Defined in: [packages/core/src/utils/QueryHelper.ts:213](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/QueryHelper.ts#L213)

___

### processExpression

▸ `Private` `Static`**processExpression**<T\>(`expr`: *string*, `value`: T): [*Dictionary*](../modules/core.md#dictionary)<T\>

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`expr` | *string* |
`value` | T |

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<T\>

Defined in: [packages/core/src/utils/QueryHelper.ts:223](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/QueryHelper.ts#L223)

___

### processObjectParams

▸ `Static`**processObjectParams**(`params?`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>): *any*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`params` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> | ... |

**Returns:** *any*

Defined in: [packages/core/src/utils/QueryHelper.ts:36](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/QueryHelper.ts#L36)

___

### processParams

▸ `Static`**processParams**(`params`: *any*, `root?`: *boolean*): *any*

#### Parameters:

Name | Type |
------ | ------ |
`params` | *any* |
`root?` | *boolean* |

**Returns:** *any*

Defined in: [packages/core/src/utils/QueryHelper.ts:12](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/QueryHelper.ts#L12)

___

### processWhere

▸ `Static`**processWhere**<T\>(`where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `entityName`: *string*, `metadata`: [*MetadataStorage*](core.metadatastorage.md), `platform`: [*Platform*](core.platform.md), `convertCustomTypes?`: *boolean*, `root?`: *boolean*): [*FilterQuery*](../modules/core.md#filterquery)<T\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> | - |
`entityName` | *string* | - |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) | - |
`platform` | [*Platform*](core.platform.md) | - |
`convertCustomTypes` | *boolean* | true |
`root` | *boolean* | true |

**Returns:** [*FilterQuery*](../modules/core.md#filterquery)<T\>

Defined in: [packages/core/src/utils/QueryHelper.ts:72](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/QueryHelper.ts#L72)
