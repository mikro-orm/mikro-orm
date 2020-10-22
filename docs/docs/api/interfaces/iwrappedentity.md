---
id: "iwrappedentity"
title: "Interface: IWrappedEntity<T, PK, P>"
sidebar_label: "IWrappedEntity"
---

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | - |
`PK` | keyof T | - |
`P` | - | never |

## Hierarchy

* **IWrappedEntity**

  ↳ [IWrappedEntityInternal](iwrappedentityinternal.md)

## Implemented by

* [BaseEntity](../classes/baseentity.md)

## Methods

### assign

▸ **assign**(`data`: any, `options?`: [AssignOptions](assignoptions.md) \| boolean): T

*Defined in [packages/core/src/typings.ts:78](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/typings.ts#L78)*

#### Parameters:

Name | Type |
------ | ------ |
`data` | any |
`options?` | [AssignOptions](assignoptions.md) \| boolean |

**Returns:** T

___

### init

▸ **init**&#60;P>(`populated?`: boolean, `populate?`: P, `lockMode?`: [LockMode](../enums/lockmode.md)): Promise&#60;T>

*Defined in [packages/core/src/typings.ts:74](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/typings.ts#L74)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`P` | [Populate](../index.md#populate)&#60;T> | Populate\&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`populated?` | boolean |
`populate?` | P |
`lockMode?` | [LockMode](../enums/lockmode.md) |

**Returns:** Promise&#60;T>

___

### isInitialized

▸ **isInitialized**(): boolean

*Defined in [packages/core/src/typings.ts:72](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/typings.ts#L72)*

**Returns:** boolean

___

### populated

▸ **populated**(`populated?`: boolean): void

*Defined in [packages/core/src/typings.ts:73](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/typings.ts#L73)*

#### Parameters:

Name | Type |
------ | ------ |
`populated?` | boolean |

**Returns:** void

___

### toJSON

▸ **toJSON**(...`args`: any[]): [Dictionary](../index.md#dictionary)

*Defined in [packages/core/src/typings.ts:77](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/typings.ts#L77)*

#### Parameters:

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** [Dictionary](../index.md#dictionary)

___

### toObject

▸ **toObject**(`ignoreFields?`: string[]): [Dictionary](../index.md#dictionary)

*Defined in [packages/core/src/typings.ts:76](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/typings.ts#L76)*

#### Parameters:

Name | Type |
------ | ------ |
`ignoreFields?` | string[] |

**Returns:** [Dictionary](../index.md#dictionary)

___

### toReference

▸ **toReference**&#60;PK2, P2>(): [IdentifiedReference](../index.md#identifiedreference)&#60;T, PK2> & [LoadedReference](loadedreference.md)&#60;T, P2>

*Defined in [packages/core/src/typings.ts:75](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/typings.ts#L75)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`PK2` | PK | never |
`P2` | P | never |

**Returns:** [IdentifiedReference](../index.md#identifiedreference)&#60;T, PK2> & [LoadedReference](loadedreference.md)&#60;T, P2>
