---
id: "serializationcontext"
title: "Class: SerializationContext<T>"
sidebar_label: "SerializationContext"
---

Helper that allows to keep track of where we are currently at when serializing complex entity graph with cycles.
Before we process a property, we call `visit` that checks if it is not a cycle path (but allows to pass cycles that
are defined in populate hint). If not, we proceed and call `leave` afterwards.

## Type parameters

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

## Hierarchy

* **SerializationContext**

## Constructors

### constructor

\+ **new SerializationContext**(`populate`: [PopulateOptions](../index.md#populateoptions)&#60;T>[]): [SerializationContext](serializationcontext.md)

*Defined in [packages/core/src/entity/EntityTransformer.ts:15](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityTransformer.ts#L15)*

#### Parameters:

Name | Type |
------ | ------ |
`populate` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] |

**Returns:** [SerializationContext](serializationcontext.md)

## Properties

### path

• `Readonly` **path**: string[] = []

*Defined in [packages/core/src/entity/EntityTransformer.ts:15](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityTransformer.ts#L15)*

___

### populate

• `Private` `Readonly` **populate**: [PopulateOptions](../index.md#populateoptions)&#60;T>[]

*Defined in [packages/core/src/entity/EntityTransformer.ts:17](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityTransformer.ts#L17)*

## Methods

### isMarkedAsPopulated

▸ `Private`**isMarkedAsPopulated**(`path`: string): boolean

*Defined in [packages/core/src/entity/EntityTransformer.ts:63](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityTransformer.ts#L63)*

#### Parameters:

Name | Type |
------ | ------ |
`path` | string |

**Returns:** boolean

___

### leave

▸ **leave**&#60;U>(`path`: string): void

*Defined in [packages/core/src/entity/EntityTransformer.ts:34](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityTransformer.ts#L34)*

#### Type parameters:

Name |
------ |
`U` |

#### Parameters:

Name | Type |
------ | ------ |
`path` | string |

**Returns:** void

___

### visit

▸ **visit**(`prop`: string): boolean

*Defined in [packages/core/src/entity/EntityTransformer.ts:19](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityTransformer.ts#L19)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | string |

**Returns:** boolean

___

### propagate

▸ `Static`**propagate**(`root`: [SerializationContext](serializationcontext.md)&#60;[AnyEntity](../index.md#anyentity)>, `entity`: [AnyEntity](../index.md#anyentity)): void

*Defined in [packages/core/src/entity/EntityTransformer.ts:46](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/entity/EntityTransformer.ts#L46)*

When initializing new context, we need to propagate it to the whole entity graph recursively.

#### Parameters:

Name | Type |
------ | ------ |
`root` | [SerializationContext](serializationcontext.md)&#60;[AnyEntity](../index.md#anyentity)> |
`entity` | [AnyEntity](../index.md#anyentity) |

**Returns:** void
