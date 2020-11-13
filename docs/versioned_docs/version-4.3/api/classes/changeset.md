---
id: "changeset"
title: "Class: ChangeSet<T, T>"
sidebar_label: "ChangeSet"
---

## Type parameters

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

## Hierarchy

* **ChangeSet**

## Constructors

### constructor

\+ **new ChangeSet**(`entity`: T, `type`: [ChangeSetType](../enums/changesettype.md), `payload`: [EntityData](../index.md#entitydata)&#60;T>, `meta`: [EntityMetadata](entitymetadata.md)&#60;T>): [ChangeSet](changeset.md)

*Defined in [packages/core/src/unit-of-work/ChangeSet.ts:3](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSet.ts#L3)*

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`type` | [ChangeSetType](../enums/changesettype.md) |
`payload` | [EntityData](../index.md#entitydata)&#60;T> |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |

**Returns:** [ChangeSet](changeset.md)

## Properties

### collection

•  **collection**: string

*Defined in [packages/core/src/unit-of-work/ChangeSet.ts:19](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSet.ts#L19)*

___

### entity

•  **entity**: T

*Defined in [packages/core/src/unit-of-work/ChangeSet.ts:5](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSet.ts#L5)*

*Defined in [packages/core/src/unit-of-work/ChangeSet.ts:21](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSet.ts#L21)*

___

### name

•  **name**: string

*Defined in [packages/core/src/unit-of-work/ChangeSet.ts:17](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSet.ts#L17)*

___

### originalEntity

• `Optional` **originalEntity**: [EntityData](../index.md#entitydata)&#60;T>

*Defined in [packages/core/src/unit-of-work/ChangeSet.ts:24](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSet.ts#L24)*

___

### payload

•  **payload**: [EntityData](../index.md#entitydata)&#60;T>

*Defined in [packages/core/src/unit-of-work/ChangeSet.ts:7](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSet.ts#L7)*

*Defined in [packages/core/src/unit-of-work/ChangeSet.ts:22](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSet.ts#L22)*

___

### persisted

•  **persisted**: boolean

*Defined in [packages/core/src/unit-of-work/ChangeSet.ts:23](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSet.ts#L23)*

___

### rootName

•  **rootName**: string

*Defined in [packages/core/src/unit-of-work/ChangeSet.ts:18](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSet.ts#L18)*

___

### type

•  **type**: [ChangeSetType](../enums/changesettype.md)

*Defined in [packages/core/src/unit-of-work/ChangeSet.ts:6](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSet.ts#L6)*

*Defined in [packages/core/src/unit-of-work/ChangeSet.ts:20](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/ChangeSet.ts#L20)*
