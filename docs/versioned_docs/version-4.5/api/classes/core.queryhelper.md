---
id: "core.queryhelper"
title: "Class: QueryHelper"
sidebar_label: "QueryHelper"
custom_edit_url: null
hide_title: true
---

# Class: QueryHelper

[core](../modules/core.md).QueryHelper

## Constructors

### constructor

\+ **new QueryHelper**(): [*QueryHelper*](core.queryhelper.md)

**Returns:** [*QueryHelper*](core.queryhelper.md)

## Properties

### SUPPORTED\_OPERATORS

▪ `Readonly` `Static` **SUPPORTED\_OPERATORS**: *string*[]

Defined in: [packages/core/src/utils/QueryHelper.ts:11](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/QueryHelper.ts#L11)

## Methods

### getActiveFilters

▸ `Static`**getActiveFilters**(`entityName`: *string*, `options`: *boolean* \| *string*[] \| [*Dictionary*](../modules/core.md#dictionary)<boolean \| [*Dictionary*](../modules/core.md#dictionary)<any\>\>, `filters`: [*Dictionary*](../modules/core.md#dictionary)<FilterDef<any\>\>): *FilterDef*<any\>[]

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`options` | *boolean* \| *string*[] \| [*Dictionary*](../modules/core.md#dictionary)<boolean \| [*Dictionary*](../modules/core.md#dictionary)<any\>\> |
`filters` | [*Dictionary*](../modules/core.md#dictionary)<FilterDef<any\>\> |

**Returns:** *FilterDef*<any\>[]

Defined in: [packages/core/src/utils/QueryHelper.ts:165](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/QueryHelper.ts#L165)

___

### inlinePrimaryKeyObjects

▸ `Static`**inlinePrimaryKeyObjects**<T\>(`where`: [*Dictionary*](../modules/core.md#dictionary)<any\>, `meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `metadata`: [*MetadataStorage*](core.metadatastorage.md), `key?`: *string*): *boolean*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`where` | [*Dictionary*](../modules/core.md#dictionary)<any\> |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |
`key?` | *string* |

**Returns:** *boolean*

Defined in: [packages/core/src/utils/QueryHelper.ts:45](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/QueryHelper.ts#L45)

___

### isFilterActive

▸ `Static`**isFilterActive**(`entityName`: *string*, `filterName`: *string*, `filter`: *FilterDef*<any\>, `options`: [*Dictionary*](../modules/core.md#dictionary)<boolean \| [*Dictionary*](../modules/core.md#dictionary)<any\>\>): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`filterName` | *string* |
`filter` | *FilterDef*<any\> |
`options` | [*Dictionary*](../modules/core.md#dictionary)<boolean \| [*Dictionary*](../modules/core.md#dictionary)<any\>\> |

**Returns:** *boolean*

Defined in: [packages/core/src/utils/QueryHelper.ts:186](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/QueryHelper.ts#L186)

___

### isSupportedOperator

▸ `Private` `Static`**isSupportedOperator**(`key`: *string*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`key` | *string* |

**Returns:** *boolean*

Defined in: [packages/core/src/utils/QueryHelper.ts:240](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/QueryHelper.ts#L240)

___

### processCustomType

▸ `Static`**processCustomType**<T\>(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>, `cond`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `platform`: [*Platform*](core.platform.md), `key?`: *string*, `fromQuery?`: *boolean*): [*FilterQuery*](../modules/core.md#filterquery)<T\>

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |
`cond` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`platform` | [*Platform*](core.platform.md) |
`key?` | *string* |
`fromQuery?` | *boolean* |

**Returns:** [*FilterQuery*](../modules/core.md#filterquery)<T\>

Defined in: [packages/core/src/utils/QueryHelper.ts:198](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/QueryHelper.ts#L198)

___

### processEntity

▸ `Private` `Static`**processEntity**(`entity`: [*AnyEntity*](../modules/core.md#anyentity)<any\>, `root?`: *boolean*): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | [*AnyEntity*](../modules/core.md#anyentity)<any\> |
`root?` | *boolean* |

**Returns:** *any*

Defined in: [packages/core/src/utils/QueryHelper.ts:218](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/QueryHelper.ts#L218)

___

### processExpression

▸ `Private` `Static`**processExpression**<T\>(`expr`: *string*, `value`: T): [*Dictionary*](../modules/core.md#dictionary)<T\>

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`expr` | *string* |
`value` | T |

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<T\>

Defined in: [packages/core/src/utils/QueryHelper.ts:228](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/QueryHelper.ts#L228)

___

### processJsonCondition

▸ `Private` `Static`**processJsonCondition**<T\>(`o`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `value`: [*Dictionary*](../modules/core.md#dictionary)<any\>, `path`: *string*[], `platform`: [*Platform*](core.platform.md)): [*FilterQuery*](../modules/core.md#filterquery)<T\>

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`o` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`value` | [*Dictionary*](../modules/core.md#dictionary)<any\> |
`path` | *string*[] |
`platform` | [*Platform*](core.platform.md) |

**Returns:** [*FilterQuery*](../modules/core.md#filterquery)<T\>

Defined in: [packages/core/src/utils/QueryHelper.ts:244](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/QueryHelper.ts#L244)

___

### processObjectParams

▸ `Static`**processObjectParams**(`params?`: [*Dictionary*](../modules/core.md#dictionary)<any\>): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`params` | [*Dictionary*](../modules/core.md#dictionary)<any\> |

**Returns:** *any*

Defined in: [packages/core/src/utils/QueryHelper.ts:37](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/QueryHelper.ts#L37)

___

### processParams

▸ `Static`**processParams**(`params`: *any*, `root?`: *boolean*): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`params` | *any* |
`root?` | *boolean* |

**Returns:** *any*

Defined in: [packages/core/src/utils/QueryHelper.ts:13](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/QueryHelper.ts#L13)

___

### processWhere

▸ `Static`**processWhere**<T\>(`where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `entityName`: *string*, `metadata`: [*MetadataStorage*](core.metadatastorage.md), `platform`: [*Platform*](core.platform.md), `convertCustomTypes?`: *boolean*, `root?`: *boolean*): [*FilterQuery*](../modules/core.md#filterquery)<T\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> | - |
`entityName` | *string* | - |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) | - |
`platform` | [*Platform*](core.platform.md) | - |
`convertCustomTypes` | *boolean* | true |
`root` | *boolean* | true |

**Returns:** [*FilterQuery*](../modules/core.md#filterquery)<T\>

Defined in: [packages/core/src/utils/QueryHelper.ts:73](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/QueryHelper.ts#L73)
