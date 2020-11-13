---
id: "entityloader"
title: "Class: EntityLoader"
sidebar_label: "EntityLoader"
---

## Hierarchy

* **EntityLoader**

## Constructors

### constructor

\+ **new EntityLoader**(`em`: [EntityManager](entitymanager.md)): [EntityLoader](entityloader.md)

*Defined in [packages/core/src/entity/EntityLoader.ts:23](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityLoader.ts#L23)*

#### Parameters:

Name | Type |
------ | ------ |
`em` | [EntityManager](entitymanager.md) |

**Returns:** [EntityLoader](entityloader.md)

## Properties

### driver

• `Private` `Readonly` **driver**: [IDatabaseDriver](../interfaces/idatabasedriver.md)&#60;[Connection](connection.md)> = this.em.getDriver()

*Defined in [packages/core/src/entity/EntityLoader.ts:23](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityLoader.ts#L23)*

___

### em

• `Private` `Readonly` **em**: [EntityManager](entitymanager.md)

*Defined in [packages/core/src/entity/EntityLoader.ts:25](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityLoader.ts#L25)*

___

### metadata

• `Private` `Readonly` **metadata**: [MetadataStorage](metadatastorage.md) = this.em.getMetadata()

*Defined in [packages/core/src/entity/EntityLoader.ts:22](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityLoader.ts#L22)*

## Methods

### expandNestedPopulate

▸ `Private`**expandNestedPopulate**&#60;T>(`entityName`: string, `parts`: string[], `strategy?`: [LoadStrategy](../enums/loadstrategy.md)): [PopulateOptions](../index.md#populateoptions)&#60;T>

*Defined in [packages/core/src/entity/EntityLoader.ts:115](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityLoader.ts#L115)*

Expands `books.perex` like populate to use `children` array instead of the dot syntax

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`parts` | string[] |
`strategy?` | [LoadStrategy](../enums/loadstrategy.md) |

**Returns:** [PopulateOptions](../index.md#populateoptions)&#60;T>

___

### filterCollections

▸ `Private`**filterCollections**&#60;T>(`entities`: T[], `field`: keyof T, `refresh`: boolean): T[]

*Defined in [packages/core/src/entity/EntityLoader.ts:302](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityLoader.ts#L302)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entities` | T[] |
`field` | keyof T |
`refresh` | boolean |

**Returns:** T[]

___

### filterReferences

▸ `Private`**filterReferences**&#60;T>(`entities`: T[], `field`: keyof T, `refresh`: boolean): T[keyof T][]

*Defined in [packages/core/src/entity/EntityLoader.ts:310](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityLoader.ts#L310)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entities` | T[] |
`field` | keyof T |
`refresh` | boolean |

**Returns:** T[keyof T][]

___

### findChildren

▸ `Private`**findChildren**&#60;T>(`entities`: T[], `prop`: [EntityProperty](../interfaces/entityproperty.md), `populate`: [PopulateOptions](../index.md#populateoptions)&#60;T>, `options`: Required&#60;[Options](../index.md#options)&#60;T>>): Promise&#60;[AnyEntity](../index.md#anyentity)[]>

*Defined in [packages/core/src/entity/EntityLoader.ts:202](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityLoader.ts#L202)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entities` | T[] |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`populate` | [PopulateOptions](../index.md#populateoptions)&#60;T> |
`options` | Required&#60;[Options](../index.md#options)&#60;T>> |

**Returns:** Promise&#60;[AnyEntity](../index.md#anyentity)[]>

___

### findChildrenFromPivotTable

▸ `Private`**findChildrenFromPivotTable**&#60;T>(`filtered`: T[], `prop`: [EntityProperty](../interfaces/entityproperty.md), `field`: keyof T, `refresh`: boolean, `where?`: [FilterQuery](../index.md#filterquery)&#60;T>, `orderBy?`: [QueryOrderMap](../interfaces/queryordermap.md)): Promise&#60;[AnyEntity](../index.md#anyentity)[]>

*Defined in [packages/core/src/entity/EntityLoader.ts:263](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityLoader.ts#L263)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`filtered` | T[] |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`field` | keyof T |
`refresh` | boolean |
`where?` | [FilterQuery](../index.md#filterquery)&#60;T> |
`orderBy?` | [QueryOrderMap](../interfaces/queryordermap.md) |

**Returns:** Promise&#60;[AnyEntity](../index.md#anyentity)[]>

___

### getChildReferences

▸ `Private`**getChildReferences**&#60;T>(`entities`: T[], `prop`: [EntityProperty](../interfaces/entityproperty.md)&#60;T>, `refresh`: boolean): [AnyEntity](../index.md#anyentity)[]

*Defined in [packages/core/src/entity/EntityLoader.ts:285](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityLoader.ts#L285)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entities` | T[] |
`prop` | [EntityProperty](../interfaces/entityproperty.md)&#60;T> |
`refresh` | boolean |

**Returns:** [AnyEntity](../index.md#anyentity)[]

___

### initializeCollections

▸ `Private`**initializeCollections**&#60;T>(`filtered`: T[], `prop`: [EntityProperty](../interfaces/entityproperty.md), `field`: keyof T, `children`: [AnyEntity](../index.md#anyentity)[]): void

*Defined in [packages/core/src/entity/EntityLoader.ts:178](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityLoader.ts#L178)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`filtered` | T[] |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`field` | keyof T |
`children` | [AnyEntity](../index.md#anyentity)[] |

**Returns:** void

___

### initializeManyToMany

▸ `Private`**initializeManyToMany**&#60;T>(`filtered`: T[], `children`: [AnyEntity](../index.md#anyentity)[], `prop`: [EntityProperty](../interfaces/entityproperty.md), `field`: keyof T): void

*Defined in [packages/core/src/entity/EntityLoader.ts:195](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityLoader.ts#L195)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`filtered` | T[] |
`children` | [AnyEntity](../index.md#anyentity)[] |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`field` | keyof T |

**Returns:** void

___

### initializeOneToMany

▸ `Private`**initializeOneToMany**&#60;T>(`filtered`: T[], `children`: [AnyEntity](../index.md#anyentity)[], `prop`: [EntityProperty](../interfaces/entityproperty.md), `field`: keyof T): void

*Defined in [packages/core/src/entity/EntityLoader.ts:188](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityLoader.ts#L188)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`filtered` | T[] |
`children` | [AnyEntity](../index.md#anyentity)[] |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`field` | keyof T |

**Returns:** void

___

### lookupAllRelationships

▸ `Private`**lookupAllRelationships**&#60;T>(`entityName`: string, `prefix?`: string, `visited?`: string[]): [PopulateOptions](../index.md#populateoptions)&#60;T>[]

*Defined in [packages/core/src/entity/EntityLoader.ts:320](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityLoader.ts#L320)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | string | - |
`prefix` | string | "" |
`visited` | string[] | [] |

**Returns:** [PopulateOptions](../index.md#populateoptions)&#60;T>[]

___

### lookupEagerLoadedRelationships

▸ `Private`**lookupEagerLoadedRelationships**&#60;T>(`entityName`: string, `populate`: [PopulateOptions](../index.md#populateoptions)&#60;T>[], `prefix?`: string, `visited?`: string[]): [PopulateOptions](../index.md#populateoptions)&#60;T>[]

*Defined in [packages/core/src/entity/EntityLoader.ts:346](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityLoader.ts#L346)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | string | - |
`populate` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] | - |
`prefix` | string | "" |
`visited` | string[] | [] |

**Returns:** [PopulateOptions](../index.md#populateoptions)&#60;T>[]

___

### mergeNestedPopulate

▸ `Private`**mergeNestedPopulate**&#60;T>(`populate`: [PopulateOptions](../index.md#populateoptions)&#60;T>[]): [PopulateOptions](../index.md#populateoptions)&#60;T>[]

*Defined in [packages/core/src/entity/EntityLoader.ts:87](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityLoader.ts#L87)*

merge multiple populates for the same entity with different children

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`populate` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] |

**Returns:** [PopulateOptions](../index.md#populateoptions)&#60;T>[]

___

### normalizePopulate

▸ **normalizePopulate**&#60;T>(`entityName`: string, `populate`: [PopulateOptions](../index.md#populateoptions)&#60;T>[] \| true, `lookup?`: boolean): [PopulateOptions](../index.md#populateoptions)&#60;T>[]

*Defined in [packages/core/src/entity/EntityLoader.ts:56](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityLoader.ts#L56)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | string | - |
`populate` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] \| true | - |
`lookup` | boolean | true |

**Returns:** [PopulateOptions](../index.md#populateoptions)&#60;T>[]

___

### populate

▸ **populate**&#60;T>(`entityName`: string, `entities`: T[], `populate`: [PopulateOptions](../index.md#populateoptions)&#60;T>[] \| boolean, `options`: [Options](../index.md#options)&#60;T>): Promise&#60;void>

*Defined in [packages/core/src/entity/EntityLoader.ts:30](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityLoader.ts#L30)*

Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`entities` | T[] |
`populate` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] \| boolean |
`options` | [Options](../index.md#options)&#60;T> |

**Returns:** Promise&#60;void>

___

### populateField

▸ `Private`**populateField**&#60;T>(`entityName`: string, `entities`: T[], `populate`: [PopulateOptions](../index.md#populateoptions)&#60;T>, `options`: Required&#60;[Options](../index.md#options)&#60;T>>): Promise&#60;void>

*Defined in [packages/core/src/entity/EntityLoader.ts:233](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityLoader.ts#L233)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`entities` | T[] |
`populate` | [PopulateOptions](../index.md#populateoptions)&#60;T> |
`options` | Required&#60;[Options](../index.md#options)&#60;T>> |

**Returns:** Promise&#60;void>

___

### populateMany

▸ `Private`**populateMany**&#60;T>(`entityName`: string, `entities`: T[], `populate`: [PopulateOptions](../index.md#populateoptions)&#60;T>, `options`: Required&#60;[Options](../index.md#options)&#60;T>>): Promise&#60;[AnyEntity](../index.md#anyentity)[]>

*Defined in [packages/core/src/entity/EntityLoader.ts:131](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityLoader.ts#L131)*

preload everything in one call (this will update already existing references in IM)

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`entities` | T[] |
`populate` | [PopulateOptions](../index.md#populateoptions)&#60;T> |
`options` | Required&#60;[Options](../index.md#options)&#60;T>> |

**Returns:** Promise&#60;[AnyEntity](../index.md#anyentity)[]>
