---
id: "core"
title: "Module: core"
sidebar_label: "core"
custom_edit_url: null
hide_title: true
---

# Module: core

## Table of contents

### Enumerations

- [Cascade](../enums/core.cascade.md)
- [ChangeSetType](../enums/core.changesettype.md)
- [EventType](../enums/core.eventtype.md)
- [GroupOperator](../enums/core.groupoperator.md)
- [LoadStrategy](../enums/core.loadstrategy.md)
- [LockMode](../enums/core.lockmode.md)
- [NodeState](../enums/core.nodestate.md)
- [QueryFlag](../enums/core.queryflag.md)
- [QueryOperator](../enums/core.queryoperator.md)
- [QueryOrder](../enums/core.queryorder.md)
- [QueryOrderNumeric](../enums/core.queryordernumeric.md)
- [ReferenceType](../enums/core.referencetype.md)

### Classes

- [AbstractNamingStrategy](../classes/core.abstractnamingstrategy.md)
- [ArrayCollection](../classes/core.arraycollection.md)
- [ArrayType](../classes/core.arraytype.md)
- [BaseEntity](../classes/core.baseentity.md)
- [BigIntType](../classes/core.biginttype.md)
- [BlobType](../classes/core.blobtype.md)
- [ChangeSet](../classes/core.changeset.md)
- [ChangeSetComputer](../classes/core.changesetcomputer.md)
- [ChangeSetPersister](../classes/core.changesetpersister.md)
- [Collection](../classes/core.collection.md)
- [CommitOrderCalculator](../classes/core.commitordercalculator.md)
- [Configuration](../classes/core.configuration.md)
- [ConfigurationLoader](../classes/core.configurationloader.md)
- [Connection](../classes/core.connection.md)
- [ConnectionException](../classes/core.connectionexception.md)
- [ConstraintViolationException](../classes/core.constraintviolationexception.md)
- [DatabaseDriver](../classes/core.databasedriver.md)
- [DatabaseObjectExistsException](../classes/core.databaseobjectexistsexception.md)
- [DatabaseObjectNotFoundException](../classes/core.databaseobjectnotfoundexception.md)
- [DateType](../classes/core.datetype.md)
- [DeadlockException](../classes/core.deadlockexception.md)
- [DriverException](../classes/core.driverexception.md)
- [EntityAssigner](../classes/core.entityassigner.md)
- [EntityCaseNamingStrategy](../classes/core.entitycasenamingstrategy.md)
- [EntityComparator](../classes/core.entitycomparator.md)
- [EntityFactory](../classes/core.entityfactory.md)
- [EntityHelper](../classes/core.entityhelper.md)
- [EntityIdentifier](../classes/core.entityidentifier.md)
- [EntityLoader](../classes/core.entityloader.md)
- [EntityManager](../classes/core.entitymanager.md)
- [EntityMetadata](../classes/core.entitymetadata.md)
- [EntityRepository](../classes/core.entityrepository.md)
- [EntitySchema](../classes/core.entityschema.md)
- [EntityTransformer](../classes/core.entitytransformer.md)
- [EntityValidator](../classes/core.entityvalidator.md)
- [EnumArrayType](../classes/core.enumarraytype.md)
- [EventManager](../classes/core.eventmanager.md)
- [ExceptionConverter](../classes/core.exceptionconverter.md)
- [FileCacheAdapter](../classes/core.filecacheadapter.md)
- [ForeignKeyConstraintViolationException](../classes/core.foreignkeyconstraintviolationexception.md)
- [Hydrator](../classes/core.hydrator.md)
- [IdentityMap](../classes/core.identitymap.md)
- [InvalidFieldNameException](../classes/core.invalidfieldnameexception.md)
- [JavaScriptMetadataProvider](../classes/core.javascriptmetadataprovider.md)
- [JsonType](../classes/core.jsontype.md)
- [LockWaitTimeoutException](../classes/core.lockwaittimeoutexception.md)
- [Logger](../classes/core.logger.md)
- [MemoryCacheAdapter](../classes/core.memorycacheadapter.md)
- [MetadataDiscovery](../classes/core.metadatadiscovery.md)
- [MetadataError](../classes/core.metadataerror.md)
- [MetadataProvider](../classes/core.metadataprovider.md)
- [MetadataStorage](../classes/core.metadatastorage.md)
- [MetadataValidator](../classes/core.metadatavalidator.md)
- [MikroORM](../classes/core.mikroorm.md)
- [MongoNamingStrategy](../classes/core.mongonamingstrategy.md)
- [NonUniqueFieldNameException](../classes/core.nonuniquefieldnameexception.md)
- [NotFoundError](../classes/core.notfounderror.md)
- [NotNullConstraintViolationException](../classes/core.notnullconstraintviolationexception.md)
- [NullCacheAdapter](../classes/core.nullcacheadapter.md)
- [NullHighlighter](../classes/core.nullhighlighter.md)
- [ObjectHydrator](../classes/core.objecthydrator.md)
- [OptimisticLockError](../classes/core.optimisticlockerror.md)
- [Platform](../classes/core.platform.md)
- [QueryHelper](../classes/core.queryhelper.md)
- [ReadOnlyException](../classes/core.readonlyexception.md)
- [Reference](../classes/core.reference.md)
- [ReflectMetadataProvider](../classes/core.reflectmetadataprovider.md)
- [RequestContext](../classes/core.requestcontext.md)
- [SerializationContext](../classes/core.serializationcontext.md)
- [ServerException](../classes/core.serverexception.md)
- [SyntaxErrorException](../classes/core.syntaxerrorexception.md)
- [TableExistsException](../classes/core.tableexistsexception.md)
- [TableNotFoundException](../classes/core.tablenotfoundexception.md)
- [TimeType](../classes/core.timetype.md)
- [TransactionContext](../classes/core.transactioncontext.md)
- [TransactionEventBroadcaster](../classes/core.transactioneventbroadcaster.md)
- [Type](../classes/core.type.md)
- [UnderscoreNamingStrategy](../classes/core.underscorenamingstrategy.md)
- [UniqueConstraintViolationException](../classes/core.uniqueconstraintviolationexception.md)
- [UnitOfWork](../classes/core.unitofwork.md)
- [Utils](../classes/core.utils.md)
- [ValidationError](../classes/core.validationerror.md)
- [WrappedEntity](../classes/core.wrappedentity.md)

