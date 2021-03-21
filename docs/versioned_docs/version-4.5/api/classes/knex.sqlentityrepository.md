---
id: "knex.sqlentityrepository"
title: "Class: SqlEntityRepository<T>"
sidebar_label: "SqlEntityRepository"
custom_edit_url: null
hide_title: true
---

# Class: SqlEntityRepository<T\>

[knex](../modules/knex.md).SqlEntityRepository

## Type parameters

Name |
:------ |
`T` |

## Hierarchy

* [*EntityRepository*](core.entityrepository.md)<T\>

  ↳ **SqlEntityRepository**

## Constructors

### constructor

\+ **new SqlEntityRepository**<T\>(`_em`: [*EntityManager*](knex.entitymanager.md)<[*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>\>, `entityName`: [*EntityName*](../modules/core.md#entityname)<T\>): [*EntityRepository*](knex.entityrepository.md)<T\>

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`_em` | [*EntityManager*](knex.entitymanager.md)<[*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>\> |
`entityName` | [*EntityName*](../modules/core.md#entityname)<T\> |

**Returns:** [*EntityRepository*](knex.entityrepository.md)<T\>

Overrides: [EntityRepository](core.entityrepository.md)

Defined in: [packages/knex/src/SqlEntityRepository.ts:6](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/SqlEntityRepository.ts#L6)

## Properties

### \_em

• `Protected` `Readonly` **\_em**: [*EntityManager*](knex.entitymanager.md)<[*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>\>

Inherited from: [EntityRepository](core.entityrepository.md).[_em](core.entityrepository.md#_em)

___

### entityName

• `Protected` `Readonly` **entityName**: [*EntityName*](../modules/core.md#entityname)<T\>

Inherited from: [EntityRepository](core.entityrepository.md).[entityName](core.entityrepository.md#entityname)

## Accessors

### em

• `Protected`get **em**(): [*EntityManager*](knex.entitymanager.md)<[*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>\>

**Returns:** [*EntityManager*](knex.entitymanager.md)<[*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>\>

Defined in: [packages/knex/src/SqlEntityRepository.ts:27](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/SqlEntityRepository.ts#L27)

## Methods

### assign

▸ **assign**(`entity`: T, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>): T

Shortcut for `wrap(entity).assign(data, { em })`

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |

**Returns:** T

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:259](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L259)

___

### canPopulate

▸ **canPopulate**(`property`: *string*): *boolean*

Checks whether given property can be populated on the entity.

#### Parameters:

Name | Type |
:------ | :------ |
`property` | *string* |

**Returns:** *boolean*

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:223](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L223)

___

### count

▸ **count**(`where?`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `options?`: [*CountOptions*](../interfaces/core.countoptions.md)<T\>): *Promise*<number\>

Returns total number of entities matching your `where` query.

#### Parameters:

Name | Type |
:------ | :------ |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`options` | [*CountOptions*](../interfaces/core.countoptions.md)<T\> |

**Returns:** *Promise*<number\>

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:274](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L274)

___

### create

▸ **create**<P\>(`data`: [*EntityData*](../modules/core.md#entitydata)<T\>): [*Loaded*](../modules/core.md#loaded)<T, P\>

Creates new instance of given entity and populates it with given data

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`P` | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> | *string*[] |

#### Parameters:

Name | Type |
:------ | :------ |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |

**Returns:** [*Loaded*](../modules/core.md#loaded)<T, P\>

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:252](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L252)

___

### createQueryBuilder

▸ **createQueryBuilder**(`alias?`: *string*): [*QueryBuilder*](knex.querybuilder.md)<T\>

Creates a QueryBuilder instance

#### Parameters:

Name | Type |
:------ | :------ |
`alias?` | *string* |

**Returns:** [*QueryBuilder*](knex.querybuilder.md)<T\>

Defined in: [packages/knex/src/SqlEntityRepository.ts:16](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/SqlEntityRepository.ts#L16)

___

### find

▸ **find**<P\>(`where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `options?`: [*FindOptions*](../interfaces/core.findoptions.md)<T, P\>): *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>[]\>

Finds all entities matching your `where` query. You can pass additional options via the `options` parameter.

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`P` | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`options?` | [*FindOptions*](../interfaces/core.findoptions.md)<T, P\> |

**Returns:** *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>[]\>

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:81](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L81)

▸ **find**<P\>(`where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `populate?`: P, `orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md), `limit?`: *number*, `offset?`: *number*): *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>[]\>

Finds all entities matching your `where` query.

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`P` | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`populate?` | P |
`orderBy?` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |
`limit?` | *number* |
`offset?` | *number* |

**Returns:** *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>[]\>

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:86](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L86)

___

### findAll

▸ **findAll**<P\>(`options?`: [*FindOptions*](../interfaces/core.findoptions.md)<T, P\>): *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>[]\>

Finds all entities of given type. You can pass additional options via the `options` parameter.

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`P` | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`options?` | [*FindOptions*](../interfaces/core.findoptions.md)<T, P\> |

**Returns:** *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>[]\>

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:118](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L118)

▸ **findAll**<P\>(`populate?`: P, `orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md), `limit?`: *number*, `offset?`: *number*): *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>[]\>

Finds all entities of given type.

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`P` | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`populate?` | P |
`orderBy?` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |
`limit?` | *number* |
`offset?` | *number* |

**Returns:** *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>[]\>

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:123](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L123)

___

### findAndCount

▸ **findAndCount**<P\>(`where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `options?`: [*FindOptions*](../interfaces/core.findoptions.md)<T, readonly *string*[] \| readonly keyof T[] \| boolean \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| PopulateChildren<T\>\>): *Promise*<[[*Loaded*](../modules/core.md#loaded)<T, P\>[], *number*]\>

Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
where first element is the array of entities and the second is the count.

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`P` | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`options?` | [*FindOptions*](../interfaces/core.findoptions.md)<T, readonly *string*[] \| readonly keyof T[] \| boolean \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| PopulateChildren<T\>\> |

**Returns:** *Promise*<[[*Loaded*](../modules/core.md#loaded)<T, P\>[], *number*]\>

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:99](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L99)

▸ **findAndCount**<P\>(`where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `populate?`: P, `orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md), `limit?`: *number*, `offset?`: *number*): *Promise*<[[*Loaded*](../modules/core.md#loaded)<T, P\>[], *number*]\>

Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
where first element is the array of entities and the second is the count.

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`P` | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`populate?` | P |
`orderBy?` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |
`limit?` | *number* |
`offset?` | *number* |

**Returns:** *Promise*<[[*Loaded*](../modules/core.md#loaded)<T, P\>[], *number*]\>

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:105](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L105)

___

### findOne

▸ **findOne**<P\>(`where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `populate?`: P, `orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md)): *Promise*<*null* \| [*Loaded*](../modules/core.md#loaded)<T, P\>\>

Finds first entity matching your `where` query.

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`P` | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`populate?` | P |
`orderBy?` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |

**Returns:** *Promise*<*null* \| [*Loaded*](../modules/core.md#loaded)<T, P\>\>

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:41](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L41)

▸ **findOne**<P\>(`where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `populate?`: [*FindOneOptions*](../interfaces/core.findoneoptions.md)<T, P\>, `orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md)): *Promise*<*null* \| [*Loaded*](../modules/core.md#loaded)<T, P\>\>

Finds first entity matching your `where` query.

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`P` | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`populate?` | [*FindOneOptions*](../interfaces/core.findoneoptions.md)<T, P\> |
`orderBy?` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |

**Returns:** *Promise*<*null* \| [*Loaded*](../modules/core.md#loaded)<T, P\>\>

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:46](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L46)

___

### findOneOrFail

▸ **findOneOrFail**<P\>(`where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `populate?`: P, `orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md)): *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>\>

Finds first entity matching your `where` query. If nothing found, it will throw an error.
You can override the factory for creating this method via `options.failHandler` locally
or via `Configuration.findOneOrFailHandler` globally.

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`P` | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`populate?` | P |
`orderBy?` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |

**Returns:** *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>\>

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:60](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L60)

▸ **findOneOrFail**<P\>(`where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `populate?`: [*FindOneOrFailOptions*](../interfaces/core.findoneorfailoptions.md)<T, P\>, `orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md)): *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>\>

Finds first entity matching your `where` query. If nothing found, it will throw an error.
You can override the factory for creating this method via `options.failHandler` locally
or via `Configuration.findOneOrFailHandler` globally.

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`P` | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`populate?` | [*FindOneOrFailOptions*](../interfaces/core.findoneorfailoptions.md)<T, P\> |
`orderBy?` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |

**Returns:** *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>\>

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:67](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L67)

___

### flush

▸ **flush**(): *Promise*<void\>

Flushes all changes to objects that have been queued up to now to the database.
This effectively synchronizes the in-memory state of managed objects with the database.
This method is a shortcut for `em.flush()`, in other words, it will flush the whole UoW,
not just entities registered via this particular repository.

**Returns:** *Promise*<void\>

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:166](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L166)

___

### getKnex

▸ **getKnex**(`type?`: *read* \| *write*): *Knex*<any, unknown[]\>

Returns configured knex instance.

#### Parameters:

Name | Type |
:------ | :------ |
`type?` | *read* \| *write* |

**Returns:** *Knex*<any, unknown[]\>

Defined in: [packages/knex/src/SqlEntityRepository.ts:23](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/SqlEntityRepository.ts#L23)

___

### getReference

▸ **getReference**<PK\>(`id`: [*Primary*](../modules/core.md#primary)<T\>, `wrapped`: *true*): [*IdentifiedReference*](../modules/core.md#identifiedreference)<T, PK\>

Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded

#### Type parameters:

Name | Type |
:------ | :------ |
`PK` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
:------ | :------ |
`id` | [*Primary*](../modules/core.md#primary)<T\> |
`wrapped` | *true* |

**Returns:** [*IdentifiedReference*](../modules/core.md#identifiedreference)<T, PK\>

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:201](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L201)

▸ **getReference**<PK\>(`id`: [*Primary*](../modules/core.md#primary)<T\>): T

Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`PK` | *string* \| *number* \| *symbol* | keyof T |

#### Parameters:

Name | Type |
:------ | :------ |
`id` | [*Primary*](../modules/core.md#primary)<T\> |

**Returns:** T

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:206](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L206)

▸ **getReference**<PK\>(`id`: [*Primary*](../modules/core.md#primary)<T\>, `wrapped`: *false*): T

Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`PK` | *string* \| *number* \| *symbol* | keyof T |

#### Parameters:

Name | Type |
:------ | :------ |
`id` | [*Primary*](../modules/core.md#primary)<T\> |
`wrapped` | *false* |

**Returns:** T

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:211](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L211)

___

### map

▸ **map**(`result`: [*EntityData*](../modules/core.md#entitydata)<T\>): T

Maps raw database result to an entity and merges it to this EntityManager.

#### Parameters:

Name | Type |
:------ | :------ |
`result` | [*EntityData*](../modules/core.md#entitydata)<T\> |

**Returns:** T

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:194](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L194)

___

### merge

▸ **merge**(`data`: T \| [*EntityData*](../modules/core.md#entitydata)<T\>, `refresh?`: *boolean*, `convertCustomTypes?`: *boolean*): T

Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
via second parameter. By default it will return already loaded entities without modifying them.

#### Parameters:

Name | Type |
:------ | :------ |
`data` | T \| [*EntityData*](../modules/core.md#entitydata)<T\> |
`refresh?` | *boolean* |
`convertCustomTypes?` | *boolean* |

**Returns:** T

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:267](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L267)

___

### nativeDelete

▸ **nativeDelete**(`where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `options?`: [*DeleteOptions*](../interfaces/core.deleteoptions.md)<T\>): *Promise*<number\>

Fires native delete query. Calling this has no side effects on the context (identity map).

#### Parameters:

Name | Type |
:------ | :------ |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`options?` | [*DeleteOptions*](../interfaces/core.deleteoptions.md)<T\> |

**Returns:** *Promise*<number\>

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:187](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L187)

___

### nativeInsert

▸ **nativeInsert**(`data`: [*EntityData*](../modules/core.md#entitydata)<T\>): *Promise*<[*Primary*](../modules/core.md#primary)<T\>\>

Fires native insert query. Calling this has no side effects on the context (identity map).

#### Parameters:

Name | Type |
:------ | :------ |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |

**Returns:** *Promise*<[*Primary*](../modules/core.md#primary)<T\>\>

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:173](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L173)

___

### nativeUpdate

▸ **nativeUpdate**(`where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `options?`: [*UpdateOptions*](../interfaces/core.updateoptions.md)<T\>): *Promise*<number\>

Fires native update query. Calling this has no side effects on the context (identity map).

#### Parameters:

Name | Type |
:------ | :------ |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`options?` | [*UpdateOptions*](../interfaces/core.updateoptions.md)<T\> |

**Returns:** *Promise*<number\>

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:180](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L180)

___

### persist

▸ **persist**(`entity`: [*AnyEntity*](../modules/core.md#anyentity)<any\> \| [*AnyEntity*](../modules/core.md#anyentity)<any\>[]): [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

Tells the EntityManager to make an instance managed and persistent.
The entity will be entered into the database at or before transaction commit or as a result of the flush operation.

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | [*AnyEntity*](../modules/core.md#anyentity)<any\> \| [*AnyEntity*](../modules/core.md#anyentity)<any\>[] |

**Returns:** [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:16](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L16)

___

### persistAndFlush

▸ **persistAndFlush**(`entity`: [*AnyEntity*](../modules/core.md#anyentity)<any\> \| [*AnyEntity*](../modules/core.md#anyentity)<any\>[]): *Promise*<void\>

Persists your entity immediately, flushing all not yet persisted changes to the database too.
Equivalent to `em.persist(e).flush()`.

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | [*AnyEntity*](../modules/core.md#anyentity)<any\> \| [*AnyEntity*](../modules/core.md#anyentity)<any\>[] |

**Returns:** *Promise*<void\>

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:24](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L24)

___

### persistLater

▸ **persistLater**(`entity`: [*AnyEntity*](../modules/core.md#anyentity)<any\> \| [*AnyEntity*](../modules/core.md#anyentity)<any\>[]): *void*

Tells the EntityManager to make an instance managed and persistent.
The entity will be entered into the database at or before transaction commit or as a result of the flush operation.

**`deprecated`** use `persist()`

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | [*AnyEntity*](../modules/core.md#anyentity)<any\> \| [*AnyEntity*](../modules/core.md#anyentity)<any\>[] |

**Returns:** *void*

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:34](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L34)

___

### populate

▸ **populate**<P\>(`entities`: T, `populate`: P, `where?`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md), `refresh?`: *boolean*, `validate?`: *boolean*): *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>\>

Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.

#### Type parameters:

Name | Type |
:------ | :------ |
`P` | *string* \| *number* \| *boolean* \| *symbol* \| readonly *string*[] \| readonly keyof T[] \| *PopulateChildren*<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entities` | T |
`populate` | P |
`where?` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`orderBy?` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |
`refresh?` | *boolean* |
`validate?` | *boolean* |

**Returns:** *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>\>

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:230](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L230)

▸ **populate**<P\>(`entities`: T[], `populate`: P, `where?`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md), `refresh?`: *boolean*, `validate?`: *boolean*): *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>[]\>

Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.

#### Type parameters:

Name | Type |
:------ | :------ |
`P` | *string* \| *number* \| *boolean* \| *symbol* \| readonly *string*[] \| readonly keyof T[] \| *PopulateChildren*<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entities` | T[] |
`populate` | P |
`where?` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`orderBy?` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |
`refresh?` | *boolean* |
`validate?` | *boolean* |

**Returns:** *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>[]\>

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:235](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L235)

▸ **populate**<P\>(`entities`: T \| T[], `populate`: P, `where?`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md), `refresh?`: *boolean*, `validate?`: *boolean*): *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\> \| [*Loaded*](../modules/core.md#loaded)<T, P\>[]\>

Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.

#### Type parameters:

Name | Type |
:------ | :------ |
`P` | *string* \| *number* \| *boolean* \| *symbol* \| readonly *string*[] \| readonly keyof T[] \| *PopulateChildren*<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entities` | T \| T[] |
`populate` | P |
`where?` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`orderBy?` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |
`refresh?` | *boolean* |
`validate?` | *boolean* |

**Returns:** *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\> \| [*Loaded*](../modules/core.md#loaded)<T, P\>[]\>

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:240](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L240)

___

### remove

▸ **remove**(`entity`: [*AnyEntity*](../modules/core.md#anyentity)<any\>): [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

Marks entity for removal.
A removed entity will be removed from the database at or before transaction commit or as a result of the flush operation.

To remove entities by condition, use `em.nativeDelete()`.

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | [*AnyEntity*](../modules/core.md#anyentity)<any\> |

**Returns:** [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:138](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L138)

___

### removeAndFlush

▸ **removeAndFlush**(`entity`: [*AnyEntity*](../modules/core.md#anyentity)<any\>): *Promise*<void\>

Removes an entity instance immediately, flushing all not yet persisted changes to the database too.
Equivalent to `em.remove(e).flush()`

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | [*AnyEntity*](../modules/core.md#anyentity)<any\> |

**Returns:** *Promise*<void\>

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:146](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L146)

___

### removeLater

▸ **removeLater**(`entity`: [*AnyEntity*](../modules/core.md#anyentity)<any\>): *void*

Marks entity for removal.
A removed entity will be removed from the database at or before transaction commit or as a result of the flush operation.

**`deprecated`** use `remove()`

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | [*AnyEntity*](../modules/core.md#anyentity)<any\> |

**Returns:** *void*

Inherited from: [EntityRepository](core.entityrepository.md)

Defined in: [packages/core/src/entity/EntityRepository.ts:156](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityRepository.ts#L156)
