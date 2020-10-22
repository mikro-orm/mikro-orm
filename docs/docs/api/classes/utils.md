---
id: "utils"
title: "Class: Utils"
sidebar_label: "Utils"
---

## Hierarchy

* **Utils**

## Properties

### PK\_SEPARATOR

▪ `Static` `Readonly` **PK\_SEPARATOR**: &#34;~~~&#34; = "~~~"

*Defined in [packages/core/src/utils/Utils.ts:118](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L118)*

## Methods

### absolutePath

▸ `Static`**absolutePath**(`path`: string, `baseDir?`: string): string

*Defined in [packages/core/src/utils/Utils.ts:598](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L598)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`path` | string | - |
`baseDir` | string | process.cwd() |

**Returns:** string

___

### asArray

▸ `Static`**asArray**&#60;T>(`data?`: T \| T[], `strict?`: boolean): T[]

*Defined in [packages/core/src/utils/Utils.ts:271](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L271)*

Normalize the argument to always be an array.

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`data?` | T \| T[] | - |
`strict` | boolean | false |

**Returns:** T[]

___

### callCompiledFunction

▸ `Static`**callCompiledFunction**&#60;T, R>(`fn`: (...args: T) => R, ...`args`: T): R

*Defined in [packages/core/src/utils/Utils.ts:720](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L720)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | unknown[] |
`R` | - |

#### Parameters:

Name | Type |
------ | ------ |
`fn` | (...args: T) => R |
`...args` | T |

**Returns:** R

___

### className

▸ `Static`**className**&#60;T>(`classOrName`: [EntityName](../index.md#entityname)&#60;T>): string

*Defined in [packages/core/src/utils/Utils.ts:497](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L497)*

