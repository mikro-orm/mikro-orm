---
id: "databasetable"
title: "Class: DatabaseTable"
sidebar_label: "DatabaseTable"
---

## Hierarchy

* **DatabaseTable**

## Constructors

### constructor

\+ **new DatabaseTable**(`name`: string, `schema?`: string): [DatabaseTable](databasetable.md)

*Defined in [packages/knex/src/schema/DatabaseTable.ts:9](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/DatabaseTable.ts#L9)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |
`schema?` | string |

**Returns:** [DatabaseTable](databasetable.md)

## Properties

### columns

• `Private` **columns**: [Dictionary](../index.md#dictionary)&#60;[Column](../interfaces/column.md)>

*Defined in [packages/knex/src/schema/DatabaseTable.ts:7](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/DatabaseTable.ts#L7)*

___

### foreignKeys

• `Private` **foreignKeys**: [Dictionary](../index.md#dictionary)&#60;[ForeignKey](../interfaces/foreignkey.md)>

*Defined in [packages/knex/src/schema/DatabaseTable.ts:9](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/DatabaseTable.ts#L9)*

___

### indexes

• `Private` **indexes**: [Index](../interfaces/index.md)[]

*Defined in [packages/knex/src/schema/DatabaseTable.ts:8](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/DatabaseTable.ts#L8)*

___

### name

• `Readonly` **name**: string

*Defined in [packages/knex/src/schema/DatabaseTable.ts:11](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/DatabaseTable.ts#L11)*

___

### schema

• `Optional` `Readonly` **schema**: string

*Defined in [packages/knex/src/schema/DatabaseTable.ts:12](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/DatabaseTable.ts#L12)*

## Methods

### getColumn

▸ **getColumn**(`name`: string): [Column](../interfaces/column.md) \| undefined

*Defined in [packages/knex/src/schema/DatabaseTable.ts:18](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/DatabaseTable.ts#L18)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** [Column](../interfaces/column.md) \| undefined

___

### getColumns

▸ **getColumns**(): [Column](../interfaces/column.md)[]

*Defined in [packages/knex/src/schema/DatabaseTable.ts:14](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/DatabaseTable.ts#L14)*

**Returns:** [Column](../interfaces/column.md)[]

___

### getEntityDeclaration

▸ **getEntityDeclaration**(`namingStrategy`: NamingStrategy, `schemaHelper`: [SchemaHelper](schemahelper.md)): EntityMetadata

*Defined in [packages/knex/src/schema/DatabaseTable.ts:58](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/DatabaseTable.ts#L58)*

#### Parameters:

Name | Type |
------ | ------ |
`namingStrategy` | NamingStrategy |
`schemaHelper` | [SchemaHelper](schemahelper.md) |

**Returns:** EntityMetadata

___

### getIndexes

▸ **getIndexes**(): [Dictionary](../index.md#dictionary)&#60;[Index](../interfaces/index.md)[]>

*Defined in [packages/knex/src/schema/DatabaseTable.ts:22](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/DatabaseTable.ts#L22)*

**Returns:** [Dictionary](../index.md#dictionary)&#60;[Index](../interfaces/index.md)[]>

___

### getPropertyDeclaration

▸ `Private`**getPropertyDeclaration**(`column`: [Column](../interfaces/column.md), `namingStrategy`: NamingStrategy, `schemaHelper`: [SchemaHelper](schemahelper.md), `compositeFkIndexes`: [Dictionary](../index.md#dictionary)&#60;{ keyName: string  }>, `schema`: EntitySchema): void

*Defined in [packages/knex/src/schema/DatabaseTable.ts:87](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/DatabaseTable.ts#L87)*

#### Parameters:

Name | Type |
------ | ------ |
`column` | [Column](../interfaces/column.md) |
`namingStrategy` | NamingStrategy |
`schemaHelper` | [SchemaHelper](schemahelper.md) |
`compositeFkIndexes` | [Dictionary](../index.md#dictionary)&#60;{ keyName: string  }> |
`schema` | EntitySchema |

**Returns:** void

___

### getPropertyDefaultValue

▸ `Private`**getPropertyDefaultValue**(`schemaHelper`: [SchemaHelper](schemahelper.md), `column`: [Column](../interfaces/column.md), `propType`: string, `raw?`: boolean): any

*Defined in [packages/knex/src/schema/DatabaseTable.ts:153](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/DatabaseTable.ts#L153)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`schemaHelper` | [SchemaHelper](schemahelper.md) | - |
`column` | [Column](../interfaces/column.md) | - |
`propType` | string | - |
`raw` | boolean | false |

**Returns:** any

___

### getPropertyName

▸ `Private`**getPropertyName**(`column`: [Column](../interfaces/column.md)): string

*Defined in [packages/knex/src/schema/DatabaseTable.ts:129](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/DatabaseTable.ts#L129)*

#### Parameters:

Name | Type |
------ | ------ |
`column` | [Column](../interfaces/column.md) |

**Returns:** string

___

### getPropertyType

▸ `Private`**getPropertyType**(`namingStrategy`: NamingStrategy, `schemaHelper`: [SchemaHelper](schemahelper.md), `column`: [Column](../interfaces/column.md), `defaultType?`: string): string

*Defined in [packages/knex/src/schema/DatabaseTable.ts:139](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/DatabaseTable.ts#L139)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`namingStrategy` | NamingStrategy | - |
`schemaHelper` | [SchemaHelper](schemahelper.md) | - |
`column` | [Column](../interfaces/column.md) | - |
`defaultType` | string | "string" |

**Returns:** string

___

### getReferenceType

▸ `Private`**getReferenceType**(`column`: [Column](../interfaces/column.md)): [ReferenceType](../enums/referencetype.md)

*Defined in [packages/knex/src/schema/DatabaseTable.ts:117](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/DatabaseTable.ts#L117)*

#### Parameters:

Name | Type |
------ | ------ |
`column` | [Column](../interfaces/column.md) |

**Returns:** [ReferenceType](../enums/referencetype.md)

___

### init

▸ **init**(`cols`: [Column](../interfaces/column.md)[], `indexes`: [Index](../interfaces/index.md)[], `pks`: string[], `fks`: [Dictionary](../index.md#dictionary)&#60;[ForeignKey](../interfaces/foreignkey.md)>, `enums`: [Dictionary](../index.md#dictionary)&#60;string[]>): void

*Defined in [packages/knex/src/schema/DatabaseTable.ts:35](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/schema/DatabaseTable.ts#L35)*

#### Parameters:

Name | Type |
------ | ------ |
`cols` | [Column](../interfaces/column.md)[] |
`indexes` | [Index](../interfaces/index.md)[] |
`pks` | string[] |
`fks` | [Dictionary](../index.md#dictionary)&#60;[ForeignKey](../interfaces/foreignkey.md)> |
`enums` | [Dictionary](../index.md#dictionary)&#60;string[]> |

**Returns:** void
