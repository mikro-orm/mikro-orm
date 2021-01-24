---
id: "core.entityidentifier"
title: "Class: EntityIdentifier"
sidebar_label: "EntityIdentifier"
hide_title: true
---

# Class: EntityIdentifier

[core](../modules/core.md).EntityIdentifier

## Hierarchy

* **EntityIdentifier**

## Constructors

### constructor

\+ **new EntityIdentifier**(`value?`: *string* \| *number* \| *bigint* \| Date \| { `toHexString`: () => *string*  }): [*EntityIdentifier*](core.entityidentifier.md)

#### Parameters:

Name | Type |
------ | ------ |
`value?` | *string* \| *number* \| *bigint* \| Date \| { `toHexString`: () => *string*  } |

**Returns:** [*EntityIdentifier*](core.entityidentifier.md)

Defined in: [packages/core/src/entity/EntityIdentifier.ts:3](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/EntityIdentifier.ts#L3)

## Methods

### getValue

▸ **getValue**<T\>(): T

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | IPrimaryKeyValue | IPrimaryKeyValue |

**Returns:** T

Defined in: [packages/core/src/entity/EntityIdentifier.ts:11](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/EntityIdentifier.ts#L11)

___

### setValue

▸ **setValue**(`value`: IPrimaryKeyValue): *void*

#### Parameters:

Name | Type |
------ | ------ |
`value` | IPrimaryKeyValue |

**Returns:** *void*

Defined in: [packages/core/src/entity/EntityIdentifier.ts:7](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/entity/EntityIdentifier.ts#L7)
