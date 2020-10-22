---
id: "iwrappedentityinternal"
title: "Interface: IWrappedEntityInternal<T, PK, P>"
sidebar_label: "IWrappedEntityInternal"
---

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`T` | - | - |
`PK` | keyof T | - |
`P` | - | keyof T |

## Hierarchy

* [IWrappedEntity](iwrappedentity.md)&#60;T, PK, P>

  ↳ **IWrappedEntityInternal**

## Properties

### \_\_data

•  **\_\_data**: [Dictionary](../index.md#dictionary)

*Defined in [packages/core/src/typings.ts:87](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L87)*

___

### \_\_em

• `Optional` **\_\_em**: any

*Defined in [packages/core/src/typings.ts:88](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L88)*

___

### \_\_identifier

• `Optional` **\_\_identifier**: [EntityIdentifier](../classes/entityidentifier.md)

*Defined in [packages/core/src/typings.ts:92](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L92)*

___

### \_\_initialized

•  **\_\_initialized**: boolean

*Defined in [packages/core/src/typings.ts:90](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L90)*

___

### \_\_lazyInitialized

•  **\_\_lazyInitialized**: boolean

*Defined in [packages/core/src/typings.ts:95](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L95)*

___

### \_\_managed

•  **\_\_managed**: boolean

*Defined in [packages/core/src/typings.ts:93](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L93)*

___

### \_\_meta

•  **\_\_meta**: [EntityMetadata](../classes/entitymetadata.md)&#60;T>

*Defined in [packages/core/src/typings.ts:86](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L86)*

___

### \_\_originalEntityData

• `Optional` **\_\_originalEntityData**: [EntityData](../index.md#entitydata)&#60;T>

*Defined in [packages/core/src/typings.ts:91](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L91)*

___

### \_\_platform

•  **\_\_platform**: [Platform](../classes/platform.md)

*Defined in [packages/core/src/typings.ts:89](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L89)*

___

### \_\_populated

•  **\_\_populated**: boolean

*Defined in [packages/core/src/typings.ts:94](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L94)*

___

### \_\_primaryKeyCond

•  **\_\_primaryKeyCond**: [Primary](../index.md#primary)&#60;T> \| [Primary](../index.md#primary)&#60;T>[]

*Defined in [packages/core/src/typings.ts:97](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L97)*

___

### \_\_primaryKeys

•  **\_\_primaryKeys**: [Primary](../index.md#primary)&#60;T>[]

*Defined in [packages/core/src/typings.ts:96](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L96)*

___

### \_\_serializationContext

•  **\_\_serializationContext**: { populate?: [PopulateOptions](../index.md#populateoptions)&#60;T>[] ; root?: [SerializationContext](../classes/serializationcontext.md)&#60;T>  }

*Defined in [packages/core/src/typings.ts:98](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L98)*

#### Type declaration:

Name | Type |
------ | ------ |
`populate?` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] |
`root?` | [SerializationContext](../classes/serializationcontext.md)&#60;T> |

## Methods

### assign

▸ **assign**(`data`: any, `options?`: [AssignOptions](assignoptions.md) \| boolean): T

*Inherited from [IWrappedEntity](iwrappedentity.md).[assign](iwrappedentity.md#assign)*

*Defined in [packages/core/src/typings.ts:78](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L78)*

#### Parameters:

Name | Type |
------ | ------ |
`data` | any |
`options?` | [AssignOptions](assignoptions.md) \| boolean |

**Returns:** T

___

### getPrimaryKey

▸ **getPrimaryKey**(): [Primary](../index.md#primary)&#60;T>

*Defined in [packages/core/src/typings.ts:83](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L83)*

**Returns:** [Primary](../index.md#primary)&#60;T>

___

### getSerializedPrimaryKey

▸ **getSerializedPrimaryKey**(): string & keyof T

*Defined in [packages/core/src/typings.ts:85](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L85)*

**Returns:** string & keyof T

___

### hasPrimaryKey

▸ **hasPrimaryKey**(): boolean

*Defined in [packages/core/src/typings.ts:82](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L82)*

**Returns:** boolean

___

### init

▸ **init**&#60;P>(`populated?`: boolean, `populate?`: P, `lockMode?`: [LockMode](../enums/lockmode.md)): Promise&#60;T>

*Inherited from [IWrappedEntity](iwrappedentity.md).[init](iwrappedentity.md#init)*

*Defined in [packages/core/src/typings.ts:74](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L74)*

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

*Inherited from [IWrappedEntity](iwrappedentity.md).[isInitialized](iwrappedentity.md#isinitialized)*

*Defined in [packages/core/src/typings.ts:72](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L72)*

**Returns:** boolean

___

### populated

▸ **populated**(`populated?`: boolean): void

*Inherited from [IWrappedEntity](iwrappedentity.md).[populated](iwrappedentity.md#populated)*

*Defined in [packages/core/src/typings.ts:73](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L73)*

#### Parameters:

Name | Type |
------ | ------ |
`populated?` | boolean |

**Returns:** void

___

### setPrimaryKey

▸ **setPrimaryKey**(`val`: [Primary](../index.md#primary)&#60;T>): void

*Defined in [packages/core/src/typings.ts:84](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L84)*

#### Parameters:

Name | Type |
------ | ------ |
`val` | [Primary](../index.md#primary)&#60;T> |

**Returns:** void

___

### toJSON

▸ **toJSON**(...`args`: any[]): [Dictionary](../index.md#dictionary)

*Inherited from [IWrappedEntity](iwrappedentity.md).[toJSON](iwrappedentity.md#tojson)*

*Defined in [packages/core/src/typings.ts:77](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L77)*

#### Parameters:

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** [Dictionary](../index.md#dictionary)

___

### toObject

▸ **toObject**(`ignoreFields?`: string[]): [Dictionary](../index.md#dictionary)

*Inherited from [IWrappedEntity](iwrappedentity.md).[toObject](iwrappedentity.md#toobject)*

*Defined in [packages/core/src/typings.ts:76](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L76)*

#### Parameters:

Name | Type |
------ | ------ |
`ignoreFields?` | string[] |

**Returns:** [Dictionary](../index.md#dictionary)

___

### toReference

▸ **toReference**&#60;PK2, P2>(): [IdentifiedReference](../index.md#identifiedreference)&#60;T, PK2> & [LoadedReference](loadedreference.md)&#60;T, P2>

*Inherited from [IWrappedEntity](iwrappedentity.md).[toReference](iwrappedentity.md#toreference)*

*Defined in [packages/core/src/typings.ts:75](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L75)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`PK2` | PK | never |
`P2` | P | never |

**Returns:** [IdentifiedReference](../index.md#identifiedreference)&#60;T, PK2> & [LoadedReference](loadedreference.md)&#60;T, P2>
