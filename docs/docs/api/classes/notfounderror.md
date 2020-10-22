---
id: "notfounderror"
title: "Class: NotFoundError<T>"
sidebar_label: "NotFoundError"
---

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity) | AnyEntity |

## Hierarchy

* [ValidationError](validationerror.md)&#60;T>

  ↳ **NotFoundError**

## Constructors

### constructor

\+ **new NotFoundError**(`message`: string, `entity?`: T): [NotFoundError](notfounderror.md)

*Inherited from [ValidationError](validationerror.md).[constructor](validationerror.md#constructor)*

*Defined in [packages/core/src/errors.ts:4](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/errors.ts#L4)*

#### Parameters:

Name | Type |
------ | ------ |
`message` | string |
`entity?` | T |

**Returns:** [NotFoundError](notfounderror.md)

## Properties

### message

•  **message**: string

*Inherited from [DriverException](driverexception.md).[message](driverexception.md#message)*

*Defined in node_modules/typescript/lib/lib.es5.d.ts:974*

___

### name

•  **name**: string

*Inherited from [DriverException](driverexception.md).[name](driverexception.md#name)*

*Defined in node_modules/typescript/lib/lib.es5.d.ts:973*

___

### stack

• `Optional` **stack**: string

*Inherited from [DriverException](driverexception.md).[stack](driverexception.md#stack)*

*Defined in node_modules/typescript/lib/lib.es5.d.ts:975*

## Methods

### getEntity

▸ **getEntity**(): [AnyEntity](../index.md#anyentity) \| undefined

*Inherited from [ValidationError](validationerror.md).[getEntity](validationerror.md#getentity)*

*Defined in [packages/core/src/errors.ts:17](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/errors.ts#L17)*

Gets instance of entity that caused this error.

**Returns:** [AnyEntity](../index.md#anyentity) \| undefined

___

### cannotCommit

▸ `Static`**cannotCommit**(): [ValidationError](validationerror.md)

*Inherited from [ValidationError](validationerror.md).[cannotCommit](validationerror.md#cannotcommit)*

*Defined in [packages/core/src/errors.ts:92](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/errors.ts#L92)*

**Returns:** [ValidationError](validationerror.md)

___

### cannotModifyInverseCollection

▸ `Static`**cannotModifyInverseCollection**(`owner`: [AnyEntity](../index.md#anyentity), `property`: [EntityProperty](../interfaces/entityproperty.md)): [ValidationError](validationerror.md)

*Inherited from [ValidationError](validationerror.md).[cannotModifyInverseCollection](validationerror.md#cannotmodifyinversecollection)*

*Defined in [packages/core/src/errors.ts:79](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/errors.ts#L79)*

#### Parameters:

Name | Type |
------ | ------ |
`owner` | [AnyEntity](../index.md#anyentity) |
`property` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** [ValidationError](validationerror.md)

___

### cannotUseOperatorsInsideEmbeddables

▸ `Static`**cannotUseOperatorsInsideEmbeddables**(`className`: string, `propName`: string, `payload`: [Dictionary](../index.md#dictionary)): [ValidationError](validationerror.md)

*Inherited from [ValidationError](validationerror.md).[cannotUseOperatorsInsideEmbeddables](validationerror.md#cannotuseoperatorsinsideembeddables)*

*Defined in [packages/core/src/errors.ts:96](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/errors.ts#L96)*

#### Parameters:

Name | Type |
------ | ------ |
`className` | string |
`propName` | string |
`payload` | [Dictionary](../index.md#dictionary) |

**Returns:** [ValidationError](validationerror.md)

___

### entityNotManaged

▸ `Static`**entityNotManaged**(`entity`: [AnyEntity](../index.md#anyentity)): [ValidationError](validationerror.md)

*Inherited from [ValidationError](validationerror.md).[entityNotManaged](validationerror.md#entitynotmanaged)*

*Defined in [packages/core/src/errors.ts:43](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/errors.ts#L43)*

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [AnyEntity](../index.md#anyentity) |

**Returns:** [ValidationError](validationerror.md)

___

### findOneFailed

▸ `Static`**findOneFailed**(`name`: string, `where`: [Dictionary](../index.md#dictionary) \| [IPrimaryKey](../index.md#iprimarykey)): [NotFoundError](notfounderror.md)

*Defined in [packages/core/src/errors.ts:207](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/errors.ts#L207)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |
`where` | [Dictionary](../index.md#dictionary) \| [IPrimaryKey](../index.md#iprimarykey) |

**Returns:** [NotFoundError](notfounderror.md)

___

### fromCollectionNotInitialized

▸ `Static`**fromCollectionNotInitialized**(`entity`: [AnyEntity](../index.md#anyentity), `prop`: [EntityProperty](../interfaces/entityproperty.md)): [ValidationError](validationerror.md)

*Inherited from [ValidationError](validationerror.md).[fromCollectionNotInitialized](validationerror.md#fromcollectionnotinitialized)*

*Defined in [packages/core/src/errors.ts:28](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/errors.ts#L28)*

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [AnyEntity](../index.md#anyentity) |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** [ValidationError](validationerror.md)

___

### fromMergeWithoutPK

▸ `Static`**fromMergeWithoutPK**(`meta`: [EntityMetadata](entitymetadata.md)): void

*Inherited from [ValidationError](validationerror.md).[fromMergeWithoutPK](validationerror.md#frommergewithoutpk)*

*Defined in [packages/core/src/errors.ts:35](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/errors.ts#L35)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |

**Returns:** void

___

### fromWrongPropertyType

▸ `Static`**fromWrongPropertyType**(`entity`: [AnyEntity](../index.md#anyentity), `property`: string, `expectedType`: string, `givenType`: string, `givenValue`: string): [ValidationError](validationerror.md)

*Inherited from [ValidationError](validationerror.md).[fromWrongPropertyType](validationerror.md#fromwrongpropertytype)*

*Defined in [packages/core/src/errors.ts:21](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/errors.ts#L21)*

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [AnyEntity](../index.md#anyentity) |
`property` | string |
`expectedType` | string |
`givenType` | string |
`givenValue` | string |

**Returns:** [ValidationError](validationerror.md)

___

### invalidCompositeIdentifier

▸ `Static`**invalidCompositeIdentifier**(`meta`: [EntityMetadata](entitymetadata.md)): [ValidationError](validationerror.md)

*Inherited from [ValidationError](validationerror.md).[invalidCompositeIdentifier](validationerror.md#invalidcompositeidentifier)*

*Defined in [packages/core/src/errors.ts:88](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/errors.ts#L88)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |

**Returns:** [ValidationError](validationerror.md)

___

### invalidPropertyName

▸ `Static`**invalidPropertyName**(`entityName`: string, `invalid`: string): [ValidationError](validationerror.md)

*Inherited from [ValidationError](validationerror.md).[invalidPropertyName](validationerror.md#invalidpropertyname)*

*Defined in [packages/core/src/errors.ts:65](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/errors.ts#L65)*

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`invalid` | string |

**Returns:** [ValidationError](validationerror.md)

___

### invalidType

▸ `Static`**invalidType**(`type`: [Constructor](../index.md#constructor)&#60;any>, `value`: any, `mode`: string): [ValidationError](validationerror.md)

*Inherited from [ValidationError](validationerror.md).[invalidType](validationerror.md#invalidtype)*

*Defined in [packages/core/src/errors.ts:69](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/errors.ts#L69)*

#### Parameters:

Name | Type |
------ | ------ |
`type` | [Constructor](../index.md#constructor)&#60;any> |
`value` | any |
`mode` | string |

**Returns:** [ValidationError](validationerror.md)

___

### notDiscoveredEntity

▸ `Static`**notDiscoveredEntity**(`data`: any, `meta?`: [EntityMetadata](entitymetadata.md)): [ValidationError](validationerror.md)

*Inherited from [ValidationError](validationerror.md).[notDiscoveredEntity](validationerror.md#notdiscoveredentity)*

*Defined in [packages/core/src/errors.ts:52](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/errors.ts#L52)*

#### Parameters:

Name | Type |
------ | ------ |
`data` | any |
`meta?` | [EntityMetadata](entitymetadata.md) |

**Returns:** [ValidationError](validationerror.md)

___

### notEntity

▸ `Static`**notEntity**(`owner`: [AnyEntity](../index.md#anyentity), `prop`: [EntityProperty](../interfaces/entityproperty.md), `data`: any): [ValidationError](validationerror.md)

*Inherited from [ValidationError](validationerror.md).[notEntity](validationerror.md#notentity)*

*Defined in [packages/core/src/errors.ts:47](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/errors.ts#L47)*

#### Parameters:

Name | Type |
------ | ------ |
`owner` | [AnyEntity](../index.md#anyentity) |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`data` | any |

**Returns:** [ValidationError](validationerror.md)

___

### transactionRequired

▸ `Static`**transactionRequired**(): [ValidationError](validationerror.md)

*Inherited from [ValidationError](validationerror.md).[transactionRequired](validationerror.md#transactionrequired)*

*Defined in [packages/core/src/errors.ts:39](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/errors.ts#L39)*

**Returns:** [ValidationError](validationerror.md)
