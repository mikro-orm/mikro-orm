---
id: "core.eventsubscriber"
title: "Interface: EventSubscriber<T>"
sidebar_label: "EventSubscriber"
custom_edit_url: null
hide_title: true
---

# Interface: EventSubscriber<T\>

[core](../modules/core.md).EventSubscriber

## Type parameters

Name | Default |
:------ | :------ |
`T` | *any* |

## Methods

### afterCreate

▸ `Optional`**afterCreate**(`args`: [*EventArgs*](core.eventargs.md)<T\>): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`args` | [*EventArgs*](core.eventargs.md)<T\> |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/events/EventSubscriber.ts:25](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventSubscriber.ts#L25)

___

### afterDelete

▸ `Optional`**afterDelete**(`args`: [*EventArgs*](core.eventargs.md)<T\>): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`args` | [*EventArgs*](core.eventargs.md)<T\> |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/events/EventSubscriber.ts:29](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventSubscriber.ts#L29)

___

### afterFlush

▸ `Optional`**afterFlush**(`args`: [*FlushEventArgs*](core.flusheventargs.md)): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`args` | [*FlushEventArgs*](core.flusheventargs.md) |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/events/EventSubscriber.ts:32](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventSubscriber.ts#L32)

___

### afterTransactionCommit

▸ `Optional`**afterTransactionCommit**(`args`: [*TransactionEventArgs*](core.transactioneventargs.md)): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`args` | [*TransactionEventArgs*](core.transactioneventargs.md) |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/events/EventSubscriber.ts:37](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventSubscriber.ts#L37)

___

### afterTransactionRollback

▸ `Optional`**afterTransactionRollback**(`args`: [*TransactionEventArgs*](core.transactioneventargs.md)): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`args` | [*TransactionEventArgs*](core.transactioneventargs.md) |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/events/EventSubscriber.ts:39](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventSubscriber.ts#L39)

___

### afterTransactionStart

▸ `Optional`**afterTransactionStart**(`args`: [*TransactionEventArgs*](core.transactioneventargs.md)): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`args` | [*TransactionEventArgs*](core.transactioneventargs.md) |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/events/EventSubscriber.ts:35](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventSubscriber.ts#L35)

___

### afterUpdate

▸ `Optional`**afterUpdate**(`args`: [*EventArgs*](core.eventargs.md)<T\>): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`args` | [*EventArgs*](core.eventargs.md)<T\> |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/events/EventSubscriber.ts:27](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventSubscriber.ts#L27)

___

### beforeCreate

▸ `Optional`**beforeCreate**(`args`: [*EventArgs*](core.eventargs.md)<T\>): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`args` | [*EventArgs*](core.eventargs.md)<T\> |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/events/EventSubscriber.ts:24](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventSubscriber.ts#L24)

___

### beforeDelete

▸ `Optional`**beforeDelete**(`args`: [*EventArgs*](core.eventargs.md)<T\>): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`args` | [*EventArgs*](core.eventargs.md)<T\> |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/events/EventSubscriber.ts:28](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventSubscriber.ts#L28)

___

### beforeFlush

▸ `Optional`**beforeFlush**(`args`: [*FlushEventArgs*](core.flusheventargs.md)): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`args` | [*FlushEventArgs*](core.flusheventargs.md) |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/events/EventSubscriber.ts:30](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventSubscriber.ts#L30)

___

### beforeTransactionCommit

▸ `Optional`**beforeTransactionCommit**(`args`: [*TransactionEventArgs*](core.transactioneventargs.md)): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`args` | [*TransactionEventArgs*](core.transactioneventargs.md) |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/events/EventSubscriber.ts:36](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventSubscriber.ts#L36)

___

### beforeTransactionRollback

▸ `Optional`**beforeTransactionRollback**(`args`: [*TransactionEventArgs*](core.transactioneventargs.md)): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`args` | [*TransactionEventArgs*](core.transactioneventargs.md) |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/events/EventSubscriber.ts:38](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventSubscriber.ts#L38)

___

### beforeTransactionStart

▸ `Optional`**beforeTransactionStart**(`args`: [*TransactionEventArgs*](core.transactioneventargs.md)): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`args` | [*TransactionEventArgs*](core.transactioneventargs.md) |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/events/EventSubscriber.ts:34](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventSubscriber.ts#L34)

___

### beforeUpdate

▸ `Optional`**beforeUpdate**(`args`: [*EventArgs*](core.eventargs.md)<T\>): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`args` | [*EventArgs*](core.eventargs.md)<T\> |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/events/EventSubscriber.ts:26](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventSubscriber.ts#L26)

___

### getSubscribedEntities

▸ `Optional`**getSubscribedEntities**(): [*EntityName*](../modules/core.md#entityname)<T\>[]

**Returns:** [*EntityName*](../modules/core.md#entityname)<T\>[]

Defined in: [packages/core/src/events/EventSubscriber.ts:22](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventSubscriber.ts#L22)

___

### onFlush

▸ `Optional`**onFlush**(`args`: [*FlushEventArgs*](core.flusheventargs.md)): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`args` | [*FlushEventArgs*](core.flusheventargs.md) |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/events/EventSubscriber.ts:31](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventSubscriber.ts#L31)

___

### onInit

▸ `Optional`**onInit**(`args`: [*EventArgs*](core.eventargs.md)<T\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`args` | [*EventArgs*](core.eventargs.md)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/events/EventSubscriber.ts:23](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/events/EventSubscriber.ts#L23)
