---
id: "entityassigner"
title: "Class: EntityAssigner"
sidebar_label: "EntityAssigner"
---

## Hierarchy

* **EntityAssigner**

## Methods

### assign

▸ `Static`**assign**&#60;T>(`entity`: T, `data`: [EntityData](../index.md#entitydata)&#60;T>, `options?`: [AssignOptions](../interfaces/assignoptions.md)): T

*Defined in [packages/core/src/entity/EntityAssigner.ts:14](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityAssigner.ts#L14)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`data` | [EntityData](../index.md#entitydata)&#60;T> |
`options?` | [AssignOptions](../interfaces/assignoptions.md) |

**Returns:** T

▸ `Static`**assign**&#60;T>(`entity`: T, `data`: [EntityData](../index.md#entitydata)&#60;T>, `onlyProperties?`: boolean): T

*Defined in [packages/core/src/entity/EntityAssigner.ts:15](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityAssigner.ts#L15)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`data` | [EntityData](../index.md#entitydata)&#60;T> |
`onlyProperties?` | boolean |

**Returns:** T

___

### assignCollection

▸ `Static` `Private`**assignCollection**&#60;T, U>(`entity`: T, `collection`: [Collection](collection.md)&#60;U>, `value`: any[], `prop`: [EntityProperty](../interfaces/entityproperty.md), `em`: [EntityManager](entitymanager.md), `options`: [AssignOptions](../interfaces/assignoptions.md)): void

*Defined in [packages/core/src/entity/EntityAssigner.ts:114](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityAssigner.ts#L114)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | - |
`U` | [AnyEntity](../index.md#anyentity)&#60;U> | AnyEntity |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`collection` | [Collection](collection.md)&#60;U> |
`value` | any[] |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`em` | [EntityManager](entitymanager.md) |
`options` | [AssignOptions](../interfaces/assignoptions.md) |

**Returns:** void

___

### assignReference

▸ `Static` `Private`**assignReference**&#60;T>(`entity`: T, `value`: any, `prop`: [EntityProperty](../interfaces/entityproperty.md), `em`: [EntityManager](entitymanager.md), `options`: [AssignOptions](../interfaces/assignoptions.md)): void

*Defined in [packages/core/src/entity/EntityAssigner.ts:97](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityAssigner.ts#L97)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`value` | any |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`em` | [EntityManager](entitymanager.md) |
`options` | [AssignOptions](../interfaces/assignoptions.md) |

**Returns:** void

___

### autoWireOneToOne

▸ `Static`**autoWireOneToOne**&#60;T>(`prop`: [EntityProperty](../interfaces/entityproperty.md), `entity`: T): void

*Defined in [packages/core/src/entity/EntityAssigner.ts:71](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityAssigner.ts#L71)*

auto-wire 1:1 inverse side with owner as in no-sql drivers it can't be joined
also makes sure the link is bidirectional when creating new entities from nested structures

**`internal`** 

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`entity` | T |

**Returns:** void

___

### createCollectionItem

▸ `Static` `Private`**createCollectionItem**&#60;T>(`item`: any, `em`: [EntityManager](entitymanager.md), `prop`: [EntityProperty](../interfaces/entityproperty.md), `invalid`: any[], `options`: [AssignOptions](../interfaces/assignoptions.md)): T

*Defined in [packages/core/src/entity/EntityAssigner.ts:126](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityAssigner.ts#L126)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`item` | any |
`em` | [EntityManager](entitymanager.md) |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`invalid` | any[] |
`options` | [AssignOptions](../interfaces/assignoptions.md) |

**Returns:** T

___

### validateEM

▸ `Static` `Private`**validateEM**(`em?`: [EntityManager](entitymanager.md)): boolean

*Defined in [packages/core/src/entity/EntityAssigner.ts:89](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityAssigner.ts#L89)*

#### Parameters:

Name | Type |
------ | ------ |
`em?` | [EntityManager](entitymanager.md) |

**Returns:** boolean
