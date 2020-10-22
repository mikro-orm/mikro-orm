---
id: "ihydrator"
title: "Interface: IHydrator"
sidebar_label: "IHydrator"
---

## Hierarchy

* **IHydrator**

## Implemented by

* [Hydrator](../classes/hydrator.md)
* [ObjectHydrator](../classes/objecthydrator.md)

## Methods

### hydrate

▸ **hydrate**&#60;T>(`entity`: T, `meta`: [EntityMetadata](../classes/entitymetadata.md)&#60;T>, `data`: [EntityData](../index.md#entitydata)&#60;T>, `factory`: [EntityFactory](../classes/entityfactory.md), `type`: &#34;full&#34; \| &#34;returning&#34; \| &#34;reference&#34;, `newEntity?`: boolean, `convertCustomTypes?`: boolean): void

*Defined in [packages/core/src/typings.ts:424](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/typings.ts#L424)*

Hydrates the whole entity. This process handles custom type conversions, creating missing Collection instances,
mapping FKs to entity instances, as well as merging those entities.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`meta` | [EntityMetadata](../classes/entitymetadata.md)&#60;T> |
`data` | [EntityData](../index.md#entitydata)&#60;T> |
`factory` | [EntityFactory](../classes/entityfactory.md) |
`type` | &#34;full&#34; \| &#34;returning&#34; \| &#34;reference&#34; |
`newEntity?` | boolean |
`convertCustomTypes?` | boolean |

**Returns:** void

___

### hydrateReference

▸ **hydrateReference**&#60;T>(`entity`: T, `meta`: [EntityMetadata](../classes/entitymetadata.md)&#60;T>, `data`: [EntityData](../index.md#entitydata)&#60;T>, `factory`: [EntityFactory](../classes/entityfactory.md), `convertCustomTypes?`: boolean): void

*Defined in [packages/core/src/typings.ts:437](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/typings.ts#L437)*

Hydrates primary keys only

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`meta` | [EntityMetadata](../classes/entitymetadata.md)&#60;T> |
`data` | [EntityData](../index.md#entitydata)&#60;T> |
`factory` | [EntityFactory](../classes/entityfactory.md) |
`convertCustomTypes?` | boolean |

**Returns:** void
