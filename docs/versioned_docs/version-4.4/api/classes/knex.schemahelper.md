---
id: "knex.schemahelper"
title: "Class: SchemaHelper"
sidebar_label: "SchemaHelper"
hide_title: true
---

# Class: SchemaHelper

[knex](../modules/knex.md).SchemaHelper

## Hierarchy

* **SchemaHelper**

## Constructors

### constructor

\+ **new SchemaHelper**(): [*SchemaHelper*](knex.schemahelper.md)

**Returns:** [*SchemaHelper*](knex.schemahelper.md)

## Methods

### databaseExists

▸ **databaseExists**(`connection`: [*Connection*](core.connection.md), `name`: *string*): *Promise*<*boolean*\>

#### Parameters:

Name | Type |
------ | ------ |
`connection` | [*Connection*](core.connection.md) |
`name` | *string* |

**Returns:** *Promise*<*boolean*\>

Defined in: [packages/knex/src/schema/SchemaHelper.ts:182](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L182)

___

### finalizeTable

▸ **finalizeTable**(`table`: [*TableBuilder*](../interfaces/knex.knex.tablebuilder.md), `charset`: *string*, `collate?`: *string*): *void*

#### Parameters:

Name | Type |
------ | ------ |
`table` | [*TableBuilder*](../interfaces/knex.knex.tablebuilder.md) |
`charset` | *string* |
`collate?` | *string* |

**Returns:** *void*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:16](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L16)

___

### getColumns

▸ **getColumns**(`connection`: [*AbstractSqlConnection*](knex.abstractsqlconnection.md), `tableName`: *string*, `schemaName?`: *string*): *Promise*<*any*[]\>

#### Parameters:

Name | Type |
------ | ------ |
`connection` | [*AbstractSqlConnection*](knex.abstractsqlconnection.md) |
`tableName` | *string* |
`schemaName?` | *string* |

**Returns:** *Promise*<*any*[]\>

Defined in: [packages/knex/src/schema/SchemaHelper.ts:93](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L93)

___

### getCreateDatabaseSQL

▸ **getCreateDatabaseSQL**(`name`: *string*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`name` | *string* |

**Returns:** *string*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:158](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L158)

___

### getDatabaseExistsSQL

▸ **getDatabaseExistsSQL**(`name`: *string*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`name` | *string* |

**Returns:** *string*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:166](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L166)

___

### getDatabaseNotExistsError

▸ **getDatabaseNotExistsError**(`dbName`: *string*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`dbName` | *string* |

**Returns:** *string*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:170](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L170)

___

### getDefaultEmptyString

▸ **getDefaultEmptyString**(): *string*

**Returns:** *string*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:178](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L178)

___

### getDropDatabaseSQL

▸ **getDropDatabaseSQL**(`name`: *string*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`name` | *string* |

**Returns:** *string*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:162](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L162)

___

### getEnumDefinitions

