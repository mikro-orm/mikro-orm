---
id: "core.utils"
title: "Class: Utils"
sidebar_label: "Utils"
hide_title: true
---

# Class: Utils

[core](../modules/core.md).Utils

## Hierarchy

* **Utils**

## Constructors

### constructor

\+ **new Utils**(): [*Utils*](core.utils.md)

**Returns:** [*Utils*](core.utils.md)

## Properties

### PK\_SEPARATOR

▪ `Readonly` `Static` **PK\_SEPARATOR**: *~~~*= '~~~'

Defined in: [packages/core/src/utils/Utils.ts:119](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L119)

## Methods

### absolutePath

▸ `Static`**absolutePath**(`path`: *string*, `baseDir?`: *string*): *string*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`path` | *string* | - |
`baseDir` | *string* | ... |

**Returns:** *string*

Defined in: [packages/core/src/utils/Utils.ts:609](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L609)

___

### asArray

▸ `Static`**asArray**<T\>(`data?`: T \| T[], `strict?`: *boolean*): T[]

Normalize the argument to always be an array.

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`data?` | T \| T[] | - |
`strict` | *boolean* | false |

**Returns:** T[]

Defined in: [packages/core/src/utils/Utils.ts:272](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L272)

___

### callCompiledFunction

▸ `Static`**callCompiledFunction**<T, R\>(`fn`: (...`args`: T) => R, ...`args`: T): R

#### Type parameters:

Name | Type |
------ | ------ |
`T` | *unknown*[] |
`R` | - |

#### Parameters:

Name | Type |
------ | ------ |
`fn` | (...`args`: T) => R |
`...args` | T |

**Returns:** R

Defined in: [packages/core/src/utils/Utils.ts:735](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L735)

___

### className

