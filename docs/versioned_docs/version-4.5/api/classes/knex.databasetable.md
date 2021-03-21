---
id: "knex.databasetable"
title: "Class: DatabaseTable"
sidebar_label: "DatabaseTable"
custom_edit_url: null
hide_title: true
---

# Class: DatabaseTable

[knex](../modules/knex.md).DatabaseTable

## Constructors

### constructor

\+ **new DatabaseTable**(`name`: *string*, `schema?`: *string*): [*DatabaseTable*](knex.databasetable.md)

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* |
`schema?` | *string* |

**Returns:** [*DatabaseTable*](knex.databasetable.md)

Defined in: [packages/knex/src/schema/DatabaseTable.ts:9](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/schema/DatabaseTable.ts#L9)

## Properties

### columns

• `Private` **columns**: [*Dictionary*](../modules/core.md#dictionary)<[*Column*](../interfaces/knex.column.md)\>

Defined in: [packages/knex/src/schema/DatabaseTable.ts:7](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/schema/DatabaseTable.ts#L7)

___

### foreignKeys

• `Private` **foreignKeys**: [*Dictionary*](../modules/core.md#dictionary)<[*ForeignKey*](../interfaces/knex.foreignkey.md)\>

Defined in: [packages/knex/src/schema/DatabaseTable.ts:9](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/schema/DatabaseTable.ts#L9)

___

### indexes

• `Private` **indexes**: [*Index*](../interfaces/knex.index.md)[]

Defined in: [packages/knex/src/schema/DatabaseTable.ts:8](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/schema/DatabaseTable.ts#L8)

___

### name

• `Readonly` **name**: *string*

___

### schema

• `Optional` `Readonly` **schema**: *string*

## Methods

### getColumn

▸ **getColumn**(`name`: *string*): *undefined* \| [*Column*](../interfaces/knex.column.md)

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* |

**Returns:** *undefined* \| [*Column*](../interfaces/knex.column.md)

Defined in: [packages/knex/src/schema/DatabaseTable.ts:18](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/schema/DatabaseTable.ts#L18)

___

### getColumns

▸ **getColumns**(): [*Column*](../interfaces/knex.column.md)[]

**Returns:** [*Column*](../interfaces/knex.column.md)[]

Defined in: [packages/knex/src/schema/DatabaseTable.ts:14](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/schema/DatabaseTable.ts#L14)

___

### getEntityDeclaration

▸ **getEntityDeclaration**(`namingStrategy`: [*NamingStrategy*](../interfaces/core.namingstrategy.md), `schemaHelper`: [*SchemaHelper*](knex.schemahelper.md)): [*EntityMetadata*](core.entitymetadata.md)<any\>

#### Parameters:

Name | Type |
:------ | :------ |
`namingStrategy` | [*NamingStrategy*](../interfaces/core.namingstrategy.md) |
`schemaHelper` | [*SchemaHelper*](knex.schemahelper.md) |

**Returns:** [*EntityMetadata*](core.entitymetadata.md)<any\>

Defined in: [packages/knex/src/schema/DatabaseTable.ts:58](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/schema/DatabaseTable.ts#L58)

___

### getIndexes

▸ **getIndexes**(): [*Dictionary*](../modules/core.md#dictionary)<[*Index*](../interfaces/knex.index.md)[]\>

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<[*Index*](../interfaces/knex.index.md)[]\>

Defined in: [packages/knex/src/schema/DatabaseTable.ts:22](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/schema/DatabaseTable.ts#L22)

___

### getPropertyDeclaration

▸ `Private`**getPropertyDeclaration**(`column`: [*Column*](../interfaces/knex.column.md), `namingStrategy`: [*NamingStrategy*](../interfaces/core.namingstrategy.md), `schemaHelper`: [*SchemaHelper*](knex.schemahelper.md), `compositeFkIndexes`: [*Dictionary*](../modules/core.md#dictionary)<{ `keyName`: *string*  }\>, `schema`: [*EntitySchema*](core.entityschema.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>, undefined\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`column` | [*Column*](../interfaces/knex.column.md) |
`namingStrategy` | [*NamingStrategy*](../interfaces/core.namingstrategy.md) |
`schemaHelper` | [*SchemaHelper*](knex.schemahelper.md) |
`compositeFkIndexes` | [*Dictionary*](../modules/core.md#dictionary)<{ `keyName`: *string*  }\> |
`schema` | [*EntitySchema*](core.entityschema.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>, undefined\> |

**Returns:** *void*

Defined in: [packages/knex/src/schema/DatabaseTable.ts:91](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/schema/DatabaseTable.ts#L91)

___

### getPropertyDefaultValue

▸ `Private`**getPropertyDefaultValue**(`schemaHelper`: [*SchemaHelper*](knex.schemahelper.md), `column`: [*Column*](../interfaces/knex.column.md), `propType`: *string*, `raw?`: *boolean*): *any*

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`schemaHelper` | [*SchemaHelper*](knex.schemahelper.md) | - |
`column` | [*Column*](../interfaces/knex.column.md) | - |
`propType` | *string* | - |
`raw` | *boolean* | false |

**Returns:** *any*

Defined in: [packages/knex/src/schema/DatabaseTable.ts:157](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/schema/DatabaseTable.ts#L157)

___

### getPropertyName

▸ `Private`**getPropertyName**(`column`: [*Column*](../interfaces/knex.column.md)): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`column` | [*Column*](../interfaces/knex.column.md) |

**Returns:** *string*

Defined in: [packages/knex/src/schema/DatabaseTable.ts:133](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/schema/DatabaseTable.ts#L133)

___

### getPropertyType

▸ `Private`**getPropertyType**(`namingStrategy`: [*NamingStrategy*](../interfaces/core.namingstrategy.md), `schemaHelper`: [*SchemaHelper*](knex.schemahelper.md), `column`: [*Column*](../interfaces/knex.column.md), `defaultType?`: *string*): *string*

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`namingStrategy` | [*NamingStrategy*](../interfaces/core.namingstrategy.md) | - |
`schemaHelper` | [*SchemaHelper*](knex.schemahelper.md) | - |
`column` | [*Column*](../interfaces/knex.column.md) | - |
`defaultType` | *string* | 'string' |

**Returns:** *string*

Defined in: [packages/knex/src/schema/DatabaseTable.ts:143](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/schema/DatabaseTable.ts#L143)

___

### getReferenceType

▸ `Private`**getReferenceType**(`column`: [*Column*](../interfaces/knex.column.md)): [*ReferenceType*](../enums/core.referencetype.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column` | [*Column*](../interfaces/knex.column.md) |

**Returns:** [*ReferenceType*](../enums/core.referencetype.md)

Defined in: [packages/knex/src/schema/DatabaseTable.ts:121](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/schema/DatabaseTable.ts#L121)

___

### init

▸ **init**(`cols`: [*Column*](../interfaces/knex.column.md)[], `indexes`: [*Index*](../interfaces/knex.index.md)[], `pks`: *string*[], `fks`: [*Dictionary*](../modules/core.md#dictionary)<[*ForeignKey*](../interfaces/knex.foreignkey.md)\>, `enums`: [*Dictionary*](../modules/core.md#dictionary)<string[]\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`cols` | [*Column*](../interfaces/knex.column.md)[] |
`indexes` | [*Index*](../interfaces/knex.index.md)[] |
`pks` | *string*[] |
`fks` | [*Dictionary*](../modules/core.md#dictionary)<[*ForeignKey*](../interfaces/knex.foreignkey.md)\> |
`enums` | [*Dictionary*](../modules/core.md#dictionary)<string[]\> |

**Returns:** *void*

Defined in: [packages/knex/src/schema/DatabaseTable.ts:35](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/schema/DatabaseTable.ts#L35)
