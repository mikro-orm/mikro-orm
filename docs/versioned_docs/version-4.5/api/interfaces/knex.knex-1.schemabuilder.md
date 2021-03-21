---
id: "knex.knex-1.schemabuilder"
title: "Interface: SchemaBuilder"
sidebar_label: "SchemaBuilder"
custom_edit_url: null
hide_title: true
---

# Interface: SchemaBuilder

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).SchemaBuilder

## Hierarchy

* [*ChainableInterface*](knex.knex-1.chainableinterface.md)<void\>

  ↳ **SchemaBuilder**

## Properties

### [Symbol.toStringTag]

• `Readonly` **[Symbol.toStringTag]**: *string*

Inherited from: [ChainableInterface](knex.knex-1.chainableinterface.md).[[Symbol.toStringTag]](knex.knex-1.chainableinterface.md#[symbol.tostringtag])

Defined in: node_modules/knex/types/index.d.ts:1645

## Methods

### alterTable

▸ **alterTable**(`tableName`: *string*, `callback`: (`tableBuilder`: [*CreateTableBuilder*](knex.knex-1.createtablebuilder.md)) => *any*): [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`tableName` | *string* |
`callback` | (`tableBuilder`: [*CreateTableBuilder*](knex.knex-1.createtablebuilder.md)) => *any* |

**Returns:** [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1699

___

### asCallback

▸ **asCallback**(`callback`: Function): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`callback` | Function |

**Returns:** *Promise*<void\>

Inherited from: [ChainableInterface](knex.knex-1.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1663

___

### catch

▸ **catch**<TResult\>(`onrejected?`: *null* \| (`reason`: *any*) => TResult \| *PromiseLike*<TResult\>): *Promise*<void \| TResult\>

Attaches a callback for only the rejection of the Promise.

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult` | *never* |

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`onrejected?` | *null* \| (`reason`: *any*) => TResult \| *PromiseLike*<TResult\> | The callback to execute when the Promise is rejected.   |

**Returns:** *Promise*<void \| TResult\>

A Promise for the completion of the callback.

Inherited from: [ChainableInterface](knex.knex-1.chainableinterface.md)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:1460

___

### connection

▸ **connection**(`connection`: *any*): [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`connection` | *any* |

**Returns:** [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

Inherited from: [ChainableInterface](knex.knex-1.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1650

___

### createSchema

▸ **createSchema**(`schemaName`: *string*): [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`schemaName` | *string* |

**Returns:** [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1697

___

### createSchemaIfNotExists

▸ **createSchemaIfNotExists**(`schemaName`: *string*): [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`schemaName` | *string* |

**Returns:** [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1698

___

### createTable

▸ **createTable**(`tableName`: *string*, `callback`: (`tableBuilder`: [*CreateTableBuilder*](knex.knex-1.createtablebuilder.md)) => *any*): [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`tableName` | *string* |
`callback` | (`tableBuilder`: [*CreateTableBuilder*](knex.knex-1.createtablebuilder.md)) => *any* |

**Returns:** [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1689

___

### createTableIfNotExists

▸ **createTableIfNotExists**(`tableName`: *string*, `callback`: (`tableBuilder`: [*CreateTableBuilder*](knex.knex-1.createtablebuilder.md)) => *any*): [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`tableName` | *string* |
`callback` | (`tableBuilder`: [*CreateTableBuilder*](knex.knex-1.createtablebuilder.md)) => *any* |

**Returns:** [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1693

___

### debug

▸ **debug**(`enabled`: *boolean*): [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`enabled` | *boolean* |

**Returns:** [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

Inherited from: [ChainableInterface](knex.knex-1.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1651

___

### dropSchema

▸ **dropSchema**(`schemaName`: *string*): [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`schemaName` | *string* |

**Returns:** [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1712

___

### dropSchemaIfExists

▸ **dropSchemaIfExists**(`schemaName`: *string*): [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`schemaName` | *string* |

**Returns:** [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1713

___

### dropTable

▸ **dropTable**(`tableName`: *string*): [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`tableName` | *string* |

**Returns:** [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1704

___

### dropTableIfExists

▸ **dropTableIfExists**(`tableName`: *string*): [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`tableName` | *string* |

**Returns:** [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1711

___

### finally

▸ **finally**(`onfinally?`: *null* \| () => *void*): *Promise*<void\>

Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
resolved value cannot be modified from the callback.

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`onfinally?` | *null* \| () => *void* | The callback to execute when the Promise is settled (fulfilled or rejected).   |

**Returns:** *Promise*<void\>

A Promise for the completion of the callback.

Inherited from: [ChainableInterface](knex.knex-1.chainableinterface.md)

Defined in: docs/node_modules/typescript/lib/lib.es2018.promise.d.ts:31

___

### hasColumn

▸ **hasColumn**(`tableName`: *string*, `columnName`: *string*): *Promise*<boolean\>

#### Parameters:

Name | Type |
:------ | :------ |
`tableName` | *string* |
`columnName` | *string* |

**Returns:** *Promise*<boolean\>

Defined in: node_modules/knex/types/index.d.ts:1706

___

### hasTable

▸ **hasTable**(`tableName`: *string*): *Promise*<boolean\>

#### Parameters:

Name | Type |
:------ | :------ |
`tableName` | *string* |

**Returns:** *Promise*<boolean\>

Defined in: node_modules/knex/types/index.d.ts:1705

___

### options

▸ **options**(`options`: *Readonly*<{ [key: string]: *any*;  }\>): [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`options` | *Readonly*<{ [key: string]: *any*;  }\> |

**Returns:** [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

Inherited from: [ChainableInterface](knex.knex-1.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1649

___

### pipe

▸ **pipe**<T\>(`writable`: T, `options?`: *Readonly*<{ [key: string]: *any*;  }\>): *PassThrough*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | *WritableStream*<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`writable` | T |
`options?` | *Readonly*<{ [key: string]: *any*;  }\> |

**Returns:** *PassThrough*

Inherited from: [ChainableInterface](knex.knex-1.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1659

___

### queryContext

▸ **queryContext**(`context`: *any*): [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`context` | *any* |

**Returns:** [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1716

___

### raw

▸ **raw**(`statement`: *string*): [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`statement` | *string* |

**Returns:** [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1714

___

### renameTable

▸ **renameTable**(`oldTableName`: *string*, `newTableName`: *string*): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`oldTableName` | *string* |
`newTableName` | *string* |

**Returns:** *Promise*<void\>

Defined in: node_modules/knex/types/index.d.ts:1703

___

### stream

▸ **stream**(`handler`: (`readable`: *PassThrough*) => *any*): *Promise*<any\>

#### Parameters:

Name | Type |
:------ | :------ |
`handler` | (`readable`: *PassThrough*) => *any* |

**Returns:** *Promise*<any\>

Inherited from: [ChainableInterface](knex.knex-1.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1653

▸ **stream**(`options`: *Readonly*<{ [key: string]: *any*;  }\>, `handler`: (`readable`: *PassThrough*) => *any*): *Promise*<any\>

#### Parameters:

Name | Type |
:------ | :------ |
`options` | *Readonly*<{ [key: string]: *any*;  }\> |
`handler` | (`readable`: *PassThrough*) => *any* |

**Returns:** *Promise*<any\>

Inherited from: [ChainableInterface](knex.knex-1.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1654

▸ **stream**(`options?`: *Readonly*<{ [key: string]: *any*;  }\>): *PassThrough*

#### Parameters:

Name | Type |
:------ | :------ |
`options?` | *Readonly*<{ [key: string]: *any*;  }\> |

**Returns:** *PassThrough*

Inherited from: [ChainableInterface](knex.knex-1.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1658

___

### table

▸ **table**(`tableName`: *string*, `callback`: (`tableBuilder`: [*AlterTableBuilder*](knex.knex-1.altertablebuilder.md)) => *any*): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`tableName` | *string* |
`callback` | (`tableBuilder`: [*AlterTableBuilder*](knex.knex-1.altertablebuilder.md)) => *any* |

**Returns:** *Promise*<void\>

Defined in: node_modules/knex/types/index.d.ts:1707

___

### then

▸ **then**<TResult1, TResult2\>(`onfulfilled?`: *null* \| (`value`: *void*) => TResult1 \| *PromiseLike*<TResult1\>, `onrejected?`: *null* \| (`reason`: *any*) => TResult2 \| *PromiseLike*<TResult2\>): *Promise*<TResult1 \| TResult2\>

Attaches callbacks for the resolution and/or rejection of the Promise.

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult1` | *void* |
`TResult2` | *never* |

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`onfulfilled?` | *null* \| (`value`: *void*) => TResult1 \| *PromiseLike*<TResult1\> | The callback to execute when the Promise is resolved.   |
`onrejected?` | *null* \| (`reason`: *any*) => TResult2 \| *PromiseLike*<TResult2\> | The callback to execute when the Promise is rejected.   |

**Returns:** *Promise*<TResult1 \| TResult2\>

A Promise for the completion of which ever callback is executed.

Inherited from: [ChainableInterface](knex.knex-1.chainableinterface.md)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:1453

___

### toQuery

▸ **toQuery**(): *string*

**Returns:** *string*

Inherited from: [ChainableInterface](knex.knex-1.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1648

___

### toSQL

▸ **toSQL**(): [*Sql*](knex.knex-1.sql.md)

**Returns:** [*Sql*](knex.knex-1.sql.md)

Defined in: node_modules/knex/types/index.d.ts:1718

___

### toString

▸ **toString**(): *string*

**Returns:** *string*

Defined in: node_modules/knex/types/index.d.ts:1717

___

### transacting

▸ **transacting**(`trx`: [*Transaction*](knex.knex-1.transaction.md)<any, any\>): [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`trx` | [*Transaction*](knex.knex-1.transaction.md)<any, any\> |

**Returns:** [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

Inherited from: [ChainableInterface](knex.knex-1.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1652

___

### withSchema

▸ **withSchema**(`schemaName`: *string*): [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`schemaName` | *string* |

**Returns:** [*SchemaBuilder*](knex.knex-1.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1715
