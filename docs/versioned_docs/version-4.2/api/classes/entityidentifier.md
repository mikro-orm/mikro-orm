---
id: "entityidentifier"
title: "Class: EntityIdentifier"
sidebar_label: "EntityIdentifier"
---

## Hierarchy

* **EntityIdentifier**

## Constructors

### constructor

\+ **new EntityIdentifier**(`value?`: [IPrimaryKey](../index.md#iprimarykey)): [EntityIdentifier](entityidentifier.md)

*Defined in [packages/core/src/entity/EntityIdentifier.ts:3](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/entity/EntityIdentifier.ts#L3)*

#### Parameters:

Name | Type |
------ | ------ |
`value?` | [IPrimaryKey](../index.md#iprimarykey) |

**Returns:** [EntityIdentifier](entityidentifier.md)

## Properties

### value

• `Private` `Optional` **value**: [IPrimaryKey](../index.md#iprimarykey)

*Defined in [packages/core/src/entity/EntityIdentifier.ts:5](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/entity/EntityIdentifier.ts#L5)*

## Methods

### getValue

▸ **getValue**&#60;T>(): T

*Defined in [packages/core/src/entity/EntityIdentifier.ts:11](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/entity/EntityIdentifier.ts#L11)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [IPrimaryKey](../index.md#iprimarykey) | IPrimaryKey |

**Returns:** T

___

### setValue

▸ **setValue**(`value`: [IPrimaryKey](../index.md#iprimarykey)): void

*Defined in [packages/core/src/entity/EntityIdentifier.ts:7](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/entity/EntityIdentifier.ts#L7)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | [IPrimaryKey](../index.md#iprimarykey) |

**Returns:** void
