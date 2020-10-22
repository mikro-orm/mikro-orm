---
id: "baseentity"
title: "Class: BaseEntity<T, PK>"
sidebar_label: "BaseEntity"
---

## Type parameters

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |
`PK` | keyof T |

## Hierarchy

* **BaseEntity**

## Implements

* [IWrappedEntity](../interfaces/iwrappedentity.md)&#60;T, PK>

## Constructors

### constructor

\+ **new BaseEntity**(): [BaseEntity](baseentity.md)

*Defined in [packages/core/src/entity/BaseEntity.ts:5](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/BaseEntity.ts#L5)*

**Returns:** [BaseEntity](baseentity.md)

## Methods

### assign

▸ **assign**(`data`: [EntityData](../index.md#entitydata)&#60;T>, `options?`: [AssignOptions](../interfaces/assignoptions.md)): T

*Defined in [packages/core/src/entity/BaseEntity.ts:31](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/BaseEntity.ts#L31)*

#### Parameters:

Name | Type |
------ | ------ |
`data` | [EntityData](../index.md#entitydata)&#60;T> |
`options?` | [AssignOptions](../interfaces/assignoptions.md) |

**Returns:** T

___

### init

▸ **init**(`populated?`: boolean): Promise&#60;T>

*Defined in [packages/core/src/entity/BaseEntity.ts:35](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/BaseEntity.ts#L35)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`populated` | boolean | true |

**Returns:** Promise&#60;T>

___

### isInitialized

▸ **isInitialized**(): boolean

*Implementation of [IWrappedEntity](../interfaces/iwrappedentity.md)*

*Defined in [packages/core/src/entity/BaseEntity.ts:11](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/BaseEntity.ts#L11)*

**Returns:** boolean

___

### populated

▸ **populated**(`populated?`: boolean): void

*Implementation of [IWrappedEntity](../interfaces/iwrappedentity.md)*

*Defined in [packages/core/src/entity/BaseEntity.ts:15](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/BaseEntity.ts#L15)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`populated` | boolean | true |

**Returns:** void

___

### toJSON

▸ **toJSON**(...`args`: any[]): [Dictionary](../index.md#dictionary)

*Implementation of [IWrappedEntity](../interfaces/iwrappedentity.md)*

*Defined in [packages/core/src/entity/BaseEntity.ts:27](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/BaseEntity.ts#L27)*

#### Parameters:

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** [Dictionary](../index.md#dictionary)

___

### toObject

▸ **toObject**(`ignoreFields?`: string[]): [Dictionary](../index.md#dictionary)

*Implementation of [IWrappedEntity](../interfaces/iwrappedentity.md)*

*Defined in [packages/core/src/entity/BaseEntity.ts:23](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/BaseEntity.ts#L23)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`ignoreFields` | string[] | [] |

**Returns:** [Dictionary](../index.md#dictionary)

___

### toReference

▸ **toReference**&#60;PK2, P>(): [IdentifiedReference](../index.md#identifiedreference)&#60;T, PK2> & [LoadedReference](../interfaces/loadedreference.md)&#60;T, P>

*Implementation of [IWrappedEntity](../interfaces/iwrappedentity.md)*

*Defined in [packages/core/src/entity/BaseEntity.ts:19](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/BaseEntity.ts#L19)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`PK2` | PK | never |
`P` | [Populate](../index.md#populate)&#60;T> | never |

**Returns:** [IdentifiedReference](../index.md#identifiedreference)&#60;T, PK2> & [LoadedReference](../interfaces/loadedreference.md)&#60;T, P>
