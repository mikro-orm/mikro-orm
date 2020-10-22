---
id: "wrappedentity"
title: "Class: WrappedEntity<T, PK>"
sidebar_label: "WrappedEntity"
---

## Type parameters

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |
`PK` | keyof T |

## Hierarchy

* **WrappedEntity**

## Constructors

### constructor

\+ **new WrappedEntity**(`entity`: T, `pkGetter`: (e: T) => [Primary](../index.md#primary)&#60;T>, `pkSerializer`: (e: T) => string): [WrappedEntity](wrappedentity.md)

*Defined in [packages/core/src/entity/WrappedEntity.ts:24](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L24)*

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`pkGetter` | (e: T) => [Primary](../index.md#primary)&#60;T> |
`pkSerializer` | (e: T) => string |

**Returns:** [WrappedEntity](wrappedentity.md)

## Properties

### \_\_em

• `Optional` **\_\_em**: [EntityManager](entitymanager.md)

*Defined in [packages/core/src/entity/WrappedEntity.ts:17](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L17)*

___

### \_\_identifier

• `Optional` **\_\_identifier**: [EntityData](../index.md#entitydata)&#60;T>

*Defined in [packages/core/src/entity/WrappedEntity.ts:24](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L24)*

holds wrapped primary key so we can compute change set without eager commit

___

### \_\_initialized

•  **\_\_initialized**: boolean = true

*Defined in [packages/core/src/entity/WrappedEntity.ts:13](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L13)*

___

### \_\_lazyInitialized

• `Optional` **\_\_lazyInitialized**: boolean

*Defined in [packages/core/src/entity/WrappedEntity.ts:15](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L15)*

___

### \_\_managed

• `Optional` **\_\_managed**: boolean

*Defined in [packages/core/src/entity/WrappedEntity.ts:16](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L16)*

___

### \_\_originalEntityData

• `Optional` **\_\_originalEntityData**: [EntityData](../index.md#entitydata)&#60;T>

*Defined in [packages/core/src/entity/WrappedEntity.ts:21](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L21)*

holds last entity data snapshot so we can compute changes when persisting managed entities

___

### \_\_populated

• `Optional` **\_\_populated**: boolean

*Defined in [packages/core/src/entity/WrappedEntity.ts:14](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L14)*

___

### \_\_serializationContext

•  **\_\_serializationContext**: { populate?: [PopulateOptions](../index.md#populateoptions)&#60;T>[] ; root?: [SerializationContext](serializationcontext.md)&#60;T>  }

*Defined in [packages/core/src/entity/WrappedEntity.ts:18](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L18)*

#### Type declaration:

Name | Type |
------ | ------ |
`populate?` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] |
`root?` | [SerializationContext](serializationcontext.md)&#60;T> |

___

### entity

• `Private` `Readonly` **entity**: T

*Defined in [packages/core/src/entity/WrappedEntity.ts:26](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L26)*

___

### pkGetter

• `Private` `Readonly` **pkGetter**: (e: T) => [Primary](../index.md#primary)&#60;T>

*Defined in [packages/core/src/entity/WrappedEntity.ts:27](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L27)*

___

### pkSerializer

• `Private` `Readonly` **pkSerializer**: (e: T) => string

*Defined in [packages/core/src/entity/WrappedEntity.ts:28](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L28)*

## Accessors

### \_\_meta

• get **__meta**(): [EntityMetadata](entitymetadata.md)&#60;T>

*Defined in [packages/core/src/entity/WrappedEntity.ts:91](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L91)*

**Returns:** [EntityMetadata](entitymetadata.md)&#60;T>

___

### \_\_platform

• get **__platform**(): [Platform](platform.md)

*Defined in [packages/core/src/entity/WrappedEntity.ts:95](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L95)*

**Returns:** [Platform](platform.md)

___

### \_\_primaryKeyCond

• get **__primaryKeyCond**(): [Primary](../index.md#primary)&#60;T> \| [Primary](../index.md#primary)&#60;T>[] \| null

*Defined in [packages/core/src/entity/WrappedEntity.ts:103](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L103)*

**Returns:** [Primary](../index.md#primary)&#60;T> \| [Primary](../index.md#primary)&#60;T>[] \| null

___

### \_\_primaryKeys

• get **__primaryKeys**(): [Primary](../index.md#primary)&#60;T>[]

*Defined in [packages/core/src/entity/WrappedEntity.ts:99](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L99)*

**Returns:** [Primary](../index.md#primary)&#60;T>[]

## Methods

### [inspect.custom]

▸ **[inspect.custom]**(): string

*Defined in [packages/core/src/entity/WrappedEntity.ts:111](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L111)*

**Returns:** string

___

### assign

▸ **assign**(`data`: [EntityData](../index.md#entitydata)&#60;T>, `options?`: [AssignOptions](../interfaces/assignoptions.md)): T

*Defined in [packages/core/src/entity/WrappedEntity.ts:52](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L52)*

#### Parameters:

Name | Type |
------ | ------ |
`data` | [EntityData](../index.md#entitydata)&#60;T> |
`options?` | [AssignOptions](../interfaces/assignoptions.md) |

**Returns:** T

___

### getPrimaryKey

▸ **getPrimaryKey**(): [Primary](../index.md#primary)&#60;T> \| null

*Defined in [packages/core/src/entity/WrappedEntity.ts:79](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L79)*

**Returns:** [Primary](../index.md#primary)&#60;T> \| null

___

### getSerializedPrimaryKey

▸ **getSerializedPrimaryKey**(): string

*Defined in [packages/core/src/entity/WrappedEntity.ts:87](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L87)*

**Returns:** string

___

### hasPrimaryKey

▸ **hasPrimaryKey**(): boolean

*Defined in [packages/core/src/entity/WrappedEntity.ts:72](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L72)*

**Returns:** boolean

___

### init

▸ **init**&#60;P>(`populated?`: boolean, `populate?`: P, `lockMode?`: [LockMode](../enums/lockmode.md)): Promise&#60;T>

*Defined in [packages/core/src/entity/WrappedEntity.ts:60](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L60)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`P` | [Populate](../index.md#populate)&#60;T> | Populate\&#60;T> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`populated` | boolean | true |
`populate?` | P | - |
`lockMode?` | [LockMode](../enums/lockmode.md) | - |

**Returns:** Promise&#60;T>

___

### isInitialized

▸ **isInitialized**(): boolean

*Defined in [packages/core/src/entity/WrappedEntity.ts:30](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L30)*

**Returns:** boolean

___

### populated

▸ **populated**(`populated?`: boolean): void

*Defined in [packages/core/src/entity/WrappedEntity.ts:34](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L34)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`populated` | boolean | true |

**Returns:** void

___

### setPrimaryKey

▸ **setPrimaryKey**(`id`: [Primary](../index.md#primary)&#60;T> \| null): void

*Defined in [packages/core/src/entity/WrappedEntity.ts:83](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L83)*

#### Parameters:

Name | Type |
------ | ------ |
`id` | [Primary](../index.md#primary)&#60;T> \| null |

**Returns:** void

___

### toJSON

▸ **toJSON**(...`args`: any[]): [EntityData](../index.md#entitydata)&#60;T> & [Dictionary](../index.md#dictionary)

*Defined in [packages/core/src/entity/WrappedEntity.ts:47](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L47)*

#### Parameters:

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** [EntityData](../index.md#entitydata)&#60;T> & [Dictionary](../index.md#dictionary)

___

### toObject

▸ **toObject**(`ignoreFields?`: string[]): [EntityData](../index.md#entitydata)&#60;T>

*Defined in [packages/core/src/entity/WrappedEntity.ts:43](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L43)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`ignoreFields` | string[] | [] |

**Returns:** [EntityData](../index.md#entitydata)&#60;T>

___

### toReference

▸ **toReference**(): [IdentifiedReference](../index.md#identifiedreference)&#60;T, PK>

*Defined in [packages/core/src/entity/WrappedEntity.ts:39](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/WrappedEntity.ts#L39)*

**Returns:** [IdentifiedReference](../index.md#identifiedreference)&#60;T, PK>
