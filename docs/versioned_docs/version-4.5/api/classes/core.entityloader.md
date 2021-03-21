---
id: "core.entityloader"
title: "Class: EntityLoader"
sidebar_label: "EntityLoader"
custom_edit_url: null
hide_title: true
---

# Class: EntityLoader

[core](../modules/core.md).EntityLoader

## Constructors

### constructor

\+ **new EntityLoader**(`em`: [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>): [*EntityLoader*](core.entityloader.md)

#### Parameters:

Name | Type |
:------ | :------ |
`em` | [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |

**Returns:** [*EntityLoader*](core.entityloader.md)

Defined in: [packages/core/src/entity/EntityLoader.ts:25](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityLoader.ts#L25)

## Properties

### driver

• `Private` `Readonly` **driver**: [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>

Defined in: [packages/core/src/entity/EntityLoader.ts:25](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityLoader.ts#L25)

___

### metadata

• `Private` `Readonly` **metadata**: [*MetadataStorage*](core.metadatastorage.md)

Defined in: [packages/core/src/entity/EntityLoader.ts:24](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityLoader.ts#L24)

## Methods

### buildFields

▸ `Private`**buildFields**<T\>(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>, `options`: *Required*<Options<T\>\>): *string*[]

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |
`options` | *Required*<Options<T\>\> |

**Returns:** *string*[]

Defined in: [packages/core/src/entity/EntityLoader.ts:306](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityLoader.ts#L306)

___

### expandNestedPopulate

▸ `Private`**expandNestedPopulate**<T\>(`entityName`: *string*, `parts`: *string*[], `strategy?`: [*LoadStrategy*](../enums/core.loadstrategy.md)): [*PopulateOptions*](../modules/core.md#populateoptions)<T\>

Expands `books.perex` like populate to use `children` array instead of the dot syntax

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`parts` | *string*[] |
`strategy?` | [*LoadStrategy*](../enums/core.loadstrategy.md) |

**Returns:** [*PopulateOptions*](../modules/core.md#populateoptions)<T\>

Defined in: [packages/core/src/entity/EntityLoader.ts:117](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityLoader.ts#L117)

___

### filterCollections

▸ `Private`**filterCollections**<T\>(`entities`: T[], `field`: keyof T, `refresh`: *boolean*): T[]

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entities` | T[] |
`field` | keyof T |
`refresh` | *boolean* |

**Returns:** T[]

Defined in: [packages/core/src/entity/EntityLoader.ts:344](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityLoader.ts#L344)

___

### filterReferences

▸ `Private`**filterReferences**<T\>(`entities`: T[], `field`: keyof T, `refresh`: *boolean*): T[keyof T][]

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entities` | T[] |
`field` | keyof T |
`refresh` | *boolean* |

**Returns:** T[keyof T][]

Defined in: [packages/core/src/entity/EntityLoader.ts:352](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityLoader.ts#L352)

___

### findChildren

▸ `Private`**findChildren**<T\>(`entities`: T[], `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `populate`: [*PopulateOptions*](../modules/core.md#populateoptions)<T\>, `options`: *Required*<Options<T\>\>): *Promise*<[*AnyEntity*](../modules/core.md#anyentity)<any\>[]\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entities` | T[] |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`populate` | [*PopulateOptions*](../modules/core.md#populateoptions)<T\> |
`options` | *Required*<Options<T\>\> |

**Returns:** *Promise*<[*AnyEntity*](../modules/core.md#anyentity)<any\>[]\>

Defined in: [packages/core/src/entity/EntityLoader.ts:211](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityLoader.ts#L211)

___

### findChildrenFromPivotTable

▸ `Private`**findChildrenFromPivotTable**<T\>(`filtered`: T[], `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>, `options`: *Required*<Options<T\>\>, `orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md), `populate?`: [*PopulateOptions*](../modules/core.md#populateoptions)<T\>): *Promise*<[*AnyEntity*](../modules/core.md#anyentity)<any\>[]\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`filtered` | T[] |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |
`options` | *Required*<Options<T\>\> |
`orderBy?` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |
`populate?` | [*PopulateOptions*](../modules/core.md#populateoptions)<T\> |

**Returns:** *Promise*<[*AnyEntity*](../modules/core.md#anyentity)<any\>[]\>

Defined in: [packages/core/src/entity/EntityLoader.ts:276](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityLoader.ts#L276)

___

### getChildReferences

▸ `Private`**getChildReferences**<T\>(`entities`: T[], `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>, `refresh`: *boolean*): [*AnyEntity*](../modules/core.md#anyentity)<any\>[]

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entities` | T[] |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |
`refresh` | *boolean* |

**Returns:** [*AnyEntity*](../modules/core.md#anyentity)<any\>[]

Defined in: [packages/core/src/entity/EntityLoader.ts:327](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityLoader.ts#L327)

___

### initializeCollections

▸ `Private`**initializeCollections**<T\>(`filtered`: T[], `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `field`: keyof T, `children`: [*AnyEntity*](../modules/core.md#anyentity)<any\>[]): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`filtered` | T[] |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`field` | keyof T |
`children` | [*AnyEntity*](../modules/core.md#anyentity)<any\>[] |

**Returns:** *void*

Defined in: [packages/core/src/entity/EntityLoader.ts:180](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityLoader.ts#L180)

___

### initializeManyToMany

▸ `Private`**initializeManyToMany**<T\>(`filtered`: T[], `children`: [*AnyEntity*](../modules/core.md#anyentity)<any\>[], `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `field`: keyof T): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`filtered` | T[] |
`children` | [*AnyEntity*](../modules/core.md#anyentity)<any\>[] |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`field` | keyof T |

**Returns:** *void*

Defined in: [packages/core/src/entity/EntityLoader.ts:204](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityLoader.ts#L204)

___

### initializeOneToMany

▸ `Private`**initializeOneToMany**<T\>(`filtered`: T[], `children`: [*AnyEntity*](../modules/core.md#anyentity)<any\>[], `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `field`: keyof T): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`filtered` | T[] |
`children` | [*AnyEntity*](../modules/core.md#anyentity)<any\>[] |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`field` | keyof T |

**Returns:** *void*

Defined in: [packages/core/src/entity/EntityLoader.ts:190](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityLoader.ts#L190)

___

### lookupAllRelationships

▸ `Private`**lookupAllRelationships**<T\>(`entityName`: *string*, `prefix?`: *string*, `visited?`: *string*[]): [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[]

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`entityName` | *string* | - |
`prefix` | *string* | '' |
`visited` | *string*[] | - |

**Returns:** [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[]

Defined in: [packages/core/src/entity/EntityLoader.ts:362](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityLoader.ts#L362)

___

### lookupEagerLoadedRelationships

▸ `Private`**lookupEagerLoadedRelationships**<T\>(`entityName`: *string*, `populate`: [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[], `prefix?`: *string*, `visited?`: *string*[]): [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[]

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`entityName` | *string* | - |
`populate` | [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[] | - |
`prefix` | *string* | '' |
`visited` | *string*[] | - |

**Returns:** [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[]

Defined in: [packages/core/src/entity/EntityLoader.ts:388](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityLoader.ts#L388)

___

### mergeNestedPopulate

▸ `Private`**mergeNestedPopulate**<T\>(`populate`: [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[]): [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[]

merge multiple populates for the same entity with different children

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`populate` | [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[] |

**Returns:** [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[]

Defined in: [packages/core/src/entity/EntityLoader.ts:89](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityLoader.ts#L89)

___

### normalizePopulate

▸ **normalizePopulate**<T\>(`entityName`: *string*, `populate`: *true* \| [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[], `lookup?`: *boolean*): [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[]

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`entityName` | *string* | - |
`populate` | *true* \| [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[] | - |
`lookup` | *boolean* | true |

**Returns:** [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[]

Defined in: [packages/core/src/entity/EntityLoader.ts:58](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityLoader.ts#L58)

___

### populate

▸ **populate**<T\>(`entityName`: *string*, `entities`: T[], `populate`: *boolean* \| [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[], `options`: *Options*<T\>): *Promise*<void\>

Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`entities` | T[] |
`populate` | *boolean* \| [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[] |
`options` | *Options*<T\> |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/entity/EntityLoader.ts:32](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityLoader.ts#L32)

___

### populateField

▸ `Private`**populateField**<T\>(`entityName`: *string*, `entities`: T[], `populate`: [*PopulateOptions*](../modules/core.md#populateoptions)<T\>, `options`: *Required*<Options<T\>\>): *Promise*<void\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`entities` | T[] |
`populate` | [*PopulateOptions*](../modules/core.md#populateoptions)<T\> |
`options` | *Required*<Options<T\>\> |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/entity/EntityLoader.ts:244](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityLoader.ts#L244)

___

### populateMany

▸ `Private`**populateMany**<T\>(`entityName`: *string*, `entities`: T[], `populate`: [*PopulateOptions*](../modules/core.md#populateoptions)<T\>, `options`: *Required*<Options<T\>\>): *Promise*<[*AnyEntity*](../modules/core.md#anyentity)<any\>[]\>

preload everything in one call (this will update already existing references in IM)

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`entities` | T[] |
`populate` | [*PopulateOptions*](../modules/core.md#populateoptions)<T\> |
`options` | *Required*<Options<T\>\> |

**Returns:** *Promise*<[*AnyEntity*](../modules/core.md#anyentity)<any\>[]\>

Defined in: [packages/core/src/entity/EntityLoader.ts:133](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityLoader.ts#L133)