### Interfaces

- [AssignOptions](../interfaces/core.assignoptions.md)
- [CacheAdapter](../interfaces/core.cacheadapter.md)
- [ConnectionConfig](../interfaces/core.connectionconfig.md)
- [ConnectionOptions](../interfaces/core.connectionoptions.md)
- [CountOptions](../interfaces/core.countoptions.md)
- [DeleteOptions](../interfaces/core.deleteoptions.md)
- [Edge](../interfaces/core.edge.md)
- [EntityProperty](../interfaces/core.entityproperty.md)
- [EnumOptions](../interfaces/core.enumoptions.md)
- [EventArgs](../interfaces/core.eventargs.md)
- [EventSubscriber](../interfaces/core.eventsubscriber.md)
- [FactoryOptions](../interfaces/core.factoryoptions.md)
- [FindOneOptions](../interfaces/core.findoneoptions.md)
- [FindOneOrFailOptions](../interfaces/core.findoneorfailoptions.md)
- [FindOptions](../interfaces/core.findoptions.md)
- [FlatQueryOrderMap](../interfaces/core.flatqueryordermap.md)
- [FlushEventArgs](../interfaces/core.flusheventargs.md)
- [FormulaOptions](../interfaces/core.formulaoptions.md)
- [Highlighter](../interfaces/core.highlighter.md)
- [IConfiguration](../interfaces/core.iconfiguration.md)
- [IDatabaseDriver](../interfaces/core.idatabasedriver.md)
- [IWrappedEntity](../interfaces/core.iwrappedentity.md)
- [IndexOptions](../interfaces/core.indexoptions.md)
- [InitOptions](../interfaces/core.initoptions.md)
- [LoadedCollection](../interfaces/core.loadedcollection.md)
- [LoadedReference](../interfaces/core.loadedreference.md)
- [ManyToManyOptions](../interfaces/core.manytomanyoptions.md)
- [ManyToOneOptions](../interfaces/core.manytooneoptions.md)
- [MatchingOptions](../interfaces/core.matchingoptions.md)
- [MigrationObject](../interfaces/core.migrationobject.md)
- [MikroORMOptions](../interfaces/core.mikroormoptions.md)
- [NamingStrategy](../interfaces/core.namingstrategy.md)
- [Node](../interfaces/core.node.md)
- [OneToOneOptions](../interfaces/core.onetooneoptions.md)
- [PoolConfig](../interfaces/core.poolconfig.md)
- [PrimaryKeyOptions](../interfaces/core.primarykeyoptions.md)
- [QueryOrderMap](../interfaces/core.queryordermap.md)
- [QueryResult](../interfaces/core.queryresult.md)
- [ReferenceOptions](../interfaces/core.referenceoptions.md)
- [SerializedPrimaryKeyOptions](../interfaces/core.serializedprimarykeyoptions.md)
- [Settings](../interfaces/core.settings.md)
- [TransactionEventArgs](../interfaces/core.transactioneventargs.md)
- [UniqueOptions](../interfaces/core.uniqueoptions.md)
- [UpdateOptions](../interfaces/core.updateoptions.md)

## Type aliases

### AnyEntity

Ƭ **AnyEntity**<T\>: *Partial*<T\> & { `[EntityRepositoryType]?`: *unknown* ; `[PrimaryKeyType]?`: *unknown* ; `__helper?`: *IWrappedEntityInternal*<T, keyof T\> ; `__meta?`: [*EntityMetadata*](../classes/core.entitymetadata.md)<T\> ; `__platform?`: [*Platform*](../classes/core.platform.md)  }

#### Type parameters:

Name | Default |
:------ | :------ |
`T` | *any* |

Defined in: [packages/core/src/typings.ts:110](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L110)

___

### Cast

Ƭ **Cast**<T, R\>: T *extends* R ? T : R

#### Type parameters:

Name |
:------ |
`T` |
`R` |

Defined in: [packages/core/src/typings.ts:12](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L12)

___

### Constructor

Ƭ **Constructor**<T\>: (...`args`: *any*[]) => T

#### Type parameters:

Name |
:------ |
`T` |

#### Type declaration:

\+ (...`args`: *any*[]): T

#### Parameters:

Name | Type |
:------ | :------ |
`...args` | *any*[] |

**Returns:** T

Defined in: [packages/core/src/typings.ts:8](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L8)

___

### DeepPartial

