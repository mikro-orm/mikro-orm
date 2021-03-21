---
id: "core.entityhelper"
title: "Class: EntityHelper"
sidebar_label: "EntityHelper"
custom_edit_url: null
hide_title: true
---

# Class: EntityHelper

[core](../modules/core.md).EntityHelper

## Constructors

### constructor

\+ **new EntityHelper**(): [*EntityHelper*](core.entityhelper.md)

**Returns:** [*EntityHelper*](core.entityhelper.md)

## Methods

### decorate

▸ `Static`**decorate**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `em`: [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`em` | [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |

**Returns:** *void*

Defined in: [packages/core/src/entity/EntityHelper.ts:16](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityHelper.ts#L16)

___

### defineBaseProperties

▸ `Private` `Static`**defineBaseProperties**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `prototype`: T, `em`: [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`prototype` | T |
`em` | [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |

**Returns:** *void*

Defined in: [packages/core/src/entity/EntityHelper.ts:55](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityHelper.ts#L55)

___

### defineIdProperty

▸ `Private` `Static`**defineIdProperty**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `platform`: [*Platform*](core.platform.md)): *void*

defines magic id property getter/setter if PK property is `_id` and there is no `id` property defined

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *void*

Defined in: [packages/core/src/entity/EntityHelper.ts:44](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityHelper.ts#L44)

___

### defineReferenceProperties

▸ `Private` `Static`**defineReferenceProperties**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>): *void*

Defines getter and setter for every owning side of m:1 and 1:1 relation. This is then used for propagation of
changes to the inverse side of bi-directional relations.
First defines a setter on the prototype, once called, actual get/set handlers are registered on the instance rather
than on its prototype. Thanks to this we still have those properties enumerable (e.g. part of `Object.keys(entity)`).

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/entity/EntityHelper.ts:79](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityHelper.ts#L79)

___

### defineReferenceProperty

▸ `Private` `Static`**defineReferenceProperty**<T\>(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>, `ref`: T, `val`: [*AnyEntity*](../modules/core.md#anyentity)<any\>): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |
`ref` | T |
`val` | [*AnyEntity*](../modules/core.md#anyentity)<any\> |

**Returns:** *void*

Defined in: [packages/core/src/entity/EntityHelper.ts:113](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityHelper.ts#L113)

___

### propagate

▸ `Private` `Static`**propagate**<T, O\>(`entity`: T, `owner`: O, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<O\>): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |
`O` | [*AnyEntity*](../modules/core.md#anyentity)<O\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`owner` | O |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<O\> |

**Returns:** *void*

Defined in: [packages/core/src/entity/EntityHelper.ts:129](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityHelper.ts#L129)

___

### propagateOneToOne

▸ `Private` `Static`**propagateOneToOne**<T, O\>(`entity`: T, `owner`: O, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<O\>): *void*

#### Type parameters:

Name |
:------ |
`T` |
`O` |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`owner` | O |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<O\> |

**Returns:** *void*

Defined in: [packages/core/src/entity/EntityHelper.ts:141](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityHelper.ts#L141)
