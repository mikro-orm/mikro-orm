---
id: "core.entityvalidator"
title: "Class: EntityValidator"
sidebar_label: "EntityValidator"
custom_edit_url: null
hide_title: true
---

# Class: EntityValidator

[core](../modules/core.md).EntityValidator

## Constructors

### constructor

\+ **new EntityValidator**(`strict`: *boolean*): [*EntityValidator*](core.entityvalidator.md)

#### Parameters:

Name | Type |
:------ | :------ |
`strict` | *boolean* |

**Returns:** [*EntityValidator*](core.entityvalidator.md)

Defined in: [packages/core/src/entity/EntityValidator.ts:6](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityValidator.ts#L6)

## Methods

### fixBooleanType

▸ `Private`**fixBooleanType**(`givenValue`: *number*): *number* \| *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`givenValue` | *number* |

**Returns:** *number* \| *boolean*

Defined in: [packages/core/src/entity/EntityValidator.ts:147](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityValidator.ts#L147)

___

### fixDateType

▸ `Private`**fixDateType**(`givenValue`: *string*): *string* \| Date

#### Parameters:

Name | Type |
:------ | :------ |
`givenValue` | *string* |

**Returns:** *string* \| Date

Defined in: [packages/core/src/entity/EntityValidator.ts:130](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityValidator.ts#L130)

___

### fixNumberType

▸ `Private`**fixNumberType**(`givenValue`: *string*): *string* \| *number*

#### Parameters:

Name | Type |
:------ | :------ |
`givenValue` | *string* |

**Returns:** *string* \| *number*

Defined in: [packages/core/src/entity/EntityValidator.ts:142](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityValidator.ts#L142)

___

### fixTypes

▸ `Private`**fixTypes**(`expectedType`: *string*, `givenType`: *string*, `givenValue`: *any*): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`expectedType` | *string* |
`givenType` | *string* |
`givenValue` | *any* |

**Returns:** *any*

Defined in: [packages/core/src/entity/EntityValidator.ts:114](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityValidator.ts#L114)

___

### getValue

▸ `Private`**getValue**(`o`: [*Dictionary*](../modules/core.md#dictionary)<any\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`o` | [*Dictionary*](../modules/core.md#dictionary)<any\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |

**Returns:** *any*

Defined in: [packages/core/src/entity/EntityValidator.ts:91](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityValidator.ts#L91)

___

### setValue

▸ `Private`**setValue**(`o`: [*Dictionary*](../modules/core.md#dictionary)<any\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `v`: *any*): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`o` | [*Dictionary*](../modules/core.md#dictionary)<any\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`v` | *any* |

**Returns:** *any*

Defined in: [packages/core/src/entity/EntityValidator.ts:99](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityValidator.ts#L99)

___

### validate

▸ **validate**<T\>(`entity`: T, `payload`: *any*, `meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`payload` | *any* |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |

**Returns:** *void*

Defined in: [packages/core/src/entity/EntityValidator.ts:10](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityValidator.ts#L10)

___

### validateCollection

▸ `Private`**validateCollection**<T\>(`entity`: T, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |

**Returns:** *void*

Defined in: [packages/core/src/entity/EntityValidator.ts:108](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityValidator.ts#L108)

___

### validateEmptyWhere

▸ **validateEmptyWhere**<T\>(`where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/entity/EntityValidator.ts:85](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityValidator.ts#L85)

___

### validateParams

▸ **validateParams**(`params`: *any*, `type?`: *string*, `field?`: *string*): *void*

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`params` | *any* | - |
`type` | *string* | 'search condition' |
`field?` | *string* | - |

**Returns:** *void*

Defined in: [packages/core/src/entity/EntityValidator.ts:61](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityValidator.ts#L61)

___

### validatePrimaryKey

▸ **validatePrimaryKey**<T\>(`entity`: [*EntityData*](../modules/core.md#entitydata)<T\>, `meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |

**Returns:** *void*

Defined in: [packages/core/src/entity/EntityValidator.ts:77](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityValidator.ts#L77)

___

### validateProperty

▸ **validateProperty**<T\>(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `givenValue`: *any*, `entity`: T): *any*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`givenValue` | *any* |
`entity` | T |

**Returns:** *any*

Defined in: [packages/core/src/entity/EntityValidator.ts:40](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityValidator.ts#L40)
