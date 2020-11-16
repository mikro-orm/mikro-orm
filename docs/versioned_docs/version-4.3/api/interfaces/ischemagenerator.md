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

*Defined in [packages/core/src/typings.ts:323](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L323)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** Promise&#60;void>

___

### createSchema

▸ **createSchema**(`wrap?`: boolean): Promise&#60;void>

*Defined in [packages/core/src/typings.ts:316](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L316)*

#### Parameters:

Name | Type |
------ | ------ |
`wrap?` | boolean |

**Returns:** Promise&#60;void>

___

### dropDatabase

▸ **dropDatabase**(`name`: string): Promise&#60;void>

*Defined in [packages/core/src/typings.ts:324](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L324)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** Promise&#60;void>

___

### dropSchema

▸ **dropSchema**(`wrap?`: boolean, `dropMigrationsTable?`: boolean, `dropDb?`: boolean): Promise&#60;void>

*Defined in [packages/core/src/typings.ts:319](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L319)*

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

*Defined in [packages/core/src/typings.ts:317](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L317)*

**Returns:** Promise&#60;void>

___

### execute

▸ **execute**(`sql`: string): Promise&#60;void>

*Defined in [packages/core/src/typings.ts:325](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L325)*

#### Parameters:

Name | Type |
------ | ------ |
`sql` | string |

**Returns:** Promise&#60;void>

___

### generate

▸ **generate**(): Promise&#60;string>

*Defined in [packages/core/src/typings.ts:315](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L315)*

**Returns:** Promise&#60;string>

___

### getCreateSchemaSQL

▸ **getCreateSchemaSQL**(`wrap?`: boolean): Promise&#60;string>

*Defined in [packages/core/src/typings.ts:318](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L318)*

#### Parameters:

Name | Type |
------ | ------ |
`wrap?` | boolean |

**Returns:** Promise&#60;string>

___

### getDropSchemaSQL

▸ **getDropSchemaSQL**(`wrap?`: boolean, `dropMigrationsTable?`: boolean): Promise&#60;string>

*Defined in [packages/core/src/typings.ts:320](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L320)*

#### Parameters:

Name | Type |
------ | ------ |
`wrap?` | boolean |
`dropMigrationsTable?` | boolean |

**Returns:** Promise&#60;string>

___

### getUpdateSchemaSQL

▸ **getUpdateSchemaSQL**(`wrap?`: boolean, `safe?`: boolean, `dropDb?`: boolean, `dropTables?`: boolean): Promise&#60;string>

*Defined in [packages/core/src/typings.ts:322](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L322)*

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

*Defined in [packages/core/src/typings.ts:321](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L321)*

#### Parameters:

Name | Type |
------ | ------ |
`wrap?` | boolean |
`safe?` | boolean |
`dropDb?` | boolean |
`dropTables?` | boolean |

**Returns:** Promise&#60;void>
