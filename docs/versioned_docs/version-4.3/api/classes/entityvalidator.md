---
id: "entityvalidator"
title: "Class: EntityValidator"
sidebar_label: "EntityValidator"
---

## Hierarchy

* **EntityValidator**

## Constructors

### constructor

\+ **new EntityValidator**(`strict`: boolean): [EntityValidator](entityvalidator.md)

*Defined in [packages/core/src/entity/EntityValidator.ts:6](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityValidator.ts#L6)*

#### Parameters:

Name | Type |
------ | ------ |
`strict` | boolean |

**Returns:** [EntityValidator](entityvalidator.md)

## Properties

### strict

• `Private` **strict**: boolean

*Defined in [packages/core/src/entity/EntityValidator.ts:8](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityValidator.ts#L8)*

## Methods

### fixBooleanType

▸ `Private`**fixBooleanType**(`givenValue`: number): boolean \| number

*Defined in [packages/core/src/entity/EntityValidator.ts:147](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityValidator.ts#L147)*

#### Parameters:

Name | Type |
------ | ------ |
`givenValue` | number |

**Returns:** boolean \| number

___

### fixDateType

▸ `Private`**fixDateType**(`givenValue`: string): Date \| string

*Defined in [packages/core/src/entity/EntityValidator.ts:130](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityValidator.ts#L130)*

#### Parameters:

Name | Type |
------ | ------ |
`givenValue` | string |

**Returns:** Date \| string

___

### fixNumberType

▸ `Private`**fixNumberType**(`givenValue`: string): number \| string

*Defined in [packages/core/src/entity/EntityValidator.ts:142](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityValidator.ts#L142)*

#### Parameters:

Name | Type |
------ | ------ |
`givenValue` | string |

**Returns:** number \| string

___

### fixTypes

▸ `Private`**fixTypes**(`expectedType`: string, `givenType`: string, `givenValue`: any): any

*Defined in [packages/core/src/entity/EntityValidator.ts:114](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityValidator.ts#L114)*

#### Parameters:

Name | Type |
------ | ------ |
`expectedType` | string |
`givenType` | string |
`givenValue` | any |

**Returns:** any

___

### getValue

▸ `Private`**getValue**(`o`: [Dictionary](../index.md#dictionary), `prop`: [EntityProperty](../interfaces/entityproperty.md)): any

*Defined in [packages/core/src/entity/EntityValidator.ts:91](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityValidator.ts#L91)*

#### Parameters:

Name | Type |
------ | ------ |
`o` | [Dictionary](../index.md#dictionary) |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** any

___

### setValue

▸ `Private`**setValue**(`o`: [Dictionary](../index.md#dictionary), `prop`: [EntityProperty](../interfaces/entityproperty.md), `v`: any): any

*Defined in [packages/core/src/entity/EntityValidator.ts:99](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityValidator.ts#L99)*

#### Parameters:

Name | Type |
------ | ------ |
`o` | [Dictionary](../index.md#dictionary) |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`v` | any |

**Returns:** any

___

### validate

▸ **validate**&#60;T>(`entity`: T, `payload`: any, `meta`: [EntityMetadata](entitymetadata.md)): void

*Defined in [packages/core/src/entity/EntityValidator.ts:10](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityValidator.ts#L10)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`payload` | any |
`meta` | [EntityMetadata](entitymetadata.md) |

**Returns:** void

___

### validateCollection

▸ `Private`**validateCollection**&#60;T>(`entity`: T, `prop`: [EntityProperty](../interfaces/entityproperty.md)): void

*Defined in [packages/core/src/entity/EntityValidator.ts:108](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityValidator.ts#L108)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** void

___

### validateEmptyWhere

▸ **validateEmptyWhere**&#60;T>(`where`: [FilterQuery](../index.md#filterquery)&#60;T>): void

*Defined in [packages/core/src/entity/EntityValidator.ts:85](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityValidator.ts#L85)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |

**Returns:** void

___

### validateParams

▸ **validateParams**(`params`: any, `type?`: string, `field?`: string): void

*Defined in [packages/core/src/entity/EntityValidator.ts:61](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityValidator.ts#L61)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`params` | any | - |
`type` | string | "search condition" |
`field?` | string | - |

**Returns:** void

___

### validatePrimaryKey

▸ **validatePrimaryKey**&#60;T>(`entity`: [EntityData](../index.md#entitydata)&#60;T>, `meta`: [EntityMetadata](entitymetadata.md)): void

*Defined in [packages/core/src/entity/EntityValidator.ts:77](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityValidator.ts#L77)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [EntityData](../index.md#entitydata)&#60;T> |
`meta` | [EntityMetadata](entitymetadata.md) |

**Returns:** void

___

### validateProperty

▸ **validateProperty**&#60;T>(`prop`: [EntityProperty](../interfaces/entityproperty.md), `givenValue`: any, `entity`: T): any

*Defined in [packages/core/src/entity/EntityValidator.ts:40](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityValidator.ts#L40)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`givenValue` | any |
`entity` | T |

**Returns:** any
