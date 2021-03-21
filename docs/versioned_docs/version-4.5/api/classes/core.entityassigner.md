---
id: "core.entityassigner"
title: "Class: EntityAssigner"
sidebar_label: "EntityAssigner"
custom_edit_url: null
hide_title: true
---

# Class: EntityAssigner

[core](../modules/core.md).EntityAssigner

## Constructors

### constructor

\+ **new EntityAssigner**(): [*EntityAssigner*](core.entityassigner.md)

**Returns:** [*EntityAssigner*](core.entityassigner.md)

## Methods

### assign

▸ `Static`**assign**<T\>(`entity`: T, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `options?`: [*AssignOptions*](../interfaces/core.assignoptions.md)): T

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`options?` | [*AssignOptions*](../interfaces/core.assignoptions.md) |

**Returns:** T

Defined in: [packages/core/src/entity/EntityAssigner.ts:15](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityAssigner.ts#L15)

▸ `Static`**assign**<T\>(`entity`: T, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `onlyProperties?`: *boolean*): T

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`onlyProperties?` | *boolean* |

**Returns:** T

Defined in: [packages/core/src/entity/EntityAssigner.ts:16](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityAssigner.ts#L16)

___

### assignCollection

▸ `Private` `Static`**assignCollection**<T, U\>(`entity`: T, `collection`: [*Collection*](core.collection.md)<U, unknown\>, `value`: *any*[], `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `em`: [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>, `options`: [*AssignOptions*](../interfaces/core.assignoptions.md)): *void*

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | - |
`U` | [*AnyEntity*](../modules/core.md#anyentity)<U\> | [*AnyEntity*](../modules/core.md#anyentity)<any\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`collection` | [*Collection*](core.collection.md)<U, unknown\> |
`value` | *any*[] |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`em` | [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |
`options` | [*AssignOptions*](../interfaces/core.assignoptions.md) |

**Returns:** *void*

Defined in: [packages/core/src/entity/EntityAssigner.ts:126](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityAssigner.ts#L126)

___

### assignEmbeddable

▸ `Private` `Static`**assignEmbeddable**<T\>(`entity`: T, `value`: *any*, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `em`: [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>, `options`: [*AssignOptions*](../interfaces/core.assignoptions.md)): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`value` | *any* |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`em` | [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |
`options` | [*AssignOptions*](../interfaces/core.assignoptions.md) |

**Returns:** *void*

Defined in: [packages/core/src/entity/EntityAssigner.ts:138](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityAssigner.ts#L138)

___

### assignReference

▸ `Private` `Static`**assignReference**<T\>(`entity`: T, `value`: *any*, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `em`: [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>, `options`: [*AssignOptions*](../interfaces/core.assignoptions.md)): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`value` | *any* |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`em` | [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |
`options` | [*AssignOptions*](../interfaces/core.assignoptions.md) |

**Returns:** *void*

Defined in: [packages/core/src/entity/EntityAssigner.ts:109](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityAssigner.ts#L109)

___

### autoWireOneToOne

▸ `Static`**autoWireOneToOne**<T\>(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `entity`: T): *void*

auto-wire 1:1 inverse side with owner as in no-sql drivers it can't be joined
also makes sure the link is bidirectional when creating new entities from nested structures

**`internal`** 

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`entity` | T |

**Returns:** *void*

Defined in: [packages/core/src/entity/EntityAssigner.ts:83](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityAssigner.ts#L83)

___

### createCollectionItem

▸ `Private` `Static`**createCollectionItem**<T\>(`item`: *any*, `em`: [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `invalid`: *any*[], `options`: [*AssignOptions*](../interfaces/core.assignoptions.md)): T

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`item` | *any* |
`em` | [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`invalid` | *any*[] |
`options` | [*AssignOptions*](../interfaces/core.assignoptions.md) |

**Returns:** T

Defined in: [packages/core/src/entity/EntityAssigner.ts:159](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityAssigner.ts#L159)

___

### validateEM

▸ `Private` `Static`**validateEM**(`em?`: [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`em?` | [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |

**Returns:** *boolean*

Defined in: [packages/core/src/entity/EntityAssigner.ts:101](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityAssigner.ts#L101)
