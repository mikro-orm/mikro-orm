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

*Defined in [packages/core/src/entity/EntityValidator.ts:6](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityValidator.ts#L6)*

#### Parameters:

Name | Type |
------ | ------ |
`strict` | boolean |

**Returns:** [EntityValidator](entityvalidator.md)

## Properties

### strict

• `Private` **strict**: boolean

*Defined in [packages/core/src/entity/EntityValidator.ts:8](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityValidator.ts#L8)*

## Methods

### fixBooleanType

▸ `Private`**fixBooleanType**(`givenValue`: number): boolean \| number

*Defined in [packages/core/src/entity/EntityValidator.ts:143](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityValidator.ts#L143)*

#### Parameters:

Name | Type |
------ | ------ |
`givenValue` | number |

**Returns:** boolean \| number

___

### fixDateType

▸ `Private`**fixDateType**(`givenValue`: string): Date \| string

*Defined in [packages/core/src/entity/EntityValidator.ts:126](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityValidator.ts#L126)*

#### Parameters:

Name | Type |
------ | ------ |
`givenValue` | string |

**Returns:** Date \| string

___

### fixNumberType

▸ `Private`**fixNumberType**(`givenValue`: string): number \| string

*Defined in [packages/core/src/entity/EntityValidator.ts:138](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityValidator.ts#L138)*

#### Parameters:

Name | Type |
------ | ------ |
`givenValue` | string |

**Returns:** number \| string

___

### fixTypes

▸ `Private`**fixTypes**(`expectedType`: string, `givenType`: string, `givenValue`: any): any

*Defined in [packages/core/src/entity/EntityValidator.ts:110](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityValidator.ts#L110)*

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

*Defined in [packages/core/src/entity/EntityValidator.ts:87](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityValidator.ts#L87)*

#### Parameters:

Name | Type |
------ | ------ |
`o` | [Dictionary](../index.md#dictionary) |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** any

___

### setValue

▸ `Private`**setValue**(`o`: [Dictionary](../index.md#dictionary), `prop`: [EntityProperty](../interfaces/entityproperty.md), `v`: any): any

*Defined in [packages/core/src/entity/EntityValidator.ts:95](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityValidator.ts#L95)*

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

*Defined in [packages/core/src/entity/EntityValidator.ts:10](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityValidator.ts#L10)*

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

*Defined in [packages/core/src/entity/EntityValidator.ts:104](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityValidator.ts#L104)*

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

*Defined in [packages/core/src/entity/EntityValidator.ts:81](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityValidator.ts#L81)*

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

*Defined in [packages/core/src/entity/EntityValidator.ts:57](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityValidator.ts#L57)*

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

*Defined in [packages/core/src/entity/EntityValidator.ts:73](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityValidator.ts#L73)*

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

*Defined in [packages/core/src/entity/EntityValidator.ts:36](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityValidator.ts#L36)*

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