▸ **getEnumDefinitions**(`connection`: [*AbstractSqlConnection*](knex.abstractsqlconnection.md), `tableName`: *string*, `schemaName?`: *string*): *Promise*<[*Dictionary*](../modules/core.md#dictionary)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`connection` | [*AbstractSqlConnection*](knex.abstractsqlconnection.md) |
`tableName` | *string* |
`schemaName?` | *string* |

**Returns:** *Promise*<[*Dictionary*](../modules/core.md#dictionary)<*any*\>\>

Defined in: [packages/knex/src/schema/SchemaHelper.ts:81](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L81)

___

### getForeignKeys

▸ **getForeignKeys**(`connection`: [*AbstractSqlConnection*](knex.abstractsqlconnection.md), `tableName`: *string*, `schemaName?`: *string*): *Promise*<[*Dictionary*](../modules/core.md#dictionary)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`connection` | [*AbstractSqlConnection*](knex.abstractsqlconnection.md) |
`tableName` | *string* |
`schemaName?` | *string* |

**Returns:** *Promise*<[*Dictionary*](../modules/core.md#dictionary)<*any*\>\>

Defined in: [packages/knex/src/schema/SchemaHelper.ts:76](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L76)

___

### getForeignKeysSQL

▸ **getForeignKeysSQL**(`tableName`: *string*, `schemaName?`: *string*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | *string* |
`schemaName?` | *string* |

**Returns:** *string*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:101](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L101)

___

### getIndexName

▸ **getIndexName**(`tableName`: *string*, `columns`: *string*[], `type`: *index* \| *unique* \| *foreign*): *string*

Returns the default name of index for the given columns

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | *string* |
`columns` | *string*[] |
`type` | *index* \| *unique* \| *foreign* |

**Returns:** *string*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:108](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L108)

___

### getIndexes

▸ **getIndexes**(`connection`: [*AbstractSqlConnection*](knex.abstractsqlconnection.md), `tableName`: *string*, `schemaName?`: *string*): *Promise*<[*Index*](../interfaces/knex.index.md)[]\>

#### Parameters:

Name | Type |
------ | ------ |
`connection` | [*AbstractSqlConnection*](knex.abstractsqlconnection.md) |
`tableName` | *string* |
`schemaName?` | *string* |

**Returns:** *Promise*<[*Index*](../interfaces/knex.index.md)[]\>

Defined in: [packages/knex/src/schema/SchemaHelper.ts:97](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L97)

___

### getListTablesSQL

▸ **getListTablesSQL**(): *string*

**Returns:** *string*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:85](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L85)

___

### getManagementDbName

▸ **getManagementDbName**(): *string*

**Returns:** *string*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:174](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L174)

___

### getPrimaryKeys

▸ **getPrimaryKeys**(`connection`: [*AbstractSqlConnection*](knex.abstractsqlconnection.md), `indexes`: [*Index*](../interfaces/knex.index.md)[], `tableName`: *string*, `schemaName?`: *string*): *Promise*<*string*[]\>

#### Parameters:

Name | Type |
------ | ------ |
`connection` | [*AbstractSqlConnection*](knex.abstractsqlconnection.md) |
`indexes` | [*Index*](../interfaces/knex.index.md)[] |
`tableName` | *string* |
`schemaName?` | *string* |

**Returns:** *Promise*<*string*[]\>

Defined in: [packages/knex/src/schema/SchemaHelper.ts:72](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L72)

___

### getRenameColumnSQL

▸ **getRenameColumnSQL**(`tableName`: *string*, `from`: [*Column*](../interfaces/knex.column.md), `to`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `idx?`: *number*, `quote?`: *string*): *string*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`tableName` | *string* | - |
`from` | [*Column*](../interfaces/knex.column.md) | - |
`to` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> | - |
`idx` | *number* | 0 |
`quote` | *string* | '"' |

**Returns:** *string*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:89](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L89)

___

### getSchemaBeginning

▸ **getSchemaBeginning**(`charset`: *string*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`charset` | *string* |

**Returns:** *string*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:8](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L8)

___

### getSchemaEnd

▸ **getSchemaEnd**(): *string*

**Returns:** *string*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:12](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L12)

___

### getTypeDefinition

