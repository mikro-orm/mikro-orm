---
id: "core.baseentity"
title: "Class: BaseEntity<T, PK, P>"
sidebar_label: "BaseEntity"
hide_title: true
---

# Class: BaseEntity<T, PK, P\>

[core](../modules/core.md).BaseEntity

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | - |
`PK` | keyof T | - |
`P` | [*Populate*](../modules/core.md#populate)<T\> \| *unknown* | *unknown* |

## Hierarchy

* **BaseEntity**

## Implements

* [*IWrappedEntity*](../interfaces/core.iwrappedentity.md)<T, PK, P\>

## Constructors

### constructor

\+ **new BaseEntity**<T, PK, P\>(): [*BaseEntity*](core.baseentity.md)<T, PK, P\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | - |
`PK` | *string* \| *number* \| *symbol* | - |
`P` | *unknown* | *unknown* |

**Returns:** [*BaseEntity*](core.baseentity.md)<T, PK, P\>

Defined in: [packages/core/src/entity/BaseEntity.ts:5](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/BaseEntity.ts#L5)

## Methods

### assign

▸ **assign**(`data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `options?`: [*AssignOptions*](../interfaces/core.assignoptions.md)): T

#### Parameters:

Name | Type |
------ | ------ |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`options?` | [*AssignOptions*](../interfaces/core.assignoptions.md) |

**Returns:** T

Defined in: [packages/core/src/entity/BaseEntity.ts:35](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/BaseEntity.ts#L35)

___

### init

▸ **init**(`populated?`: *boolean*): *Promise*<T\>

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`populated` | *boolean* | true |

**Returns:** *Promise*<T\>

Defined in: [packages/core/src/entity/BaseEntity.ts:39](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/BaseEntity.ts#L39)

___

### isInitialized

▸ **isInitialized**(): *boolean*

**Returns:** *boolean*

Implementation of: [IWrappedEntity](../interfaces/core.iwrappedentity.md)

Defined in: [packages/core/src/entity/BaseEntity.ts:11](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/BaseEntity.ts#L11)

___

### populated

▸ **populated**(`populated?`: *boolean*): *void*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`populated` | *boolean* | true |

**Returns:** *void*

Implementation of: [IWrappedEntity](../interfaces/core.iwrappedentity.md)

Defined in: [packages/core/src/entity/BaseEntity.ts:15](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/BaseEntity.ts#L15)

___

### toJSON

▸ **toJSON**(...`args`: *any*[]): [*Dictionary*](../modules/core.md#dictionary)<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`...args` | *any*[] |

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<*any*\>

Implementation of: [IWrappedEntity](../interfaces/core.iwrappedentity.md)

Defined in: [packages/core/src/entity/BaseEntity.ts:27](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/BaseEntity.ts#L27)

___

### toObject

▸ **toObject**(`ignoreFields?`: *string*[]): [*Dictionary*](../modules/core.md#dictionary)<*any*\>

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`ignoreFields` | *string*[] | ... |

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<*any*\>

Implementation of: [IWrappedEntity](../interfaces/core.iwrappedentity.md)

Defined in: [packages/core/src/entity/BaseEntity.ts:23](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/BaseEntity.ts#L23)

___

### toPOJO

▸ **toPOJO**(): [*EntityData*](../modules/core.md#entitydata)<T\>

**Returns:** [*EntityData*](../modules/core.md#entitydata)<T\>

Implementation of: [IWrappedEntity](../interfaces/core.iwrappedentity.md)

Defined in: [packages/core/src/entity/BaseEntity.ts:31](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/BaseEntity.ts#L31)

___

### toReference

▸ **toReference**(): *any*

**Returns:** *any*

Implementation of: [IWrappedEntity](../interfaces/core.iwrappedentity.md)

Defined in: [packages/core/src/entity/BaseEntity.ts:19](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/BaseEntity.ts#L19)