Ƭ **DeepPartial**<T\>: T & { [P in keyof T]?: T[P] extends infer U[] ? DeepPartial<U\>[] : T[P] extends Readonly<infer U\>[] ? Readonly<DeepPartial<U\>\>[] : DeepPartial<T[P]\>}

#### Type parameters:

Name |
:------ |
`T` |

Defined in: [packages/core/src/typings.ts:15](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L15)

___

### Dictionary

Ƭ **Dictionary**<T\>: *object*

#### Type parameters:

Name | Default |
:------ | :------ |
`T` | *any* |

#### Type declaration:

Defined in: [packages/core/src/typings.ts:9](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L9)

___

### EmbeddedOptions

Ƭ **EmbeddedOptions**: *object*

#### Type declaration:

Name | Type |
:------ | :------ |
`array`? | *boolean* |
`entity`? | *string* \| () => [*AnyEntity*](core.md#anyentity) |
`nullable`? | *boolean* |
`object`? | *boolean* |
`prefix`? | *string* \| *boolean* |
`type`? | *string* |

Defined in: [packages/core/src/decorators/Embedded.ts:19](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Embedded.ts#L19)

___

### EntityData

Ƭ **EntityData**<T\>: { [P in keyof T]?: T[P] \| any} & [*Dictionary*](core.md#dictionary)

#### Type parameters:

Name |
:------ |
`T` |

Defined in: [packages/core/src/typings.ts:122](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L122)

___

### EntityName

Ƭ **EntityName**<T\>: *string* \| *EntityClass*<T\> \| [*EntitySchema*](../classes/core.entityschema.md)<T, any\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](core.md#anyentity)<T\> |

Defined in: [packages/core/src/typings.ts:121](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L121)

___

### EntityOptions

Ƭ **EntityOptions**<T\>: *object*

#### Type parameters:

Name |
:------ |
`T` |

#### Type declaration:

Name | Type |
:------ | :------ |
`abstract`? | *boolean* |
`collection`? | *string* |
`comment`? | *string* |
`customRepository`? | () => [*Constructor*](core.md#constructor)<[*EntityRepository*](../classes/core.entityrepository.md)<T\>\> |
`discriminatorColumn`? | *string* |
`discriminatorMap`? | [*Dictionary*](core.md#dictionary)<string\> |
`discriminatorValue`? | *string* |
`readonly`? | *boolean* |
`tableName`? | *string* |

Defined in: [packages/core/src/decorators/Entity.ts:20](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Entity.ts#L20)

___

### FieldsMap

Ƭ **FieldsMap**: *object*

#### Type declaration:

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:80](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L80)

___

### FilterQuery

Ƭ **FilterQuery**<T\>: *NonNullable*<Query<T\>\> \| { `[PrimaryKeyType]?`: *any*  }

#### Type parameters:

Name |
:------ |
`T` |

Defined in: [packages/core/src/typings.ts:76](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L76)

___

### GetRepository

Ƭ **GetRepository**<T, U\>: T[*typeof* [*EntityRepositoryType*](core.md#entityrepositorytype)] *extends* [*EntityRepository*](../classes/core.entityrepository.md)<any\> \| *undefined* ? *NonNullable*<T[*typeof* [*EntityRepositoryType*](core.md#entityrepositorytype)]\> : U

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](core.md#anyentity)<T\> |
`U` | - |

Defined in: [packages/core/src/typings.ts:123](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L123)

___

### IPrimaryKey

Ƭ **IPrimaryKey**<T\>: T

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | IPrimaryKeyValue | IPrimaryKeyValue |

Defined in: [packages/core/src/typings.ts:37](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L37)

___

### IdentifiedReference

Ƭ **IdentifiedReference**<T, PK\>: *true* *extends* [*IsUnknown*](core.md#isunknown)<PK\> ? [*Reference*](../classes/core.reference.md)<T\> : { [K in Cast<PK, keyof T\>]: T[K]} & [*Reference*](../classes/core.reference.md)<T\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](core.md#anyentity)<T\> | - |
`PK` | keyof T \| *unknown* | [*PrimaryProperty*](core.md#primaryproperty)<T\> |

Defined in: [packages/core/src/entity/Reference.ts:4](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/Reference.ts#L4)

___

### IsUnknown

Ƭ **IsUnknown**<T\>: T *extends* *unknown* ? *unknown* *extends* T ? *true* : *never* : *never*

#### Type parameters:

Name |
:------ |
`T` |

Defined in: [packages/core/src/typings.ts:13](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L13)

___

### Loaded

Ƭ **Loaded**<T, P\>: *unknown* *extends* P ? T : T & { [K in keyof RelationsIn<T\>]: P extends readonly infer U[] ? LoadedIfInKeyHint<T, K, U\> : P extends NestedLoadHint<T\> ? LoadedIfInNestedHint<T, K, P\> : LoadedIfInKeyHint<T, K, P\>}

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](core.md#anyentity)<T\> | - |
`P` | - | *unknown* |

Defined in: [packages/core/src/typings.ts:413](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L413)

___

### LoggerNamespace

Ƭ **LoggerNamespace**: *query* \| *query-params* \| *discovery* \| *info*

Defined in: [packages/core/src/utils/Logger.ts:34](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Logger.ts#L34)

___

### MigrationsOptions

Ƭ **MigrationsOptions**: *object*

#### Type declaration:

Name | Type |
:------ | :------ |
`allOrNothing`? | *boolean* |
`disableForeignKeys`? | *boolean* |
`dropTables`? | *boolean* |
`emit`? | *js* \| *ts* |
`fileName`? | (`timestamp`: *string*) => *string* |
`migrationsList`? | [*MigrationObject*](../interfaces/core.migrationobject.md)[] |
`path`? | *string* |
`pattern`? | RegExp |
`safe`? | *boolean* |
`tableName`? | *string* |
`transactional`? | *boolean* |

Defined in: [packages/core/src/utils/Configuration.ts:302](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L302)

___

### New

Ƭ **New**<T, P\>: [*Loaded*](core.md#loaded)<T, P\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](core.md#anyentity)<T\> | - |
`P` | - | *string*[] |

Defined in: [packages/core/src/typings.ts:421](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L421)

___

### ORMDomain

Ƭ **ORMDomain**: Domain & { `__mikro_orm_context?`: [*RequestContext*](../classes/core.requestcontext.md)  }

Defined in: [packages/core/src/utils/RequestContext.ts:5](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/RequestContext.ts#L5)

___

### OneToManyOptions

Ƭ **OneToManyOptions**<T, O\>: [*ReferenceOptions*](../interfaces/core.referenceoptions.md)<T, O\> & { `entity?`: *string* \| () => [*EntityName*](core.md#entityname)<T\> ; `inverseJoinColumn?`: *string* ; `inverseJoinColumns?`: *string*[] ; `joinColumn?`: *string* ; `joinColumns?`: *string*[] ; `mappedBy`: *string* & keyof T \| (`e`: T) => *any* ; `orderBy?`: { [field: string]: [*QueryOrder*](../enums/core.queryorder.md);  } ; `orphanRemoval?`: *boolean* ; `referenceColumnName?`: *string*  }

#### Type parameters:

Name |
:------ |
`T` |
`O` |

Defined in: [packages/core/src/decorators/OneToMany.ts:40](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/OneToMany.ts#L40)

___

### Options

Ƭ **Options**<D\>: *Pick*<[*MikroORMOptions*](../interfaces/core.mikroormoptions.md)<D\>, Exclude<keyof [*MikroORMOptions*](../interfaces/core.mikroormoptions.md)<D\>, keyof *typeof* [*DEFAULTS*](../classes/core.configuration.md#defaults)\>\> & *Partial*<[*MikroORMOptions*](../interfaces/core.mikroormoptions.md)<D\>\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`D` | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md) | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md) |

Defined in: [packages/core/src/utils/Configuration.ts:396](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Configuration.ts#L396)

___

### Populate

Ƭ **Populate**<T\>: readonly keyof T[] \| readonly *string*[] \| *boolean* \| *PopulateMap*<T\>

#### Type parameters:

Name |
:------ |
`T` |

Defined in: [packages/core/src/typings.ts:375](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L375)

___

### PopulateOptions

Ƭ **PopulateOptions**<T\>: *object*

#### Type parameters:

Name |
:------ |
`T` |

#### Type declaration:

Name | Type |
:------ | :------ |
`all`? | *boolean* |
`children`? | [*PopulateOptions*](core.md#populateoptions)<T[keyof T]\>[] |
`field` | *string* |
`strategy`? | [*LoadStrategy*](../enums/core.loadstrategy.md) |

Defined in: [packages/core/src/typings.ts:377](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L377)

___

### Primary

Ƭ **Primary**<T\>: T *extends* { `[PrimaryKeyType]`: *infer* PK  } ? PK : T *extends* { `_id`: *infer* PK  } ? PK \| *string* : T *extends* { `uuid`: *infer* PK  } ? PK : T *extends* { `id`: *infer* PK  } ? PK : *never*

#### Type parameters:

Name |
:------ |
`T` |

Defined in: [packages/core/src/typings.ts:26](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L26)

___

### PrimaryProperty

Ƭ **PrimaryProperty**<T\>: T *extends* { `[PrimaryKeyProp]?`: *infer* PK  } ? PK : T *extends* { `_id`: *any*  } ? *_id* \| *string* : T *extends* { `uuid`: *any*  } ? *uuid* : T *extends* { `id`: *any*  } ? *id* : *never*

#### Type parameters:

Name |
:------ |
`T` |

Defined in: [packages/core/src/typings.ts:31](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L31)

___

### PropertyOptions

Ƭ **PropertyOptions**<T\>: *object*

#### Type parameters:

Name |
:------ |
`T` |

#### Type declaration:

Name | Type |
:------ | :------ |
`columnType`? | *string* |
`comment`? | *string* |
`customType`? | [*Type*](../classes/core.type.md)<any\> |
`default`? | *string* \| *string*[] \| *number* \| *number*[] \| *boolean* \| *null* |
`defaultRaw`? | *string* |
`fieldName`? | *string* |
`fieldNames`? | *string*[] |
`formula`? | *string* \| (`alias`: *string*) => *string* |
`hidden`? | *boolean* |
`index`? | *boolean* \| *string* |
`lazy`? | *boolean* |
`length`? | *number* |
`name`? | *string* |
`nullable`? | *boolean* |
`onCreate`? | (`entity`: T) => *any* |
`onUpdate`? | (`entity`: T) => *any* |
`persist`? | *boolean* |
`primary`? | *boolean* |
`serializedName`? | *string* |
`serializedPrimaryKey`? | *boolean* |
`serializer`? | (`value`: *any*) => *any* |
`type`? | *string* \| *number* \| *boolean* \| *bigint* \| *ObjectId* \| *string* \| *unknown* \| *bigint* \| Date \| [*Constructor*](core.md#constructor)<[*Type*](../classes/core.type.md)<any\>\> \| [*Type*](../classes/core.type.md)<any\> |
`unique`? | *boolean* \| *string* |
`unsigned`? | *boolean* |
`version`? | *boolean* |

Defined in: [packages/core/src/decorators/Property.ts:37](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L37)

___

### QBFilterQuery

Ƭ **QBFilterQuery**<T\>: [*FilterQuery*](core.md#filterquery)<T\> & [*Dictionary*](core.md#dictionary) \| [*FilterQuery*](core.md#filterquery)<T\>

#### Type parameters:

Name | Default |
:------ | :------ |
`T` | *any* |

Defined in: [packages/core/src/typings.ts:77](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L77)

___

### QueryOrderKeys

Ƭ **QueryOrderKeys**: [*QueryOrderKeysFlat*](core.md#queryorderkeysflat) \| [*QueryOrderMap*](../interfaces/core.queryordermap.md)

Defined in: [packages/core/src/enums.ts:47](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/enums.ts#L47)

___

### QueryOrderKeysFlat

Ƭ **QueryOrderKeysFlat**: [*QueryOrder*](../enums/core.queryorder.md) \| [*QueryOrderNumeric*](../enums/core.queryordernumeric.md) \| keyof *typeof* [*QueryOrder*](../enums/core.queryorder.md)

Defined in: [packages/core/src/enums.ts:46](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/enums.ts#L46)

___

### TXDomain

Ƭ **TXDomain**: Domain & { `__mikro_orm_tx_context?`: [*TransactionContext*](../classes/core.transactioncontext.md)  }

Defined in: [packages/core/src/utils/TransactionContext.ts:5](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/TransactionContext.ts#L5)

___

### Transaction

Ƭ **Transaction**<T\>: T

#### Type parameters:

Name | Default |
:------ | :------ |
`T` | *any* |

Defined in: [packages/core/src/connections/Connection.ts:141](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/connections/Connection.ts#L141)

___

### TransactionEventType

Ƭ **TransactionEventType**: [*beforeTransactionStart*](../enums/core.eventtype.md#beforetransactionstart) \| [*afterTransactionStart*](../enums/core.eventtype.md#aftertransactionstart) \| [*beforeTransactionCommit*](../enums/core.eventtype.md#beforetransactioncommit) \| [*afterTransactionCommit*](../enums/core.eventtype.md#aftertransactioncommit) \| [*beforeTransactionRollback*](../enums/core.eventtype.md#beforetransactionrollback) \| [*afterTransactionRollback*](../enums/core.eventtype.md#aftertransactionrollback)

Defined in: [packages/core/src/enums.ts:115](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/enums.ts#L115)

## Variables

### ARRAY\_OPERATORS

• `Const` **ARRAY\_OPERATORS**: *string*[]

Defined in: [packages/core/src/enums.ts:24](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/enums.ts#L24)

___

### EntityManagerType

• `Const` **EntityManagerType**: *typeof* [*EntityManagerType*](core.md#entitymanagertype)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:10](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/drivers/IDatabaseDriver.ts#L10)

___

### EntityRepositoryType

• `Const` **EntityRepositoryType**: *typeof* [*EntityRepositoryType*](core.md#entityrepositorytype)

Defined in: [packages/core/src/typings.ts:23](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L23)

___

### ObjectBindingPattern

• `Const` **ObjectBindingPattern**: *typeof* [*ObjectBindingPattern*](core.md#objectbindingpattern)

Defined in: [packages/core/src/utils/Utils.ts:14](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Utils.ts#L14)

___

### PrimaryKeyProp

• `Const` **PrimaryKeyProp**: *typeof* [*PrimaryKeyProp*](core.md#primarykeyprop)

Defined in: [packages/core/src/typings.ts:25](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L25)

___

### PrimaryKeyType

• `Const` **PrimaryKeyType**: *typeof* [*PrimaryKeyType*](core.md#primarykeytype)

Defined in: [packages/core/src/typings.ts:24](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/typings.ts#L24)

___

### SCALAR\_TYPES

• `Const` **SCALAR\_TYPES**: *string*[]

Defined in: [packages/core/src/enums.ts:66](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/enums.ts#L66)

## Functions

### AfterCreate

▸ **AfterCreate**(): *function*

**Returns:** (`target`: *any*, `method`: *string*) => *void*

Defined in: [packages/core/src/decorators/hooks.ts:20](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/hooks.ts#L20)

___

### AfterDelete

▸ **AfterDelete**(): *function*

Called after deleting entity, but only when providing initialized entity to EM#remove()

**Returns:** (`target`: *any*, `method`: *string*) => *void*

Defined in: [packages/core/src/decorators/hooks.ts:46](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/hooks.ts#L46)

___

### AfterUpdate

▸ **AfterUpdate**(): *function*

**Returns:** (`target`: *any*, `method`: *string*) => *void*

Defined in: [packages/core/src/decorators/hooks.ts:28](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/hooks.ts#L28)

___

### BeforeCreate

▸ **BeforeCreate**(): *function*

**Returns:** (`target`: *any*, `method`: *string*) => *void*

Defined in: [packages/core/src/decorators/hooks.ts:16](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/hooks.ts#L16)

___

### BeforeDelete

▸ **BeforeDelete**(): *function*

Called before deleting entity, but only when providing initialized entity to EM#remove()

**Returns:** (`target`: *any*, `method`: *string*) => *void*

Defined in: [packages/core/src/decorators/hooks.ts:39](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/hooks.ts#L39)

___

### BeforeUpdate

▸ **BeforeUpdate**(): *function*

**Returns:** (`target`: *any*, `method`: *string*) => *void*

Defined in: [packages/core/src/decorators/hooks.ts:24](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/hooks.ts#L24)

___

### Embeddable

▸ **Embeddable**(): *function*

**Returns:** <T\>(`target`: T & [*Dictionary*](core.md#dictionary)<any\>) => T & [*Dictionary*](core.md#dictionary)<any\>

Defined in: [packages/core/src/decorators/Embeddable.ts:4](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Embeddable.ts#L4)

___

### Embedded

▸ **Embedded**(`type?`: [*EmbeddedOptions*](core.md#embeddedoptions) \| () => [*AnyEntity*](core.md#anyentity), `options?`: [*EmbeddedOptions*](core.md#embeddedoptions)): *function*

#### Parameters:

Name | Type |
:------ | :------ |
`type` | [*EmbeddedOptions*](core.md#embeddedoptions) \| () => [*AnyEntity*](core.md#anyentity) |
`options` | [*EmbeddedOptions*](core.md#embeddedoptions) |

**Returns:** (`target`: [*AnyEntity*](core.md#anyentity)<any\>, `propertyName`: *string*) => *any*

Defined in: [packages/core/src/decorators/Embedded.ts:6](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Embedded.ts#L6)

___

### Entity

▸ **Entity**(`options?`: [*EntityOptions*](core.md#entityoptions)<any\>): *function*

#### Parameters:

Name | Type |
:------ | :------ |
`options` | [*EntityOptions*](core.md#entityoptions)<any\> |

**Returns:** <T\>(`target`: T & [*Dictionary*](core.md#dictionary)<any\>) => T & [*Dictionary*](core.md#dictionary)<any\>

Defined in: [packages/core/src/decorators/Entity.ts:6](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Entity.ts#L6)

___

### Enum

▸ **Enum**(`options?`: [*EnumOptions*](../interfaces/core.enumoptions.md)<[*AnyEntity*](core.md#anyentity)\> \| () => [*Dictionary*](core.md#dictionary)): *function*

#### Parameters:

Name | Type |
:------ | :------ |
`options` | [*EnumOptions*](../interfaces/core.enumoptions.md)<[*AnyEntity*](core.md#anyentity)\> \| () => [*Dictionary*](core.md#dictionary) |

**Returns:** (`target`: [*AnyEntity*](core.md#anyentity)<any\>, `propertyName`: *string*) => *any*

Defined in: [packages/core/src/decorators/Enum.ts:7](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Enum.ts#L7)

___

### Filter

▸ **Filter**<T\>(`options`: *FilterDef*<T\>): *function*

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`options` | *FilterDef*<T\> |

**Returns:** <U\>(`target`: U & [*Dictionary*](core.md#dictionary)<any\>) => U & [*Dictionary*](core.md#dictionary)<any\>

Defined in: [packages/core/src/decorators/Filter.ts:4](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Filter.ts#L4)

___

### Formula

▸ **Formula**<T\>(`formula`: *string* \| (`alias`: *string*) => *string*, `options?`: [*FormulaOptions*](../interfaces/core.formulaoptions.md)<T\>): *function*

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`formula` | *string* \| (`alias`: *string*) => *string* |
`options` | [*FormulaOptions*](../interfaces/core.formulaoptions.md)<T\> |

**Returns:** (`target`: [*AnyEntity*](core.md#anyentity)<any\>, `propertyName`: *string*) => *any*

Defined in: [packages/core/src/decorators/Formula.ts:7](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Formula.ts#L7)

___

### Index

▸ **Index**<T\>(`options?`: [*IndexOptions*](../interfaces/core.indexoptions.md)<T\>): *function*

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`options` | [*IndexOptions*](../interfaces/core.indexoptions.md)<T\> |

**Returns:** (`target`: [*AnyEntity*](core.md#anyentity)<any\>, `propertyName?`: *string*) => *any*

Defined in: [packages/core/src/decorators/Indexed.ts:20](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Indexed.ts#L20)

___

### ManyToMany

▸ **ManyToMany**<T, O\>(`entity?`: [*ManyToManyOptions*](../interfaces/core.manytomanyoptions.md)<T, O\> \| *string* \| () => [*EntityName*](core.md#entityname)<T\>, `mappedBy?`: *string* & keyof T \| (`e`: T) => *any*, `options?`: *Partial*<[*ManyToManyOptions*](../interfaces/core.manytomanyoptions.md)<T, O\>\>): *function*

#### Type parameters:

Name |
:------ |
`T` |
`O` |

#### Parameters:

Name | Type |
:------ | :------ |
`entity?` | [*ManyToManyOptions*](../interfaces/core.manytomanyoptions.md)<T, O\> \| *string* \| () => [*EntityName*](core.md#entityname)<T\> |
`mappedBy?` | *string* & keyof T \| (`e`: T) => *any* |
`options` | *Partial*<[*ManyToManyOptions*](../interfaces/core.manytomanyoptions.md)<T, O\>\> |

**Returns:** (`target`: [*AnyEntity*](core.md#anyentity)<any\>, `propertyName`: *string*) => *any*

Defined in: [packages/core/src/decorators/ManyToMany.ts:7](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/ManyToMany.ts#L7)

___

### ManyToOne

▸ **ManyToOne**<T, O\>(`entity?`: [*ManyToOneOptions*](../interfaces/core.manytooneoptions.md)<T, O\> \| *string* \| (`e?`: *any*) => [*EntityName*](core.md#entityname)<T\>, `options?`: *Partial*<[*ManyToOneOptions*](../interfaces/core.manytooneoptions.md)<T, O\>\>): *function*

#### Type parameters:

Name |
:------ |
`T` |
`O` |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | [*ManyToOneOptions*](../interfaces/core.manytooneoptions.md)<T, O\> \| *string* \| (`e?`: *any*) => [*EntityName*](core.md#entityname)<T\> |
`options` | *Partial*<[*ManyToOneOptions*](../interfaces/core.manytooneoptions.md)<T, O\>\> |

**Returns:** (`target`: [*AnyEntity*](core.md#anyentity)<any\>, `propertyName`: *string*) => *any*

Defined in: [packages/core/src/decorators/ManyToOne.ts:7](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/ManyToOne.ts#L7)

___

### OnInit

▸ **OnInit**(): *function*

**Returns:** (`target`: *any*, `method`: *string*) => *void*

Defined in: [packages/core/src/decorators/hooks.ts:32](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/hooks.ts#L32)

___

### OneToMany

▸ **OneToMany**<T, O\>(`entity`: *string* \| (`e?`: *any*) => [*EntityName*](core.md#entityname)<T\>, `mappedBy`: *string* & keyof T \| (`e`: T) => *any*, `options?`: *Partial*<[*OneToManyOptions*](core.md#onetomanyoptions)<T, O\>\>): *function*

#### Type parameters:

Name |
:------ |
`T` |
`O` |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | *string* \| (`e?`: *any*) => [*EntityName*](core.md#entityname)<T\> |
`mappedBy` | *string* & keyof T \| (`e`: T) => *any* |
`options?` | *Partial*<[*OneToManyOptions*](core.md#onetomanyoptions)<T, O\>\> |

**Returns:** (`target`: [*AnyEntity*](core.md#anyentity), `propertyName`: *string*) => *void*

Defined in: [packages/core/src/decorators/OneToMany.ts:24](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/OneToMany.ts#L24)

▸ **OneToMany**<T, O\>(`options`: [*OneToManyOptions*](core.md#onetomanyoptions)<T, O\>): *function*

#### Type parameters:

Name |
:------ |
`T` |
`O` |

#### Parameters:

Name | Type |
:------ | :------ |
`options` | [*OneToManyOptions*](core.md#onetomanyoptions)<T, O\> |

**Returns:** (`target`: [*AnyEntity*](core.md#anyentity), `propertyName`: *string*) => *void*

Defined in: [packages/core/src/decorators/OneToMany.ts:29](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/OneToMany.ts#L29)

___

### OneToOne

▸ **OneToOne**<T, O\>(`entity?`: [*OneToOneOptions*](../interfaces/core.onetooneoptions.md)<T, O\> \| *string* \| (`e?`: *any*) => [*EntityName*](core.md#entityname)<T\>, `mappedBy?`: *string* & keyof T \| (`e`: T) => *any*, `options?`: *Partial*<[*OneToOneOptions*](../interfaces/core.onetooneoptions.md)<T, O\>\>): *function*

#### Type parameters:

Name |
:------ |
`T` |
`O` |

#### Parameters:

Name | Type |
:------ | :------ |
`entity?` | [*OneToOneOptions*](../interfaces/core.onetooneoptions.md)<T, O\> \| *string* \| (`e?`: *any*) => [*EntityName*](core.md#entityname)<T\> |
`mappedBy?` | *string* & keyof T \| (`e`: T) => *any* |
`options` | *Partial*<[*OneToOneOptions*](../interfaces/core.onetooneoptions.md)<T, O\>\> |

**Returns:** (`target`: [*AnyEntity*](core.md#anyentity)<any\>, `propertyName`: *string*) => *any*

Defined in: [packages/core/src/decorators/OneToOne.ts:5](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/OneToOne.ts#L5)

___

### PrimaryKey

▸ **PrimaryKey**<T\>(`options?`: [*PrimaryKeyOptions*](../interfaces/core.primarykeyoptions.md)<T\>): *function*

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`options` | [*PrimaryKeyOptions*](../interfaces/core.primarykeyoptions.md)<T\> |

**Returns:** (`target`: [*AnyEntity*](core.md#anyentity)<any\>, `propertyName`: *string*) => *any*

Defined in: [packages/core/src/decorators/PrimaryKey.ts:19](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/PrimaryKey.ts#L19)

___

### Property

▸ **Property**<T\>(`options?`: [*PropertyOptions*](core.md#propertyoptions)<T\>): *function*

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`options` | [*PropertyOptions*](core.md#propertyoptions)<T\> |

**Returns:** (`target`: [*AnyEntity*](core.md#anyentity)<any\>, `propertyName`: *string*) => *any*

Defined in: [packages/core/src/decorators/Property.ts:7](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Property.ts#L7)

___

### Repository

▸ **Repository**<T\>(`entity`: *EntityClass*<T\>): *function*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](core.md#anyentity)<any\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | *EntityClass*<T\> |

**Returns:** (`target`: [*Constructor*](core.md#constructor)<[*EntityRepository*](../classes/core.entityrepository.md)<T\>\>) => *void*

Defined in: [packages/core/src/decorators/Repository.ts:5](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Repository.ts#L5)

___

### SerializedPrimaryKey

▸ **SerializedPrimaryKey**<T\>(`options?`: [*SerializedPrimaryKeyOptions*](../interfaces/core.serializedprimarykeyoptions.md)<T\>): *function*

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`options` | [*SerializedPrimaryKeyOptions*](../interfaces/core.serializedprimarykeyoptions.md)<T\> |

**Returns:** (`target`: [*AnyEntity*](core.md#anyentity)<any\>, `propertyName`: *string*) => *any*

Defined in: [packages/core/src/decorators/PrimaryKey.ts:23](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/PrimaryKey.ts#L23)

___

### Subscriber

▸ **Subscriber**(): *function*

**Returns:** (`target`: [*Constructor*](core.md#constructor)<[*EventSubscriber*](../interfaces/core.eventsubscriber.md)<any\>\>) => *void*

Defined in: [packages/core/src/decorators/Subscriber.ts:5](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Subscriber.ts#L5)

___

### Unique

▸ **Unique**<T\>(`options?`: [*UniqueOptions*](../interfaces/core.uniqueoptions.md)<T\>): *function*

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`options` | [*UniqueOptions*](../interfaces/core.uniqueoptions.md)<T\> |

**Returns:** (`target`: [*AnyEntity*](core.md#anyentity)<any\>, `propertyName?`: *string*) => *any*

Defined in: [packages/core/src/decorators/Indexed.ts:24](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/decorators/Indexed.ts#L24)

___

### assign

▸ `Const`**assign**<T\>(`entity`: T, `data`: [*EntityData*](core.md#entitydata)<T\>, `options?`: [*AssignOptions*](../interfaces/core.assignoptions.md)): T

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`data` | [*EntityData*](core.md#entitydata)<T\> |
`options?` | [*AssignOptions*](../interfaces/core.assignoptions.md) |

**Returns:** T

Defined in: [packages/core/src/entity/EntityAssigner.ts:183](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityAssigner.ts#L183)

▸ `Const`**assign**<T\>(`entity`: T, `data`: [*EntityData*](core.md#entitydata)<T\>, `onlyProperties?`: *boolean*): T

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`data` | [*EntityData*](core.md#entitydata)<T\> |
`onlyProperties?` | *boolean* |

**Returns:** T

Defined in: [packages/core/src/entity/EntityAssigner.ts:183](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/EntityAssigner.ts#L183)

___

### compareArrays

▸ **compareArrays**(`a`: *any*[], `b`: *any*[]): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`a` | *any*[] |
`b` | *any*[] |

**Returns:** *boolean*

Defined in: [packages/core/src/utils/Utils.ts:59](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Utils.ts#L59)

___

### compareBuffers

▸ **compareBuffers**(`a`: Buffer, `b`: Buffer): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`a` | Buffer |
`b` | Buffer |

**Returns:** *boolean*

Defined in: [packages/core/src/utils/Utils.ts:76](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Utils.ts#L76)

___

### compareObjects

▸ **compareObjects**(`a`: *any*, `b`: *any*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`a` | *any* |
`b` | *any* |

**Returns:** *boolean*

Defined in: [packages/core/src/utils/Utils.ts:16](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Utils.ts#L16)

___

### equals

▸ **equals**(`a`: *any*, `b`: *any*): *boolean*

Checks if arguments are deeply (but not strictly) equal.

#### Parameters:

Name | Type |
:------ | :------ |
`a` | *any* |
`b` | *any* |

**Returns:** *boolean*

Defined in: [packages/core/src/utils/Utils.ts:95](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/Utils.ts#L95)

___

### expr

▸ `Const`**expr**(`sql`: *string*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`sql` | *string* |

**Returns:** *string*

Defined in: [packages/core/src/utils/QueryHelper.ts:261](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/utils/QueryHelper.ts#L261)

___

### wrap

▸ **wrap**<T, PK\>(`entity`: T, `preferHelper`: *true*): *IWrappedEntityInternal*<T, PK\>

returns WrappedEntity instance associated with this entity. This includes all the internal properties like `__meta` or `__em`.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | - |
`PK` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`preferHelper` | *true* |

**Returns:** *IWrappedEntityInternal*<T, PK\>

Defined in: [packages/core/src/entity/wrap.ts:6](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/wrap.ts#L6)

▸ **wrap**<T, PK\>(`entity`: T, `preferHelper?`: *false*): [*IWrappedEntity*](../interfaces/core.iwrappedentity.md)<T, PK\>

wraps entity type with WrappedEntity internal properties and helpers like init/isInitialized/populated/toJSON

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | - |
`PK` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`preferHelper?` | *false* |

**Returns:** [*IWrappedEntity*](../interfaces/core.iwrappedentity.md)<T, PK\>

Defined in: [packages/core/src/entity/wrap.ts:11](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/entity/wrap.ts#L11)
