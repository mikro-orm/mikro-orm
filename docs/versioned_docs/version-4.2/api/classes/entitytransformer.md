---
id: "entitytransformer"
title: "Class: EntityTransformer"
sidebar_label: "EntityTransformer"
---

## Hierarchy

* **EntityTransformer**

## Methods

### isVisible

▸ `Static` `Private`**isVisible**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `prop`: keyof T & string, `ignoreFields`: string[]): boolean

*Defined in [packages/core/src/entity/EntityTransformer.ts:155](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityTransformer.ts#L155)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`prop` | keyof T & string |
`ignoreFields` | string[] |

**Returns:** boolean

___

### processCollection

▸ `Static` `Private`**processCollection**&#60;T>(`prop`: keyof T, `entity`: T): T[keyof T] \| undefined

*Defined in [packages/core/src/entity/EntityTransformer.ts:212](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityTransformer.ts#L212)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | keyof T |
`entity` | T |

**Returns:** T[keyof T] \| undefined

___

### processEntity

▸ `Static` `Private`**processEntity**&#60;T>(`prop`: keyof T, `entity`: T, `platform`: [Platform](platform.md)): T[keyof T] \| undefined

*Defined in [packages/core/src/entity/EntityTransformer.ts:200](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityTransformer.ts#L200)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | keyof T |
`entity` | T |
`platform` | [Platform](platform.md) |

**Returns:** T[keyof T] \| undefined

___

### processProperty

▸ `Static` `Private`**processProperty**&#60;T>(`prop`: keyof T & string, `entity`: T): T[keyof T] \| undefined

*Defined in [packages/core/src/entity/EntityTransformer.ts:172](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityTransformer.ts#L172)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | keyof T & string |
`entity` | T |

**Returns:** T[keyof T] \| undefined

___

### propertyName

▸ `Static` `Private`**propertyName**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `prop`: keyof T & string, `platform?`: [Platform](platform.md)): keyof T & string

*Defined in [packages/core/src/entity/EntityTransformer.ts:160](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityTransformer.ts#L160)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`prop` | keyof T & string |
`platform?` | [Platform](platform.md) |

**Returns:** keyof T & string

___

### toObject

▸ `Static`**toObject**&#60;T>(`entity`: T, `ignoreFields?`: string[]): [EntityData](../index.md#entitydata)&#60;T>

*Defined in [packages/core/src/entity/EntityTransformer.ts:85](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityTransformer.ts#L85)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entity` | T | - |
`ignoreFields` | string[] | [] |

**Returns:** [EntityData](../index.md#entitydata)&#60;T>
