---
id: "core.entitytransformer"
title: "Class: EntityTransformer"
sidebar_label: "EntityTransformer"
hide_title: true
---

# Class: EntityTransformer

[core](../modules/core.md).EntityTransformer

## Hierarchy

* **EntityTransformer**

## Constructors

### constructor

\+ **new EntityTransformer**(): [*EntityTransformer*](core.entitytransformer.md)

**Returns:** [*EntityTransformer*](core.entitytransformer.md)

## Methods

### isVisible

▸ `Private` `Static`**isVisible**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `prop`: keyof T & *string*, `ignoreFields`: *string*[]): *boolean*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`prop` | keyof T & *string* |
`ignoreFields` | *string*[] |

**Returns:** *boolean*

Defined in: [packages/core/src/entity/EntityTransformer.ts:155](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/EntityTransformer.ts#L155)

___

### processCollection

▸ `Private` `Static`**processCollection**<T\>(`prop`: keyof T, `entity`: T, `raw`: *boolean*): *undefined* \| T[keyof T]

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | keyof T |
`entity` | T |
`raw` | *boolean* |

**Returns:** *undefined* \| T[keyof T]

Defined in: [packages/core/src/entity/EntityTransformer.ts:216](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/EntityTransformer.ts#L216)

___

### processEntity

▸ `Private` `Static`**processEntity**<T\>(`prop`: keyof T, `entity`: T, `platform`: [*Platform*](core.platform.md), `raw`: *boolean*): *undefined* \| T[keyof T]

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | keyof T |
`entity` | T |
`platform` | [*Platform*](core.platform.md) |
`raw` | *boolean* |

**Returns:** *undefined* \| T[keyof T]

Defined in: [packages/core/src/entity/EntityTransformer.ts:200](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/EntityTransformer.ts#L200)

___

### processProperty

▸ `Private` `Static`**processProperty**<T\>(`prop`: keyof T & *string*, `entity`: T, `raw`: *boolean*): *undefined* \| T[keyof T]

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | keyof T & *string* |
`entity` | T |
`raw` | *boolean* |

**Returns:** *undefined* \| T[keyof T]

Defined in: [packages/core/src/entity/EntityTransformer.ts:172](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/EntityTransformer.ts#L172)

___

### propertyName

▸ `Private` `Static`**propertyName**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `prop`: keyof T & *string*, `platform?`: [*Platform*](core.platform.md)): keyof T & *string*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`prop` | keyof T & *string* |
`platform?` | [*Platform*](core.platform.md) |

**Returns:** keyof T & *string*

Defined in: [packages/core/src/entity/EntityTransformer.ts:160](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/EntityTransformer.ts#L160)

___

### toObject

▸ `Static`**toObject**<T\>(`entity`: T, `ignoreFields?`: *string*[], `raw?`: *boolean*): [*EntityData*](../modules/core.md#entitydata)<T\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entity` | T | - |
`ignoreFields` | *string*[] | ... |
`raw` | *boolean* | false |

**Returns:** [*EntityData*](../modules/core.md#entitydata)<T\>

Defined in: [packages/core/src/entity/EntityTransformer.ts:85](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/EntityTransformer.ts#L85)
