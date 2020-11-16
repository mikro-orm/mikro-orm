---
id: "eventmanager"
title: "Class: EventManager"
sidebar_label: "EventManager"
---

## Hierarchy

* **EventManager**

## Constructors

### constructor

\+ **new EventManager**(`subscribers`: [EventSubscriber](../interfaces/eventsubscriber.md)[]): [EventManager](eventmanager.md)

*Defined in [packages/core/src/events/EventManager.ts:9](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/events/EventManager.ts#L9)*

#### Parameters:

Name | Type |
------ | ------ |
`subscribers` | [EventSubscriber](../interfaces/eventsubscriber.md)[] |

**Returns:** [EventManager](eventmanager.md)

## Properties

### entities

• `Private` `Readonly` **entities**: Map&#60;[EventSubscriber](../interfaces/eventsubscriber.md), string[]> = new Map()

*Defined in [packages/core/src/events/EventManager.ts:9](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/events/EventManager.ts#L9)*

___

### listeners

• `Private` `Readonly` **listeners**: Partial&#60;Record&#60;[EventType](../enums/eventtype.md), [EventSubscriber](../interfaces/eventsubscriber.md)[]>>

*Defined in [packages/core/src/events/EventManager.ts:8](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/events/EventManager.ts#L8)*

## Methods

### dispatchEvent

▸ **dispatchEvent**&#60;T>(`event`: [onInit](../enums/eventtype.md#oninit), `args`: Partial&#60;[EventArgs](../interfaces/eventargs.md)&#60;T>>): unknown

*Defined in [packages/core/src/events/EventManager.ts:25](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/events/EventManager.ts#L25)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`event` | [onInit](../enums/eventtype.md#oninit) |
`args` | Partial&#60;[EventArgs](../interfaces/eventargs.md)&#60;T>> |

**Returns:** unknown

▸ **dispatchEvent**&#60;T>(`event`: [EventType](../enums/eventtype.md), `args`: Partial&#60;[EventArgs](../interfaces/eventargs.md)&#60;T> \| [FlushEventArgs](../interfaces/flusheventargs.md)>): Promise&#60;unknown>

*Defined in [packages/core/src/events/EventManager.ts:26](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/events/EventManager.ts#L26)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`event` | [EventType](../enums/eventtype.md) |
`args` | Partial&#60;[EventArgs](../interfaces/eventargs.md)&#60;T> \| [FlushEventArgs](../interfaces/flusheventargs.md)> |

**Returns:** Promise&#60;unknown>

___

### getSubscribedEntities

▸ `Private`**getSubscribedEntities**(`listener`: [EventSubscriber](../interfaces/eventsubscriber.md)): string[]

*Defined in [packages/core/src/events/EventManager.ts:69](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/events/EventManager.ts#L69)*

#### Parameters:

Name | Type |
------ | ------ |
`listener` | [EventSubscriber](../interfaces/eventsubscriber.md) |

**Returns:** string[]

___

### hasListeners

▸ **hasListeners**&#60;T>(`event`: [EventType](../enums/eventtype.md), `meta`: [EntityMetadata](entitymetadata.md)&#60;T>): boolean

*Defined in [packages/core/src/events/EventManager.ts:50](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/events/EventManager.ts#L50)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`event` | [EventType](../enums/eventtype.md) |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |

**Returns:** boolean

___

### registerSubscriber

▸ **registerSubscriber**(`subscriber`: [EventSubscriber](../interfaces/eventsubscriber.md)): void

*Defined in [packages/core/src/events/EventManager.ts:15](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/events/EventManager.ts#L15)*

#### Parameters:

Name | Type |
------ | ------ |
`subscriber` | [EventSubscriber](../interfaces/eventsubscriber.md) |

**Returns:** void
