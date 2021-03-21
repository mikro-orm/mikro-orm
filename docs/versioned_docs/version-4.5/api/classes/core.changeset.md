---
id: "core.changeset"
title: "Class: ChangeSet<T>"
sidebar_label: "ChangeSet"
custom_edit_url: null
hide_title: true
---

# Class: ChangeSet<T\>

[core](../modules/core.md).ChangeSet

## Type parameters

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

## Constructors

### constructor

\+ **new ChangeSet**<T\>(`entity`: T, `type`: [*ChangeSetType*](../enums/core.changesettype.md), `payload`: [*EntityData*](../modules/core.md#entitydata)<T\>, `meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>): [*ChangeSet*](core.changeset.md)<T\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`type` | [*ChangeSetType*](../enums/core.changesettype.md) |
`payload` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |

**Returns:** [*ChangeSet*](core.changeset.md)<T\>

Defined in: [packages/core/src/unit-of-work/ChangeSet.ts:3](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSet.ts#L3)

## Properties

### collection

• **collection**: *string*

Defined in: [packages/core/src/unit-of-work/ChangeSet.ts:19](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSet.ts#L19)

___

### entity

• **entity**: T

Defined in: [packages/core/src/unit-of-work/ChangeSet.ts:21](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSet.ts#L21)

___

### name

• **name**: *string*

Defined in: [packages/core/src/unit-of-work/ChangeSet.ts:17](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSet.ts#L17)

___

### originalEntity

• `Optional` **originalEntity**: [*EntityData*](../modules/core.md#entitydata)<T\>

Defined in: [packages/core/src/unit-of-work/ChangeSet.ts:24](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSet.ts#L24)

___

### payload

• **payload**: [*EntityData*](../modules/core.md#entitydata)<T\>

Defined in: [packages/core/src/unit-of-work/ChangeSet.ts:22](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSet.ts#L22)

___

### persisted

• **persisted**: *boolean*

Defined in: [packages/core/src/unit-of-work/ChangeSet.ts:23](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSet.ts#L23)

___

### rootName

• **rootName**: *string*

Defined in: [packages/core/src/unit-of-work/ChangeSet.ts:18](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSet.ts#L18)

___

### type

• **type**: [*ChangeSetType*](../enums/core.changesettype.md)

Defined in: [packages/core/src/unit-of-work/ChangeSet.ts:20](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/ChangeSet.ts#L20)
