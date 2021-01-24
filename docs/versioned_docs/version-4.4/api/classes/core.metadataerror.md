---
id: "core.metadataerror"
title: "Class: MetadataError<T>"
sidebar_label: "MetadataError"
hide_title: true
---

# Class: MetadataError<T\>

[core](../modules/core.md).MetadataError

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity) | [*AnyEntity*](../modules/core.md#anyentity) |

## Hierarchy

* [*ValidationError*](core.validationerror.md)<T\>

  ↳ **MetadataError**

## Constructors

### constructor

\+ **new MetadataError**<T\>(`message`: *string*, `entity?`: T): [*MetadataError*](core.metadataerror.md)<T\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<*any*\> | [*AnyEntity*](../modules/core.md#anyentity)<*any*\\> |

#### Parameters:

Name | Type |
------ | ------ |
`message` | *string* |
`entity?` | T |

**Returns:** [*MetadataError*](core.metadataerror.md)<T\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:4](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L4)

## Properties

### message

• **message**: *string*

Inherited from: [ValidationError](core.validationerror.md).[message](core.validationerror.md#message)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:974

___

### name

• **name**: *string*

Inherited from: [ValidationError](core.validationerror.md).[name](core.validationerror.md#name)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:973

___

### prepareStackTrace

• `Optional` **prepareStackTrace**: *undefined* \| (`err`: Error, `stackTraces`: CallSite[]) => *any*

Optional override for formatting stack traces

**`see`** https://github.com/v8/v8/wiki/Stack%20Trace%20API#customizing-stack-traces

Inherited from: [ValidationError](core.validationerror.md).[prepareStackTrace](core.validationerror.md#preparestacktrace)

Defined in: node_modules/@types/node/globals.d.ts:11

___

### stack

• `Optional` **stack**: *undefined* \| *string*

Inherited from: [ValidationError](core.validationerror.md).[stack](core.validationerror.md#stack)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:975

___

### stackTraceLimit

• **stackTraceLimit**: *number*

Inherited from: [ValidationError](core.validationerror.md).[stackTraceLimit](core.validationerror.md#stacktracelimit)

Defined in: node_modules/@types/node/globals.d.ts:13

## Methods

### captureStackTrace

▸ **captureStackTrace**(`targetObject`: *object*, `constructorOpt?`: Function): *void*

Create .stack property on a target object

#### Parameters:

Name | Type |
------ | ------ |
`targetObject` | *object* |
`constructorOpt?` | Function |

**Returns:** *void*

Inherited from: [ValidationError](core.validationerror.md)

Defined in: node_modules/@types/node/globals.d.ts:4

___

### getEntity

▸ **getEntity**(): *undefined* \| [*AnyEntity*](../modules/core.md#anyentity)<*any*\>

Gets instance of entity that caused this error.

**Returns:** *undefined* \| [*AnyEntity*](../modules/core.md#anyentity)<*any*\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:17](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L17)

___

### cannotCommit

▸ `Static`**cannotCommit**(): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:92](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L92)

___

### cannotModifyInverseCollection

▸ `Static`**cannotModifyInverseCollection**(`owner`: [*AnyEntity*](../modules/core.md#anyentity)<*any*\>, `property`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`owner` | [*AnyEntity*](../modules/core.md#anyentity)<*any*\> |
`property` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:79](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L79)

___

### cannotUseOperatorsInsideEmbeddables

▸ `Static`**cannotUseOperatorsInsideEmbeddables**(`className`: *string*, `propName`: *string*, `payload`: [*Dictionary*](../modules/core.md#dictionary)<*any*\>): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`className` | *string* |
`propName` | *string* |
`payload` | [*Dictionary*](../modules/core.md#dictionary)<*any*\> |

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:96](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L96)

___

### conflictingPropertyName

▸ `Static`**conflictingPropertyName**(`className`: *string*, `name`: *string*, `embeddedName`: *string*): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`className` | *string* |
`name` | *string* |
`embeddedName` | *string* |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Defined in: [packages/core/src/errors.ts:199](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L199)

___

### duplicateEntityDiscovered

▸ `Static`**duplicateEntityDiscovered**(`paths`: *string*[]): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`paths` | *string*[] |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Defined in: [packages/core/src/errors.ts:187](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L187)

___

### entityNotFound

▸ `Static`**entityNotFound**(`name`: *string*, `path`: *string*): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`name` | *string* |
`path` | *string* |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Defined in: [packages/core/src/errors.ts:158](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L158)

___

### entityNotManaged

▸ `Static`**entityNotManaged**(`entity`: [*AnyEntity*](../modules/core.md#anyentity)<*any*\>): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [*AnyEntity*](../modules/core.md#anyentity)<*any*\> |

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:43](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L43)

___

### fromCollectionNotInitialized

▸ `Static`**fromCollectionNotInitialized**(`entity`: [*AnyEntity*](../modules/core.md#anyentity)<*any*\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [*AnyEntity*](../modules/core.md#anyentity)<*any*\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:28](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L28)

___

### fromMergeWithoutPK

▸ `Static`**fromMergeWithoutPK**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |

**Returns:** *void*

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:35](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L35)

___

### fromMessage

▸ `Private` `Static`**fromMessage**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `message`: *string*): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`message` | *string* |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Defined in: [packages/core/src/errors.ts:203](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L203)

___

### fromMissingPrimaryKey

▸ `Static`**fromMissingPrimaryKey**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Defined in: [packages/core/src/errors.ts:130](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L130)

___

### fromUnknownEntity

▸ `Static`**fromUnknownEntity**(`className`: *string*, `source`: *string*): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`className` | *string* |
`source` | *string* |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Defined in: [packages/core/src/errors.ts:175](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L175)

___

### fromWrongOwnership

▸ `Static`**fromWrongOwnership**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `key`: *object* \| *default* \| *cascade* \| *name* \| *entity* \| *type* \| *targetMeta* \| *columnTypes* \| *customType* \| *primary* \| *serializedPrimaryKey* \| *lazy* \| *array* \| *length* \| *reference* \| *wrappedReference* \| *fieldNames* \| *fieldNameRaw* \| *defaultRaw* \| *formula* \| *prefix* \| *embedded* \| *embeddable* \| *embeddedProps* \| *index* \| *unique* \| *nullable* \| *inherited* \| *unsigned* \| *mapToPk* \| *persist* \| *hidden* \| *enum* \| *items* \| *version* \| *eager* \| *setter* \| *getter* \| *getterName* \| *orphanRemoval* \| *onCreate* \| *onUpdate* \| *onDelete* \| *onUpdateIntegrity* \| *strategy* \| *owner* \| *inversedBy* \| *mappedBy* \| *orderBy* \| *fixedOrder* \| *fixedOrderColumn* \| *pivotTable* \| *joinColumns* \| *inverseJoinColumns* \| *referencedColumnNames* \| *referencedTableName* \| *referencedPKs* \| *serializer* \| *serializedName* \| *comment* \| *userDefined*): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`key` | *object* \| *default* \| *cascade* \| *name* \| *entity* \| *type* \| *targetMeta* \| *columnTypes* \| *customType* \| *primary* \| *serializedPrimaryKey* \| *lazy* \| *array* \| *length* \| *reference* \| *wrappedReference* \| *fieldNames* \| *fieldNameRaw* \| *defaultRaw* \| *formula* \| *prefix* \| *embedded* \| *embeddable* \| *embeddedProps* \| *index* \| *unique* \| *nullable* \| *inherited* \| *unsigned* \| *mapToPk* \| *persist* \| *hidden* \| *enum* \| *items* \| *version* \| *eager* \| *setter* \| *getter* \| *getterName* \| *orphanRemoval* \| *onCreate* \| *onUpdate* \| *onDelete* \| *onUpdateIntegrity* \| *strategy* \| *owner* \| *inversedBy* \| *mappedBy* \| *orderBy* \| *fixedOrder* \| *fixedOrderColumn* \| *pivotTable* \| *joinColumns* \| *inverseJoinColumns* \| *referencedColumnNames* \| *referencedTableName* \| *referencedPKs* \| *serializer* \| *serializedName* \| *comment* \| *userDefined* |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Defined in: [packages/core/src/errors.ts:150](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L150)

___

### fromWrongPropertyType

▸ `Static`**fromWrongPropertyType**(`entity`: [*AnyEntity*](../modules/core.md#anyentity)<*any*\>, `property`: *string*, `expectedType`: *string*, `givenType`: *string*, `givenValue`: *string*): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [*AnyEntity*](../modules/core.md#anyentity)<*any*\> |
`property` | *string* |
`expectedType` | *string* |
`givenType` | *string* |
`givenValue` | *string* |

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:21](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L21)

___

### fromWrongReference

▸ `Static`**fromWrongReference**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `key`: *object* \| *default* \| *cascade* \| *name* \| *entity* \| *type* \| *targetMeta* \| *columnTypes* \| *customType* \| *primary* \| *serializedPrimaryKey* \| *lazy* \| *array* \| *length* \| *reference* \| *wrappedReference* \| *fieldNames* \| *fieldNameRaw* \| *defaultRaw* \| *formula* \| *prefix* \| *embedded* \| *embeddable* \| *embeddedProps* \| *index* \| *unique* \| *nullable* \| *inherited* \| *unsigned* \| *mapToPk* \| *persist* \| *hidden* \| *enum* \| *items* \| *version* \| *eager* \| *setter* \| *getter* \| *getterName* \| *orphanRemoval* \| *onCreate* \| *onUpdate* \| *onDelete* \| *onUpdateIntegrity* \| *strategy* \| *owner* \| *inversedBy* \| *mappedBy* \| *orderBy* \| *fixedOrder* \| *fixedOrderColumn* \| *pivotTable* \| *joinColumns* \| *inverseJoinColumns* \| *referencedColumnNames* \| *referencedTableName* \| *referencedPKs* \| *serializer* \| *serializedName* \| *comment* \| *userDefined*, `owner?`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`key` | *object* \| *default* \| *cascade* \| *name* \| *entity* \| *type* \| *targetMeta* \| *columnTypes* \| *customType* \| *primary* \| *serializedPrimaryKey* \| *lazy* \| *array* \| *length* \| *reference* \| *wrappedReference* \| *fieldNames* \| *fieldNameRaw* \| *defaultRaw* \| *formula* \| *prefix* \| *embedded* \| *embeddable* \| *embeddedProps* \| *index* \| *unique* \| *nullable* \| *inherited* \| *unsigned* \| *mapToPk* \| *persist* \| *hidden* \| *enum* \| *items* \| *version* \| *eager* \| *setter* \| *getter* \| *getterName* \| *orphanRemoval* \| *onCreate* \| *onUpdate* \| *onDelete* \| *onUpdateIntegrity* \| *strategy* \| *owner* \| *inversedBy* \| *mappedBy* \| *orderBy* \| *fixedOrder* \| *fixedOrderColumn* \| *pivotTable* \| *joinColumns* \| *inverseJoinColumns* \| *referencedColumnNames* \| *referencedTableName* \| *referencedPKs* \| *serializer* \| *serializedName* \| *comment* \| *userDefined* |
`owner?` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Defined in: [packages/core/src/errors.ts:134](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L134)

___

### fromWrongTypeDefinition

▸ `Static`**fromWrongTypeDefinition**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Defined in: [packages/core/src/errors.ts:142](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L142)

___

### invalidCompositeIdentifier

▸ `Static`**invalidCompositeIdentifier**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:88](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L88)

___

### invalidEmbeddableQuery

▸ `Static`**invalidEmbeddableQuery**(`className`: *string*, `propName`: *string*, `embeddableType`: *string*): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`className` | *string* |
`propName` | *string* |
`embeddableType` | *string* |

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:100](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L100)

___

### invalidPropertyName

▸ `Static`**invalidPropertyName**(`entityName`: *string*, `invalid`: *string*): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |
`invalid` | *string* |

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:65](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L65)

___

### invalidType

▸ `Static`**invalidType**(`type`: [*Constructor*](../modules/core.md#constructor)<*any*\>, `value`: *any*, `mode`: *string*): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`type` | [*Constructor*](../modules/core.md#constructor)<*any*\> |
`value` | *any* |
`mode` | *string* |

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:69](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L69)

___

### invalidVersionFieldType

▸ `Static`**invalidVersionFieldType**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Defined in: [packages/core/src/errors.ts:170](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L170)

___

### missingMetadata

▸ `Static`**missingMetadata**(`entity`: *string*): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`entity` | *string* |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Defined in: [packages/core/src/errors.ts:195](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L195)

___

### multipleDecorators

▸ `Static`**multipleDecorators**(`entityName`: *string*, `propertyName`: *string*): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |
`propertyName` | *string* |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Defined in: [packages/core/src/errors.ts:191](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L191)

___

### multipleVersionFields

▸ `Static`**multipleVersionFields**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `fields`: *string*[]): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`fields` | *string*[] |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Defined in: [packages/core/src/errors.ts:166](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L166)

___

### noEntityDiscovered

▸ `Static`**noEntityDiscovered**(): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Defined in: [packages/core/src/errors.ts:179](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L179)

___

### notDiscoveredEntity

▸ `Static`**notDiscoveredEntity**(`data`: *any*, `meta?`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`data` | *any* |
`meta?` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:52](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L52)

___

### notEntity

▸ `Static`**notEntity**(`owner`: [*AnyEntity*](../modules/core.md#anyentity)<*any*\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `data`: *any*): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`owner` | [*AnyEntity*](../modules/core.md#anyentity)<*any*\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`data` | *any* |

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:47](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L47)

___

### onlyAbstractEntitiesDiscovered

▸ `Static`**onlyAbstractEntitiesDiscovered**(): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Defined in: [packages/core/src/errors.ts:183](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L183)

___

### transactionRequired

▸ `Static`**transactionRequired**(): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:39](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L39)

___

### unknownIndexProperty

▸ `Static`**unknownIndexProperty**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `prop`: *string*, `type`: *string*): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`prop` | *string* |
`type` | *string* |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<*any*\>\>

Defined in: [packages/core/src/errors.ts:162](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/errors.ts#L162)