▸ `Static`**className**<T\>(`classOrName`: [*EntityName*](../modules/core.md#entityname)<T\>): *string*

Gets string name of given class.

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`classOrName` | [*EntityName*](../modules/core.md#entityname)<T\> |

**Returns:** *string*

Defined in: [packages/core/src/utils/Utils.ts:508](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L508)

___

### copy

▸ `Static`**copy**<T\>(`entity`: T): T

Creates deep copy of given entity.

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |

**Returns:** T

Defined in: [packages/core/src/utils/Utils.ts:265](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L265)

___

### createFunction

▸ `Static`**createFunction**(`context`: *Map*<*string*, *any*\>, `code`: *string*): *any*

#### Parameters:

Name | Type |
------ | ------ |
`context` | *Map*<*string*, *any*\> |
`code` | *string* |

**Returns:** *any*

Defined in: [packages/core/src/utils/Utils.ts:724](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L724)

___

### defaultValue

▸ `Static`**defaultValue**<T\>(`prop`: T, `option`: keyof T, `defaultValue`: *any*): *void*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | T |
`option` | keyof T |
`defaultValue` | *any* |

**Returns:** *void*

Defined in: [packages/core/src/utils/Utils.ts:631](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L631)

___

### detectTsNode

▸ `Static`**detectTsNode**(): *boolean*

Tries to detect `ts-node` runtime.

**Returns:** *boolean*

Defined in: [packages/core/src/utils/Utils.ts:519](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L519)

___

### diff

▸ `Static`**diff**(`a`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>, `b`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>): *Record*<*string* \| *number*, *any*\>

Computes difference between two objects, ignoring items missing in `b`.

#### Parameters:

Name | Type |
------ | ------ |
`a` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> |
`b` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> |

**Returns:** *Record*<*string* \| *number*, *any*\>

Defined in: [packages/core/src/utils/Utils.ts:248](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L248)

___

### equals

▸ `Static`**equals**(`a`: *any*, `b`: *any*): *boolean*

Checks if arguments are deeply (but not strictly) equal.

#### Parameters:

Name | Type |
------ | ------ |
`a` | *any* |
`b` | *any* |

**Returns:** *boolean*

Defined in: [packages/core/src/utils/Utils.ts:191](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L191)

___

### extractEnumValues

▸ `Static`**extractEnumValues**(`target`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>): (*string* \| *number*)[]

Extracts all possible values of a TS enum. Works with both string and numeric enums.

#### Parameters:

Name | Type |
------ | ------ |
`target` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> |

**Returns:** (*string* \| *number*)[]

Defined in: [packages/core/src/utils/Utils.ts:657](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L657)

___

### extractPK

▸ `Static`**extractPK**<T\>(`data`: *any*, `meta?`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `strict?`: *boolean*): *null* \| *string* \| [*Primary*](../modules/core.md#primary)<T\>

Extracts primary key from `data`. Accepts objects or primary keys directly.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`data` | *any* | - |
`meta?` | [*EntityMetadata*](core.entitymetadata.md)<T\> | - |
`strict` | *boolean* | false |

**Returns:** *null* \| *string* \| [*Primary*](../modules/core.md#primary)<T\>

Defined in: [packages/core/src/utils/Utils.ts:364](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L364)

___

### findDuplicates

▸ `Static`**findDuplicates**<T\>(`items`: T[]): T[]

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`items` | T[] |

**Returns:** T[]

Defined in: [packages/core/src/utils/Utils.ts:635](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L635)

___

### flatten

▸ `Static`**flatten**<T\>(`arrays`: T[][]): T[]

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`arrays` | T[][] |

**Returns:** T[]

Defined in: [packages/core/src/utils/Utils.ts:673](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L673)

___

### getCompositeKeyHash

▸ `Static`**getCompositeKeyHash**<T\>(`entity`: T, `meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>): *string*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |

**Returns:** *string*

Defined in: [packages/core/src/utils/Utils.ts:388](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L388)

___

### getGlobalStorage

▸ `Static`**getGlobalStorage**(`namespace`: *string*): [*Dictionary*](../modules/core.md#dictionary)<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`namespace` | *string* |

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<*any*\>

Defined in: [packages/core/src/utils/Utils.ts:689](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L689)

___

### getORMVersion

▸ `Static`**getORMVersion**(): *string*

**Returns:** *string*

Defined in: [packages/core/src/utils/Utils.ts:710](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L710)

___

### getObjectKeysSize

▸ `Static`**getObjectKeysSize**(`object`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>): *number*

Returns the number of properties on `obj`. This is 20x faster than Object.keys(obj).length.

**`see`** https://github.com/deepkit/deepkit-framework/blob/master/packages/core/src/core.ts

#### Parameters:

Name | Type |
------ | ------ |
`object` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> |

**Returns:** *number*

Defined in: [packages/core/src/utils/Utils.ts:146](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L146)

___

### getObjectType

▸ `Static`**getObjectType**(`value`: *any*): *string*

Gets the type of the argument.

#### Parameters:

Name | Type |
------ | ------ |
`value` | *any* |

**Returns:** *string*

Defined in: [packages/core/src/utils/Utils.ts:552](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L552)

___

### getOrderedPrimaryKeys

▸ `Static`**getOrderedPrimaryKeys**<T\>(`id`: [*Primary*](../modules/core.md#primary)<T\> \| *Record*<*string*, [*Primary*](../modules/core.md#primary)<T\>\>, `meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `platform?`: [*Platform*](core.platform.md), `convertCustomTypes?`: *boolean*): [*Primary*](../modules/core.md#primary)<T\>[]

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`id` | [*Primary*](../modules/core.md#primary)<T\> \| *Record*<*string*, [*Primary*](../modules/core.md#primary)<T\>\> |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`platform?` | [*Platform*](core.platform.md) |
`convertCustomTypes?` | *boolean* |

**Returns:** [*Primary*](../modules/core.md#primary)<T\>[]

Defined in: [packages/core/src/utils/Utils.ts:449](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L449)

___

### getParamNames

▸ `Static`**getParamNames**(`func`: *string* \| { `toString`: () => *string*  }, `methodName?`: *string*): *string*[]

Returns array of functions argument names. Uses `escaya` for source code analysis.

#### Parameters:

Name | Type |
------ | ------ |
`func` | *string* \| { `toString`: () => *string*  } |
`methodName?` | *string* |

**Returns:** *string*[]

Defined in: [packages/core/src/utils/Utils.ts:300](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L300)

___

### getPrimaryKeyCond

▸ `Static`**getPrimaryKeyCond**<T\>(`entity`: T, `primaryKeys`: *string*[]): *null* \| *Record*<*string*, [*Primary*](../modules/core.md#primary)<T\>\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`primaryKeys` | *string*[] |

**Returns:** *null* \| *Record*<*string*, [*Primary*](../modules/core.md#primary)<T\>\>

Defined in: [packages/core/src/utils/Utils.ts:429](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L429)

___

### getPrimaryKeyCondFromArray

▸ `Static`**getPrimaryKeyCondFromArray**<T\>(`pks`: [*Primary*](../modules/core.md#primary)<T\>[], `primaryKeys`: *string*[]): *Record*<*string*, [*Primary*](../modules/core.md#primary)<T\>\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`pks` | [*Primary*](../modules/core.md#primary)<T\>[] |
`primaryKeys` | *string*[] |

**Returns:** *Record*<*string*, [*Primary*](../modules/core.md#primary)<T\>\>

Defined in: [packages/core/src/utils/Utils.ts:442](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L442)

___

### getPrimaryKeyHash

▸ `Static`**getPrimaryKeyHash**(`pks`: *string*[]): *string*

#### Parameters:

Name | Type |
------ | ------ |
`pks` | *string*[] |

**Returns:** *string*

Defined in: [packages/core/src/utils/Utils.ts:403](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L403)

___

### getPrimaryKeyValues

▸ `Static`**getPrimaryKeyValues**<T\>(`entity`: T, `primaryKeys`: *string*[], `allowScalar?`: *boolean*): *any*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entity` | T | - |
`primaryKeys` | *string*[] | - |
`allowScalar` | *boolean* | false |

**Returns:** *any*

Defined in: [packages/core/src/utils/Utils.ts:411](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L411)

___

### getRootEntity

▸ `Static`**getRootEntity**(`metadata`: IMetadataStorage, `meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>): [*EntityMetadata*](core.entitymetadata.md)<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | IMetadataStorage |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |

**Returns:** [*EntityMetadata*](core.entitymetadata.md)<*any*\>

Defined in: [packages/core/src/utils/Utils.ts:229](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L229)

___

### hasObjectKeys

▸ `Static`**hasObjectKeys**(`object`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>): *boolean*

Returns true if `obj` has at least one property. This is 20x faster than Object.keys(obj).length.

**`see`** https://github.com/deepkit/deepkit-framework/blob/master/packages/core/src/core.ts

#### Parameters:

Name | Type |
------ | ------ |
`object` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> |

**Returns:** *boolean*

Defined in: [packages/core/src/utils/Utils.ts:163](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L163)

___

### hash

▸ `Static`**hash**(`data`: *string*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`data` | *string* |

**Returns:** *string*

Defined in: [packages/core/src/utils/Utils.ts:621](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L621)

___

### isCollection

▸ `Static`**isCollection**<T, O\>(`item`: *any*, `prop?`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>, `type?`: [*SCALAR*](../enums/core.referencetype.md#scalar) \| [*ONE\_TO\_ONE*](../enums/core.referencetype.md#one_to_one) \| [*ONE\_TO\_MANY*](../enums/core.referencetype.md#one_to_many) \| [*MANY\_TO\_ONE*](../enums/core.referencetype.md#many_to_one) \| [*MANY\_TO\_MANY*](../enums/core.referencetype.md#many_to_many) \| [*EMBEDDED*](../enums/core.referencetype.md#embedded)): item is Collection<T, O\>

#### Type parameters:

Name | Default |
------ | ------ |
`T` | - |
`O` | *unknown* |

#### Parameters:

Name | Type |
------ | ------ |
`item` | *any* |
`prop?` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |
`type?` | [*SCALAR*](../enums/core.referencetype.md#scalar) \| [*ONE\_TO\_ONE*](../enums/core.referencetype.md#one_to_one) \| [*ONE\_TO\_MANY*](../enums/core.referencetype.md#one_to_many) \| [*MANY\_TO\_ONE*](../enums/core.referencetype.md#many_to_one) \| [*MANY\_TO\_MANY*](../enums/core.referencetype.md#many_to_many) \| [*EMBEDDED*](../enums/core.referencetype.md#embedded) |

**Returns:** item is Collection<T, O\>

Defined in: [packages/core/src/utils/Utils.ts:578](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L578)

___

### isDefined

▸ `Static`**isDefined**<T\>(`data`: *any*, `considerNullUndefined?`: *boolean*): data is T

Checks if the argument is not undefined

#### Type parameters:

Name | Default |
------ | ------ |
`T` | *Record*<*string*, *unknown*\\> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`data` | *any* | - |
`considerNullUndefined` | *boolean* | false |

**Returns:** data is T

Defined in: [packages/core/src/utils/Utils.ts:124](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L124)

___

### isEmpty

▸ `Static`**isEmpty**(`data`: *any*): *boolean*

Checks whether the argument is empty (array without items, object without keys or falsy value).

#### Parameters:

Name | Type |
------ | ------ |
`data` | *any* |

**Returns:** *boolean*

Defined in: [packages/core/src/utils/Utils.ts:493](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L493)

___

### isEntity

▸ `Static`**isEntity**<T\>(`data`: *any*, `allowReference?`: *boolean*): data is T

Checks whether given object is an entity instance.

#### Type parameters:

Name | Default |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<*any*\\> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`data` | *any* | - |
`allowReference` | *boolean* | false |

**Returns:** data is T

Defined in: [packages/core/src/utils/Utils.ts:471](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L471)

___

### isGroupOperator

▸ `Static`**isGroupOperator**(`key`: *string*): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`key` | *string* |

**Returns:** *boolean*

Defined in: [packages/core/src/utils/Utils.ts:685](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L685)

___

### isNotObject

▸ `Static`**isNotObject**<T\>(`o`: *any*, `not`: *any*[]): o is T

Checks if the argument is instance of `Object`, but not one of the blacklisted types. Returns false for arrays.

#### Type parameters:

Name | Default |
------ | ------ |
`T` | [*Dictionary*](../modules/core.md#dictionary)<*any*\\> |

#### Parameters:

Name | Type |
------ | ------ |
`o` | *any* |
`not` | *any*[] |

**Returns:** o is T

Defined in: [packages/core/src/utils/Utils.ts:138](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L138)

___

### isNumber

▸ `Static`**isNumber**<T\>(`s`: *any*): s is T

Checks if the argument is number

#### Type parameters:

Name | Default |
------ | ------ |
`T` | *number* |

#### Parameters:

Name | Type |
------ | ------ |
`s` | *any* |

**Returns:** s is T

Defined in: [packages/core/src/utils/Utils.ts:184](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L184)

___

### isObject

▸ `Static`**isObject**<T\>(`o`: *any*): o is T

Checks if the argument is instance of `Object`. Returns false for arrays.

#### Type parameters:

Name | Default |
------ | ------ |
`T` | [*Dictionary*](../modules/core.md#dictionary)<*any*\\> |

#### Parameters:

Name | Type |
------ | ------ |
`o` | *any* |

**Returns:** o is T

Defined in: [packages/core/src/utils/Utils.ts:131](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L131)

___

### isObjectID

▸ `Static`**isObjectID**(`key`: *any*): *boolean*

Checks whether the argument is ObjectId instance

#### Parameters:

Name | Type |
------ | ------ |
`key` | *any* |

**Returns:** *boolean*

Defined in: [packages/core/src/utils/Utils.ts:486](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L486)

___

### isOperator

▸ `Static`**isOperator**(`key`: *string*, `includeGroupOperators?`: *boolean*): *boolean*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`key` | *string* | - |
`includeGroupOperators` | *boolean* | true |

**Returns:** *boolean*

Defined in: [packages/core/src/utils/Utils.ts:677](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L677)

___

### isPlainObject

▸ `Static`**isPlainObject**(`value`: *any*): value is Dictionary<any\>

Checks whether the value is POJO (e.g. `{ foo: 'bar' }`, and not instance of `Foo`)

#### Parameters:

Name | Type |
------ | ------ |
`value` | *any* |

**Returns:** value is Dictionary<any\>

Defined in: [packages/core/src/utils/Utils.ts:560](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L560)

___

### isPrimaryKey

▸ `Static`**isPrimaryKey**<T\>(`key`: *any*, `allowComposite?`: *boolean*): key is Primary<T\>

Checks whether the argument looks like primary key (string, number or ObjectId).

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`key` | *any* | - |
`allowComposite` | *boolean* | false |

**Returns:** key is Primary<T\>

Defined in: [packages/core/src/utils/Utils.ts:353](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L353)

___

### isString

▸ `Static`**isString**(`s`: *any*): s is string

Checks if the argument is string

#### Parameters:

Name | Type |
------ | ------ |
`s` | *any* |

**Returns:** s is string

Defined in: [packages/core/src/utils/Utils.ts:177](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L177)

___

### lookupPathFromDecorator

▸ `Static`**lookupPathFromDecorator**(`name`: *string*, `stack?`: *string*[]): *string*

Uses some dark magic to get source path to caller where decorator is used.
Analyses stack trace of error created inside the function call.

#### Parameters:

Name | Type |
------ | ------ |
`name` | *string* |
`stack?` | *string*[] |

**Returns:** *string*

Defined in: [packages/core/src/utils/Utils.ts:531](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L531)

___

### merge

▸ `Static`**merge**(`target`: *any*, ...`sources`: *any*[]): *any*

Merges all sources into the target recursively.

#### Parameters:

Name | Type |
------ | ------ |
`target` | *any* |
`...sources` | *any*[] |

**Returns:** *any*

Defined in: [packages/core/src/utils/Utils.ts:205](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L205)

___

### normalizePath

▸ `Static`**normalizePath**(...`parts`: *string*[]): *string*

#### Parameters:

Name | Type |
------ | ------ |
`...parts` | *string*[] |

**Returns:** *string*

Defined in: [packages/core/src/utils/Utils.ts:586](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L586)

___

### pathExists

▸ `Static`**pathExists**(`path`: *string*, `options?`: *GlobbyOptions*): *Promise*<*boolean*\>

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`path` | *string* | - |
`options` | *GlobbyOptions* | ... |

**Returns:** *Promise*<*boolean*\>

Defined in: [packages/core/src/utils/Utils.ts:645](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L645)

___

### propertyDecoratorReturnValue

▸ `Static`**propertyDecoratorReturnValue**(): *any*

**`see`** https://github.com/mikro-orm/mikro-orm/issues/840

**Returns:** *any*

Defined in: [packages/core/src/utils/Utils.ts:751](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L751)

___

### randomInt

▸ `Static`**randomInt**(`min`: *number*, `max`: *number*): *number*

#### Parameters:

Name | Type |
------ | ------ |
`min` | *number* |
`max` | *number* |

**Returns:** *number*

Defined in: [packages/core/src/utils/Utils.ts:641](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L641)

___

### relativePath

▸ `Static`**relativePath**(`path`: *string*, `relativeTo`: *string*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`path` | *string* |
`relativeTo` | *string* |

**Returns:** *string*

Defined in: [packages/core/src/utils/Utils.ts:593](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L593)

___

### renameKey

▸ `Static`**renameKey**<T\>(`payload`: T, `from`: *string* \| keyof T, `to`: *string*): *void*

Renames object key, keeps order of properties.

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`payload` | T |
`from` | *string* \| keyof T |
`to` | *string* |

**Returns:** *void*

Defined in: [packages/core/src/utils/Utils.ts:287](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L287)

___

### requireFrom

▸ `Static`**requireFrom**(`id`: *string*, `from`: *string*): *any*

Require a module from a specific location

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`id` | *string* | The module to require   |
`from` | *string* | Location to start the node resolution    |

**Returns:** *any*

Defined in: [packages/core/src/utils/Utils.ts:701](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L701)

___

### runIfNotEmpty

▸ `Static`**runIfNotEmpty**(`clause`: () => *any*, `data`: *any*): *void*

#### Parameters:

Name | Type |
------ | ------ |
`clause` | () => *any* |
`data` | *any* |

**Returns:** *void*

Defined in: [packages/core/src/utils/Utils.ts:625](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L625)

___

### runSerial

▸ `Static`**runSerial**<T, U\>(`items`: *Iterable*<U\>, `cb`: (`item`: U) => *Promise*<T\>): *Promise*<T[]\>

Executes the `cb` promise serially on every element of the `items` array and returns array of resolved values.

#### Type parameters:

Name | Default |
------ | ------ |
`T` | *any* |
`U` | *any* |

#### Parameters:

Name | Type |
------ | ------ |
`items` | *Iterable*<U\> |
`cb` | (`item`: U) => *Promise*<T\> |

**Returns:** *Promise*<T[]\>

Defined in: [packages/core/src/utils/Utils.ts:568](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L568)

___

### splitPrimaryKeys

▸ `Static`**splitPrimaryKeys**(`key`: *string*): *string*[]

#### Parameters:

Name | Type |
------ | ------ |
`key` | *string* |

**Returns:** *string*[]

Defined in: [packages/core/src/utils/Utils.ts:407](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L407)

___

### unique

▸ `Static`**unique**<T\>(`items`: T[]): T[]

Gets array without duplicates.

#### Type parameters:

Name | Default |
------ | ------ |
`T` | *string* |

#### Parameters:

Name | Type |
------ | ------ |
`items` | T[] |

**Returns:** T[]

Defined in: [packages/core/src/utils/Utils.ts:198](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L198)

___

### walkNode

▸ `Private` `Static`**walkNode**(`node`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>, `checkNode`: (`node`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>) => *void*): *void*

#### Parameters:

Name | Type |
------ | ------ |
`node` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> |
`checkNode` | (`node`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>) => *void* |

**Returns:** *void*

Defined in: [packages/core/src/utils/Utils.ts:332](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/utils/Utils.ts#L332)
