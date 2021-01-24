---
id: "core.changesetcomputer"
title: "Class: ChangeSetComputer"
sidebar_label: "ChangeSetComputer"
hide_title: true
---

# Class: ChangeSetComputer

[core](../modules/core.md).ChangeSetComputer

## Hierarchy

* **ChangeSetComputer**

## Constructors

### constructor

\+ **new ChangeSetComputer**(`validator`: [*EntityValidator*](core.entityvalidator.md), `collectionUpdates`: *Set*<[*Collection*](core.collection.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>, *unknown*\>\>, `removeStack`: *Set*<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>, `metadata`: [*MetadataStorage*](core.metadatastorage.md), `platform`: [*Platform*](core.platform.md), `config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>): [*ChangeSetComputer*](core.changesetcomputer.md)

#### Parameters:

Name | Type |
------ | ------ |
`validator` | [*EntityValidator*](core.entityvalidator.md) |
`collectionUpdates` | *Set*<[*Collection*](core.collection.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>, *unknown*\>\> |
`removeStack` | *Set*<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\> |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |
`platform` | [*Platform*](core.platform.md) |
`config` | [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |

**Returns:** [*ChangeSetComputer*](core.changesetcomputer.md)

Defined in: [packages/core/src/unit-of-work/ChangeSetComputer.ts:12](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/unit-of-work/ChangeSetComputer.ts#L12)

## Properties

### comparator

• `Private` `Readonly` **comparator**: [*EntityComparator*](core.entitycomparator.md)

Defined in: [packages/core/src/unit-of-work/ChangeSetComputer.ts:12](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/unit-of-work/ChangeSetComputer.ts#L12)

## Methods

### computeChangeSet

▸ **computeChangeSet**<T\>(`entity`: T): *null* \| [*ChangeSet*](core.changeset.md)<T\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |

**Returns:** *null* \| [*ChangeSet*](core.changeset.md)<T\>

Defined in: [packages/core/src/unit-of-work/ChangeSetComputer.ts:21](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/unit-of-work/ChangeSetComputer.ts#L21)

___

### computePayload

▸ `Private`**computePayload**<T\>(`entity`: T): [*EntityData*](../modules/core.md#entitydata)<T\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |

**Returns:** [*EntityData*](../modules/core.md#entitydata)<T\>

Defined in: [packages/core/src/unit-of-work/ChangeSetComputer.ts:50](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/unit-of-work/ChangeSetComputer.ts#L50)

___

### processProperty

▸ `Private`**processProperty**<T\>(`changeSet`: [*ChangeSet*](core.changeset.md)<T\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>): *void*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`changeSet` | [*ChangeSet*](core.changeset.md)<T\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/ChangeSetComputer.ts:63](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/unit-of-work/ChangeSetComputer.ts#L63)

___

### processToMany

▸ `Private`**processToMany**<T\>(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>, `changeSet`: [*ChangeSet*](core.changeset.md)<T\>): *void*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |
`changeSet` | [*ChangeSet*](core.changeset.md)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/ChangeSetComputer.ts:83](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/unit-of-work/ChangeSetComputer.ts#L83)

___

### processToOne

▸ `Private`**processToOne**<T\>(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>, `changeSet`: [*ChangeSet*](core.changeset.md)<T\>): *void*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |
`changeSet` | [*ChangeSet*](core.changeset.md)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/ChangeSetComputer.ts:73](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/unit-of-work/ChangeSetComputer.ts#L73)
