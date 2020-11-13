---
id: "entityhelper"
title: "Class: EntityHelper"
sidebar_label: "EntityHelper"
---

## Hierarchy

* **EntityHelper**

## Methods

### decorate

▸ `Static`**decorate**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `em`: [EntityManager](entitymanager.md)): void

*Defined in [packages/core/src/entity/EntityHelper.ts:16](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityHelper.ts#L16)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`em` | [EntityManager](entitymanager.md) |

**Returns:** void

___

### defineBaseProperties

▸ `Static` `Private`**defineBaseProperties**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `prototype`: T, `em`: [EntityManager](entitymanager.md)): void

*Defined in [packages/core/src/entity/EntityHelper.ts:55](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityHelper.ts#L55)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`prototype` | T |
`em` | [EntityManager](entitymanager.md) |

**Returns:** void

___

### defineIdProperty

▸ `Static` `Private`**defineIdProperty**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `platform`: [Platform](platform.md)): void

*Defined in [packages/core/src/entity/EntityHelper.ts:44](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityHelper.ts#L44)*

defines magic id property getter/setter if PK property is `_id` and there is no `id` property defined

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`platform` | [Platform](platform.md) |

**Returns:** void

___

### defineReferenceProperties

▸ `Static` `Private`**defineReferenceProperties**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>): void

*Defined in [packages/core/src/entity/EntityHelper.ts:79](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityHelper.ts#L79)*

Defines getter and setter for every owning side of m:1 and 1:1 relation. This is then used for propagation of
changes to the inverse side of bi-directional relations.
First defines a setter on the prototype, once called, actual get/set handlers are registered on the instance rather
than on its prototype. Thanks to this we still have those properties enumerable (e.g. part of `Object.keys(entity)`).

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |

**Returns:** void

___

### defineReferenceProperty

▸ `Static` `Private`**defineReferenceProperty**&#60;T>(`prop`: [EntityProperty](../interfaces/entityproperty.md)&#60;T>, `ref`: T, `val`: [AnyEntity](../index.md#anyentity)): void

*Defined in [packages/core/src/entity/EntityHelper.ts:110](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityHelper.ts#L110)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md)&#60;T> |
`ref` | T |
`val` | [AnyEntity](../index.md#anyentity) |

**Returns:** void

___

### propagate

▸ `Static` `Private`**propagate**&#60;T, O>(`entity`: T, `owner`: O, `prop`: [EntityProperty](../interfaces/entityproperty.md)&#60;O>): void

*Defined in [packages/core/src/entity/EntityHelper.ts:126](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityHelper.ts#L126)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |
`O` | [AnyEntity](../index.md#anyentity)&#60;O> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`owner` | O |
`prop` | [EntityProperty](../interfaces/entityproperty.md)&#60;O> |

**Returns:** void

___

### propagateOneToOne

▸ `Static` `Private`**propagateOneToOne**&#60;T, O>(`entity`: T, `owner`: O, `prop`: [EntityProperty](../interfaces/entityproperty.md)&#60;O>): void

*Defined in [packages/core/src/entity/EntityHelper.ts:138](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityHelper.ts#L138)*

#### Type parameters:

Name |
------ |
`T` |
`O` |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`owner` | O |
`prop` | [EntityProperty](../interfaces/entityproperty.md)&#60;O> |

**Returns:** void
