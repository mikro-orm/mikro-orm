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
`P` | [Populate](../index.md#populate)&#60;T> \| unknown | unknown |

## Hierarchy

* **IWrappedEntity**

  ↳ [IWrappedEntityInternal](iwrappedentityinternal.md)

## Implemented by

* [BaseEntity](../classes/baseentity.md)

## Methods

### assign

▸ **assign**(`data`: any, `options?`: [AssignOptions](assignoptions.md) \| boolean): T

*Defined in [packages/core/src/typings.ts:86](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L86)*

#### Parameters:

Name | Type |
------ | ------ |
`data` | any |
`options?` | [AssignOptions](assignoptions.md) \| boolean |

**Returns:** T

___

### init

▸ **init**&#60;P>(`populated?`: boolean, `populate?`: P, `lockMode?`: [LockMode](../enums/lockmode.md)): Promise&#60;T>

*Defined in [packages/core/src/typings.ts:82](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L82)*

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

*Defined in [packages/core/src/typings.ts:80](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L80)*

**Returns:** boolean

___

### populated

▸ **populated**(`populated?`: boolean): void

*Defined in [packages/core/src/typings.ts:81](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L81)*

#### Parameters:

Name | Type |
------ | ------ |
`populated?` | boolean |

**Returns:** void

___

### toJSON

▸ **toJSON**(...`args`: any[]): [Dictionary](../index.md#dictionary)

*Defined in [packages/core/src/typings.ts:85](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L85)*

#### Parameters:

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** [Dictionary](../index.md#dictionary)

___

### toObject

▸ **toObject**(`ignoreFields?`: string[]): [Dictionary](../index.md#dictionary)

*Defined in [packages/core/src/typings.ts:84](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L84)*

#### Parameters:

Name | Type |
------ | ------ |
`ignoreFields?` | string[] |

**Returns:** [Dictionary](../index.md#dictionary)

___

### toReference

▸ **toReference**&#60;PK2, P2>(): [IdentifiedReference](../index.md#identifiedreference)&#60;T, PK2> & [LoadedReference](loadedreference.md)&#60;T, P2>

*Defined in [packages/core/src/typings.ts:83](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L83)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`PK2` | PK \| unknown | unknown |
`P2` | P \| unknown | unknown |

**Returns:** [IdentifiedReference](../index.md#identifiedreference)&#60;T, PK2> & [LoadedReference](loadedreference.md)&#60;T, P2>
