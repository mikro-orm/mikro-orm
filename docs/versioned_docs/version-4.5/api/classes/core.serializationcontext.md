---
id: "core.serializationcontext"
title: "Class: SerializationContext<T>"
sidebar_label: "SerializationContext"
custom_edit_url: null
hide_title: true
---

# Class: SerializationContext<T\>

[core](../modules/core.md).SerializationContext

Helper that allows to keep track of where we are currently at when serializing complex entity graph with cycles.
Before we process a property, we call `visit` that checks if it is not a cycle path (but allows to pass cycles that
are defined in populate hint). If not, we proceed and call `leave` afterwards.

## Type parameters

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

## Constructors

### constructor

\+ **new SerializationContext**<T\>(`populate`: [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[]): [*SerializationContext*](core.serializationcontext.md)<T\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`populate` | [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[] |

**Returns:** [*SerializationContext*](core.serializationcontext.md)<T\>

Defined in: [packages/core/src/entity/EntityTransformer.ts:15](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityTransformer.ts#L15)

## Properties

### path

• `Readonly` **path**: [*string*, *string*][]

Defined in: [packages/core/src/entity/EntityTransformer.ts:15](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityTransformer.ts#L15)

## Methods

### isMarkedAsPopulated

▸ `Private`**isMarkedAsPopulated**(`prop`: *string*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | *string* |

**Returns:** *boolean*

Defined in: [packages/core/src/entity/EntityTransformer.ts:63](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityTransformer.ts#L63)

___

### leave

▸ **leave**<U\>(`entityName`: *string*, `prop`: *string*): *void*

#### Type parameters:

Name |
:------ |
`U` |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`prop` | *string* |

**Returns:** *void*

Defined in: [packages/core/src/entity/EntityTransformer.ts:34](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityTransformer.ts#L34)

___

### visit

▸ **visit**(`entityName`: *string*, `prop`: *string*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`prop` | *string* |

**Returns:** *boolean*

Defined in: [packages/core/src/entity/EntityTransformer.ts:19](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityTransformer.ts#L19)

___

### propagate

▸ `Static`**propagate**(`root`: [*SerializationContext*](core.serializationcontext.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>, `entity`: [*AnyEntity*](../modules/core.md#anyentity)<any\>): *void*

When initializing new context, we need to propagate it to the whole entity graph recursively.

#### Parameters:

Name | Type |
:------ | :------ |
`root` | [*SerializationContext*](core.serializationcontext.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> |
`entity` | [*AnyEntity*](../modules/core.md#anyentity)<any\> |

**Returns:** *void*

Defined in: [packages/core/src/entity/EntityTransformer.ts:46](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityTransformer.ts#L46)