▸ **getTypeDefinition**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `types?`: [*Dictionary*](../modules/core.md#dictionary)<*string*[]\>, `lengths?`: [*Dictionary*](../modules/core.md#dictionary)<*number*\>, `allowZero?`: *boolean*): *string*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> | - |
`types` | [*Dictionary*](../modules/core.md#dictionary)<*string*[]\> | ... |
`lengths` | [*Dictionary*](../modules/core.md#dictionary)<*number*\> | ... |
`allowZero` | *boolean* | false |

**Returns:** *string*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:20](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L20)

___

### getTypeFromDefinition

▸ **getTypeFromDefinition**(`type`: *string*, `defaultType`: *string*, `types?`: [*Dictionary*](../modules/core.md#dictionary)<*string*[]\>): *string*

#### Parameters:

Name | Type |
------ | ------ |
`type` | *string* |
`defaultType` | *string* |
`types?` | [*Dictionary*](../modules/core.md#dictionary)<*string*[]\> |

**Returns:** *string*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:62](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L62)

___

### hasSameDefaultValue

▸ `Private`**hasSameDefaultValue**(`info`: [*Column*](../interfaces/knex.column.md), `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `defaultValues`: [*Dictionary*](../modules/core.md#dictionary)<*string*[]\>): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`info` | [*Column*](../interfaces/knex.column.md) |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`defaultValues` | [*Dictionary*](../modules/core.md#dictionary)<*string*[]\> |

**Returns:** *boolean*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:214](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L214)

___

### hasSameEnumDefinition

▸ `Private`**hasSameEnumDefinition**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `column`: [*Column*](../interfaces/knex.column.md)): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`column` | [*Column*](../interfaces/knex.column.md) |

**Returns:** *boolean*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:251](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L251)

___

### hasSameIndex

▸ `Private`**hasSameIndex**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `column`: [*Column*](../interfaces/knex.column.md)): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`column` | [*Column*](../interfaces/knex.column.md) |

**Returns:** *boolean*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:241](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L241)

___

### hasSameType

▸ `Private`**hasSameType**(`columnType`: *string*, `infoType`: *string*, `types`: [*Dictionary*](../modules/core.md#dictionary)<*string*[]\>): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`columnType` | *string* |
`infoType` | *string* |
`types` | [*Dictionary*](../modules/core.md#dictionary)<*string*[]\> |

**Returns:** *boolean*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:195](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L195)

___

### indexForeignKeys

▸ **indexForeignKeys**(): *boolean*

**Returns:** *boolean*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:51](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L51)

___

### isImplicitIndex

▸ **isImplicitIndex**(`name`: *string*): *boolean*

Implicit indexes will be ignored when diffing

#### Parameters:

Name | Type |
------ | ------ |
`name` | *string* |

**Returns:** *boolean*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:58](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L58)

___

### isSame

▸ **isSame**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `column`: [*Column*](../interfaces/knex.column.md), `idx?`: *number*, `types?`: [*Dictionary*](../modules/core.md#dictionary)<*string*[]\>, `defaultValues?`: [*Dictionary*](../modules/core.md#dictionary)<*string*[]\>): [*IsSame*](../interfaces/knex.issame.md)

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> | - |
`column` | [*Column*](../interfaces/knex.column.md) | - |
`idx` | *number* | 0 |
`types` | [*Dictionary*](../modules/core.md#dictionary)<*string*[]\> | ... |
`defaultValues` | [*Dictionary*](../modules/core.md#dictionary)<*string*[]\> | ... |

**Returns:** [*IsSame*](../interfaces/knex.issame.md)

Defined in: [packages/knex/src/schema/SchemaHelper.ts:36](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L36)

___

### mapForeignKeys

▸ **mapForeignKeys**(`fks`: *any*[]): [*Dictionary*](../modules/core.md#dictionary)<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`fks` | *any*[] |

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<*any*\>

Defined in: [packages/knex/src/schema/SchemaHelper.ts:116](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L116)

___

### normalizeDefaultValue

▸ **normalizeDefaultValue**(`defaultValue`: *string*, `length`: *number*, `defaultValues?`: [*Dictionary*](../modules/core.md#dictionary)<*string*[]\>): *string* \| *number*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`defaultValue` | *string* | - |
`length` | *number* | - |
`defaultValues` | [*Dictionary*](../modules/core.md#dictionary)<*string*[]\> | ... |

**Returns:** *string* \| *number*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:147](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L147)

___

### processTypeWildCard

▸ `Private`**processTypeWildCard**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `lengths`: [*Dictionary*](../modules/core.md#dictionary)<*number*\>, `propType`: *string*, `allowZero`: *boolean*, `type`: *string*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`lengths` | [*Dictionary*](../modules/core.md#dictionary)<*number*\> |
`propType` | *string* |
`allowZero` | *boolean* |
`type` | *string* |

**Returns:** *string*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:131](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L131)

___

### supportsColumnAlter

▸ **supportsColumnAlter**(): *boolean*

**Returns:** *boolean*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:143](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L143)

___

### supportsSchemaConstraints

▸ **supportsSchemaConstraints**(): *boolean*

**Returns:** *boolean*

Defined in: [packages/knex/src/schema/SchemaHelper.ts:47](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/schema/SchemaHelper.ts#L47)
