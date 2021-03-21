---
id: "knex.icriterianode"
title: "Interface: ICriteriaNode"
sidebar_label: "ICriteriaNode"
custom_edit_url: null
hide_title: true
---

# Interface: ICriteriaNode

[knex](../modules/knex.md).ICriteriaNode

## Properties

### entityName

• `Readonly` **entityName**: *string*

Defined in: [packages/knex/src/typings.ts:115](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L115)

___

### key

• `Optional` `Readonly` **key**: *string*

Defined in: [packages/knex/src/typings.ts:117](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L117)

___

### parent

• `Optional` `Readonly` **parent**: [*ICriteriaNode*](knex.icriterianode.md)

Defined in: [packages/knex/src/typings.ts:116](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L116)

___

### payload

• **payload**: *any*

Defined in: [packages/knex/src/typings.ts:118](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L118)

___

### prop

• `Optional` **prop**: [*EntityProperty*](core.entityproperty.md)<any\>

Defined in: [packages/knex/src/typings.ts:119](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L119)

## Methods

### getPath

▸ **getPath**(): *string*

**Returns:** *string*

Defined in: [packages/knex/src/typings.ts:125](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L125)

___

### getPivotPath

▸ **getPivotPath**(`path`: *string*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`path` | *string* |

**Returns:** *string*

Defined in: [packages/knex/src/typings.ts:126](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L126)

___

### process

▸ **process**<T\>(`qb`: [*IQueryBuilder*](knex.iquerybuilder.md)<T\>, `alias?`: *string*): *any*

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`qb` | [*IQueryBuilder*](knex.iquerybuilder.md)<T\> |
`alias?` | *string* |

**Returns:** *any*

Defined in: [packages/knex/src/typings.ts:120](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L120)

___

### renameFieldToPK

▸ **renameFieldToPK**<T\>(`qb`: [*IQueryBuilder*](knex.iquerybuilder.md)<T\>): *string*

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`qb` | [*IQueryBuilder*](knex.iquerybuilder.md)<T\> |

**Returns:** *string*

Defined in: [packages/knex/src/typings.ts:124](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L124)

___

### shouldInline

▸ **shouldInline**(`payload`: *any*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`payload` | *any* |

**Returns:** *boolean*

Defined in: [packages/knex/src/typings.ts:121](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L121)

___

### shouldRename

▸ **shouldRename**(`payload`: *any*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`payload` | *any* |

**Returns:** *boolean*

Defined in: [packages/knex/src/typings.ts:123](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L123)

___

### willAutoJoin

▸ **willAutoJoin**<T\>(`qb`: [*IQueryBuilder*](knex.iquerybuilder.md)<T\>, `alias?`: *string*): *boolean*

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`qb` | [*IQueryBuilder*](knex.iquerybuilder.md)<T\> |
`alias?` | *string* |

**Returns:** *boolean*

Defined in: [packages/knex/src/typings.ts:122](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/typings.ts#L122)
