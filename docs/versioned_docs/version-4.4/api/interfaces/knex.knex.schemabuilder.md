---
id: "knex.knex.schemabuilder"
title: "Interface: SchemaBuilder"
sidebar_label: "SchemaBuilder"
hide_title: true
---

# Interface: SchemaBuilder

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).SchemaBuilder

## Hierarchy

* [*ChainableInterface*](knex.knex.chainableinterface.md)<*void*\>

  ↳ **SchemaBuilder**

## Properties

### [Symbol.toStringTag]

• `Readonly` **[Symbol.toStringTag]**: *string*

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md).[[Symbol.toStringTag]](knex.knex.chainableinterface.md#[symbol.tostringtag])

Defined in: node_modules/knex/types/index.d.ts:1639

## Methods

### alterTable

▸ **alterTable**(`tableName`: *string*, `callback`: (`tableBuilder`: [*CreateTableBuilder*](knex.knex.createtablebuilder.md)) => *any*): [*SchemaBuilder*](knex.knex.schemabuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | *string* |
`callback` | (`tableBuilder`: [*CreateTableBuilder*](knex.knex.createtablebuilder.md)) => *any* |

**Returns:** [*SchemaBuilder*](knex.knex.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1693

___

### asCallback

▸ **asCallback**(`callback`: Function): *Promise*<*void*\>

#### Parameters:

Name | Type |
------ | ------ |
`callback` | Function |

**Returns:** *Promise*<*void*\>

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1657

___

### catch

▸ **catch**<TResult\>(`onrejected?`: *null* \| (`reason`: *any*) => TResult \| *PromiseLike*<TResult\>): *Promise*<*void* \| TResult\>

Attaches a callback for only the rejection of the Promise.

#### Type parameters:

Name | Default |
------ | ------ |
`TResult` | *never* |

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`onrejected?` | *null* \| (`reason`: *any*) => TResult \| *PromiseLike*<TResult\> | The callback to execute when the Promise is rejected.   |

**Returns:** *Promise*<*void* \| TResult\>

A Promise for the completion of the callback.

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:1448

___

### connection

▸ **connection**(`connection`: *any*): [*SchemaBuilder*](knex.knex.schemabuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`connection` | *any* |

**Returns:** [*SchemaBuilder*](knex.knex.schemabuilder.md)

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1644

___

### createSchema

▸ **createSchema**(`schemaName`: *string*): [*SchemaBuilder*](knex.knex.schemabuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`schemaName` | *string* |

**Returns:** [*SchemaBuilder*](knex.knex.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1691

___

### createSchemaIfNotExists

▸ **createSchemaIfNotExists**(`schemaName`: *string*): [*SchemaBuilder*](knex.knex.schemabuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`schemaName` | *string* |

**Returns:** [*SchemaBuilder*](knex.knex.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1692

___

### createTable

▸ **createTable**(`tableName`: *string*, `callback`: (`tableBuilder`: [*CreateTableBuilder*](knex.knex.createtablebuilder.md)) => *any*): [*SchemaBuilder*](knex.knex.schemabuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | *string* |
`callback` | (`tableBuilder`: [*CreateTableBuilder*](knex.knex.createtablebuilder.md)) => *any* |

**Returns:** [*SchemaBuilder*](knex.knex.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1683

___

### createTableIfNotExists

▸ **createTableIfNotExists**(`tableName`: *string*, `callback`: (`tableBuilder`: [*CreateTableBuilder*](knex.knex.createtablebuilder.md)) => *any*): [*SchemaBuilder*](knex.knex.schemabuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | *string* |
`callback` | (`tableBuilder`: [*CreateTableBuilder*](knex.knex.createtablebuilder.md)) => *any* |

**Returns:** [*SchemaBuilder*](knex.knex.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1687

___

### debug

▸ **debug**(`enabled`: *boolean*): [*SchemaBuilder*](knex.knex.schemabuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`enabled` | *boolean* |

**Returns:** [*SchemaBuilder*](knex.knex.schemabuilder.md)

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1645

___

### dropSchema

▸ **dropSchema**(`schemaName`: *string*): [*SchemaBuilder*](knex.knex.schemabuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`schemaName` | *string* |

**Returns:** [*SchemaBuilder*](knex.knex.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1706

___

### dropSchemaIfExists

▸ **dropSchemaIfExists**(`schemaName`: *string*): [*SchemaBuilder*](knex.knex.schemabuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`schemaName` | *string* |

**Returns:** [*SchemaBuilder*](knex.knex.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1707

___

### dropTable

▸ **dropTable**(`tableName`: *string*): [*SchemaBuilder*](knex.knex.schemabuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | *string* |

**Returns:** [*SchemaBuilder*](knex.knex.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1698

___

### dropTableIfExists

▸ **dropTableIfExists**(`tableName`: *string*): [*SchemaBuilder*](knex.knex.schemabuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | *string* |

**Returns:** [*SchemaBuilder*](knex.knex.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1705

___

### finally

▸ **finally**(`onfinally?`: *null* \| () => *void*): *Promise*<*void*\>

Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
resolved value cannot be modified from the callback.

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`onfinally?` | *null* \| () => *void* | The callback to execute when the Promise is settled (fulfilled or rejected).   |

**Returns:** *Promise*<*void*\>

A Promise for the completion of the callback.

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: docs/node_modules/typescript/lib/lib.es2018.promise.d.ts:31

___

### hasColumn

▸ **hasColumn**(`tableName`: *string*, `columnName`: *string*): *Promise*<*boolean*\>

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | *string* |
`columnName` | *string* |

**Returns:** *Promise*<*boolean*\>

Defined in: node_modules/knex/types/index.d.ts:1700

___

### hasTable

▸ **hasTable**(`tableName`: *string*): *Promise*<*boolean*\>

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | *string* |

**Returns:** *Promise*<*boolean*\>

Defined in: node_modules/knex/types/index.d.ts:1699

___

### options

▸ **options**(`options`: *Readonly*<{ [key: string]: *any*;  }\>): [*SchemaBuilder*](knex.knex.schemabuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`options` | *Readonly*<{ [key: string]: *any*;  }\> |

**Returns:** [*SchemaBuilder*](knex.knex.schemabuilder.md)

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1643

___

### pipe

▸ **pipe**<T\>(`writable`: T, `options?`: *Readonly*<{ [key: string]: *any*;  }\>): *PassThrough*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | *WritableStream*<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`writable` | T |
`options?` | *Readonly*<{ [key: string]: *any*;  }\> |

**Returns:** *PassThrough*

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1653

___

### queryContext

▸ **queryContext**(`context`: *any*): [*SchemaBuilder*](knex.knex.schemabuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`context` | *any* |

**Returns:** [*SchemaBuilder*](knex.knex.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1710

___

### raw

▸ **raw**(`statement`: *string*): [*SchemaBuilder*](knex.knex.schemabuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`statement` | *string* |

**Returns:** [*SchemaBuilder*](knex.knex.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1708

___

### renameTable

▸ **renameTable**(`oldTableName`: *string*, `newTableName`: *string*): *Promise*<*void*\>

#### Parameters:

Name | Type |
------ | ------ |
`oldTableName` | *string* |
`newTableName` | *string* |

**Returns:** *Promise*<*void*\>

Defined in: node_modules/knex/types/index.d.ts:1697

___

### stream

▸ **stream**(`handler`: (`readable`: *PassThrough*) => *any*): *Promise*<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`handler` | (`readable`: *PassThrough*) => *any* |

**Returns:** *Promise*<*any*\>

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1647

▸ **stream**(`options`: *Readonly*<{ [key: string]: *any*;  }\>, `handler`: (`readable`: *PassThrough*) => *any*): *Promise*<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`options` | *Readonly*<{ [key: string]: *any*;  }\> |
`handler` | (`readable`: *PassThrough*) => *any* |

**Returns:** *Promise*<*any*\>

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1648

▸ **stream**(`options?`: *Readonly*<{ [key: string]: *any*;  }\>): *PassThrough*

#### Parameters:

Name | Type |
------ | ------ |
`options?` | *Readonly*<{ [key: string]: *any*;  }\> |

**Returns:** *PassThrough*

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1652

___

### table

▸ **table**(`tableName`: *string*, `callback`: (`tableBuilder`: [*AlterTableBuilder*](knex.knex.altertablebuilder.md)) => *any*): *Promise*<*void*\>

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | *string* |
`callback` | (`tableBuilder`: [*AlterTableBuilder*](knex.knex.altertablebuilder.md)) => *any* |

**Returns:** *Promise*<*void*\>

Defined in: node_modules/knex/types/index.d.ts:1701

___

### then

▸ **then**<TResult1, TResult2\>(`onfulfilled?`: *null* \| (`value`: *void*) => TResult1 \| *PromiseLike*<TResult1\>, `onrejected?`: *null* \| (`reason`: *any*) => TResult2 \| *PromiseLike*<TResult2\>): *Promise*<TResult1 \| TResult2\>

Attaches callbacks for the resolution and/or rejection of the Promise.

#### Type parameters:

Name | Default |
------ | ------ |
`TResult1` | *void* |
`TResult2` | *never* |

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`onfulfilled?` | *null* \| (`value`: *void*) => TResult1 \| *PromiseLike*<TResult1\> | The callback to execute when the Promise is resolved.   |
`onrejected?` | *null* \| (`reason`: *any*) => TResult2 \| *PromiseLike*<TResult2\> | The callback to execute when the Promise is rejected.   |

**Returns:** *Promise*<TResult1 \| TResult2\>

A Promise for the completion of which ever callback is executed.

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:1441

___

### toQuery

▸ **toQuery**(): *string*

**Returns:** *string*

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1642

___

### toSQL

▸ **toSQL**(): [*Sql*](knex.knex.sql.md)

**Returns:** [*Sql*](knex.knex.sql.md)

Defined in: node_modules/knex/types/index.d.ts:1712

___

### toString

▸ **toString**(): *string*

**Returns:** *string*

Defined in: node_modules/knex/types/index.d.ts:1711

___

### transacting

▸ **transacting**(`trx`: [*Transaction*](knex.knex.transaction.md)<*any*, *any*\>): [*SchemaBuilder*](knex.knex.schemabuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`trx` | [*Transaction*](knex.knex.transaction.md)<*any*, *any*\> |

**Returns:** [*SchemaBuilder*](knex.knex.schemabuilder.md)

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1646

___

### withSchema

▸ **withSchema**(`schemaName`: *string*): [*SchemaBuilder*](knex.knex.schemabuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`schemaName` | *string* |

**Returns:** [*SchemaBuilder*](knex.knex.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1709
