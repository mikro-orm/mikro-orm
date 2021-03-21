---
id: "core.eventmanager"
title: "Class: EventManager"
sidebar_label: "EventManager"
custom_edit_url: null
hide_title: true
---

# Class: EventManager

[core](../modules/core.md).EventManager

## Constructors

### constructor

\+ **new EventManager**(`subscribers`: [*EventSubscriber*](../interfaces/core.eventsubscriber.md)<any\>[]): [*EventManager*](core.eventmanager.md)

#### Parameters:

Name | Type |
:------ | :------ |
`subscribers` | [*EventSubscriber*](../interfaces/core.eventsubscriber.md)<any\>[] |

**Returns:** [*EventManager*](core.eventmanager.md)

Defined in: [packages/core/src/events/EventManager.ts:9](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventManager.ts#L9)

## Properties

### entities

• `Private` `Readonly` **entities**: *Map*<[*EventSubscriber*](../interfaces/core.eventsubscriber.md)<any\>, string[]\>

Defined in: [packages/core/src/events/EventManager.ts:9](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventManager.ts#L9)

___

### listeners

• `Private` `Readonly` **listeners**: *Partial*<Record<[*EventType*](../enums/core.eventtype.md), [*EventSubscriber*](../interfaces/core.eventsubscriber.md)<any\>[]\>\>

Defined in: [packages/core/src/events/EventManager.ts:8](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventManager.ts#L8)

## Methods

### dispatchEvent

▸ **dispatchEvent**<T\>(`event`: [*TransactionEventType*](../modules/core.md#transactioneventtype), `args`: [*TransactionEventArgs*](../interfaces/core.transactioneventargs.md)): *unknown*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`event` | [*TransactionEventType*](../modules/core.md#transactioneventtype) |
`args` | [*TransactionEventArgs*](../interfaces/core.transactioneventargs.md) |

**Returns:** *unknown*

Defined in: [packages/core/src/events/EventManager.ts:25](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventManager.ts#L25)

▸ **dispatchEvent**<T\>(`event`: [*onInit*](../enums/core.eventtype.md#oninit), `args`: *Partial*<[*EventArgs*](../interfaces/core.eventargs.md)<T\>\>): *unknown*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`event` | [*onInit*](../enums/core.eventtype.md#oninit) |
`args` | *Partial*<[*EventArgs*](../interfaces/core.eventargs.md)<T\>\> |

**Returns:** *unknown*

Defined in: [packages/core/src/events/EventManager.ts:26](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventManager.ts#L26)

▸ **dispatchEvent**<T\>(`event`: [*EventType*](../enums/core.eventtype.md), `args`: *Partial*<[*FlushEventArgs*](../interfaces/core.flusheventargs.md) \| [*EventArgs*](../interfaces/core.eventargs.md)<T\>\>): *Promise*<unknown\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`event` | [*EventType*](../enums/core.eventtype.md) |
`args` | *Partial*<[*FlushEventArgs*](../interfaces/core.flusheventargs.md) \| [*EventArgs*](../interfaces/core.eventargs.md)<T\>\> |

**Returns:** *Promise*<unknown\>

Defined in: [packages/core/src/events/EventManager.ts:27](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventManager.ts#L27)

___

### getSubscribedEntities

▸ `Private`**getSubscribedEntities**(`listener`: [*EventSubscriber*](../interfaces/core.eventsubscriber.md)<any\>): *string*[]

#### Parameters:

Name | Type |
:------ | :------ |
`listener` | [*EventSubscriber*](../interfaces/core.eventsubscriber.md)<any\> |

**Returns:** *string*[]

Defined in: [packages/core/src/events/EventManager.ts:70](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventManager.ts#L70)

___

### hasListeners

▸ **hasListeners**<T\>(`event`: [*EventType*](../enums/core.eventtype.md), `meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>): *boolean*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`event` | [*EventType*](../enums/core.eventtype.md) |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |

**Returns:** *boolean*

Defined in: [packages/core/src/events/EventManager.ts:51](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventManager.ts#L51)

___

### registerSubscriber

▸ **registerSubscriber**(`subscriber`: [*EventSubscriber*](../interfaces/core.eventsubscriber.md)<any\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`subscriber` | [*EventSubscriber*](../interfaces/core.eventsubscriber.md)<any\> |

**Returns:** *void*

Defined in: [packages/core/src/events/EventManager.ts:15](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventManager.ts#L15)
