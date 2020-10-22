---
id: "eventsubscriber"
title: "Interface: EventSubscriber<T>"
sidebar_label: "EventSubscriber"
---

## Type parameters

Name | Default |
------ | ------ |
`T` | any |

## Hierarchy

* **EventSubscriber**

## Methods

### afterCreate

▸ `Optional`**afterCreate**(`args`: [EventArgs](eventargs.md)&#60;T>): Promise&#60;void>

*Defined in [packages/core/src/events/EventSubscriber.ts:19](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/events/EventSubscriber.ts#L19)*

#### Parameters:

Name | Type |
------ | ------ |
`args` | [EventArgs](eventargs.md)&#60;T> |

**Returns:** Promise&#60;void>

___

### afterDelete

▸ `Optional`**afterDelete**(`args`: [EventArgs](eventargs.md)&#60;T>): Promise&#60;void>

*Defined in [packages/core/src/events/EventSubscriber.ts:23](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/events/EventSubscriber.ts#L23)*

#### Parameters:

Name | Type |
------ | ------ |
`args` | [EventArgs](eventargs.md)&#60;T> |

**Returns:** Promise&#60;void>

___

### afterFlush

▸ `Optional`**afterFlush**(`args`: [FlushEventArgs](flusheventargs.md)): Promise&#60;void>

*Defined in [packages/core/src/events/EventSubscriber.ts:26](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/events/EventSubscriber.ts#L26)*

#### Parameters:

Name | Type |
------ | ------ |
`args` | [FlushEventArgs](flusheventargs.md) |

**Returns:** Promise&#60;void>

___

### afterUpdate

▸ `Optional`**afterUpdate**(`args`: [EventArgs](eventargs.md)&#60;T>): Promise&#60;void>

*Defined in [packages/core/src/events/EventSubscriber.ts:21](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/events/EventSubscriber.ts#L21)*

#### Parameters:

Name | Type |
------ | ------ |
`args` | [EventArgs](eventargs.md)&#60;T> |

**Returns:** Promise&#60;void>

___

### beforeCreate

▸ `Optional`**beforeCreate**(`args`: [EventArgs](eventargs.md)&#60;T>): Promise&#60;void>

*Defined in [packages/core/src/events/EventSubscriber.ts:18](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/events/EventSubscriber.ts#L18)*

#### Parameters:

Name | Type |
------ | ------ |
`args` | [EventArgs](eventargs.md)&#60;T> |

**Returns:** Promise&#60;void>

___

### beforeDelete

▸ `Optional`**beforeDelete**(`args`: [EventArgs](eventargs.md)&#60;T>): Promise&#60;void>

*Defined in [packages/core/src/events/EventSubscriber.ts:22](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/events/EventSubscriber.ts#L22)*

#### Parameters:

Name | Type |
------ | ------ |
`args` | [EventArgs](eventargs.md)&#60;T> |

**Returns:** Promise&#60;void>

___

### beforeFlush

▸ `Optional`**beforeFlush**(`args`: [FlushEventArgs](flusheventargs.md)): Promise&#60;void>

*Defined in [packages/core/src/events/EventSubscriber.ts:24](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/events/EventSubscriber.ts#L24)*

#### Parameters:

Name | Type |
------ | ------ |
`args` | [FlushEventArgs](flusheventargs.md) |

**Returns:** Promise&#60;void>

___

### beforeUpdate

▸ `Optional`**beforeUpdate**(`args`: [EventArgs](eventargs.md)&#60;T>): Promise&#60;void>

*Defined in [packages/core/src/events/EventSubscriber.ts:20](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/events/EventSubscriber.ts#L20)*

#### Parameters:

Name | Type |
------ | ------ |
`args` | [EventArgs](eventargs.md)&#60;T> |

**Returns:** Promise&#60;void>

___

### getSubscribedEntities

▸ `Optional`**getSubscribedEntities**(): [EntityName](../index.md#entityname)&#60;T>[]

*Defined in [packages/core/src/events/EventSubscriber.ts:16](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/events/EventSubscriber.ts#L16)*

**Returns:** [EntityName](../index.md#entityname)&#60;T>[]

___

### onFlush

▸ `Optional`**onFlush**(`args`: [FlushEventArgs](flusheventargs.md)): Promise&#60;void>

*Defined in [packages/core/src/events/EventSubscriber.ts:25](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/events/EventSubscriber.ts#L25)*

#### Parameters:

Name | Type |
------ | ------ |
`args` | [FlushEventArgs](flusheventargs.md) |

**Returns:** Promise&#60;void>

___

### onInit

▸ `Optional`**onInit**(`args`: [EventArgs](eventargs.md)&#60;T>): void

*Defined in [packages/core/src/events/EventSubscriber.ts:17](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/events/EventSubscriber.ts#L17)*

#### Parameters:

Name | Type |
------ | ------ |
`args` | [EventArgs](eventargs.md)&#60;T> |

**Returns:** void
