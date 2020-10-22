---
id: "ischemagenerator"
title: "Interface: ISchemaGenerator"
sidebar_label: "ISchemaGenerator"
---

## Hierarchy

* **ISchemaGenerator**

## Methods

### createDatabase

▸ **createDatabase**(`name`: string): Promise&#60;void>

*Defined in [packages/core/src/typings.ts:309](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L309)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** Promise&#60;void>

___

### createSchema

▸ **createSchema**(`wrap?`: boolean): Promise&#60;void>

*Defined in [packages/core/src/typings.ts:302](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L302)*

#### Parameters:

Name | Type |
------ | ------ |
`wrap?` | boolean |

**Returns:** Promise&#60;void>

___

### dropDatabase

▸ **dropDatabase**(`name`: string): Promise&#60;void>

*Defined in [packages/core/src/typings.ts:310](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L310)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** Promise&#60;void>

___

### dropSchema

▸ **dropSchema**(`wrap?`: boolean, `dropMigrationsTable?`: boolean, `dropDb?`: boolean): Promise&#60;void>

*Defined in [packages/core/src/typings.ts:305](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L305)*

#### Parameters:

Name | Type |
------ | ------ |
`wrap?` | boolean |
`dropMigrationsTable?` | boolean |
`dropDb?` | boolean |

**Returns:** Promise&#60;void>

___

### ensureDatabase

▸ **ensureDatabase**(): Promise&#60;void>

*Defined in [packages/core/src/typings.ts:303](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L303)*

**Returns:** Promise&#60;void>

___

### execute

▸ **execute**(`sql`: string): Promise&#60;void>

*Defined in [packages/core/src/typings.ts:311](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L311)*

#### Parameters:

Name | Type |
------ | ------ |
`sql` | string |

**Returns:** Promise&#60;void>

___

### generate

▸ **generate**(): Promise&#60;string>

*Defined in [packages/core/src/typings.ts:301](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L301)*

**Returns:** Promise&#60;string>

___

### getCreateSchemaSQL

▸ **getCreateSchemaSQL**(`wrap?`: boolean): Promise&#60;string>

*Defined in [packages/core/src/typings.ts:304](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L304)*

#### Parameters:

Name | Type |
------ | ------ |
`wrap?` | boolean |

**Returns:** Promise&#60;string>

___

### getDropSchemaSQL

▸ **getDropSchemaSQL**(`wrap?`: boolean, `dropMigrationsTable?`: boolean): Promise&#60;string>

*Defined in [packages/core/src/typings.ts:306](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L306)*

#### Parameters:

Name | Type |
------ | ------ |
`wrap?` | boolean |
`dropMigrationsTable?` | boolean |

**Returns:** Promise&#60;string>

___

### getUpdateSchemaSQL

▸ **getUpdateSchemaSQL**(`wrap?`: boolean, `safe?`: boolean, `dropDb?`: boolean, `dropTables?`: boolean): Promise&#60;string>

*Defined in [packages/core/src/typings.ts:308](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L308)*

#### Parameters:

Name | Type |
------ | ------ |
`wrap?` | boolean |
`safe?` | boolean |
`dropDb?` | boolean |
`dropTables?` | boolean |

**Returns:** Promise&#60;string>

___

### updateSchema

▸ **updateSchema**(`wrap?`: boolean, `safe?`: boolean, `dropDb?`: boolean, `dropTables?`: boolean): Promise&#60;void>

*Defined in [packages/core/src/typings.ts:307](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/typings.ts#L307)*

#### Parameters:

Name | Type |
------ | ------ |
`wrap?` | boolean |
`safe?` | boolean |
`dropDb?` | boolean |
`dropTables?` | boolean |

**Returns:** Promise&#60;void>
