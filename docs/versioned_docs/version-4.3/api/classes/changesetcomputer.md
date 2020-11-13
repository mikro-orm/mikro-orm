---
id: "changesetcomputer"
title: "Class: ChangeSetComputer"
sidebar_label: "ChangeSetComputer"
---

## Hierarchy

* **ChangeSetComputer**

## Constructors

### constructor

\+ **new ChangeSetComputer**(`validator`: [EntityValidator](entityvalidator.md), `collectionUpdates`: Set&#60;[Collection](collection.md)&#60;[AnyEntity](../index.md#anyentity)>>, `removeStack`: Set&#60;[AnyEntity](../index.md#anyentity)>, `metadata`: [MetadataStorage](metadatastorage.md), `platform`: [Platform](platform.md), `config`: [Configuration](configuration.md)): [ChangeSetComputer](changesetcomputer.md)

*Defined in [packages/core/src/unit-of-work/ChangeSetComputer.ts:12](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSetComputer.ts#L12)*

#### Parameters:

Name | Type |
------ | ------ |
`validator` | [EntityValidator](entityvalidator.md) |
`collectionUpdates` | Set&#60;[Collection](collection.md)&#60;[AnyEntity](../index.md#anyentity)>> |
`removeStack` | Set&#60;[AnyEntity](../index.md#anyentity)> |
`metadata` | [MetadataStorage](metadatastorage.md) |
`platform` | [Platform](platform.md) |
`config` | [Configuration](configuration.md) |

**Returns:** [ChangeSetComputer](changesetcomputer.md)

## Properties

### collectionUpdates

• `Private` `Readonly` **collectionUpdates**: Set&#60;[Collection](collection.md)&#60;[AnyEntity](../index.md#anyentity)>>

*Defined in [packages/core/src/unit-of-work/ChangeSetComputer.ts:15](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSetComputer.ts#L15)*

___

### comparator

• `Private` `Readonly` **comparator**: [EntityComparator](entitycomparator.md) = new EntityComparator(this.metadata, this.platform)

*Defined in [packages/core/src/unit-of-work/ChangeSetComputer.ts:12](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSetComputer.ts#L12)*

___

### config

• `Private` `Readonly` **config**: [Configuration](configuration.md)

*Defined in [packages/core/src/unit-of-work/ChangeSetComputer.ts:19](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSetComputer.ts#L19)*

___

### metadata

• `Private` `Readonly` **metadata**: [MetadataStorage](metadatastorage.md)

*Defined in [packages/core/src/unit-of-work/ChangeSetComputer.ts:17](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSetComputer.ts#L17)*

___

### platform

• `Private` `Readonly` **platform**: [Platform](platform.md)

*Defined in [packages/core/src/unit-of-work/ChangeSetComputer.ts:18](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSetComputer.ts#L18)*

___

### removeStack

• `Private` `Readonly` **removeStack**: Set&#60;[AnyEntity](../index.md#anyentity)>

*Defined in [packages/core/src/unit-of-work/ChangeSetComputer.ts:16](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSetComputer.ts#L16)*

___

### validator

• `Private` `Readonly` **validator**: [EntityValidator](entityvalidator.md)

*Defined in [packages/core/src/unit-of-work/ChangeSetComputer.ts:14](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSetComputer.ts#L14)*

## Methods

### computeChangeSet

▸ **computeChangeSet**&#60;T>(`entity`: T): [ChangeSet](changeset.md)&#60;T> \| null

*Defined in [packages/core/src/unit-of-work/ChangeSetComputer.ts:21](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSetComputer.ts#L21)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |

**Returns:** [ChangeSet](changeset.md)&#60;T> \| null

___

### computePayload

▸ `Private`**computePayload**&#60;T>(`entity`: T): [EntityData](../index.md#entitydata)&#60;T>

*Defined in [packages/core/src/unit-of-work/ChangeSetComputer.ts:50](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSetComputer.ts#L50)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |

**Returns:** [EntityData](../index.md#entitydata)&#60;T>

___

### processProperty

▸ `Private`**processProperty**&#60;T>(`changeSet`: [ChangeSet](changeset.md)&#60;T>, `prop`: [EntityProperty](../interfaces/entityproperty.md)&#60;T>): void

*Defined in [packages/core/src/unit-of-work/ChangeSetComputer.ts:63](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSetComputer.ts#L63)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`changeSet` | [ChangeSet](changeset.md)&#60;T> |
`prop` | [EntityProperty](../interfaces/entityproperty.md)&#60;T> |

**Returns:** void

___

### processToMany

▸ `Private`**processToMany**&#60;T>(`prop`: [EntityProperty](../interfaces/entityproperty.md)&#60;T>, `changeSet`: [ChangeSet](changeset.md)&#60;T>): void

*Defined in [packages/core/src/unit-of-work/ChangeSetComputer.ts:83](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSetComputer.ts#L83)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md)&#60;T> |
`changeSet` | [ChangeSet](changeset.md)&#60;T> |

**Returns:** void

___

### processToOne

▸ `Private`**processToOne**&#60;T>(`prop`: [EntityProperty](../interfaces/entityproperty.md)&#60;T>, `changeSet`: [ChangeSet](changeset.md)&#60;T>): void

*Defined in [packages/core/src/unit-of-work/ChangeSetComputer.ts:73](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSetComputer.ts#L73)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md)&#60;T> |
`changeSet` | [ChangeSet](changeset.md)&#60;T> |

**Returns:** void