Gets string name of given class.

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`classOrName` | [EntityName](../index.md#entityname)&#60;T> |

**Returns:** string

___

### copy

▸ `Static`**copy**&#60;T>(`entity`: T): T

*Defined in [packages/core/src/utils/Utils.ts:264](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L264)*

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

___

### createFunction

▸ `Static`**createFunction**(`context`: Map&#60;string, any>, `code`: string): any

*Defined in [packages/core/src/utils/Utils.ts:709](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L709)*

#### Parameters:

Name | Type |
------ | ------ |
`context` | Map&#60;string, any> |
`code` | string |

**Returns:** any

___

### defaultValue

▸ `Static`**defaultValue**&#60;T>(`prop`: T, `option`: keyof T, `defaultValue`: any): void

*Defined in [packages/core/src/utils/Utils.ts:620](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L620)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [Dictionary](../index.md#dictionary) |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | T |
`option` | keyof T |
`defaultValue` | any |

**Returns:** void

___

### detectTsNode

▸ `Static`**detectTsNode**(): boolean

*Defined in [packages/core/src/utils/Utils.ts:508](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L508)*

Tries to detect `ts-node` runtime.

**Returns:** boolean

___

### diff

▸ `Static`**diff**(`a`: [Dictionary](../index.md#dictionary), `b`: [Dictionary](../index.md#dictionary)): Record&#60;keyof *typeof* a & *typeof* b, any>

*Defined in [packages/core/src/utils/Utils.ts:247](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L247)*

Computes difference between two objects, ignoring items missing in `b`.

#### Parameters:

Name | Type |
------ | ------ |
`a` | [Dictionary](../index.md#dictionary) |
`b` | [Dictionary](../index.md#dictionary) |

**Returns:** Record&#60;keyof *typeof* a & *typeof* b, any>

___

### equals

▸ `Static`**equals**(`a`: any, `b`: any): boolean

*Defined in [packages/core/src/utils/Utils.ts:190](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L190)*

Checks if arguments are deeply (but not strictly) equal.

#### Parameters:

Name | Type |
------ | ------ |
`a` | any |
`b` | any |

**Returns:** boolean

___

### extractEnumValues

▸ `Static`**extractEnumValues**(`target`: [Dictionary](../index.md#dictionary)): (string \| number)[]

*Defined in [packages/core/src/utils/Utils.ts:646](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L646)*

Extracts all possible values of a TS enum. Works with both string and numeric enums.

#### Parameters:

Name | Type |
------ | ------ |
`target` | [Dictionary](../index.md#dictionary) |

**Returns:** (string \| number)[]

___

### extractPK

▸ `Static`**extractPK**&#60;T>(`data`: any, `meta?`: [EntityMetadata](entitymetadata.md)&#60;T>, `strict?`: boolean): [Primary](../index.md#primary)&#60;T> \| string \| null

*Defined in [packages/core/src/utils/Utils.ts:359](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L359)*

Extracts primary key from `data`. Accepts objects or primary keys directly.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`data` | any | - |
`meta?` | [EntityMetadata](entitymetadata.md)&#60;T> | - |
`strict` | boolean | false |

**Returns:** [Primary](../index.md#primary)&#60;T> \| string \| null

___

### findDuplicates

▸ `Static`**findDuplicates**&#60;T>(`items`: T[]): T[]

*Defined in [packages/core/src/utils/Utils.ts:624](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L624)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`items` | T[] |

**Returns:** T[]

___

### flatten

▸ `Static`**flatten**&#60;T>(`arrays`: T[][]): T[]

*Defined in [packages/core/src/utils/Utils.ts:658](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L658)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`arrays` | T[][] |

**Returns:** T[]

___

### getCompositeKeyHash

▸ `Static`**getCompositeKeyHash**&#60;T>(`entity`: T, `meta`: [EntityMetadata](entitymetadata.md)&#60;T>): string

*Defined in [packages/core/src/utils/Utils.ts:383](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L383)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |

**Returns:** string

___

### getGlobalStorage

▸ `Static`**getGlobalStorage**(`namespace`: string): [Dictionary](../index.md#dictionary)

*Defined in [packages/core/src/utils/Utils.ts:674](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L674)*

#### Parameters:

Name | Type |
------ | ------ |
`namespace` | string |

**Returns:** [Dictionary](../index.md#dictionary)

___

### getORMVersion

▸ `Static`**getORMVersion**(): string

*Defined in [packages/core/src/utils/Utils.ts:695](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L695)*

**Returns:** string

___

### getObjectKeysSize

▸ `Static`**getObjectKeysSize**(`object`: [Dictionary](../index.md#dictionary)): number

*Defined in [packages/core/src/utils/Utils.ts:145](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L145)*

Returns the number of properties on `obj`. This is 20x faster than Object.keys(obj).length.

**`see`** https://github.com/deepkit/deepkit-framework/blob/master/packages/core/src/core.ts

#### Parameters:

Name | Type |
------ | ------ |
`object` | [Dictionary](../index.md#dictionary) |

**Returns:** number

___

### getObjectType

▸ `Static`**getObjectType**(`value`: any): string

*Defined in [packages/core/src/utils/Utils.ts:541](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L541)*

Gets the type of the argument.

#### Parameters:

Name | Type |
------ | ------ |
`value` | any |

**Returns:** string

___

### getOrderedPrimaryKeys

▸ `Static`**getOrderedPrimaryKeys**&#60;T>(`id`: [Primary](../index.md#primary)&#60;T> \| Record&#60;string, [Primary](../index.md#primary)&#60;T>>, `meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `platform?`: [Platform](platform.md), `convertCustomTypes?`: boolean): [Primary](../index.md#primary)&#60;T>[]

*Defined in [packages/core/src/utils/Utils.ts:444](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L444)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`id` | [Primary](../index.md#primary)&#60;T> \| Record&#60;string, [Primary](../index.md#primary)&#60;T>> |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`platform?` | [Platform](platform.md) |
`convertCustomTypes?` | boolean |

**Returns:** [Primary](../index.md#primary)&#60;T>[]

___

### getParamNames

▸ `Static`**getParamNames**(`func`: { toString: () => string  } \| string, `methodName?`: string): string[]

*Defined in [packages/core/src/utils/Utils.ts:295](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L295)*

Returns array of functions argument names. Uses `escaya` for source code analysis.

#### Parameters:

Name | Type |
------ | ------ |
`func` | { toString: () => string  } \| string |
`methodName?` | string |

**Returns:** string[]

___

### getPrimaryKeyCond

▸ `Static`**getPrimaryKeyCond**&#60;T>(`entity`: T, `primaryKeys`: string[]): Record&#60;string, [Primary](../index.md#primary)&#60;T>> \| null

*Defined in [packages/core/src/utils/Utils.ts:424](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L424)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`primaryKeys` | string[] |

**Returns:** Record&#60;string, [Primary](../index.md#primary)&#60;T>> \| null

___

### getPrimaryKeyCondFromArray

▸ `Static`**getPrimaryKeyCondFromArray**&#60;T>(`pks`: [Primary](../index.md#primary)&#60;T>[], `primaryKeys`: string[]): Record&#60;string, [Primary](../index.md#primary)&#60;T>>

*Defined in [packages/core/src/utils/Utils.ts:437](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L437)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`pks` | [Primary](../index.md#primary)&#60;T>[] |
`primaryKeys` | string[] |

**Returns:** Record&#60;string, [Primary](../index.md#primary)&#60;T>>

___

### getPrimaryKeyHash

▸ `Static`**getPrimaryKeyHash**(`pks`: string[]): string

*Defined in [packages/core/src/utils/Utils.ts:398](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L398)*

#### Parameters:

Name | Type |
------ | ------ |
`pks` | string[] |

**Returns:** string

___

### getPrimaryKeyValues

▸ `Static`**getPrimaryKeyValues**&#60;T>(`entity`: T, `primaryKeys`: string[], `allowScalar?`: boolean): any

*Defined in [packages/core/src/utils/Utils.ts:406](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L406)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entity` | T | - |
`primaryKeys` | string[] | - |
`allowScalar` | boolean | false |

**Returns:** any

___

### getRootEntity

▸ `Static`**getRootEntity**(`metadata`: [IMetadataStorage](../interfaces/imetadatastorage.md), `meta`: [EntityMetadata](entitymetadata.md)): [EntityMetadata](entitymetadata.md)

*Defined in [packages/core/src/utils/Utils.ts:228](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L228)*

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | [IMetadataStorage](../interfaces/imetadatastorage.md) |
`meta` | [EntityMetadata](entitymetadata.md) |

**Returns:** [EntityMetadata](entitymetadata.md)

___

### hasObjectKeys

▸ `Static`**hasObjectKeys**(`object`: [Dictionary](../index.md#dictionary)): boolean

*Defined in [packages/core/src/utils/Utils.ts:162](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L162)*

Returns true if `obj` has at least one property. This is 20x faster than Object.keys(obj).length.

**`see`** https://github.com/deepkit/deepkit-framework/blob/master/packages/core/src/core.ts

#### Parameters:

Name | Type |
------ | ------ |
`object` | [Dictionary](../index.md#dictionary) |

**Returns:** boolean

___

### hash

▸ `Static`**hash**(`data`: string): string

*Defined in [packages/core/src/utils/Utils.ts:610](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L610)*

#### Parameters:

Name | Type |
------ | ------ |
`data` | string |

**Returns:** string

___

### isCollection

▸ `Static`**isCollection**&#60;T, O>(`item`: any, `prop?`: [EntityProperty](../interfaces/entityproperty.md)&#60;T>, `type?`: [ReferenceType](../enums/referencetype.md)): item is Collection&#60;T, O>

*Defined in [packages/core/src/utils/Utils.ts:567](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L567)*

#### Type parameters:

Name | Default |
------ | ------ |
`T` | - |
`O` | unknown |

#### Parameters:

Name | Type |
------ | ------ |
`item` | any |
`prop?` | [EntityProperty](../interfaces/entityproperty.md)&#60;T> |
`type?` | [ReferenceType](../enums/referencetype.md) |

**Returns:** item is Collection&#60;T, O>

___

### isDefined

▸ `Static`**isDefined**&#60;T>(`data`: any, `considerNullUndefined?`: boolean): data is T

*Defined in [packages/core/src/utils/Utils.ts:123](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L123)*

Checks if the argument is not undefined

#### Type parameters:

Name | Default |
------ | ------ |
`T` | Record\&#60;string, unknown> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`data` | any | - |
`considerNullUndefined` | boolean | false |

**Returns:** data is T

___

### isEmpty

▸ `Static`**isEmpty**(`data`: any): boolean

*Defined in [packages/core/src/utils/Utils.ts:482](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L482)*

Checks whether the argument is empty (array without items, object without keys or falsy value).

#### Parameters:

Name | Type |
------ | ------ |
`data` | any |

**Returns:** boolean

___

### isEntity

▸ `Static`**isEntity**&#60;T>(`data`: any, `allowReference?`: boolean): data is T

*Defined in [packages/core/src/utils/Utils.ts:460](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L460)*

Checks whether given object is an entity instance.

#### Type parameters:

Name | Default |
------ | ------ |
`T` | AnyEntity |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`data` | any | - |
`allowReference` | boolean | false |

**Returns:** data is T

___

### isGroupOperator

▸ `Static`**isGroupOperator**(`key`: string): boolean

*Defined in [packages/core/src/utils/Utils.ts:670](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L670)*

#### Parameters:

Name | Type |
------ | ------ |
`key` | string |

**Returns:** boolean

___

### isNotObject

▸ `Static`**isNotObject**&#60;T>(`o`: any, `not`: any[]): o is T

*Defined in [packages/core/src/utils/Utils.ts:137](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L137)*

Checks if the argument is instance of `Object`, but not one of the blacklisted types. Returns false for arrays.

#### Type parameters:

Name | Default |
------ | ------ |
`T` | Dictionary |

#### Parameters:

Name | Type |
------ | ------ |
`o` | any |
`not` | any[] |

**Returns:** o is T

___

### isNumber

▸ `Static`**isNumber**&#60;T>(`s`: any): s is T

*Defined in [packages/core/src/utils/Utils.ts:183](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L183)*

Checks if the argument is number

#### Type parameters:

Name | Default |
------ | ------ |
`T` | number |

#### Parameters:

Name | Type |
------ | ------ |
`s` | any |

**Returns:** s is T

___

### isObject

▸ `Static`**isObject**&#60;T>(`o`: any): o is T

*Defined in [packages/core/src/utils/Utils.ts:130](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L130)*

Checks if the argument is instance of `Object`. Returns false for arrays.

#### Type parameters:

Name | Default |
------ | ------ |
`T` | Dictionary |

#### Parameters:

Name | Type |
------ | ------ |
`o` | any |

**Returns:** o is T

___

### isObjectID

▸ `Static`**isObjectID**(`key`: any): boolean

*Defined in [packages/core/src/utils/Utils.ts:475](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L475)*

Checks whether the argument is ObjectId instance

#### Parameters:

Name | Type |
------ | ------ |
`key` | any |

**Returns:** boolean

___

### isOperator

▸ `Static`**isOperator**(`key`: string, `includeGroupOperators?`: boolean): boolean

*Defined in [packages/core/src/utils/Utils.ts:662](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L662)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`key` | string | - |
`includeGroupOperators` | boolean | true |

**Returns:** boolean

___

### isPlainObject

▸ `Static`**isPlainObject**(`value`: any): value is Dictionary

*Defined in [packages/core/src/utils/Utils.ts:549](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L549)*

Checks whether the value is POJO (e.g. `{ foo: 'bar' }`, and not instance of `Foo`)

#### Parameters:

Name | Type |
------ | ------ |
`value` | any |

**Returns:** value is Dictionary

___

### isPrimaryKey

▸ `Static`**isPrimaryKey**&#60;T>(`key`: any, `allowComposite?`: boolean): key is Primary&#60;T>

*Defined in [packages/core/src/utils/Utils.ts:348](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L348)*

Checks whether the argument looks like primary key (string, number or ObjectId).

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`key` | any | - |
`allowComposite` | boolean | false |

**Returns:** key is Primary&#60;T>

___

### isString

▸ `Static`**isString**(`s`: any): s is string

*Defined in [packages/core/src/utils/Utils.ts:176](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L176)*

Checks if the argument is string

#### Parameters:

Name | Type |
------ | ------ |
`s` | any |

**Returns:** s is string

___

### lookupPathFromDecorator

▸ `Static`**lookupPathFromDecorator**(`name`: string, `stack?`: string[]): string

*Defined in [packages/core/src/utils/Utils.ts:520](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L520)*

Uses some dark magic to get source path to caller where decorator is used.
Analyses stack trace of error created inside the function call.

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |
`stack?` | string[] |

**Returns:** string

___

### merge

▸ `Static`**merge**(`target`: any, ...`sources`: any[]): any

*Defined in [packages/core/src/utils/Utils.ts:204](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L204)*

Merges all sources into the target recursively.

#### Parameters:

Name | Type |
------ | ------ |
`target` | any |
`...sources` | any[] |

**Returns:** any

___

### normalizePath

▸ `Static`**normalizePath**(...`parts`: string[]): string

*Defined in [packages/core/src/utils/Utils.ts:575](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L575)*

#### Parameters:

Name | Type |
------ | ------ |
`...parts` | string[] |

**Returns:** string

___

### pathExists

▸ `Static`**pathExists**(`path`: string, `options?`: GlobbyOptions): Promise&#60;boolean>

*Defined in [packages/core/src/utils/Utils.ts:634](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L634)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`path` | string | - |
`options` | GlobbyOptions | {} |

**Returns:** Promise&#60;boolean>

___

### propertyDecoratorReturnValue

▸ `Static`**propertyDecoratorReturnValue**(): any

*Defined in [packages/core/src/utils/Utils.ts:736](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L736)*

**`see`** https://github.com/mikro-orm/mikro-orm/issues/840

**Returns:** any

___

### randomInt

▸ `Static`**randomInt**(`min`: number, `max`: number): number

*Defined in [packages/core/src/utils/Utils.ts:630](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L630)*

#### Parameters:

Name | Type |
------ | ------ |
`min` | number |
`max` | number |

**Returns:** number

___

### relativePath

▸ `Static`**relativePath**(`path`: string, `relativeTo`: string): string

*Defined in [packages/core/src/utils/Utils.ts:582](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L582)*

#### Parameters:

Name | Type |
------ | ------ |
`path` | string |
`relativeTo` | string |

**Returns:** string

___

### renameKey

▸ `Static`**renameKey**&#60;T>(`payload`: T, `from`: string \| keyof T, `to`: string): void

*Defined in [packages/core/src/utils/Utils.ts:282](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L282)*

Renames object key, keeps order of properties.

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`payload` | T |
`from` | string \| keyof T |
`to` | string |

**Returns:** void

___

### requireFrom

▸ `Static`**requireFrom**(`id`: string, `from`: string): any

*Defined in [packages/core/src/utils/Utils.ts:686](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L686)*

Require a module from a specific location

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`id` | string | The module to require |
`from` | string | Location to start the node resolution  |

**Returns:** any

___

### runIfNotEmpty

▸ `Static`**runIfNotEmpty**(`clause`: () => any, `data`: any): void

*Defined in [packages/core/src/utils/Utils.ts:614](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L614)*

#### Parameters:

Name | Type |
------ | ------ |
`clause` | () => any |
`data` | any |

**Returns:** void

___

### runSerial

▸ `Static`**runSerial**&#60;T, U>(`items`: Iterable&#60;U>, `cb`: (item: U) => Promise&#60;T>): Promise&#60;T[]>

*Defined in [packages/core/src/utils/Utils.ts:557](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L557)*

Executes the `cb` promise serially on every element of the `items` array and returns array of resolved values.

#### Type parameters:

Name | Default |
------ | ------ |
`T` | any |
`U` | any |

#### Parameters:

Name | Type |
------ | ------ |
`items` | Iterable&#60;U> |
`cb` | (item: U) => Promise&#60;T> |

**Returns:** Promise&#60;T[]>

___

### splitPrimaryKeys

▸ `Static`**splitPrimaryKeys**(`key`: string): string[]

*Defined in [packages/core/src/utils/Utils.ts:402](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L402)*

#### Parameters:

Name | Type |
------ | ------ |
`key` | string |

**Returns:** string[]

___

### unique

▸ `Static`**unique**&#60;T>(`items`: T[]): T[]

*Defined in [packages/core/src/utils/Utils.ts:197](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L197)*

Gets array without duplicates.

#### Type parameters:

Name | Default |
------ | ------ |
`T` | string |

#### Parameters:

Name | Type |
------ | ------ |
`items` | T[] |

**Returns:** T[]

___

### walkNode

▸ `Static` `Private`**walkNode**(`node`: [Dictionary](../index.md#dictionary), `checkNode`: (node: [Dictionary](../index.md#dictionary)) => void): void

*Defined in [packages/core/src/utils/Utils.ts:327](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/utils/Utils.ts#L327)*

#### Parameters:

Name | Type |
------ | ------ |
`node` | [Dictionary](../index.md#dictionary) |
`checkNode` | (node: [Dictionary](../index.md#dictionary)) => void |

**Returns:** void
